import json
import uuid
from typing import Any, Dict, List, Optional

from .adk.a2a_agent import A2AAgent


class ADKService:
    """Адаптер над A2AAgent, нормализующий ответы для FastAPI."""

    def __init__(self):
        self.agent = A2AAgent()

    @staticmethod
    def _parse_graph(content: str) -> Optional[Dict[str, Any]]:
        """
        Пытаемся извлечь graph из JSON-ответа.
        Ожидаем формат:
        {
          "answer": "...",
          "graph": {
            "nodes": [{"id": "...", "type": "...", "data": {...}, "position": {"x":0,"y":0}}],
            "edges": [{"id": "...", "source": "...", "target": "..."}]
          }
        }
        """
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            return None

        graph = data.get("graph")
        if not graph:
            return None

        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])

        # минимальная валидация
        if not isinstance(nodes, list) or not isinstance(edges, list):
            return None

        return {
            "answer": data.get("answer") or content,
            "graph": {
                "nodes": nodes,
                "edges": edges,
            },
            "steps": data.get("steps", []),
            "retrieval_sources": data.get("retrieval_sources", []),
        }

    async def chat(self, message: str, session_id: Optional[str]) -> Dict[str, Any]:
        sid = session_id or str(uuid.uuid4())
        result = await self.agent.invoke(message, sid)
        content = result.get("content", "")

        parsed_graph = self._parse_graph(content)
        if parsed_graph:
            return {**parsed_graph, "session_id": sid}

        return {
            "answer": content,
            "steps": [],
            "retrieval_sources": [],
            "graph": None,
            "session_id": sid,
        }
