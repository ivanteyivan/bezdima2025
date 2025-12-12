from typing import Dict, Any, AsyncGenerator, Optional, List
import asyncio
import logging
import os

try:
    from google.genai import types
except ImportError:
    types = None

try:
    from google.adk import Runner
    from google.adk.artifacts import InMemoryArtifactService
    from google.adk.auth.credential_service.in_memory_credential_service import InMemoryCredentialService
    from google.adk.memory import InMemoryMemoryService
    from google.adk.sessions import InMemorySessionService, Session
    ADK_AVAILABLE = True
except ImportError:
    Runner = None
    InMemoryArtifactService = None
    InMemoryCredentialService = None
    InMemoryMemoryService = None
    InMemorySessionService = None
    Session = None
    ADK_AVAILABLE = False

from .agent import worker_agent

logger = logging.getLogger("agent_logger")

# Optional litellm debug / exceptions
LITELLM_AVAILABLE = False
try:
    import litellm
    from litellm import exceptions as litellm_exceptions
    LITELLM_AVAILABLE = True
except Exception:
    litellm = None
    litellm_exceptions = None



class A2Aagent:
    def __init__(self):
        # Initialize runner storage
        self.agent = worker_agent
        self.runner = None
        self.mock = False

        # Check if agent is real (not mock)
        is_mock_agent = type(self.agent).__name__ == '_MockAgent'

        if is_mock_agent:
            logger.error("Mock agent detected: LLM not configured — switching to mock mode.")
            self.mock = True

        # Enable litellm debug if requested (useful for diagnosing hosted_vllm errors)
        try:
            if os.getenv('LITELLM_DEBUG', 'false').lower() in ('1', 'true', 'yes') and LITELLM_AVAILABLE:
                try:
                    # litellm exposes debug helper
                    if hasattr(litellm, '_turn_on_debug'):
                        litellm._turn_on_debug()
                        logger.warning('LiteLLM debug turned ON (LITELLM_DEBUG=true)')
                except Exception:
                    logger.exception('Failed to enable litellm debug')
        except Exception:
            pass
        
        try:
            if ADK_AVAILABLE and Runner is not None:
                self.runner = Runner(
                    app_name=self.agent.name,
                    agent=self.agent,
                    artifact_service=InMemoryArtifactService(),
                    session_service=InMemorySessionService(),
                    memory_service=InMemoryMemoryService(),
                    credential_service=InMemoryCredentialService()
                )
                logger.info('ADK Runner initialized successfully')
            else:
                logger.warning('ADK Runner not available; operating in mock mode.')
                self.mock = True
                self.runner = None
        except Exception as e:
            logger.error('Failed to initialize ADK Runner: %s', e, exc_info=True)
            self.mock = True
            self.runner = None

    async def get_session(self, session_id) -> Session:
        if self.mock or not self.runner:
            # Return a minimal mock-like object to satisfy callers
            class _MockSession:
                def __init__(self, id):
                    self.id = id
                    self.user_id = 'mock_user'

            return _MockSession(session_id or 'mock-session')

        session = await self.runner.session_service.get_session(
            app_name=self.agent.name,
            user_id='a2a_user',
            session_id=session_id
        )

        logger.debug('get_session %s %s', session_id, session)

        if session is None:
            session = await self.runner.session_service.create_session(
                app_name=self.agent.name,
                user_id='a2a_user',
                session_id=session_id
            )

        return session


    async def invoke(self, query: str, session_id: str, history: Optional[List[dict]] = None) -> Dict[str, Any]:
        """Stream the agent's processing and responses."""
        # Lightweight mock response when runner/ADK not configured
        if self.mock or not self.runner or not ADK_AVAILABLE or not hasattr(self.agent, 'run_async'):
            return {
                "is_task_complete": True,
                "require_user_input": False,
                "content": f"[mock agent] {query}",
                "is_error": False,
                "is_event": False,
            }

        session = await self.get_session(session_id)

        if types is None:
            return {
                "is_task_complete": True,
                "require_user_input": False,
                "content": "[error] google.genai not available",
                "is_error": True,
                "is_event": False,
            }

        # If chat history provided, prepend it to the query to give the agent context
        combined_text = query
        try:
            if history and isinstance(history, list) and len(history) > 0:
                hist_text = '\n'.join([f"{h.get('role','user')}: {h.get('content','')}" for h in history])
                combined_text = hist_text + '\n' + query
        except Exception:
            combined_text = query

        content = types.Content(
            role='user',
            parts=[types.Part.from_text(text=combined_text)],
        )

        max_retries = 3
        last_exception = None
        for attempt in range(1, max_retries + 1):
            try:
                last_event = None
                async for event in self.runner.run_async(
                        user_id=session.user_id, session_id=session.id, new_message=content
                ):
                    last_event = event

                if last_event is None:
                    return {
                        "is_task_complete": True,
                        "require_user_input": False,
                        "content": "[error] No response from agent",
                        "is_error": True,
                        "is_event": False,
                    }

                response = '\n'.join(p.text for p in last_event.content.parts if p.text)

                return {
                    "is_task_complete": True,
                    "require_user_input": False,
                    "content": response,
                    "is_error": False,
                    "is_event": False
                }

            except Exception as e:
                last_exception = e
                # Detect litellm transient errors (timeouts / internal server errors)
                transient = False
                try:
                    if LITELLM_AVAILABLE and litellm_exceptions is not None:
                        if isinstance(e, getattr(litellm_exceptions, 'Timeout', litellm_exceptions)):
                            transient = True
                        if isinstance(e, getattr(litellm_exceptions, 'InternalServerError', litellm_exceptions)):
                            transient = True
                except Exception:
                    pass

                # Also treat common HTTP 5xx/504 from underlying libraries as transient
                msg = str(e).lower()
                if '504' in msg or 'timeout' in msg or 'hosted_vllm' in msg or 'internalservererror' in msg:
                    transient = True

                logger.error('Error in invoke (attempt %s/%s): %s', attempt, max_retries, e, exc_info=True)

                if transient and attempt < max_retries:
                    backoff = 1 * (2 ** (attempt - 1))
                    logger.warning('Transient error detected, retrying after %s seconds...', backoff)
                    await asyncio.sleep(backoff)
                    continue

                # Non-transient or retries exhausted
                return {
                    "is_task_complete": True,
                    "require_user_input": False,
                    "content": f"[error] {str(e)}",
                    "is_error": True,
                    "is_event": False,
                }


    async def stream(self, query: str, session_id: str, history: Optional[List[dict]] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream the agent's processing and responses."""
        # Mock streaming when runner/ADK not configured
        if self.mock or not self.runner or not ADK_AVAILABLE or not hasattr(self.agent, 'run_async'):
            chunks = query.split()
            if not chunks:
                chunks = [query]

            for i, chunk in enumerate(chunks):
                if i > 0:
                    await asyncio.sleep(0.05)
                yield {
                    "is_task_complete": False,
                    "require_user_input": False,
                    "content": chunk,
                    "is_error": False,
                    "is_event": True,
                }

            await asyncio.sleep(0.05)
            yield {
                "is_task_complete": True,
                "require_user_input": False,
                "content": f"[mock agent] {query}",
                "is_error": False,
                "is_event": False,
            }
            return

        if types is None:
            yield {
                "is_task_complete": True,
                "require_user_input": False,
                "content": "[error] google.genai not available",
                "is_error": True,
                "is_event": False,
            }
            return

        session = await self.get_session(session_id)

        combined_text = query
        try:
            if history and isinstance(history, list) and len(history) > 0:
                hist_text = '\n'.join([f"{h.get('role','user')}: {h.get('content','')}" for h in history])
                combined_text = hist_text + '\n' + query
        except Exception:
            combined_text = query

        content = types.Content(
            role='user',
            parts=[types.Part.from_text(text=combined_text)],
        )

        max_retries = 3
        for attempt in range(1, max_retries + 1):
            try:
                last_event = None
                async for event in self.runner.run_async(
                        user_id=session.user_id, session_id=session.id, new_message=content
                ):
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            if part.function_call is not None and 'short_info_to_user_what_you_do' in part.function_call.args:
                                yield {
                                    "is_task_complete": False,
                                    "require_user_input": False,
                                    "content": part.function_call.args['short_info_to_user_what_you_do'],
                                    "is_error": False,
                                    "is_event": True
                                }
                            elif part.text:
                                yield {
                                    "is_task_complete": False,
                                    "require_user_input": False,
                                    "content": part.text,
                                    "is_error": False,
                                    "is_event": True
                                }

                    last_event = event

                if last_event is not None:
                    response = '\n'.join(p.text for p in last_event.content.parts if p.text)
                else:
                    response = "[agent completed with no output]"

                yield {
                    "is_task_complete": True,
                    "require_user_input": False,
                    "content": response,
                    "is_error": False,
                    "is_event": False
                }
                return

            except Exception as e:
                transient = False
                try:
                    if LITELLM_AVAILABLE and litellm_exceptions is not None:
                        if isinstance(e, getattr(litellm_exceptions, 'Timeout', litellm_exceptions)):
                            transient = True
                        if isinstance(e, getattr(litellm_exceptions, 'InternalServerError', litellm_exceptions)):
                            transient = True
                except Exception:
                    pass

                msg = str(e).lower()
                if '504' in msg or 'timeout' in msg or 'hosted_vllm' in msg or 'internalservererror' in msg:
                    transient = True

                logger.error('Error in stream (attempt %s/%s): %s', attempt, max_retries, e, exc_info=True)

                if transient and attempt < max_retries:
                    backoff = 1 * (2 ** (attempt - 1))
                    logger.warning('Transient stream error, retrying after %s seconds...', backoff)
                    await asyncio.sleep(backoff)
                    continue

                yield {
                    "is_task_complete": True,
                    "require_user_input": False,
                    "content": f"[error] {str(e)}",
                    "is_error": True,
                    "is_event": False,
                }
                return


    # For compatibility with the original implementation
    def sync_invoke(self, query: str, session_id: str, history: Optional[List[dict]] = None) -> Dict[str, Any]:
        """Synchronous wrapper for invoke."""
        return asyncio.run(self.invoke(query, session_id, history))

    # For compatibility with the original API
    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]