import asyncio
import json
import importlib.util
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


def test_stream_with_inline_json_graph():
    mod = _load_adk_module()

    async def fake_stream(message, session_id, history):
        yield {'content': json.dumps({'nodes': [{'id': 's1', 'type': 'start'}], 'edges': []})}

    mod.agent.stream = fake_stream

    async def run():
        req = mod.ChatRequest(message='create graph', session_id='sess1')
        resp = await mod.adk_chat_stream(req)
        collected = []
        async for chunk in resp.body_iterator:
            collected.append(json.loads(chunk))
            # stop on done
            if collected[-1].get('done'):
                break
        return collected

    collected = asyncio.run(run())

    # There should be at least one emitted object with graph_saved True and no 'content'
    found = [c for c in collected if c.get('graph_saved')]
    assert len(found) >= 1
    for f in found:
        assert 'content' not in f
        assert f.get('graph_session_key') is not None


def test_stream_with_parsable_plain_text():
    mod = _load_adk_module()

    async def fake_stream(message, session_id, history):
        # plain text that parse_nl_to_graph can parse
        yield {'content': 'Create a start node and an end node and connect start -> end'}

    mod.agent.stream = fake_stream

    async def run():
        req = mod.ChatRequest(message='create graph', session_id='sess2')
        resp = await mod.adk_chat_stream(req)
        collected = []
        async for chunk in resp.body_iterator:
            collected.append(json.loads(chunk))
            if collected[-1].get('done'):
                break
        return collected

    collected = asyncio.run(run())

    found = [c for c in collected if c.get('graph_saved')]
    assert len(found) >= 1
    for f in found:
        assert 'content' not in f
        assert f.get('graph_session_key') is not None
