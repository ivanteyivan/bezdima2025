import asyncio

from main import OptimizeRequest, get_test_optimizer


class FakeOptimizer:
    async def analyze_coverage(self, test_cases, requirements):
        return {"analysis": "ANALYSIS", "coverage_percentage": 80, "gaps": []}

    async def find_duplicates(self, test_cases):
        return {"llm_analysis": "DUPS", "detected_duplicates": []}

    async def suggest_improvements(self, test_cases, defect_history=""):
        return {"suggestions": "IMPROVE", "priority_improvements": ["Add negative tests"]}


def test_optimize_endpoint(monkeypatch):
    fake = FakeOptimizer()
    monkeypatch.setattr('main.test_optimizer', fake)

    req = OptimizeRequest(test_cases=["t1", "t2"], requirements="reqs", defect_history="")
    res = asyncio.run(__import__('main').optimize_tests(req))

    assert res['success'] is True
    assert 'coverage' in res
    assert res['coverage']['analysis'] == 'ANALYSIS'
    assert 'duplicates' in res
    assert 'improvements' in res
