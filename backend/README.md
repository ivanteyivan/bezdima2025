# TestOps Copilot (backend)

FastAPI‑сервис для генерации и проверки тестов с использованием Cloud.ru Foundation Model.

## Требования
- Python 3.11+
- Установленные зависимости из `backend/requirements.txt`
- Доступный API Cloud.ru Foundation Model:
  - `CLOUD_RU_API_KEY`
  - `CLOUD_RU_API_BASE_URL` (по умолчанию `https://foundation-models.api.cloud.ru/v1`)
  - `CLOUD_RU_MODEL` (рекомендуется `openai/gpt-oss-120b` или `evolution`)

## Установка и запуск
```bash
cd backend
pip install -r requirements.txt

# .env в папке backend
cat > .env <<'EOF'
CLOUD_RU_API_KEY=your_api_key_here
CLOUD_RU_API_BASE_URL=https://foundation-models.api.cloud.ru/v1
CLOUD_RU_MODEL=openai/gpt-oss-120b
EOF

python main.py  # или uvicorn main:app --host 0.0.0.0 --port 8000
```

### Docker
```bash
cd backend
docker build -t testops-copilot .
docker run -p 8000:8000 --env-file .env testops-copilot
```

После старта: Swagger UI на `http://localhost:8000/docs`.

## Обзор эндпоинтов
- `POST /api/v1/generate-test-case` — генерация ручных тест-кейсов (Allure TestOps as Code, AAA).
- `POST /api/v1/generate-test-case-from-openapi` — генерация тест-кейсов из OpenAPI (JSON/YAML строкой).
- `POST /api/v1/generate-ui-test` — генерация UI e2e автотестов (pytest + selenium/playwright).
- `POST /api/v1/generate-api-test` — генерация API автотестов (pytest + requests/httpx) по OpenAPI.
- `POST /api/v1/optimize` — анализ покрытия, дубликатов, рекомендации.
- `POST /api/v1/check-standards` — проверка структуры/декораторов/AAA, отчет.
- `POST /api/v1/agent-chat` — AI-агент с retrieval + chain-of-thought (JSON формат ответа).
- `POST /api/v1/adk/chat` — ADK агент (Google ADK + LiteLLM) с возможностью вернуть граф (nodes/edges).
- `POST /api/v1/parse-openapi` — парсинг OpenAPI, вход в JSON (spec_content строкой).
- `POST /api/v1/parse-openapi-raw` — парсинг OpenAPI, вход сырой YAML/JSON (binary body).
- `GET /api/v1/check-config` — проверка конфигурации LLM.
- `GET /api/v1/test-llm-connection` — диагностика подключения к LLM.
- `GET /health` — healthcheck.

Ниже — подробности по каждому.

## Эндпоинты и примеры

### 1. Генерация ручных тест-кейсов
`POST /api/v1/generate-test-case`
Request:
```json
{
  "requirements": "Протестировать форму регистрации: проверка email, пароля, подтверждения",
  "test_type": "manual",
  "feature": "Registration",
  "story": "User Registration",
  "owner": "QA Team"
}
```
Response:
```json
{
  "code": "@allure.manual\n@allure.label(\"owner\", \"QA Team\")\n...\n",
  "success": true
}
```

### 2. Генерация тест-кейсов из OpenAPI
`POST /api/v1/generate-test-case-from-openapi`
Request (если спецификация уже есть строкой):
```json
{
  "spec_content": "{ \"openapi\": \"3.0.0\", \"paths\": {\"/ping\": {\"get\": {\"responses\": {\"200\": {\"description\": \"ok\"}}}}}}",
  "format": "json"
}
```
Response аналогичен пункту 1.

### 3. Генерация UI e2e автотестов
`POST /api/v1/generate-ui-test`
Request:
```json
{
  "test_cases": "код тест-кейсов в формате Allure",
  "requirements": "дополнительные требования",
  "framework": "selenium"
}
```
Response:
```json
{
  "code": "import pytest\nfrom selenium import webdriver\n...\n",
  "success": true
}
```

### 4. Генерация API автотестов
`POST /api/v1/generate-api-test`
Request:
```json
{
  "openapi_spec": { "openapi": "3.0.0", "paths": { "/ping": { "get": { "responses": { "200": { "description": "ok" }}}}}},
  "test_cases": "",
  "base_url": "https://compute.api.cloud.ru"
}
```
Response: pytest-код, структура аналогична UI тестам.

### 5. Оптимизация тест-кейсов
`POST /api/v1/optimize`
Request:
```json
{
  "test_cases": ["test_case_1 code", "test_case_2 code"],
  "requirements": "описание требований",
  "defect_history": "опционально"
}
```
Response:
```json
{
  "success": true,
  "coverage": { "analysis": "...", "coverage_percentage": 75.5, "gaps": ["..."] },
  "duplicates": { "llm_analysis": "...", "detected_duplicates": [] },
  "improvements": { "suggestions": "...", "priority_improvements": ["..."] }
}
```

