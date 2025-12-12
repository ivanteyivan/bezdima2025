# Узлы и API

| Узел | Что получает | Что делает / API | Что возвращает | Модалка |
| --- | --- | --- | --- | --- |
| Start | - | Старт графа | - | - |
| FileUpload | Файл (txt/openapi), preview | Передаёт `fileContent`, `preview` далее | `fileContent`, `preview`, `fileName` | Нет |
| ManualTest (API) | URL или файл (OpenAPI), story/owner/test_type, format | `/api/v1/generate-test-case-from-openapi` (format + url ИЛИ spec_content) | Код тестов (manual/API), requirements | Поля: feature, story, owner, format; URL блокируется если подключён файл |
| AutomatedTest (UI) | test_cases/requirements/framework | `/api/v1/generate-ui-test` | `code` | Поля: framework, requirements/test_cases |
| ApiTest (API автотесты) | openapi_spec или test_cases/base_url | `/api/v1/generate-api-test` | `code` | Поля: url/base_url, test_cases |
| Optimization | test_cases[], requirements | `/api/v1/optimize` | coverage/duplicates/improvements | Поля: requirements |
| CheckStandards | test_case(s) | `/api/v1/check-standards` | result {score,...} | Поля: test_case(s) |
| Statistics | payload от Optimization | Показывает payload, пробрасывает как есть | payload | Нет |
| FileDownload | payload | Скачивает payload как `tests.py` | - | Нет |
| AI Agent Chat | message/history/knowledge_base | `/api/v1/agent-chat` — ответ + steps + sources | answer/steps/retrieval_sources | Кнопка в Sidebar + плавающее окно |
| ADK Agent Graph | message/session_id | `/api/v1/adk/chat` — может вернуть `graph` (nodes/edges) | answer/steps/graph | Через чат, автопостроение графа |
| End | - | Завершение | - | - |

## Правила связей
- Один вход на узел, кроме End (может иметь несколько входов). Исходящих ограничений нет; Start — fan-out.
- По edge передаётся: `fileContent`/`preview` (upload), код тестов, openapi_spec строкой, объекты optimization/check-standards.

## Поведение RUN
- Топосорт, берётся первый входящий узел как источник данных.
- ManualTest: если есть файл — `spec_content`; если файла нет — `url` (format auto/json/yaml). Ошибки URL/parse — через toast.
- Errors: toast, без alert. Прогресс-бар в сайдбаре.

## Env
`VITE_API_URL` — база backend. Если не задан, используется https://container-testops-copilot-backend.containerapps.ru. Для агента нужен рабочий backend с LLM ключом (и переменные ADK, если используете `/api/v1/adk/chat`).

## Docker
Сборка и запуск docker-образа фронтенда (в корне папки `frontend/my-react-flow-app`):

```powershell
docker build -t my-react-flow-app .
docker run -p 8080:8080 my-react-flow-app
```

## Как построить граф через чат
1. Откройте чат (кнопка AI или в Sidebar).
2. Сформулируйте запрос, например:  
   “Построй граф: старт -> prompt 'подготовь api тесты' -> api узел с url https://api.example.com”.
3. Агент ответит и, если вернет `graph`, ноды/ребра автоматически добавятся в текущую вкладку React Flow. Будет показано системное сообщение “Построен граф по предложению агента”.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
