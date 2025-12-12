"""
Генератор ручных тест-кейсов в формате Allure TestOps as Code
"""
from typing import Dict, Any, List
from .llm_service import LLMService


class TestCaseGenerator:
    """Генератор тест-кейсов в формате Allure TestOps as Code"""
    
    def __init__(self):
        self.llm_service = LLMService()
    
    def _get_system_prompt(self) -> str:
        """Системный промпт для генерации тест-кейсов"""
        return """Ты эксперт по тестированию ПО. Твоя задача - генерировать тест-кейсы в формате Allure TestOps as Code на Python.

Требования к формату:
1. Использовать паттерн AAA (Arrange-Act-Assert)
2. Обязательные декораторы Allure:
   - @allure.manual
   - @allure.label("owner", owner)
   - @allure.feature(feature)
   - @allure.story(story)
   - @allure.suite(test_type)
   - @pytest.mark.manual
3. Для каждого теста:
   - @allure.title(test_title)
   - @allure.link(jira_link, name=jira_name) (если есть)
   - @allure.tag("CRITICAL" | "NORMAL" | "LOW")
   - @allure.label("priority", priority)
4. Использовать with allure_step() для шагов
5. Корректное именование классов и методов

Генерируй только валидный Python код без дополнительных объяснений."""
    
    async def generate_from_requirements(
        self,
        requirements: str,
        test_type: str = "manual",
        feature: str = "Default Feature",
        story: str = "Default Story",
        owner: str = "QA Team"
    ) -> str:
        """
        Генерирует тест-кейсы из описания требований
        
        Args:
            requirements: Описание требований (UI или API спецификация)
            test_type: Тип теста (manual, automated)
            feature: Название фичи
            story: Название истории
            owner: Владелец тест-кейса
        
        Returns:
            Python код тест-кейса
        """
        prompt = f"""Сгенерируй тест-кейсы в формате Allure TestOps as Code на основе следующих требований:

{requirements}

Параметры:
- test_type: {test_type}
- feature: {feature}
- story: {story}
- owner: {owner}

Сгенерируй несколько тест-кейсов, покрывающих основные сценарии. Используй паттерн AAA."""
        
        code = await self.llm_service.generate(
            prompt=prompt,
            system_prompt=self._get_system_prompt(),
            temperature=0.3,
            max_tokens=4000
        )
        
        # Очистка кода от markdown форматирования если есть
        if "```python" in code:
            code = code.split("```python")[1].split("```")[0]
        elif "```" in code:
            code = code.split("```")[1].split("```")[0]
        
        return code.strip()
    
    async def generate_from_openapi(
        self,
        openapi_spec: Dict[str, Any],
        endpoint: str = None
    ) -> str:
        """
        Генерирует тест-кейсы из OpenAPI спецификации
        
        Args:
            openapi_spec: OpenAPI спецификация (dict)
            endpoint: Конкретный endpoint для генерации (опционально)
        
        Returns:
            Python код тест-кейсов
        """
        # Формируем описание из OpenAPI
        spec_description = self._format_openapi_spec(openapi_spec, endpoint)
        
        return await self.generate_from_requirements(
            requirements=spec_description,
            test_type="manual",
            feature="API Testing",
            story="API Test Cases"
        )
    
    def _format_openapi_spec(self, spec: Dict[str, Any], endpoint: str = None) -> str:
        """Форматирует OpenAPI спецификацию в текстовое описание"""
        description = f"OpenAPI спецификация версии {spec.get('openapi', 'unknown')}\n\n"
        
        if 'info' in spec:
            description += f"API: {spec['info'].get('title', 'Unknown')}\n"
            description += f"Описание: {spec['info'].get('description', '')}\n\n"
        
        if 'paths' in spec:
            description += "Доступные endpoints:\n"
            for path, methods in spec['paths'].items():
                if endpoint and endpoint not in path:
                    continue
                description += f"\n{path}:\n"
                for method, details in methods.items():
                    if method.lower() in ['get', 'post', 'put', 'delete', 'patch']:
                        description += f"  {method.upper()}: {details.get('summary', '')}\n"
                        if 'parameters' in details:
                            description += "    Параметры:\n"
                            for param in details['parameters']:
                                description += f"      - {param.get('name')}: {param.get('description', '')}\n"
        
        return description