### 6. Проверка стандартов
`POST /api/v1/check-standards`
- Один тест-кейс:
```json
{ "test_case": "код тест-кейса" }
```
- Несколько:
```json
{ "test_cases": ["код_1", "код_2"] }
```
Response:
```json
{
  "success": true,
  "result": {
    "score": 85.5,
    "structure": {...},
    "decorators": {...},
    "aaa_pattern": {...},
    "recommendations": [...]
  }
}
```

### 6. AI Agent с retrieval (новый)
`POST /api/v1/agent-chat`
Request:
```json
{
  "message": "Сделай чек-лист регресса для биллинга",
  "history": [
    { "role": "user", "content": "Нужно покрыть биллинг" },
    { "role": "assistant", "content": "Какие модули?" }
  ],
  "knowledge_base": [
    { "source": "wiki/billing", "text": "Основные сценарии оплаты и возвратов" }
  ]
}
```
Response:
```json
{
  "answer": "Проверь платежи, возвраты, отмены, интеграции с провайдером.",
  "steps": [
    "Собери требования по способам оплаты",
    "Проверь позитивные/негативные платежи",
    "Проверь возвраты/отмены и события в логах"
  ],
  "retrieval_sources": ["wiki/billing"],
  "success": true
}
```

### 7. ADK Agent с построением графа (новый)
`POST /api/v1/adk/chat`
Request:
```json
{
  "message": "Построй граф: старт -> prompt 'сгенерируй api тесты' -> api node",
  "session_id": "optional-session"
}
```
Response:
```json
{
  "answer": "Создал граф: prompt -> api.",
  "steps": ["Создал prompt", "Создал api"],
  "retrieval_sources": [],
  "graph": {
    "nodes": [
      {"id": "n1", "type": "start", "data": {}, "position": {"x":50,"y":200}},
      {"id": "n2", "type": "prompt", "data": {"prompt": "сгенерируй api тесты"}, "position": {"x":270,"y":200}},
      {"id": "n3", "type": "api", "data": {"url": "https://..."}, "position": {"x":490,"y":200}}
    ],
    "edges": [
      {"id": "e1", "source": "n1", "target": "n2"},
      {"id": "e2", "source": "n2", "target": "n3"}
    ]
  },
  "session_id": "adk-123",
  "success": true
}
```
Граф необязателен: если агент вернет `graph: null`, фронт просто покажет ответ.

### 8. Парсинг OpenAPI (JSON со строкой)
`POST /api/v1/parse-openapi`
Request:
```json
{
  "spec_content": "{ \"openapi\": \"3.0.3\", \"paths\": {\"/ping\": {\"get\": {\"responses\": {\"200\": {\"description\": \"ok\"}}}}}}",
  "format": "json"
}
```
Response:
```json
{
  "success": true,
  "validation": {...},
  "endpoints": [...],
  "endpoints_count": 1,
  "schemas": [],
  "schemas_count": 0,
  "security_schemes": [],
  "spec": { ...parsed spec... }
}
```

### 8. Парсинг OpenAPI (сырой YAML/JSON)
`POST /api/v1/parse-openapi-raw`
- Используйте, если не хотите экранировать `spec_content`.
- Пример с YAML-файлом:
```bash
curl -X POST http://127.0.0.1:8000/api/v1/parse-openapi-raw \
  -H "Content-Type: text/yaml" \
  --data-binary @openapi-v3.yaml
```
Query-параметр `format` можно указать `yaml|json|auto` (по умолчанию `auto`).
Response аналогичен `/api/v1/parse-openapi`.

### 9. Диагностика
- `GET /api/v1/check-config` — покажет, подтянулся ли ключ, какая модель, удалось ли сделать тестовый запрос.
- `GET /api/v1/test-llm-connection` — пробует несколько моделей, показывает результаты.
- `GET /health` — простой healthcheck.

## ADK окружение (Google ADK + A2A)
Новые переменные окружения (пример для `.env` в `backend/`):
```
LLM_MODEL=openai/gpt-oss-120b
LLM_API_BASE=https://foundation-models.api.cloud.ru/v1
LLM_API_KEY=your_api_key
AGENT_NAME=GraphBuilder
AGENT_DESCRIPTION=Agent that plans and builds graphs
AGENT_SYSTEM_PROMPT=опционально, иначе используется встроенный prompt c JSON графом
MCP_URL=http://localhost:5173/sse   # если нужны MCP tools, иначе можно пусто
```
**Note:** If `LLM_API_KEY` or `CLOUD_RU_API_KEY` are not set, the backend will run in mock mode for AI-related features (ADK agent / LLM). AI-related endpoints will return mock responses, allowing the backend to run without external LLM keys during development or CI.

