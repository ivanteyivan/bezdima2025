"""Prompt templates for instructing the LLM to return strict JSON graph outputs."""

JSON_GRAPH_PROMPT = (
    "Return ONLY a JSON object (no surrounding text) with exactly two top-level keys: 'nodes' and 'edges'.\n"
    "- 'nodes' should be a list of objects with keys: 'id' (unique string), 'type' (one of: manualTest,fileUpload,fileDownload,api,prompt,start,end,automatedTest,checkStandards,optimization,statistics), and 'data' (object containing at least 'label').\n"
    "- 'edges' should be a list of objects with keys: 'id' (unique string), 'source' (node id), 'target' (node id).\n"
    "If you cannot produce such a graph, return {\"nodes\": [], \"edges\": []}.\n"
    "Do not include any commentary or additional keys. Produce strictly valid JSON that can be parsed by a JSON parser.\n\n"
)

# Instruct the LLM to treat this as a fresh graph request and not to replay
# or reuse previously generated graphs from this session unless the user
# explicitly asks to modify or reuse them.
JSON_GRAPH_PROMPT += (
    "Important: Do NOT reuse or repeat graphs that you have generated earlier in this session unless the user explicitly refers to or asks to reuse/modify a previous graph. Treat this as a new graph creation request.\n"
)


def wrap_with_json_prompt(user_text: str) -> str:
    """Prepend the JSON enforcement template to the user's instruction."""
    return JSON_GRAPH_PROMPT + user_text
