from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
from typing import AsyncGenerator, Optional

from .a2a_agent import A2Aagent
from .graph_parser import parse_nl_to_graph
import time
from typing import Dict

# Graph store entries now include metadata for TTL cleanup
GRAPH_TTL_SECONDS = int(__import__('os').environ.get('GRAPH_TTL_SECONDS', 3600))
from .graph_intent import detect_graph_intent
from .llm_prompts import wrap_with_json_prompt

# Pydantic models for request validation
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[list] = None

app = FastAPI(title="ADK Agent Adapter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = A2Aagent()

# Simple in-memory graph store: session_id -> graph
GRAPH_STORE: Dict[str, Dict] = {}
# Per-session metadata (e.g., versioning for graphs)
SESSION_META: Dict[str, Dict] = {}


def _store_graph(key: str, graph: dict):
    # increment session graph version
    prev = SESSION_META.get(key, {}).get('version', 0)
    new_version = prev + 1
    SESSION_META.setdefault(key, {})['version'] = new_version
    GRAPH_STORE[key] = {'graph': graph, 'created_at': time.time(), 'version': new_version}


def _cleanup_graph_store_once(now: float = None) -> int:
    """Remove expired graphs. Returns number removed."""
    if now is None:
        now = time.time()
    removed = 0
    for k in list(GRAPH_STORE.keys()):
        entry = GRAPH_STORE.get(k)
        if not entry:
            continue
        if (now - entry.get('created_at', 0)) > GRAPH_TTL_SECONDS:
            del GRAPH_STORE[k]
            removed += 1
    return removed


async def _cleanup_graph_store_loop():
    import asyncio
    while True:
        removed = _cleanup_graph_store_once()
        if removed > 0:
            # keep logs minimal; in production use proper logger
            print(f"[GRAPH_CLEANUP] removed {removed} expired graphs")
        await asyncio.sleep(60)


@app.post('/api/v1/adk/chat')
async def adk_chat(request: ChatRequest):
    message = request.message
    session_id = request.session_id
    if not message:
        raise HTTPException(status_code=400, detail='Missing message')
    # If this message looks like an instruction to create or modify a graph, ask the LLM
    # to return strictly formatted JSON to make detection/processing robust.
    message_to_send = wrap_with_json_prompt(message) if detect_graph_intent(message) else message
    res = await agent.invoke(message_to_send, session_id, request.history)

    # Try to detect structured graph output (nodes/edges) encoded as JSON in the agent content
    answer = res.get('content')
    graph = None
    try:
        parsed = json.loads(answer) if isinstance(answer, str) else None
        if isinstance(parsed, dict) and ('nodes' in parsed or 'edges' in parsed):
            graph = parsed
    except Exception:
        graph = None

    # If graph detected, store it server-side under session_id so frontend can fetch and insert it.
    graph_saved = False
    if graph is not None:
        key = session_id or f"session-{int(asyncio.get_event_loop().time())}"
        _store_graph(key, graph)
        graph_saved = True
    else:
        # Try to parse plain-language instructions to graph
            parsed_graph = parse_nl_to_graph(answer or '')
            if parsed_graph is not None:
                key = session_id or f"session-{int(asyncio.get_event_loop().time())}"
                _store_graph(key, parsed_graph)
                graph = parsed_graph
                graph_saved = True

    payload = {
        'answer': answer,
        'session_id': session_id,
        'steps': res.get('steps'),
        'retrieval_sources': res.get('retrieval_sources'),
        'graph_saved': graph_saved,
        'graph_session_key': (session_id or None) if graph_saved else None,
        'graph_session_version': (SESSION_META.get(session_id or '') or {}).get('version') if graph_saved else None
    }

    return JSONResponse(payload)


@app.get('/api/v1/health')
async def health():
    return JSONResponse({'ok': True})


@app.post('/api/v1/adk/chat/stream')
async def adk_chat_stream(request: ChatRequest):
    message = request.message
    session_id = request.session_id
    history = request.history
    if not message:
        raise HTTPException(status_code=400, detail='Missing message')

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            # stream with JSON enforcement when graph intent detected
            message_to_send = wrap_with_json_prompt(message) if detect_graph_intent(message) else message
            async for item in agent.stream(message_to_send, session_id, history):
                out = {}
                # If agent emitted a structured JSON graph, forward it under `graph`
                content = item.get('content')
                graph = None
                try:
                    parsed = json.loads(content) if isinstance(content, str) else None
                    if isinstance(parsed, dict) and ('nodes' in parsed or 'edges' in parsed):
                        graph = parsed
                except Exception:
                    graph = None

                if graph is not None:
                    # store graph server-side
                    key = session_id or f"session-{int(asyncio.get_event_loop().time())}"
                    _store_graph(key, graph)
                    out['graph_saved'] = True
                    out['graph_session_key'] = key
                    out['graph_session_version'] = SESSION_META.get(key, {}).get('version')
                else:
                    if 'content' in item:
                        out['content'] = item['content']
                        # Try to parse natural language instruction into graph
                        try:
                            parsed_graph = parse_nl_to_graph(item['content'])
                            if parsed_graph is not None:
                                key = session_id or f"session-{int(asyncio.get_event_loop().time())}"
                                _store_graph(key, parsed_graph)
                                out['graph_saved'] = True
                                out['graph_session_key'] = key
                                out['graph_session_version'] = SESSION_META.get(key, {}).get('version')
                                # remove typical content to avoid duplication
                                out.pop('content', None)
                        except Exception:
                            pass

                if 'is_event' in item:
                    out['is_event'] = item['is_event']
                if 'is_task_complete' in item:
                    out['is_task_complete'] = item['is_task_complete']
                yield json.dumps(out) + '\n'
            # final marker
            yield json.dumps({'done': True, 'session_id': session_id}) + '\n'
        except Exception as e:
            yield json.dumps({'error': str(e)}) + '\n'

    return StreamingResponse(event_stream(), media_type='text/plain')


@app.post('/api/v1/agent-chat')
async def agent_chat(request: ChatRequest):
    # Reuse the same ADK agent for now
    message = request.message
    session_id = request.session_id
    if not message:
        raise HTTPException(status_code=400, detail='Missing message')
    message_to_send = wrap_with_json_prompt(message) if detect_graph_intent(message) else message
    res = await agent.invoke(message_to_send, session_id, request.history)
    answer = res.get('content')
    graph = None
    try:
        parsed = json.loads(answer) if isinstance(answer, str) else None
        if isinstance(parsed, dict) and ('nodes' in parsed or 'edges' in parsed):
            graph = parsed
    except Exception:
        graph = None

    graph_saved = False
    if graph is not None:
        key = session_id or f"session-{int(asyncio.get_event_loop().time() * 1000)}"
        _store_graph(key, graph)
        graph_saved = True

    payload = {
        'answer': answer,
        'steps': res.get('steps'),
        'retrieval_sources': res.get('retrieval_sources'),
        'graph_saved': graph_saved
    }

    return JSONResponse(payload)


@app.get('/api/v1/adk/graph')
async def get_graph(session_key: Optional[str] = None):
    # Return stored graph by session key. If no key provided and only one graph exists, return that.
    if session_key:
        entry = GRAPH_STORE.get(session_key)
        if entry is None:
            raise HTTPException(status_code=404, detail='Graph not found')
        return JSONResponse({'graph': entry.get('graph'), 'session_key': session_key, 'version': entry.get('version')})

    # No key provided: if single graph available return it
    if len(GRAPH_STORE) == 1:
        key, entry = next(iter(GRAPH_STORE.items()))
        return JSONResponse({'graph': entry.get('graph'), 'session_key': key, 'version': entry.get('version')})

    raise HTTPException(status_code=400, detail='session_key required when multiple graphs stored')


@app.delete('/api/v1/adk/graph')
async def delete_graph(session_key: Optional[str] = None):
    if not session_key:
        raise HTTPException(status_code=400, detail='session_key required')
    if session_key in GRAPH_STORE:
        del GRAPH_STORE[session_key]
        SESSION_META.pop(session_key, None)
        return JSONResponse({'deleted': True, 'session_key': session_key})
    raise HTTPException(status_code=404, detail='Graph not found')


@app.post('/api/v1/adk/graph/reset')
async def reset_graph(session_key: Optional[str] = None, delete_graph: Optional[bool] = False):
    if not session_key:
        raise HTTPException(status_code=400, detail='session_key required')
    # reset session meta version
    if session_key in SESSION_META:
        SESSION_META[session_key]['version'] = 0
    else:
        SESSION_META[session_key] = {'version': 0}

    if delete_graph and session_key in GRAPH_STORE:
        del GRAPH_STORE[session_key]

    return JSONResponse({'reset': True, 'session_key': session_key})


@app.on_event('startup')
async def _startup_background_tasks():
    # Start background cleanup loop
    try:
        import asyncio
        asyncio.create_task(_cleanup_graph_store_loop())
    except Exception:
        pass


@app.post('/api/v1/agent-chat/stream')
async def agent_chat_stream(request: ChatRequest):
    message = request.message
    history = request.history
    session_id = request.session_id
    if not message:
        raise HTTPException(status_code=400, detail='Missing message')

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            message_to_send = wrap_with_json_prompt(message) if detect_graph_intent(message) else message
            async for item in agent.stream(message_to_send, None, history):
                out = {}
                content = item.get('content')
                graph = None
                try:
                    parsed = json.loads(content) if isinstance(content, str) else None
                    if isinstance(parsed, dict) and ('nodes' in parsed or 'edges' in parsed):
                        graph = parsed
                except Exception:
                    graph = None

                if graph is not None:
                    key = session_id or f"session-{int(asyncio.get_event_loop().time() * 1000)}"
                    _store_graph(key, graph)
                    out['graph_saved'] = True
                    out['graph_session_key'] = key
                else:
                    if 'content' in item:
                        out['content'] = item['content']

                yield json.dumps(out) + '\n'
            yield json.dumps({'done': True}) + '\n'
        except Exception as e:
            yield json.dumps({'error': str(e)}) + '\n'

    return StreamingResponse(event_stream(), media_type='text/plain')

    return StreamingResponse(event_stream(), media_type='text/plain')


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('src.adk_api:app', host='0.0.0.0', port=int(__import__('os').environ.get('PORT', 10000)), log_level='info')
