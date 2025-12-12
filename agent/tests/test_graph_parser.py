import runpy


def test_parse_manual_test_connect_file_upload():
    gp = runpy.run_path('src/graph_parser.py')
    parse_nl_to_graph = gp['parse_nl_to_graph']
    text = 'Нужно создать граф manual test и связать его с file upload node'
    g = parse_nl_to_graph(text)
    assert g is not None
    assert 'nodes' in g and 'edges' in g
    types = set(n['type'] for n in g['nodes'])
    assert 'manualTest' in types
    assert 'fileUpload' in types
    assert len(g['edges']) >= 1


def test_parse_counts_and_multiple_nodes():
    gp = runpy.run_path('src/graph_parser.py')
    parse_nl_to_graph = gp['parse_nl_to_graph']
    text = 'Create 3 api nodes and 2 prompt nodes and connect api -> prompt'
    g = parse_nl_to_graph(text)
    assert g is not None
    api_nodes = [n for n in g['nodes'] if n['type'] == 'api']
    prompt_nodes = [n for n in g['nodes'] if n['type'] == 'prompt']
    assert len(api_nodes) == 3
    assert len(prompt_nodes) == 2
    # edges should connect api to prompt but not create multiple incoming targets
    assert len(g['edges']) >= 1


def test_start_end_uniqueness_and_incoming_limit():
    gp = runpy.run_path('src/graph_parser.py')
    parse_nl_to_graph = gp['parse_nl_to_graph']
    # Request multiple starts/ends
    text = 'Create 2 start nodes and 2 end nodes and 3 api nodes and connect api -> start'
    g = parse_nl_to_graph(text)
    start_nodes = [n for n in g['nodes'] if n['type'] == 'start']
    end_nodes = [n for n in g['nodes'] if n['type'] == 'end']
    api_nodes = [n for n in g['nodes'] if n['type'] == 'api']
    assert len(start_nodes) == 1
    assert len(end_nodes) == 1
    # The edge connecting api -> start should only add at most one incoming to start
    incoming_to_start = sum(1 for e in g['edges'] if any(n['id'] == e['target'] for n in start_nodes))
    assert incoming_to_start <= 1


def test_label_parsing():
    gp = runpy.run_path('src/graph_parser.py')
    parse_nl_to_graph = gp['parse_nl_to_graph']
    text = 'Создай manual test "Регрессионный тест" и file upload "Загрузка отчётов"'
    g = parse_nl_to_graph(text)
    assert g is not None
    labels = {n['type']: n['data']['label'] for n in g['nodes']}
    assert any('Регрессионный' in v for v in labels.values())
    assert any('Загрузка' in v for v in labels.values())
