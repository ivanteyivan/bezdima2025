from __future__ import annotations
import os
import logging

# Load .env file first
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[AGENT INIT] ✅ .env file loaded")
except Exception as e:
    print(f"[AGENT INIT] ⚠️  Could not load .env: {e}")

logger = logging.getLogger(__name__)

try:
    from google.adk.agents import Agent
    from google.adk.models.lite_llm import LiteLlm
    from google.adk.tools.mcp_tool import SseConnectionParams, McpToolset
    ADK_AVAILABLE = True
except Exception as e:
    logger.warning(f"ADK not available: {e}")
    Agent = None
    LiteLlm = None
    SseConnectionParams = None
    McpToolset = None
    ADK_AVAILABLE = False

# Try to use different LLM providers
_llm_model_env = os.getenv("LLM_MODEL")
_llm_api_key = os.getenv("LLM_API_KEY")
_llm_api_base = os.getenv("LLM_API_BASE")
_llm_provider = os.getenv("LLM_PROVIDER", "foundation_models")  # foundation_models, openai, local

print(f"\n[AGENT INIT] LLM Configuration:")
print(f"  Provider: {_llm_provider}")
print(f"  Model: {_llm_model_env}")
print(f"  API Base: {_llm_api_base}")
print(f"  Has API Key: {bool(_llm_api_key)}")
print(f"  ADK Available: {ADK_AVAILABLE}\n")

llm_model = None
llm_configured = False

if ADK_AVAILABLE and _llm_model_env and _llm_api_key:
    try:
        print("[AGENT INIT] Attempting to initialize LLM with LiteLlm...")
        logger.info(f"Attempting to initialize LLM...")
        logger.info(f"  Provider: {_llm_provider}")
        logger.info(f"  Model: {_llm_model_env}")
        logger.info(f"  API Base: {_llm_api_base}")
        logger.info(f"  API Key: {'***' + _llm_api_key[-4:] if len(_llm_api_key) > 4 else '***'}")
        
        # Use LiteLlm for OpenAI-compatible or Foundation Models
        llm_model = LiteLlm(
            model=_llm_model_env,
            api_base=_llm_api_base,
            api_key=_llm_api_key
        )
        llm_configured = True
        print(f"[AGENT INIT] ✅ LLM configured successfully!")
        logger.info(f"✅ LLM configured successfully with model: {_llm_model_env}")
    except Exception as e:
        print(f"[AGENT INIT] ❌ Failed to configure LLM: {e}")
        logger.error(f"❌ Failed to configure LLM: {e}", exc_info=True)
        llm_model = None
elif ADK_AVAILABLE and _llm_model_env:
    print("[AGENT INIT] ⚠️  LLM_API_KEY is empty")
    logger.warning("⚠️  LLM_API_KEY is empty. Using mock agent. Set LLM_API_KEY to use real LLM.")
else:
    print("[AGENT INIT] ℹ️  ADK not available or LLM_MODEL not configured")
    logger.info("ℹ️  ADK not available or LLM_MODEL not configured. Using mock agent.")

if ADK_AVAILABLE and llm_model is not None and llm_configured:
    try:
        logger.info("Creating ADK Agent...")
        worker_agent = Agent(
            model=llm_model,
            name=os.getenv('AGENT_NAME', 'Work Agent').replace(" ", '_'),
            description=os.getenv('AGENT_DESCRIPTION', 'This agent do work'),
            instruction=os.getenv("AGENT_SYSTEM_PROMPT"),
            tools=[McpToolset(
                connection_params=SseConnectionParams(
                    url=url
                )
            ) for url in (os.getenv("MCP_URL") or "").split(',') if url],
        )
        logger.info("✅ Real ADK Agent initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create ADK Agent, using mock: {e}", exc_info=True)
        class _MockAgent:
            def __init__(self):
                self.name = os.getenv('AGENT_NAME', 'Mock Agent').replace(' ', '_')
                self.description = os.getenv('AGENT_DESCRIPTION', 'Mock agent for local dev')
                self.instruction = os.getenv('AGENT_SYSTEM_PROMPT')
                self.SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

        worker_agent = _MockAgent()
else:
    logger.info("Using mock agent - LLM not properly configured")
    # Local/mock fallback
    class _MockAgent:
        def __init__(self):
            self.name = os.getenv('AGENT_NAME', 'Mock Agent').replace(' ', '_')
            self.description = os.getenv('AGENT_DESCRIPTION', 'Mock agent for local dev')
            self.instruction = os.getenv('AGENT_SYSTEM_PROMPT')
            self.SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

    worker_agent = _MockAgent()

root_agent = worker_agent
