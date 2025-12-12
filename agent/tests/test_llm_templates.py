import asyncio
import pytest
import importlib.util
import importlib.machinery
import os
import pathlib
import sys
import types


def _load_module(name: str, filename: str):
    base = pathlib.Path(__file__).resolve().parents[1]
    path = os.path.join(base, 'src', filename)
    pkg = types.ModuleType('src')
    pkg.__path__ = [os.path.join(base, 'src')]
    sys.modules['src'] = pkg
    spec = importlib.util.spec_from_file_location(f'src.{name}', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


adk_api = _load_module('adk_api', 'adk_api.py')
llm_prompts = _load_module('llm_prompts', 'llm_prompts.py')
graph_intent = _load_module('graph_intent', 'graph_intent.py')
wrap_with_json_prompt = llm_prompts.wrap_with_json_prompt
detect_graph_intent = graph_intent.detect_graph_intent


def test_detect_graph_intent_positive():
    assert detect_graph_intent('Create 2 manual tests and connect them to a file upload')
    assert detect_graph_intent('Добавь загрузку файла и свяжи её с ручным тестом')


def test_detect_graph_intent_negative():
    assert not detect_graph_intent('What is the status of the deployment today?')


def test_wrap_with_json_prompt_contains_instruction():
    msg = 'create a start node and an end node'
    wrapped = wrap_with_json_prompt(msg)
    assert 'Return ONLY a JSON object' in wrapped
    assert msg in wrapped
    assert 'Do NOT reuse or repeat graphs' in wrapped


@pytest.mark.asyncio
async def test_adk_chat_uses_template(monkeypatch):
    # Capture the message passed into agent.invoke
    captured = {}

    async def fake_invoke(query, session_id, history):
        captured['query'] = query
        return {'content': '{"nodes": [], "edges": []}'}

    monkeypatch.setattr(adk_api, 'agent', adk_api.agent)
    monkeypatch.setattr(adk_api.agent, 'invoke', fake_invoke)

    # Call adk_chat with graph-like instruction
    req = adk_api.ChatRequest(message='create a manual test and connect it to a file upload', session_id='s1')
    await adk_api.adk_chat(req)

    assert 'Return ONLY a JSON object' in captured['query']
