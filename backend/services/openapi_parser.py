"""
Парсер OpenAPI спецификаций
"""
from typing import Dict, Any, Optional, List
import json
import yaml
import requests
from urllib.parse import urlparse


class OpenAPIParser:
    """Парсер для OpenAPI 3.0 спецификаций"""
    
    def parse(self, spec_content: str, format: str = "auto") -> Dict[str, Any]:
        """
        Парсит OpenAPI спецификацию
        
        Args:
            spec_content: Содержимое спецификации (JSON или YAML)
            format: Формат ('json', 'yaml', 'auto')
        
        Returns:
            Распарсенная спецификация
        """
        if format == "auto":
            format = self._detect_format(spec_content)
        
        try:
            if format == "json":
                # Пробуем распарсить JSON
                try:
                    return json.loads(spec_content)
                except json.JSONDecodeError as e:
                    # Более понятное сообщение об ошибке
                    raise ValueError(
                        f"Ошибка парсинга JSON: {str(e)}\n"
                        f"Убедитесь, что:\n"
                        f"1. JSON валидный (проверьте на jsonlint.com)\n"
                        f"2. Все кавычки правильно экранированы\n"
                        f"3. Нет незакрытых скобок или запятых\n"
                        f"Первые 100 символов содержимого: {spec_content[:100]}"
                    )
            elif format == "yaml":
                return yaml.safe_load(spec_content)
            else:
                raise ValueError(f"Неподдерживаемый формат: {format}")
        except ValueError:
            raise  # Пробрасываем ValueError как есть
        except Exception as e:
            raise ValueError(f"Ошибка парсинга OpenAPI: {str(e)}")
    
    def parse_from_url(self, url: str) -> Dict[str, Any]:
        """
        Парсит OpenAPI спецификацию из URL
        
        Args:
            url: URL спецификации
        
        Returns:
            Распарсенная спецификация
        """
        import requests
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 404:
                raise ValueError(
                    f"OpenAPI спецификация не найдена по URL: {url}\n"
                    f"Возможные причины:\n"
                    f"1. URL неправильный или спецификация находится по другому адресу\n"
                    f"2. Требуется аутентификация для доступа к спецификации\n"
                    f"3. Спецификация может быть доступна по другому пути (например, /swagger.json, /api-docs)\n"
                    f"Попробуйте загрузить спецификацию вручную и передать через 'spec_content'"
                )
            
            response.raise_for_status()
            
            content_type = response.headers.get('content-type', '')
            if 'json' in content_type or url.endswith('.json'):
                return response.json()
            else:
                return yaml.safe_load(response.text)
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Ошибка загрузки OpenAPI из URL {url}: {str(e)}")
        except Exception as e:
            raise ValueError(f"Ошибка загрузки OpenAPI из URL: {str(e)}")
    
    def extract_endpoints(self, spec: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Извлекает список endpoints из спецификации
        
        Args:
            spec: OpenAPI спецификация
        
        Returns:
            Список endpoints с методами
        """
        endpoints = []
        
        if 'paths' not in spec:
            return endpoints
        
        for path, methods in spec['paths'].items():
            for method, details in methods.items():
                if method.lower() in ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']:
                    endpoint_info = {
                        "path": path,
                        "method": method.upper(),
                        "summary": details.get('summary', ''),
                        "description": details.get('description', ''),
                        "operation_id": details.get('operationId', ''),
                        "parameters": details.get('parameters', []),
                        "request_body": details.get('requestBody'),
                        "responses": details.get('responses', {}),
                        "tags": details.get('tags', [])
                    }
                    endpoints.append(endpoint_info)
        
        return endpoints
    
    def extract_schemas(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Извлекает схемы данных из спецификации
        Поддерживает OpenAPI 3.0 (components/schemas) и Swagger 2.0 (definitions)
        
        Args:
            spec: OpenAPI/Swagger спецификация
        
        Returns:
            Словарь схем
        """
        # OpenAPI 3.0
        if 'components' in spec:
            return spec.get('components', {}).get('schemas', {})
        # Swagger 2.0
        elif 'definitions' in spec:
            return spec.get('definitions', {})
        return {}
    
    def get_security_schemes(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Получает схемы безопасности
        Поддерживает OpenAPI 3.0 (components/securitySchemes) и Swagger 2.0 (securityDefinitions)
        
        Args:
            spec: OpenAPI/Swagger спецификация
        
        Returns:
            Словарь схем безопасности
        """
        # OpenAPI 3.0
        if 'components' in spec:
            return spec.get('components', {}).get('securitySchemes', {})
        # Swagger 2.0
        elif 'securityDefinitions' in spec:
            return spec.get('securityDefinitions', {})
        return {}
    
    def _detect_format(self, content: str) -> str:
        """Определяет формат содержимого"""
        content = content.strip()
        if content.startswith('{') or content.startswith('['):
            return "json"
        else:
            return "yaml"
    
    def validate_spec(self, spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Валидирует OpenAPI спецификацию (поддерживает OpenAPI 3.0 и Swagger 2.0)
        
        Args:
            spec: OpenAPI/Swagger спецификация
        
        Returns:
            Результат валидации
        """
        errors = []
        warnings = []
        
        # Определяем версию спецификации
        is_openapi_3 = 'openapi' in spec
        is_swagger_2 = 'swagger' in spec
        
        if is_openapi_3:
            # OpenAPI 3.0
            version = spec['openapi']
            if not version.startswith('3.'):
                warnings.append(f"Версия OpenAPI: {version}, ожидается 3.x")
        elif is_swagger_2:
            # Swagger 2.0
            version = spec['swagger']
            warnings.append(f"Обнаружена Swagger 2.0 спецификация (версия: {version}). Парсер поддерживает обе версии.")
        else:
            errors.append("Отсутствует поле 'openapi' (OpenAPI 3.0) или 'swagger' (Swagger 2.0)")
        
        # Проверка обязательных полей (общие для обеих версий)
        if 'info' not in spec:
            errors.append("Отсутствует поле 'info'")
        
        if 'paths' not in spec:
            warnings.append("Отсутствует поле 'paths' - нет endpoints")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "spec_version": "OpenAPI 3.0" if is_openapi_3 else ("Swagger 2.0" if is_swagger_2 else "Unknown")
        }