Запуск FastAPI уже включает ленивую инициализацию ADK агента; отдельный A2A сервер (`services/adk/start_a2a.py`) можно запускать вручную при необходимости.

## Работа с большими OpenAPI
- Можно отправлять через `/api/v1/parse-openapi-raw` с `--data-binary @file`.
- Через `/api/v1/parse-openapi` — упаковать спецификацию в поле `spec_content` как строку (JSON экранирует переводы строк).

## Типичные ошибки и как их решать
- 401/403 при генерации: проверьте `CLOUD_RU_API_KEY`, доступ к модели, корректность base_url.
- Пустой ответ в `check-config`: попробуйте прямой curl к `CLOUD_RU_API_BASE_URL/v1/chat/completions` с теми же заголовками; убедитесь, что нет корпоративного прокси, разрывающего соединение.
- 404 при `parse_from_url`: чаще всего URL требует авторизацию или путь отличается. Скачайте руками с нужными заголовками и передайте через `spec_content` или `parse-openapi-raw`.
- Ошибка декодирования JSON при передаче YAML: используйте `parse-openapi-raw` с `Content-Type: text/yaml` и `--data-binary @file`.

## Аутентификация для Evolution Compute Public API v3 (кейc 2)
Для вызовов к `https://compute.api.cloud.ru` добавлен модуль `services/cloud_auth.py`:

- `CloudRuAuthenticator` — получает Bearer-токен через IAM (`https://iam.api.cloud.ru/api/v1/auth/token`), хранит `expires_at`, обновляет при истечении или 401.
- `CloudRuComputeClient` — обертка над `requests.Session`, добавляет `Authorization: Bearer ...`, опционально `project_id` в query, повторяет запрос после 401 с обновлением токена.

Переменные окружения:
- `CLOUD_KEY_ID`, `CLOUD_SECRET` — IAM ключи.
- `CLOUD_PROJECT_ID` — опционально, подставляется в query `project_id`.
- `CLOUD_TOKEN_FILE` — опционально, путь для кеша токена (по умолчанию `.cloud_token.json`).

Пример использования:
```python
from services.cloud_auth import CloudRuAuthenticator, CloudRuComputeClient

auth = CloudRuAuthenticator()
compute = CloudRuComputeClient(authenticator=auth, project_id="your-project-id")

# Пример: GET /vms
resp = compute.get("/vms")
vms = resp.json()

# Пример: POST /vms
body = {"name": "vm-1", "flavor_id": "...", "image_id": "..."}
resp = compute.post("/vms", json=body)
task = resp.json()
```

Готово к использованию в тестах для кейса 2 (VMs/Disks/Flavors). При ошибке 401 токен обновляется автоматически. Решение не хардкодит кейс: используйте любые эндпоинты OpenAPI v3 с базой `https://compute.api.cloud.ru`.

## Тесты для VMs / Disks / Flavors
Тесты расположены в `backend/tests/`. Для запуска требуются переменные окружения:
```
export CLOUD_KEY_ID=...
export CLOUD_SECRET=...
export CLOUD_PROJECT_ID=...
```
Запуск:
```
pytest backend/tests -m smoke   # базовые проверки списков/негативы
pytest backend/tests            # полный набор (часть create/delete помечена skip)
```

Фикстуры:
- `auth` — CloudRuAuthenticator
- `compute` — ComputeAPI
- `project_id` — из env

Покрытие:
- VMs: list, get invalid, change-status invalid; create/delete — skip (запускать вручную с валидными параметрами)
- Disks: list, get invalid; create/attach/detach/delete — skip
- Flavors: list, get invalid

## Структура проекта (backend)
```
backend/
  main.py                  # FastAPI приложение и маршруты
  services/
    llm_service.py         # Работа с LLM (Cloud.ru FM через OpenAI API)
    test_case_generator.py # Ручные тест-кейсы (Allure, AAA)
    automated_test_generator.py # UI/API автотесты
    test_optimizer.py      # Покрытие, дубликаты, рекомендации
    standards_checker.py   # Проверка стандартов Allure, AAA
    openapi_parser.py      # Парсинг/валидация OpenAPI
  models/schemas.py        # Pydantic схемы запросов/ответов
  requirements.txt
  Dockerfile
```

## Минимальный чеклист для запуска
1) Создать `backend/.env` с ключом и моделью.
2) `pip install -r requirements.txt`.
3) `python main.py` или `docker run -p 8000:8000 --env-file .env testops-copilot`.
4) Проверить `http://localhost:8000/docs`.
5) Выполнить `GET /api/v1/check-config`.
6) Сгенерировать первый тест: `POST /api/v1/generate-test-case`.

