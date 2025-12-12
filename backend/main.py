from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from services.test_case_generator import TestCaseGenerator
from services.automated_test_generator import AutomatedTestGenerator
from services.test_optimizer import TestOptimizer
from services.standards_checker import StandardsChecker
from services.openapi_parser import OpenAPIParser
from services.agent_service import AgentService
from services.adk_service import ADKService
from models.schemas import (
    GenerateTestCaseRequest,
    GenerateTestCaseResponse,
    GenerateUITestRequest,
    GenerateAPITestRequest,
    OptimizeRequest,
    CheckStandardsRequest,
    OpenAPIParseRequest,
    AgentChatRequest,
    AgentChatResponse,
    ADKChatRequest,
    ADKChatResponse
)

load_dotenv()

app = FastAPI(
    title="TestOps Copilot API",
    description="AI-ассистент для автоматизации работы QA-инженера",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация сервисов (ленивая инициализация для избежания ошибок при старте)
test_case_generator = None
automated_test_generator = None
test_optimizer = None
standards_checker = None
openapi_parser = OpenAPIParser()  # Не требует API ключа
agent_service = None
adk_service = None

def get_test_case_generator():
    """Ленивая инициализация генератора тест-кейсов"""
    global test_case_generator
    if test_case_generator is None:
        try:
            test_case_generator = TestCaseGenerator()
        except Exception as e:
            raise
    return test_case_generator

def get_automated_test_generator():
    """Ленивая инициализация генератора автотестов"""
    global automated_test_generator
    if automated_test_generator is None:
        automated_test_generator = AutomatedTestGenerator()
    return automated_test_generator

def get_test_optimizer():
    """Ленивая инициализация оптимизатора"""
    global test_optimizer
    if test_optimizer is None:
        test_optimizer = TestOptimizer()
    return test_optimizer

def get_standards_checker():
    """Ленивая инициализация проверки стандартов"""
    global standards_checker
    if standards_checker is None:
        standards_checker = StandardsChecker()
    return standards_checker


def get_agent_service():
    """Ленивая инициализация агента"""
    global agent_service
    if agent_service is None:
        agent_service = AgentService()
    return agent_service


def get_adk_service():
    """Ленивая инициализация ADK агента"""
    global adk_service
    if adk_service is None:
        adk_service = ADKService()
    return adk_service


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "TestOps Copilot API",
        "version": "1.0.0",
        "endpoints": {
            "generate_test_case": "/api/v1/generate-test-case",
            "generate_ui_test": "/api/v1/generate-ui-test",
            "generate_api_test": "/api/v1/generate-api-test",
            "optimize": "/api/v1/optimize",
            "check_standards": "/api/v1/check-standards",
        "parse_openapi": "/api/v1/parse-openapi",
        "agent_chat": "/api/v1/agent-chat",
        "adk_chat": "/api/v1/adk/chat"
        }
    }


