import asyncio
import logging
from typing import Dict, Any, AsyncGenerator

from google.genai import types
from google.adk import Runner
from google.adk.artifacts import InMemoryArtifactService
from google.adk.auth.credential_service.in_memory_credential_service import (
    InMemoryCredentialService,
)
from google.adk.memory import InMemoryMemoryService
from google.adk.sessions import InMemorySessionService, Session

from .agent import worker_agent

logger = logging.getLogger("adk_agent_logger")


class A2AAgent:
    """Обертка вокруг Runner для вызова агента и потоковых событий."""

    def __init__(self):
        self.agent = worker_agent
        self.runner = Runner(
            app_name=self.agent.name,
            agent=self.agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
            credential_service=InMemoryCredentialService(),
        )

    async def get_session(self, session_id: str) -> Session:
        session = await self.runner.session_service.get_session(
            app_name=self.agent.name, user_id="adk_user", session_id=session_id
        )
        if session is None:
            session = await self.runner.session_service.create_session(
                app_name=self.agent.name, user_id="adk_user", session_id=session_id
            )
        return session

    async def invoke(self, query: str, session_id: str) -> Dict[str, Any]:
        """Полный вывод (нестриминговый)."""
        session = await self.get_session(session_id)
        content = types.Content(role="user", parts=[types.Part.from_text(text=query)])
        last_event = None
        async for event in self.runner.run_async(
            user_id=session.user_id, session_id=session.id, new_message=content
        ):
            last_event = event

        response = "\n".join(p.text for p in last_event.content.parts if p.text)
        return {
            "is_task_complete": True,
            "require_user_input": False,
            "content": response,
            "is_error": False,
            "is_event": False,
        }

    async def stream(
        self, query: str, session_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Стриминговый вывод с прогресс-сообщениями."""
        session = await self.get_session(session_id)
        content = types.Content(role="user", parts=[types.Part.from_text(text=query)])
        last_event = None
        async for event in self.runner.run_async(
            user_id=session.user_id, session_id=session.id, new_message=content
        ):
            for part in event.content.parts:
                if (
                    part.function_call is not None
                    and "short_info_to_user_what_you_do" in part.function_call.args
                ):
                    yield {
                        "is_task_complete": True,
                        "require_user_input": False,
                        "content": part.function_call.args[
                            "short_info_to_user_what_you_do"
                        ],
                        "is_error": False,
                        "is_event": True,
                    }
            last_event = event

        response = "\n".join(p.text for p in last_event.content.parts if p.text)
        yield {
            "is_task_complete": True,
            "require_user_input": False,
            "content": response,
            "is_error": False,
            "is_event": False,
        }

    def sync_invoke(self, query: str, session_id: str) -> Dict[str, Any]:
        return asyncio.run(self.invoke(query, session_id))

    SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]
