import time
import asyncio
import importlib.util
import importlib.machinery
import os
import pathlib


def _load_adk_module():
    base = pathlib.Path(__file__).resolve().parents[1]
    path = os.path.join(base, 'src', 'adk_api.py')
    # Ensure 'src' package is available for relative imports used by the module
    import sys, types
    src_pkg = types.ModuleType('src')
    src_pkg.__path__ = [os.path.join(base, 'src')]
    sys.modules['src'] = src_pkg
    spec = importlib.util.spec_from_file_location('src.adk_api', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_store_and_cleanup():
    mod = _load_adk_module()
    _store_graph = mod._store_graph
    GRAPH_STORE = mod.GRAPH_STORE
    _cleanup_graph_store_once = mod._cleanup_graph_store_once

    # clear store
    GRAPH_STORE.clear()
    _store_graph('k1', {'nodes': [], 'edges': []})
    # Simulate an old entry by manipulating created_at
    GRAPH_STORE['k1']['created_at'] = time.time() - 7200

    removed = _cleanup_graph_store_once(now=time.time())
    assert removed == 1
    assert 'k1' not in GRAPH_STORE


def test_session_versioning_and_reset():
    mod = _load_adk_module()
    _store_graph = mod._store_graph
    GRAPH_STORE = mod.GRAPH_STORE
    SESSION_META = mod.SESSION_META

    GRAPH_STORE.clear()
    SESSION_META.clear()

    _store_graph('s1', {'nodes': [], 'edges': []})
    assert SESSION_META['s1']['version'] == 1
    _store_graph('s1', {'nodes': [], 'edges': []})
    assert SESSION_META['s1']['version'] == 2

    # Call reset endpoint (it's async)
    asyncio.run(mod.reset_graph(session_key='s1'))
    # After reset, version should be 0
    assert SESSION_META['s1']['version'] == 0
