# REST API Tester

Веб‑приложение для **генерации и запуска автотестов REST API** на основе пользовательских сценариев и OpenAPI‑схем.

Проект состоит из:
- **Backend** на FastAPI (JWT‑аутентификация, роли доступа, CRUD по рабочим пространствам, сценариям, тестам, логам);
- **Frontend** на Vanilla JS/HTML/CSS (панель управления, редактор сценариев, запуск тестов, просмотр истории и логов);
- **Test Engine** (внутренний модуль генерации и выполнения тестов по DSL‑сценарию).

---

## Содержание

- [Возможности](#возможности)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [Технологический стек](#технологический-стек)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Запуск](#запуск)
- [Аутентификация и права доступа](#аутентификация-и-права-доступа)
- [API (кратко)](#api-кратко)
- [Сценарии и генерация тестов](#сценарии-и-генерация-тестов)
- [Запуск тестов и логи](#запуск-тестов-и-логи)
- [Frontend страницы](#frontend-страницы)
- [Типичный пользовательский поток](#типичный-пользовательский-поток)
- [Диагностика и частые проблемы](#диагностика-и-частые-проблемы)

---

## Возможности

- Регистрация и логин пользователей (JWT Bearer).
- Создание рабочих пространств (workspaces) и управление участниками.
- Ролевая модель в workspace: `viewer`, `editor`, `owner`.
- Настройка подключения к целевой системе (Basic/Bearer/API key).
- Загрузка и хранение OpenAPI‑схемы для workspace.
- Создание/редактирование сценариев тестирования в JSON.
- Генерация теста на основе сценария + OpenAPI.
- Запуск теста, сохранение результата, истории запусков и логов.
- Просмотр, удаление одного/всех логов выполнения.

---

## Архитектура

Бэкенд построен по слоистой схеме:

`API routers -> Services -> Repositories -> MySQL`

- **`app/api`** — HTTP‑эндпоинты.
- **`app/services`** — бизнес‑логика и проверки.
- **`app/repositories`** — SQL‑доступ к данным (PyMySQL).
- **`app/schemas`** — Pydantic‑валидация запросов/ответов.
- **`app/core`** — конфигурация, JWT, зависимости, проверки доступа.
- **`app/test_engine`** — генерация и выполнение тестов.

Frontend — многостраничный интерфейс в папке `site/`, логика сосредоточена в `site/app.js`.

---

## Структура проекта

```text
.
├── app/
│   ├── main.py
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   └── test_engine/
├── site/
│   ├── app.js
│   ├── styles.css
│   ├── login.html
│   ├── dashboard.html
│   ├── workspace.html
│   ├── scenario.html
│   ├── scenario_create.html
│   ├── test.html
│   └── img/
├── requirements.txt
└── readme.md
```

---

## Технологический стек

### Backend
- FastAPI
- Pydantic / pydantic-settings
- PyMySQL
- python-jose (JWT)
- passlib + bcrypt
- Uvicorn

### Frontend
- Vanilla JavaScript
- HTML5 / CSS3
- CodeMirror (редактирование JSON сценариев)

---

## Требования

- Python 3.11+ (рекомендуется)
- MySQL 8+
- Доступная база данных со схемой проекта


---

## Быстрый старт

```bash
git clone <repository-url>
cd restapi_server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Создайте файл `.env` в корне проекта (пример ниже), затем запустите backend и frontend.

---

## Переменные окружения

Файл `.env`:

```env
PROJECT_NAME=REST API Tester

DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASSWORD=password
DB_NAME=database

ACCESS_TOKEN_EXPIRE_MINUTES=30
SECRET_KEY=super-secret-key
```

---

## Запуск

### 1) Backend

```bash
uvicorn app.main:app --reload
```

По умолчанию: `http://127.0.0.1:8000`

### 2) Frontend

```bash
python -m http.server 5500 --directory site
```

Откройте `http://127.0.0.1:5500/login.html`

---

## Аутентификация и права доступа

### JWT
- `POST /auth/login` возвращает `access_token`.
- Токен передаётся в заголовке:

```http
Authorization: Bearer <token>
```

### Роли в workspace
- `viewer` — чтение
- `editor` — чтение + изменение
- `owner` — полный доступ (включая удаление/шаринг)

Проверка прав выполняется dependency `check_workspace_access_dep()`.

---

## API (кратко)

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Users
- `GET /users/`
- `GET /users/me`

### Workspaces
- `POST /workspaces/`
- `GET /workspaces/`
- `DELETE /workspaces/{id_workspace}`
- `GET /workspaces/{id_workspace}/members`
- `POST /workspaces/{id_workspace}/members`
- `DELETE /workspaces/{id_workspace}/members/{id_user}`

### Connections
- `POST /connections/`
- `PATCH /connections/{id_workspace}/modify`
- `GET /connections/{id_workspace}`
- `DELETE /connections/{id_connection}`
- `PUT /connections/openapi/{id_workspace}`
- `GET /connections/openapi/{id_workspace}`
- `DELETE /connections/openapi/{id_workspace}`
- `GET /connections/check/{id_workspace}`

### Scenarios
- `POST /scenarios/{id_workspace}`
- `PATCH /scenarios/{id_workspace}/{id_scenario}`
- `GET /scenarios/{id_workspace}`
- `GET /scenarios/{id_workspace}/detail/{id_scenario}`
- `DELETE /scenarios/{id_scenario}`

### Tests
- `GET /tests/{id_workspace}`
- `GET /tests/{id_workspace}/detail/{id_test}`
- `DELETE /tests/{id_workspace}/{id_test}`
- `POST /tests/generate/{id_workspace}/{id_scenario}`
- `POST /tests/{id_workspace}/run/{id_test}`
- `GET /tests/{id_workspace}/executions/{id_test}`
- `GET /tests/{id_workspace}/executions/log/{id_execution}`
- `DELETE /tests/{id_workspace}/executions/log/{id_execution}`
- `DELETE /tests/{id_workspace}/executions/{id_test}`

---

## Сценарии и генерация тестов

Генерация проходит через `app/test_engine`:

1. Парсинг endpoint’ов из сценария (`ScenarioParser`)
2. Разрешение схем endpoint’ов из OpenAPI (`ResolveScheme`)
3. Поиск `pattern/min/max` для полей
4. Генерация значений (`GenerateValues`)
5. Преобразование в формат теста (`GenerateTests`)

Поддерживаются конструкции заполнения значений:
- `random`
- `minimum`, `maximum`
- `gt_max`, `lt_min`
- `modify`
- `ref`

---

## Запуск тестов и логи

При запуске теста:

- выполняются HTTP шаги (GET/POST) через `Http_methods`
- проверяются `httpCode`, `errCode`, schema‑ожидания
- формируется статус (`PASS/FAIL`) и список неуспешных шагов
- сохраняются:
  - запись выполнения (`tests_executions`)
  - текстовый лог (`log_executions`)

История запусков доступна через API и в UI страницы `test.html`.

---

## Frontend страницы

- `login.html` — вход
- `dashboard.html` — список/создание workspace
- `workspace.html` — подключение, OpenAPI, участники, сценарии, тесты
- `scenario_create.html` — создание сценария в JSON (CodeMirror)
- `scenario.html` — просмотр/редактирование сценария
- `test.html` — просмотр теста, запуск, история и логи

---

## Типичный пользовательский поток

1. Зарегистрироваться / войти
2. Создать workspace
3. Настроить connection (base URL + auth)
4. Загрузить OpenAPI
5. Создать сценарий
6. Сгенерировать тест
7. Запустить тест
8. Посмотреть историю запусков и лог

---

## Диагностика и частые проблемы

### 401 Unauthorized
- Проверьте наличие/актуальность Bearer токена
- Повторно войдите через `/auth/login`

### 403 Forbidden
- Недостаточно прав в workspace (`viewer/editor/owner`)

### 404 OpenAPI not found при генерации
- Для данного workspace не загружена OpenAPI схема

### Ошибка подключения к БД
- Проверьте `.env` и доступность MySQL

### Frontend не открывается
- Убедитесь, что запущен статический сервер (`python -m http.server ...`), а не открытие HTML напрямую с диска

---

Если нужно, можно расширить README разделами:
- подробной DB-схемой,
- примерами `curl` для каждого эндпоинта,
- Docker/docker-compose конфигурацией,
- инструкциями по деплою.