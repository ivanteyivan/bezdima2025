"""Utilities to detect when a user's message likely requests graph/node creation so we can
apply strict JSON output prompts to the LLM."""
from typing import Optional
import re

from .graph_parser import parse_nl_to_graph, NODE_KEYWORDS


def detect_graph_intent(text: Optional[str]) -> bool:
    if not text:
        return False

    t = text.lower()

    # If natural language parse finds something, assume intent
    try:
        if parse_nl_to_graph(t) is not None:
            return True
    except Exception:
        pass

    # heuristics: look for commands that mention creating/connecting nodes or node keywords
    if re.search(r'\b(create|add|make|connect|connects|connect to|add a|create a)\b', t):
        return True

    # node keyword presence
    for kws in NODE_KEYWORDS.values():
        for kw in kws:
            if kw in t:
                return True

    return False
