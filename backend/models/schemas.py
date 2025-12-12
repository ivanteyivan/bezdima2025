"""
Pydantic схемы для API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal


class GenerateTestCaseRequest(BaseModel):
    """Запрос на генерацию тест-кейсов"""
    requirements: str = Field(..., description="Описание требований")
    test_type: str = Field(default="manual", description="Тип теста")
    feature: str = Field(default="Default Feature", description="Название фичи")
    story: str = Field(default="Default Story", description="Название истории")
    owner: str = Field(default="QA Team", description="Владелец тест-кейса")

    model_config = {
        "json_schema_extra": {
            "example": {
                "requirements": "Протестировать форму регистрации: проверка валидации email, проверка пароля",
                "test_type": "manual",
                "feature": "Registration",
                "story": "User Registration",
                "owner": "QA Team"
            }
        }
    }


class GenerateTestCaseResponse(BaseModel):
    """Ответ с сгенерированным тест-кейсом"""
    code: str = Field(..., description="Python код тест-кейса")
    success: bool = Field(default=True)


class GenerateUITestRequest(BaseModel):
    """Запрос на генерацию UI тестов"""
    test_cases: str = Field(..., description="Тест-кейсы в формате Allure")
    requirements: Optional[str] = Field(default="", description="Дополнительные требования")
    framework: str = Field(default="selenium", description="Фреймворк (selenium/playwright)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "test_cases": "код тест-кейсов в формате Allure",
                "requirements": "дополнительные требования",
                "framework": "selenium"
            }
        }
    }


class GenerateAPITestRequest(BaseModel):
    """Запрос на генерацию API тестов"""
    openapi_spec: Dict[str, Any] = Field(..., description="OpenAPI спецификация")
    test_cases: Optional[str] = Field(default="", description="Существующие тест-кейсы")
    base_url: str = Field(default="", description="Базовый URL API")

    model_config = {
        "json_schema_extra": {
            "example": {
                "openapi_spec": {"openapi": "3.0.0", "paths": {}},
                "test_cases": "",
                "base_url": "https://compute.api.cloud.ru"
            }
        }
    }


class OptimizeRequest(BaseModel):
    """Запрос на оптимизацию тест-кейсов"""
    test_cases: List[str] = Field(..., description="Список тест-кейсов")
    requirements: str = Field(..., description="Описание требований")
    defect_history: Optional[str] = Field(default="", description="История дефектов")

    model_config = {
        "json_schema_extra": {
            "example": {
                "test_cases": ["test_case_1", "test_case_2"],
                "requirements": "описание требований",
                "defect_history": "история дефектов (опционально)"
            }
        }
    }


class CheckStandardsRequest(BaseModel):
    """Запрос на проверку стандартов"""
    test_case: Optional[str] = Field(default=None, description="Один тест-кейс")
    test_cases: Optional[List[str]] = Field(default=None, description="Список тест-кейсов")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"test_case": "код тест-кейса"},
                {"test_cases": ["код тест-кейса 1", "код тест-кейса 2"]}
            ]
        }
    }


class OpenAPIParseRequest(BaseModel):
    """Запрос на парсинг OpenAPI"""
    spec_content: Optional[str] = Field(default=None, description="Содержимое спецификации")
    format: str = Field(default="auto", description="Формат (json/yaml/auto)")
    url: Optional[str] = Field(default=None, description="URL спецификации (альтернатива spec_content)")
    
    def __init__(self, **data):
        super().__init__(**data)
        if not self.url and not self.spec_content:
            raise ValueError("Необходимо указать либо 'url', либо 'spec_content'")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"url": "https://compute.api.cloud.ru/openapi.json", "format": "auto"},
                {"spec_content": "{ \"openapi\": \"3.0.0\" }", "format": "json"}
            ]
        }
    }


class AgentMessage(BaseModel):
    """Сообщение в истории чата агента"""
    role: Literal["user", "assistant", "system"] = Field(..., description="Роль участника диалога")
    content: str = Field(..., description="Текст сообщения")


class KnowledgeBaseItem(BaseModel):
    """Элемент базы знаний для retrieval"""
    source: str = Field(..., description="Идентификатор или название источника")
    text: str = Field(..., description="Содержимое или выдержка из источника")


class AgentChatRequest(BaseModel):
    """Запрос к AI-агенту"""
    message: str = Field(..., description="Текущее сообщение пользователя")
    history: List[AgentMessage] = Field(default_factory=list, description="История диалога")
    knowledge_base: List[KnowledgeBaseItem] = Field(
        default_factory=list,
        description="Дополнительные контексты для retrieval"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Сгенерируй чек-лист регресса для биллинга",
                "history": [
                    {"role": "user", "content": "Нужно покрыть биллинг"},
                    {"role": "assistant", "content": "Какие модули важны?"}
                ],
                "knowledge_base": [
                    {"source": "wiki/billing", "text": "Основные сценарии оплаты картой и возвраты"},
                    {"source": "jira/QE-123", "text": "Недавние дефекты в module: refunds"}
                ]
            }
        }
    }


class AgentChatResponse(BaseModel):
    """Ответ от AI-агента"""
    answer: str = Field(..., description="Основной ответ ассистента")
    steps: List[str] = Field(default_factory=list, description="Краткие шаги рассуждения/рекомендации")
    retrieval_sources: List[str] = Field(default_factory=list, description="Источники, использованные в ответе")
    success: bool = Field(default=True)


class GraphNode(BaseModel):
    id: str
    type: str
    data: Dict[str, Any] = Field(default_factory=dict)
    position: Dict[str, float] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    data: Dict[str, Any] = Field(default_factory=dict)


class GraphPayload(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)


class ADKChatRequest(BaseModel):
    message: str = Field(..., description="Пользовательский запрос")
    session_id: Optional[str] = Field(default=None, description="Сессия ADK, если есть")


class ADKChatResponse(BaseModel):
    answer: str = Field(..., description="Ответ агента")
    session_id: str = Field(..., description="Текущая сессия ADK")
    steps: List[str] = Field(default_factory=list)
    retrieval_sources: List[str] = Field(default_factory=list)
    graph: Optional[GraphPayload] = None
    success: bool = True

