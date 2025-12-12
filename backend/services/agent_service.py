import json
from typing import List, Dict, Any

from .llm_service import LLMService


class AgentService:
    """Простой агент с поддержкой retrieval-подсказок и chain-of-thought."""

    def __init__(self):
        self.llm = LLMService()

    def _build_prompt(
        self,
        message: str,
        history: List[Dict[str, str]],
        knowledge_base: List[Dict[str, str]]
    ) -> str:
        history_text = "\n".join([f"{item['role']}: {item['content']}" for item in history][-6:])

        kb_chunks = knowledge_base[:3] if knowledge_base else []
        kb_text = "\n".join([f"- [{item.get('source', 'source')}] {item.get('text', '')}" for item in kb_chunks])

        return f"""
Ты — AI агент для QA/DevOps. Отвечай кратко и по делу.
1) Используй контекст из базы знаний, если он есть.
2) Если контекста нет — отвечай на основе опыта, но помечай отсутствие источников.
3) Формат ответа строго JSON:
{{
  "answer": "<финальный краткий ответ>",
  "steps": ["<шаг 1>", "<шаг 2>", "<шаг 3>"],
  "references": ["<source-1>", "<source-2>"]
}}
Не используй Markdown, не добавляй лишних полей.

История (последние 6 сообщений):
{history_text or "—"}

Контекст (top-3):
{kb_text or "—"}

Текущее сообщение пользователя: {message}
"""

    async def chat(
        self,
        message: str,
        history: List[Dict[str, str]],
        knowledge_base: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        prompt = self._build_prompt(message, history, knowledge_base)

        system_prompt = (
            "Ты помощник по тестированию и качеству. "
            "Верни строго JSON с ключами answer, steps, references."
        )

        raw = await self.llm.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.25,
            max_tokens=700
        )

        parsed: Dict[str, Any]
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            # Фолбэк: пытаемся построить ответ сами
            parsed = {
                "answer": raw.strip(),
                "steps": ["Уточните детали задачи", "Проверьте исходные требования", "Запустите smoke-проверку"],
                "references": [item.get("source", "context") for item in (knowledge_base or [])][:3]
            }

        answer = parsed.get("answer", "").strip()
        steps = [s for s in parsed.get("steps", []) if isinstance(s, str) and s.strip()]
        references = [r for r in parsed.get("references", []) if isinstance(r, str) and r.strip()]

        return {
            "answer": answer or raw.strip(),
            "steps": steps,
            "retrieval_sources": references
        }