@app.post("/api/v1/generate-test-case", response_model=GenerateTestCaseResponse)
async def generate_test_case(request: GenerateTestCaseRequest):
    """
    Генерирует ручные тест-кейсы в формате Allure TestOps as Code
    
    Принимает описание требований и генерирует Python код тест-кейсов
    с использованием паттерна AAA и декораторов Allure.
    """
    try:
        generator = get_test_case_generator()
        code = await generator.generate_from_requirements(
            requirements=request.requirements,
            test_type=request.test_type,
            feature=request.feature,
            story=request.story,
            owner=request.owner
        )
        return GenerateTestCaseResponse(code=code, success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации: {str(e)}")


@app.post("/api/v1/generate-test-case-from-openapi", response_model=GenerateTestCaseResponse)
async def generate_test_case_from_openapi(request: OpenAPIParseRequest):
    """
    Генерирует тест-кейсы из OpenAPI спецификации
    """
    try:
        if request.url:
            spec = openapi_parser.parse_from_url(request.url)
        else:
            spec = openapi_parser.parse(request.spec_content, request.format)
        
        generator = get_test_case_generator()
        code = await generator.generate_from_openapi(spec)
        return GenerateTestCaseResponse(code=code, success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации: {str(e)}")


@app.post("/api/v1/generate-ui-test")
async def generate_ui_test(request: GenerateUITestRequest):
    """
    Генерирует автоматизированные UI e2e тесты
    
    На основе тест-кейсов и требований генерирует pytest код
    для автоматизации UI тестирования.
    """
    try:
        generator = get_automated_test_generator()
        code = await generator.generate_ui_tests(
            test_cases=request.test_cases,
            requirements=request.requirements,
            framework=request.framework
        )
        return {"code": code, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации: {str(e)}")


@app.post("/api/v1/generate-api-test")
async def generate_api_test(request: GenerateAPITestRequest):
    """
    Генерирует автоматизированные API тесты
    
    На основе OpenAPI спецификации генерирует pytest код
    для автоматизации API тестирования.
    """
    try:
        generator = get_automated_test_generator()
        code = await generator.generate_api_tests(
            openapi_spec=request.openapi_spec,
            test_cases=request.test_cases,
            base_url=request.base_url
        )
        return {"code": code, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации: {str(e)}")


@app.post("/api/v1/optimize")
async def optimize_tests(request: OptimizeRequest):
    """
    Оптимизирует тест-кейсы
    
    Анализирует покрытие, находит дубликаты и предлагает улучшения.
    """
    try:
        optimizer = get_test_optimizer()
        # Анализ покрытия
        coverage = await optimizer.analyze_coverage(
            test_cases=request.test_cases,
            requirements=request.requirements
        )
        
        # Поиск дубликатов
        duplicates = await optimizer.find_duplicates(request.test_cases)
        
        # Предложения по улучшению
        improvements = await optimizer.suggest_improvements(
            test_cases=request.test_cases,
            defect_history=request.defect_history
        )
        
        return {
            "success": True,
            "coverage": coverage,
            "duplicates": duplicates,
            "improvements": improvements
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка оптимизации: {str(e)}")


@app.post("/api/v1/check-standards")
async def check_standards(request: CheckStandardsRequest):
    """
    Проверяет тест-кейсы на соответствие стандартам Allure
    
    Проверяет структуру, декораторы, паттерн AAA и формирует отчет.
    """
    try:
        checker = get_standards_checker()
        if request.test_case:
            result = await checker.check_test_case(request.test_case)
            return {"success": True, "result": result}
        elif request.test_cases:
            result = await checker.check_batch(request.test_cases)
            return {"success": True, "result": result}
        else:
            raise HTTPException(status_code=400, detail="Необходимо указать test_case или test_cases")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка проверки: {str(e)}")


@app.post("/api/v1/parse-openapi")
async def parse_openapi(request: OpenAPIParseRequest):
    """
    Парсит OpenAPI спецификацию
    
    Извлекает endpoints, схемы и другую информацию из спецификации.
    Можно указать либо URL, либо содержимое спецификации.
    """
    try:
        if not request.url and not request.spec_content:
            raise HTTPException(
                status_code=400, 
                detail="Необходимо указать либо 'url', либо 'spec_content'"
            )
        
        if request.url:
            spec = openapi_parser.parse_from_url(request.url)
        else:
            spec = openapi_parser.parse(request.spec_content, request.format)
        
        # Валидация
        validation = openapi_parser.validate_spec(spec)
        
        # Извлечение информации
        endpoints = openapi_parser.extract_endpoints(spec)
        schemas = openapi_parser.extract_schemas(spec)
        security = openapi_parser.get_security_schemes(spec)
        
        return {
            "success": True,
            "validation": validation,
            "endpoints": endpoints,
            "endpoints_count": len(endpoints),
            "schemas": list(schemas.keys()) if schemas else [],
            "schemas_count": len(schemas) if schemas else 0,
            "security_schemes": list(security.keys()) if security else [],
            "spec": spec
        }
    except ValueError as e:
        # ValueError содержит детальное описание проблемы
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка парсинга: {str(e)}")


@app.post("/api/v1/parse-openapi-raw")
async def parse_openapi_raw(request: Request, format: str = "auto"):
    """
    Парсит OpenAPI спецификацию, переданную как сырой YAML/JSON без обертки в JSON.
    
    Используйте, если тяжело экранировать spec_content. Пример:
      curl -X POST http://127.0.0.1:8000/api/v1/parse-openapi-raw \\
        -H "Content-Type: text/yaml" \\
        --data-binary @openapi-v3.yaml
    """
    try:
        body = await request.body()
        if not body:
            raise HTTPException(status_code=400, detail="Пустое тело запроса")
        spec_content = body.decode("utf-8", errors="ignore")
        
        # Парсим
        spec = openapi_parser.parse(spec_content, format)
        
        # Валидация
        validation = openapi_parser.validate_spec(spec)
        
        # Извлечение информации
        endpoints = openapi_parser.extract_endpoints(spec)
        schemas = openapi_parser.extract_schemas(spec)
        security = openapi_parser.get_security_schemes(spec)
        
        return {
            "success": True,
            "validation": validation,
            "endpoints": endpoints,
            "endpoints_count": len(endpoints),
            "schemas": list(schemas.keys()) if schemas else [],
            "schemas_count": len(schemas) if schemas else 0,
            "security_schemes": list(security.keys()) if security else [],
            "spec": spec
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка парсинга: {str(e)}")


@app.post("/api/v1/agent-chat", response_model=AgentChatResponse)
async def agent_chat(request: AgentChatRequest):
    """
    Общение с AI-агентом (retrieval + chain-of-thought)
    """
    try:
        agent = get_agent_service()
        result = await agent.chat(
            message=request.message,
            history=[item.model_dump() for item in request.history],
            knowledge_base=[item.model_dump() for item in request.knowledge_base]
        )
        return AgentChatResponse(**result, success=True)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка агента: {str(e)}")


@app.post("/api/v1/adk/chat", response_model=ADKChatResponse)
async def adk_chat(request: ADKChatRequest):
    """
    Общение с ADK агентом, который может возвращать инструкции для графа.
    """
    try:
        agent = get_adk_service()
        result = await agent.chat(message=request.message, session_id=request.session_id)
        return ADKChatResponse(**result, success=True)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка ADK агента: {str(e)}")


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/api/v1/check-config")
async def check_config():
    """Проверка конфигурации API"""
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("CLOUD_RU_API_KEY")
    base_url = os.getenv("CLOUD_RU_API_BASE_URL", "https://foundation-models.api.cloud.ru/v1")
    model = os.getenv("CLOUD_RU_MODEL", "evolution")
    
    config_status = {
        "api_key_set": bool(api_key),
        "api_key_length": len(api_key) if api_key else 0,
        "api_key_preview": f"{api_key[:10]}..." if api_key and len(api_key) > 10 else "N/A",
        "base_url": base_url,
        "model": model
    }
    
    # Попытка реального тестового запроса
    if api_key:
        try:
            from services.llm_service import LLMService
            llm = LLMService()
            config_status["llm_initialized"] = True
            
            # Пробуем сделать реальный тестовый запрос
            try:
                test_response = await llm.generate(
                    prompt="Тест",
                    system_prompt="Ответь одним словом: работает",
                    max_tokens=10
                )
                if test_response:
                    config_status["test_status"] = "connected"
                    config_status["test_response"] = str(test_response)[:50]  # Первые 50 символов
                    config_status["api_working"] = True
                else:
                    config_status["test_status"] = "connection_failed"
                    config_status["api_working"] = False
                    config_status["error"] = "API вернул пустой ответ"
                    config_status["error_type"] = "empty_response"
            except Exception as api_error:
                config_status["test_status"] = "connection_failed"
                config_status["api_working"] = False
                config_status["error"] = str(api_error)
                # Определяем тип ошибки
                error_str = str(api_error)
                if "404" in error_str:
                    config_status["error_type"] = "endpoint_not_found"
                    config_status["suggestion"] = "Проверьте URL и имя модели."
                elif "401" in error_str:
                    config_status["error_type"] = "unauthorized"
                    config_status["suggestion"] = "Проверьте правильность API ключа"
                elif "403" in error_str:
                    config_status["error_type"] = "forbidden"
                    config_status["suggestion"] = "API ключ не имеет доступа к этому сервису"
                else:
                    config_status["error_type"] = "unknown"
                    config_status["suggestion"] = "Проверьте подключение к интернету и настройки API"
        except Exception as e:
            config_status["llm_initialized"] = False
            config_status["test_status"] = "init_failed"
            config_status["error"] = str(e)
    else:
        config_status["test_status"] = "api_key_missing"
        config_status["suggestion"] = "Установите CLOUD_RU_API_KEY в .env"
    
    return config_status


@app.post("/api/v1/test-llm-connection")
async def test_llm_connection():
    """Тестовый запрос к LLM API для диагностики"""
    import os
    import requests
    from dotenv import load_dotenv
    
    load_dotenv()
    
    api_key = os.getenv("CLOUD_RU_API_KEY")
    base_url = os.getenv("CLOUD_RU_API_BASE_URL", "https://foundation-models.api.cloud.ru/v1")
    model = os.getenv("CLOUD_RU_MODEL", "openai/gpt-oss-120b")
    
    if not api_key:
        return {
            "success": False,
            "error": "CLOUD_RU_API_KEY не установлен"
        }
    
    # Используем тот же метод, что и основной сервис - прямые HTTP запросы
    endpoint = "https://foundation-models.api.cloud.ru/v1/chat/completions"
    
    # Пробуем разные варианты моделей
    test_configs = [
        {"model": model, "name": "Текущая конфигурация"},
        {"model": "openai/gpt-oss-120b", "name": "Вариант 1: openai/gpt-oss-120b"},
        {"model": "evolution", "name": "Вариант 2: evolution"},
    ]
    
    results = []
    
    # Заголовки (используем рабочий формат)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "TestOps-Copilot/1.0"
    }
    
    for config in test_configs:
        try:
            payload = {
                "model": config["model"],
                "messages": [{"role": "user", "content": "Привет, ответь одним словом: работает"}],
                "temperature": 0.2,
                "max_tokens": 10
            }
            
            response = requests.post(
                endpoint,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                content = ""
                if "choices" in data and len(data.get("choices", [])) > 0:
                    content = data["choices"][0].get("message", {}).get("content", "")
                
                results.append({
                    "config": config["name"],
                    "base_url": endpoint,
                    "model": config["model"],
                    "success": True,
                    "response": content[:50] if content else "Успешный ответ получен"
                })
                break  # Если успешно, останавливаемся
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    error_msg += f": {str(error_data)[:150]}"
                except:
                    error_msg += f": {response.text[:150]}"
                
                results.append({
                    "config": config["name"],
                    "base_url": endpoint,
                    "model": config["model"],
                    "success": False,
                    "error": error_msg
                })
            
        except requests.exceptions.RequestException as e:
            results.append({
                "config": config["name"],
                "base_url": endpoint,
                "model": config["model"],
                "success": False,
                "error": f"Ошибка запроса: {str(e)[:200]}"
            })
        except Exception as e:
            results.append({
                "config": config["name"],
                "base_url": endpoint,
                "model": config["model"],
                "success": False,
                "error": f"Ошибка: {str(e)[:200]}"
            })
    
    # Проверяем, есть ли хотя бы один успешный
    success_count = sum(1 for r in results if r.get("success", False))
    
    return {
        "success": success_count > 0,
        "successful_configs": success_count,
        "total_tested": len(results),
        "results": results,
        "recommendation": "Используйте первый успешный вариант" if success_count > 0 else "Проверьте API ключ и документацию Cloud.ru. Убедитесь, что используете правильную модель."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)