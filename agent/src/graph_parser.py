from typing import Optional, Dict, Any, List
import re
from datetime import datetime


NODE_KEYWORDS = {
    'manualTest': ['manual test', 'manual-test', 'manual_test', 'ручн', 'ручной тест', 'manual тест', 'manualtest', 'manual'],
    'fileUpload': ['file upload', 'file-upload', 'file_upload', 'fileupload', 'загруз', 'загрузка файла', 'file upload node', 'file upload'],
    'fileDownload': ['file download', 'file-download', 'file_download', 'filedownload', 'скач', 'скачать', 'file download node'],
    'api': ['api', 'endpoint', 'запрос', 'api node', 'api node component', 'api node'],
    'prompt': ['prompt', 'промпт'],
    'start': ['start', 'старт', 'начало'],
    'end': ['end', 'конец', 'финиш'],
    'automatedTest': ['automated test', 'автомат', 'автоматический тест', 'automatedtest'],
    'checkStandards': ['check standards', 'check-standards', 'проверка стандартов', 'check standards node'],
    'optimization': ['optimization', 'optimize', 'optimization node', 'оптимиза'],
    'statistics': ['statistics', 'статист', 'statistics node']
}


def _find_node_types_with_counts(text: str) -> List[Dict[str, Any]]:
    """Find occurrences of node keywords with optional counts. Returns list of dicts {type, count}.

    Examples detected: '2 manual tests', 'create 3 file upload nodes', 'manual test and file upload'
    """
    lower = text.lower()
    results: List[Dict[str, Any]] = []

    # First look for explicit count patterns like '2 manual test(s)'
    for node_type, kws in NODE_KEYWORDS.items():
        for kw in kws:
            # match digits before keyword
            m = re.search(rf"(\d+)\s+{re.escape(kw)}s?", lower)
            if m:
                cnt = int(m.group(1))
                results.append({'type': node_type, 'count': cnt})
                break

    # If none found with counts, fallback to single appearances
    if not results:
        for node_type, kws in NODE_KEYWORDS.items():
            for kw in kws:
                if kw in lower:
                    results.append({'type': node_type, 'count': 1})
                    break

    return results


def _extract_labels(text: str) -> Dict[str, List[str]]:
    """Extract labels for node types from the text.

    Returns mapping node_type -> list of labels detected in order.
    """
    labels: Dict[str, List[str]] = {}
    lower = text

    # Patterns: <node keyword> (named|called|label|с именем|под названием) "label"
    label_patterns = [
            r'(?P<kw>[\w\s-]+?)\s+(?:named|called|labelled|label|с именем|под названием|под именем)\s*[:\-]?\s*"(?P<label>[^"]+)"',
            r'(?P<kw>[\w\s-]+?)\s+"(?P<label>[^"]+)"'
    ]

    for p in label_patterns:
        for m in re.finditer(p, lower, flags=re.I):
            kw = m.group('kw').strip()
            lab = m.group('label').strip()
            # find which node type matches the kw
            for t, kws in NODE_KEYWORDS.items():
                if any(k in kw.lower() or k in kw for k in kws):
                    labels.setdefault(t, []).append(lab)
                    break

    return labels


def _detect_connection(text: str) -> List[Dict[str, Any]]:
    """Detect connection commands with optional counts. Returns list of {'src_type','dst_type','src_count','dst_count'}"""
    lower = text.lower()
    conns: List[Dict[str, Any]] = []

    # Patterns like 'connect X to Y' or 'connect 2 X to 1 Y'
    patterns = [
        r'connect\s+(?P<src_count>\d+\s+)?(?P<src>[\w\s-]+?)\s+to\s+(?P<dst_count>\d+\s+)?(?P<dst>[\w\s-]+)',
        r'связать\s+(?P<src_count>\d+\s+)?(?P<src>[\w\s-]+?)\s+с\s+(?P<dst_count>\d+\s+)?(?P<dst>[\w\s-]+)'
    ]

    for p in patterns:
        for m in re.finditer(p, lower):
            src = m.group('src').strip()
            dst = m.group('dst').strip()
            src_count = int(m.group('src_count').strip()) if m.group('src_count') else 1
            dst_count = int(m.group('dst_count').strip()) if m.group('dst_count') else 1
            conns.append({'src': src, 'dst': dst, 'src_count': src_count, 'dst_count': dst_count})

    # Also detect arrow style 'X -> Y' or 'X->Y'
    for m in re.finditer(r'(?P<src>[\w\s-]+?)\s*->\s*(?P<dst>[\w\s-]+)', lower):
        src = m.group('src').strip()
        dst = m.group('dst').strip()
        conns.append({'src': src, 'dst': dst, 'src_count': 1, 'dst_count': 1})

    return conns


