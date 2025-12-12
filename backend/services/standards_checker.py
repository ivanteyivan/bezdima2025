"""
Модуль проверки тест-кейсов на соответствие стандартам
"""
from typing import Dict, Any, List
import re
from .llm_service import LLMService


class StandardsChecker:
    """Проверка тест-кейсов на соответствие стандартам Allure"""
    
    def __init__(self):
        self.llm_service = LLMService()
        self.required_decorators = [
            r'@allure\.manual',
            r'@allure\.label\("owner"',
            r'@allure\.feature\(',
            r'@allure\.story\(',
            r'@allure\.suite\(',
            r'@pytest\.mark\.manual'
        ]
    
    async def check_test_case(
        self,
        test_case: str
    ) -> Dict[str, Any]:
        """
        Проверяет тест-кейс на соответствие стандартам
        
        Args:
            test_case: Код тест-кейса
        
        Returns:
            Результат проверки с рекомендациями
        """
        # Структурная проверка
        structure_check = self._check_structure(test_case)
        
        # Проверка декораторов
        decorators_check = self._check_decorators(test_case)
        
        # Проверка AAA паттерна
        aaa_check = self._check_aaa_pattern(test_case)
        
        # LLM проверка качества
        quality_check = await self._llm_quality_check(test_case)
        
        # Общая оценка
        score = self._calculate_score(structure_check, decorators_check, aaa_check)
        
        return {
            "score": score,
            "structure": structure_check,
            "decorators": decorators_check,
            "aaa_pattern": aaa_check,
            "quality_analysis": quality_check,
            "recommendations": self._generate_recommendations(
                structure_check, decorators_check, aaa_check, quality_check
            )
        }
    
    def _check_structure(self, test_case: str) -> Dict[str, Any]:
        """Проверяет структуру тест-кейса"""
        checks = {
            "has_class": bool(re.search(r'class\s+\w+', test_case)),
            "has_test_method": bool(re.search(r'def\s+test_\w+', test_case)),
            "has_description": bool(re.search(r'""".*"""', test_case, re.DOTALL)),
            "has_steps": bool(re.search(r'allure_step|with\s+allure\.step', test_case)),
            "has_expected_result": bool(re.search(r'assert|expected|should', test_case, re.IGNORECASE))
        }
        
        return {
            "passed": all(checks.values()),
            "details": checks,
            "missing": [k for k, v in checks.items() if not v]
        }
    
    def _check_decorators(self, test_case: str) -> Dict[str, Any]:
        """Проверяет наличие обязательных декораторов"""
        found_decorators = []
        missing_decorators = []
        
        for decorator_pattern in self.required_decorators:
            if re.search(decorator_pattern, test_case):
                found_decorators.append(decorator_pattern)
            else:
                missing_decorators.append(decorator_pattern)
        
        return {
            "passed": len(missing_decorators) == 0,
            "found": found_decorators,
            "missing": missing_decorators,
            "coverage": len(found_decorators) / len(self.required_decorators) * 100
        }
    
    def _check_aaa_pattern(self, test_case: str) -> Dict[str, Any]:
        """Проверяет соответствие паттерну AAA"""
        # Ищем Arrange (подготовка данных)
        has_arrange = bool(re.search(
            r'(setup|arrange|prepare|initialize|create|setup_data)',
            test_case, re.IGNORECASE
        ))
        
        # Ищем Act (действие)
        has_act = bool(re.search(
            r'(action|act|execute|perform|call|invoke)',
            test_case, re.IGNORECASE
        ))
        
        # Ищем Assert (проверка)
        has_assert = bool(re.search(r'assert|verify|check|validate', test_case, re.IGNORECASE))
        
        return {
            "passed": has_arrange and has_act and has_assert,
            "has_arrange": has_arrange,
            "has_act": has_act,
            "has_assert": has_assert
        }
    
    async def _llm_quality_check(self, test_case: str) -> Dict[str, Any]:
        """LLM проверка качества тест-кейса"""
        prompt = f"""Проверь качество следующего тест-кейса на соответствие стандартам Allure TestOps:

{test_case}

Проверь:
1. Корректность структуры
2. Полноту декораторов
3. Соответствие паттерну AAA
4. Качество именования
5. Полноту шагов и проверок

Дай оценку и рекомендации."""
        
        analysis = await self.llm_service.generate(
            prompt=prompt,
            system_prompt="Ты эксперт по стандартам Allure TestOps. Проверяй тест-кейсы на соответствие.",
            temperature=0.2,
            max_tokens=1000
        )
        
        return {
            "analysis": analysis,
            "is_valid": "соответствует" in analysis.lower() or "коррект" in analysis.lower()
        }
    
    def _calculate_score(
        self,
        structure: Dict[str, Any],
        decorators: Dict[str, Any],
        aaa: Dict[str, Any]
    ) -> float:
        """Вычисляет общий балл соответствия"""
        structure_score = 30 if structure["passed"] else 10
        decorators_score = decorators["coverage"] * 0.4
        aaa_score = 30 if aaa["passed"] else 10
        
        return round(structure_score + decorators_score + aaa_score, 2)
    
    def _generate_recommendations(
        self,
        structure: Dict[str, Any],
        decorators: Dict[str, Any],
        aaa: Dict[str, Any],
        quality: Dict[str, Any]
    ) -> List[str]:
        """Генерирует рекомендации по улучшению"""
        recommendations = []
        
        if not structure["passed"]:
            recommendations.append(f"Добавить недостающие элементы структуры: {', '.join(structure['missing'])}")
        
        if decorators["missing"]:
            recommendations.append(f"Добавить декораторы: {len(decorators['missing'])} отсутствует")
        
        if not aaa["passed"]:
            missing = []
            if not aaa["has_arrange"]:
                missing.append("Arrange")
            if not aaa["has_act"]:
                missing.append("Act")
            if not aaa["has_assert"]:
                missing.append("Assert")
            recommendations.append(f"Улучшить паттерн AAA: добавить {', '.join(missing)}")
        
        return recommendations
    
    async def check_batch(
        self,
        test_cases: List[str]
    ) -> Dict[str, Any]:
        """
        Проверяет несколько тест-кейсов
        
        Args:
            test_cases: Список тест-кейсов
        
        Returns:
            Сводный отчет
        """
        results = []
        for test_case in test_cases:
            result = await self.check_test_case(test_case)
            results.append(result)
        
        avg_score = sum(r["score"] for r in results) / len(results) if results else 0
        
        return {
            "total_tests": len(test_cases),
            "average_score": round(avg_score, 2),
            "results": results,
            "summary": {
                "passed": sum(1 for r in results if r["score"] >= 70),
                "needs_improvement": sum(1 for r in results if 50 <= r["score"] < 70),
                "failed": sum(1 for r in results if r["score"] < 50)
            }
        }

