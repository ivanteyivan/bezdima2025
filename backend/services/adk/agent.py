import os
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
from google.adk.tools.mcp_tool import SseConnectionParams, McpToolset

DEFAULT_GRAPH_PROMPT = """
Ты помощник, который строит граф задач (React Flow).
Возвращай JSON вида:
{
  "answer": "<краткое описание плана>",
  "steps": ["шаг1", "шаг2"],
  "retrieval_sources": [],
  "graph": {
    "nodes": [
      {"id": "n1", "type": "prompt", "data": {"prompt": "..."}, "position": {"x":0,"y":0}},
      {"id": "n2", "type": "api", "data": {"url": "..."}, "position": {"x":220,"y":0}}
    ],
    "edges": [
      {"id": "e1", "source": "n1", "target": "n2"}
    ]
  }
}
Требования:
- id уникальны.
- positions задавай с шагом 220 по X, 140 по Y, чтобы не пересекались.
- types должны соответствовать фронтенду: prompt, api, manualTest, automatedTest, optimization, checkStandards, fileUpload, fileDownload, start, end.
- Не используй Markdown. Только JSON.
Если граф не нужен, верни graph: null.
"""


def build_agent() -> Agent:
    """Создает ADK-агент на основе переменных окружения."""
    llm_model = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    llm_base = os.getenv("LLM_API_BASE", "https://foundation-models.api.cloud.ru/v1")
    llm_key = os.getenv("LLM_API_KEY")

    if not llm_key:
        raise ValueError("LLM_API_KEY не установлен в окружении для ADK агента")

    model = LiteLlm(
        model=llm_model,
        api_base=llm_base,
        api_key=llm_key,
    )

    mcp_urls = [u.strip() for u in os.getenv("MCP_URL", "").split(",") if u.strip()]
    tools = [
        McpToolset(
            connection_params=SseConnectionParams(url=url),
        )
        for url in mcp_urls
    ]

    return Agent(
        model=model,
        name=os.getenv("AGENT_NAME", "Work Agent").replace(" ", "_"),
        description=os.getenv("AGENT_DESCRIPTION", "This agent does work"),
        instruction=os.getenv("AGENT_SYSTEM_PROMPT", DEFAULT_GRAPH_PROMPT),
        tools=tools,
    )


# Экспорт по аналогии с исходным примером
worker_agent = build_agent()
root_agent = worker_agent