def parse_nl_to_graph(text: str) -> Optional[Dict[str, Any]]:
    """Attempt to parse natural language instructions into a simple graph dict with nodes and edges.

    Returns None if nothing meaningful detected.
    """
    if not text or not text.strip():
        return None

    mentions = _find_node_types_with_counts(text)
    if not mentions:
        return None

    nodes = []
    id_map: Dict[str, List[str]] = {}
    now = datetime.utcnow().isoformat()
    counter = 0
    # Enforce only one start and one end by tracking
    seen_special = {'start': 0, 'end': 0}

    labels_map = _extract_labels(text)

    for m in mentions:
        t = m['type']
        count = max(1, int(m.get('count', 1)))
        # Enforce single start/end
        if t == 'start':
            count = 1
            if seen_special['start'] >= 1:
                continue
            seen_special['start'] += 1
        if t == 'end':
            count = 1
            if seen_special['end'] >= 1:
                continue
            seen_special['end'] += 1

        id_map.setdefault(t, [])
        for i in range(count):
            counter += 1
            nid = f"nl-{counter}-{t}-{int(datetime.utcnow().timestamp() * 1000) % 100000}"
            id_map[t].append(nid)
            # pick label from labels_map if available (consume in order)
            label_list = labels_map.get(t, [])
            label = label_list.pop(0) if label_list else t
            nodes.append({
                'id': nid,
                'type': t,
                'position': {'x': 100 + (len(nodes) * 120) % 800, 'y': 150 + ((len(nodes) * 120) // 800) * 120},
                'data': {'label': label, 'createdAt': now}
            })

    # Build edges based on explicit connection instructions
    edges = []
    conns = _detect_connection(text)
    edge_idx = 0
    # track incoming counts per prospective target to enforce single incoming
    incoming_counts: Dict[str, int] = {}

    def _can_add_edge(target_id: str) -> bool:
        return incoming_counts.get(target_id, 0) < 1

    for c in conns:
        # Map textual src/dst to known node types
        src_type = None
        dst_type = None
        for t in NODE_KEYWORDS.keys():
            if any(kw in c['src'] for kw in NODE_KEYWORDS[t]):
                src_type = t
            if any(kw in c['dst'] for kw in NODE_KEYWORDS[t]):
                dst_type = t

        # fallback: if names exactly match types
        if not src_type and c.get('src') in id_map:
            src_type = c.get('src')
        if not dst_type and c.get('dst') in id_map:
            dst_type = c.get('dst')

        if not src_type or not dst_type:
            continue

        src_ids = id_map.get(src_type, [])
        dst_ids = id_map.get(dst_type, [])
        if not src_ids or not dst_ids:
            continue

        # create up to min(src_count, dst_count, available) edges, but skip if it would violate incoming constraint
        src_count = min(c.get('src_count', 1), len(src_ids))
        dst_count = min(c.get('dst_count', 1), len(dst_ids))

        for i in range(min(src_count, dst_count)):
            s = src_ids[i % len(src_ids)]
            d = dst_ids[i % len(dst_ids)]
            if not _can_add_edge(d):
                continue
            edges.append({'id': f'nl-edge-{edge_idx}', 'source': s, 'target': d, 'data': {}})
            incoming_counts[d] = incoming_counts.get(d, 0) + 1
            edge_idx += 1

    # If no explicit connections but user used word 'connect' or 'связ', create simple first->second mapping
    if not edges and ('connect' in text.lower() or 'связ' in text.lower() or '->' in text):
        # connect first found type to second found type
        types_sequence = [m['type'] for m in mentions]
        if len(types_sequence) >= 2:
            t1 = types_sequence[0]
            t2 = types_sequence[1]
            s = id_map.get(t1, [None])[0]
            d = id_map.get(t2, [None])[0]
            if s and d and _can_add_edge(d):
                edges.append({'id': f'nl-edge-{edge_idx}', 'source': s, 'target': d, 'data': {}})

    return {'nodes': nodes, 'edges': edges}
