"""
Модуль оптимизации тест-кейсов
"""
from typing import List, Dict, Any
from .llm_service import LLMService
import re


class TestOptimizer:
    """Оптимизатор тест-кейсов"""
    
    def __init__(self):
        self.llm_service = LLMService()
    
    async def analyze_coverage(
        self,
        test_cases: List[str],
        requirements: str
    ) -> Dict[str, Any]:
        """
        Анализирует покрытие функционала тестами
        
        Args:
            test_cases: Список тест-кейсов
            requirements: Описание требований
        
        Returns:
            Результат анализа покрытия
        """
        test_cases_text = "\n\n".join(test_cases)
        
        prompt = f"""Проанализируй покрытие функционала тестами.

Требования:
{requirements}

Тест-кейсы:
{test_cases_text}

Определи:
1. Что покрыто тестами
2. Что не покрыто тестами (пробелы)
3. Критичность непокрытых сценариев
4. Рекомендации по улучшению покрытия

Ответь в структурированном формате."""
        
        analysis = await self.llm_service.generate(
            prompt=prompt,
            system_prompt="Ты эксперт по анализу покрытия тестами. Анализируй тест-кейсы и требования.",
            temperature=0.2,
            max_tokens=2000
        )
        
        return {
            "analysis": analysis,
            "coverage_percentage": self._estimate_coverage(test_cases, requirements),
            "gaps": await self._identify_gaps(test_cases, requirements)
        }
    
    async def find_duplicates(
        self,
        test_cases: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Находит дублирующиеся тест-кейсы
        
        Args:
            test_cases: Список тест-кейсов
        
        Returns:
            Список найденных дубликатов
        """
        if len(test_cases) < 2:
            return []
        
        test_cases_text = "\n\n---TEST CASE---\n\n".join(test_cases)
        
        prompt = f"""Найди дублирующиеся, устаревшие или конфликтующие тест-кейсы:

{test_cases_text}

Для каждого дубликата укажи:
1. Номера тест-кейсов
2. Причину дублирования
3. Рекомендацию (объединить/удалить/оставить)"""
        
        analysis = await self.llm_service.generate(
            prompt=prompt,
            system_prompt="Ты эксперт по оптимизации тест-кейсов. Находи дубликаты и конфликты.",
            temperature=0.2,
            max_tokens=2000
        )
        
        # Простой анализ на основе названий тестов
        duplicates = self._simple_duplicate_check(test_cases)
        
        return {
            "llm_analysis": analysis,
            "detected_duplicates": duplicates
        }
    
    async def suggest_improvements(
        self,
        test_cases: List[str],
        defect_history: str = ""
    ) -> Dict[str, Any]:
        """
        Предлагает улучшения на основе типовых дефектов
        
        Args:
            test_cases: Список тест-кейсов
            defect_history: История дефектов (опционально)
        
        Returns:
            Рекомендации по улучшению
        """
        test_cases_text = "\n\n".join(test_cases)
        
        # Формируем часть с историей дефектов отдельно, чтобы избежать проблемы с \n в f-string
        defect_history_part = ""
        if defect_history:
            defect_history_part = f"История дефектов:\n{defect_history}\n"
        
        prompt = f"""Проанализируй тест-кейсы и предложи улучшения:

Тест-кейсы:
{test_cases_text}

{defect_history_part}Предложи:
1. Улучшения на основе типовых дефектов
2. Дополнительные проверки
3. Оптимизацию критических сценариев
4. Улучшение структуры тестов"""
        
        suggestions = await self.llm_service.generate(
            prompt=prompt,
            system_prompt="Ты эксперт по улучшению тест-кейсов. Анализируй и предлагай практические улучшения.",
            temperature=0.3,
            max_tokens=2000
        )
        
        return {
            "suggestions": suggestions,
            "priority_improvements": await self._identify_priority_improvements(test_cases)
        }
    
    def _estimate_coverage(self, test_cases: List[str], requirements: str) -> float:
        """Простая оценка покрытия (можно улучшить)"""
        # Базовая эвристика: количество тест-кейсов относительно требований
        req_keywords = len(re.findall(r'\b(?:проверить|тест|сценарий|кейс)\b', requirements, re.IGNORECASE))
        coverage = min(100, (len(test_cases) / max(1, req_keywords)) * 100)
        return round(coverage, 2)
    
    async def _identify_gaps(self, test_cases: List[str], requirements: str) -> List[str]:
        """Идентифицирует пробелы в покрытии"""
        prompt = f"""Найди пробелы в покрытии тестами:

Требования:
{requirements}

Тест-кейсы:
{chr(10).join(test_cases[:5])}

Укажи конкретные пробелы в покрытии."""
        
        gaps = await self.llm_service.generate(
            prompt=prompt,
            system_prompt="Ты эксперт по анализу покрытия. Находи пробелы.",
            temperature=0.2,
            max_tokens=1000
        )
        
        return gaps.split('\n') if gaps else []
    
    def _simple_duplicate_check(self, test_cases: List[str]) -> List[Dict[str, Any]]:
        """Простая проверка дубликатов по названиям"""
        duplicates = []
        test_names = []
        
        for i, test_case in enumerate(test_cases):
            # Извлекаем название теста
            name_match = re.search(r'def\s+(\w+)', test_case)
            if name_match:
                test_name = name_match.group(1)
                if test_name in test_names:
                    duplicates.append({
                        "test_case_1": test_names.index(test_name),
                        "test_case_2": i,
                        "name": test_name
                    })
                test_names.append(test_name)
        
        return duplicates
    
    async def _identify_priority_improvements(self, test_cases: List[str]) -> List[str]:
        """Идентифицирует приоритетные улучшения"""
        # Можно добавить более сложную логику
        return [
            "Добавить проверки граничных значений",
            "Улучшить обработку ошибок",
            "Добавить негативные тест-кейсы"
        ]

