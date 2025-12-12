"""
Генератор автоматизированных тестов (UI e2e и API)
"""
from typing import Dict, Any, List
from .llm_service import LLMService


class AutomatedTestGenerator:
    """Генератор автоматизированных тестов"""
    
    def __init__(self):
        self.llm_service = LLMService()
    
    def _get_ui_system_prompt(self) -> str:
        """Системный промпт для генерации UI e2e тестов"""
        return """Ты эксперт по автоматизации тестирования. Генерируй pytest тесты для e2e UI тестирования.

Требования:
1. Использовать pytest и selenium/playwright
2. Паттерн AAA (Arrange-Act-Assert)
3. Четкая структура: setup, test, teardown
4. Обработка ошибок и ожиданий
5. Использовать page object pattern где возможно
6. Добавлять комментарии для сложных действий

Генерируй только валидный Python код."""
    
    def _get_api_system_prompt(self) -> str:
        """Системный промпт для генерации API тестов"""
        return """Ты эксперт по API тестированию. Генерируй pytest тесты для API.

Требования:
1. Использовать pytest и requests/httpx
2. Паттерн AAA (Arrange-Act-Assert)
3. Проверки статус-кодов, схем ответов
4. Параметризация тестов где возможно
5. Фикстуры для аутентификации и setup
6. Использовать Allure декораторы для отчетности

Генерируй только валидный Python код."""
    
    async def generate_ui_tests(
        self,
        test_cases: str,
        requirements: str = "",
        framework: str = "selenium"
    ) -> str:
        """
        Генерирует UI e2e тесты на основе тест-кейсов
        
        Args:
            test_cases: Тест-кейсы в формате Allure TestOps as Code
            requirements: Дополнительные требования
            framework: Фреймворк (selenium, playwright)
        
        Returns:
            Python код автоматизированных тестов
        """
        prompt = f"""На основе следующих тест-кейсов сгенерируй автоматизированные e2e UI тесты используя {framework}:

Тест-кейсы:
{test_cases}

Дополнительные требования:
{requirements}

Сгенерируй pytest тесты, которые автоматизируют эти сценарии."""
        
        code = await self.llm_service.generate(
            prompt=prompt,
            system_prompt=self._get_ui_system_prompt(),
            temperature=0.3,
            max_tokens=4000
        )
        
        # Очистка от markdown
        if "```python" in code:
            code = code.split("```python")[1].split("```")[0]
        elif "```" in code:
            code = code.split("```")[1].split("```")[0]
        
        return code.strip()
    
    async def generate_api_tests(
        self,
        openapi_spec: Dict[str, Any],
        test_cases: str = "",
        base_url: str = ""
    ) -> str:
        """
        Генерирует API тесты на основе OpenAPI спецификации
        
        Args:
            openapi_spec: OpenAPI спецификация
            test_cases: Существующие тест-кейсы (опционально)
            base_url: Базовый URL API
        
        Returns:
            Python код автоматизированных API тестов
        """
        spec_description = self._format_openapi_spec(openapi_spec)
        
        # Формируем часть с тест-кейсами отдельно, чтобы избежать проблемы с \n в f-string
        test_cases_part = ""
        if test_cases:
            test_cases_part = f"Существующие тест-кейсы для справки:\n{test_cases}\n"
        
        prompt = f"""На основе следующей OpenAPI спецификации сгенерируй автоматизированные API тесты:

{spec_description}

Базовый URL: {base_url}

{test_cases_part}Сгенерируй pytest тесты с проверками статус-кодов, схем ответов и валидацией данных."""
        
        code = await self.llm_service.generate(
            prompt=prompt,
            system_prompt=self._get_api_system_prompt(),
            temperature=0.3,
            max_tokens=4000
        )
        
        # Очистка от markdown
        if "```python" in code:
            code = code.split("```python")[1].split("```")[0]
        elif "```" in code:
            code = code.split("```")[1].split("```")[0]
        
        return code.strip()
    
    def _format_openapi_spec(self, spec: Dict[str, Any]) -> str:
        """Форматирует OpenAPI спецификацию"""
        description = f"OpenAPI {spec.get('openapi', 'unknown')}\n\n"
        
        if 'info' in spec:
            description += f"{spec['info'].get('title', 'API')}\n"
            description += f"{spec['info'].get('description', '')}\n\n"
        
        if 'paths' in spec:
            for path, methods in spec['paths'].items():
                for method, details in methods.items():
                    if method.lower() in ['get', 'post', 'put', 'delete', 'patch']:
                        description += f"{method.upper()} {path}\n"
                        description += f"  {details.get('summary', '')}\n"
                        if 'requestBody' in details:
                            description += "  Request body required\n"
                        if 'responses' in details:
                            description += "  Responses:\n"
                            for status, response in details['responses'].items():
                                description += f"    {status}: {response.get('description', '')}\n"
        
        return description

