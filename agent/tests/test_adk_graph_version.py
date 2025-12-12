import importlib.util
import importlib.machinery
import os
import pathlib
import sys
import types


def _load_adk_module():
    base = pathlib.Path(__file__).resolve().parents[1]
    path = os.path.join(base, 'src', 'adk_api.py')
    src_pkg = types.ModuleType('src')
    src_pkg.__path__ = [os.path.join(base, 'src')]
    sys.modules['src'] = src_pkg
    spec = importlib.util.spec_from_file_location('src.adk_api', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_adk_chat_increments_session_version(monkeypatch):
    mod = _load_adk_module()

    async def fake_invoke(query, session_id, history):
        return {'content': '{"nodes": [], "edges": []}'}

    monkeypatch.setattr(mod, 'agent', mod.agent)
    monkeypatch.setattr(mod.agent, 'invoke', fake_invoke)

    req = mod.ChatRequest(message='create graph', session_id='sess-ver-1')
    res = mod.__dict__['adk_chat'](req)
    # adk_chat is async, run it
    import asyncio
    resp = asyncio.run(res)

    # Ensure SESSION_META was updated
    assert mod.SESSION_META.get('sess-ver-1', {}).get('version', 0) >= 1
    # Ensure returned payload indicates graph_saved
    # resp is a JSONResponse; its content embedded in .body may vary, but we can check GRAPH_STORE
    assert 'sess-ver-1' in mod.GRAPH_STORE
