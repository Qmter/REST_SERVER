# Нейронная генерация тестов

## Быстрый старт

### 1. Установка Ollama

Ollama - это локальный раннер для LLM моделей, который работает на вашем ноутбуке.

```bash
# Установка Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Запуск модели (первый раз загрузит модель ~4GB)
ollama run qwen2.5:7b
```

**Рекомендуемые модели для вашего ноутбука (16GB RAM):**
- `qwen2.5:7b` - оптимальный баланс качества и скорости (рекомендуется)
- `llama3.2:3b` - быстрее, но менее качественная
- `mistral:7b` - альтернатива qwen

### 2. Подготовка примеров тестов

Поместите ваши 169 JSON файлов с готовыми тестами в директорию:

```
/workspace/app/test_engine/neural/examples/
```

Пример структуры файла теста:
```json
{
    "test_1": {
        "description": "Успешное создание пользователя",
        "step_1": {
            "endpoint": "/api/users",
            "type": "POST",
            "schema": {
                "username": "test_user",
                "email": "test@example.com"
            },
            "expected": {
                "httpCode": 200,
                "errCode": 0
            }
        }
    }
}
```

### 3. Использование через API

#### Генерация теста для одного эндпоинта

```bash
curl -X POST http://localhost:8000/neural/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "/api/users",
    "method": "post",
    "openapi_spec": {...}
  }'
```

#### Пакетная генерация для нескольких эндпоинтов

```bash
curl -X POST http://localhost:8000/neural/generate/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoints": [
      {"endpoint": "/api/users", "method": "post"},
      {"endpoint": "/api/users/{id}", "method": "get"},
      {"endpoint": "/api/users/{id}", "method": "delete"}
    ],
    "openapi_spec": {...}
  }'
```

#### Проверка статуса генератора

```bash
curl -X GET http://localhost:8000/neural/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Ответ:
```json
{
    "status": "ready",
    "examples_loaded": 169,
    "model": "qwen2.5:7b"
}
```

## Как это работает

1. **Few-shot обучение**: При запросе система выбирает 3 случайных примера из ваших 169 JSON файлов
2. **Формирование промпта**: Создается промпт с примерами, информацией об эндпоинте и распаршенной схемой
3. **Генерация**: Ollama генерирует тест на основе промпта
4. **Парсинг ответа**: JSON извлекается из ответа LLM и возвращается клиенту

## Архитектура

```
app/
├── test_engine/
│   └── neural/
│       ├── __init__.py              # Модуль нейронной генерации
│       ├── neural_generator.py      # Основной класс генератора
│       └── examples/                # Директория с JSON примерами
├── services/
│   └── neural_service.py            # Бизнес-логика генерации
├── api/
│   └── neural.py                    # API endpoints
└── schemas/
    └── neural_schema.py             # Pydantic схемы
```

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/neural/generate` | Генерация теста для одного эндпоинта |
| POST | `/neural/generate/batch` | Пакетная генерация тестов |
| GET | `/neural/status` | Статус генератора |

## Troubleshooting

### Ошибка подключения к Ollama

```
Ошибка: Не удалось подключиться к Ollama. Убедитесь, что сервис запущен.
```

**Решение:**
```bash
# Запустить Ollama как сервис
ollama serve

# В отдельном терминале запустить модель
ollama run qwen2.5:7b
```

### Модель слишком медленная

**Решение:** Использовать более легкую модель:
```bash
ollama run llama3.2:3b
```

Затем обновить код или передать `model_name="llama3.2:3b"` при инициализации.

### Мало примеров загружено

Проверьте, что JSON файлы находятся в правильной директории:
```bash
ls -la /workspace/app/test_engine/neural/examples/*.json
```

## Интеграция с существующим кодом

В `generate_test.py` можно добавить метод для нейронной генерации:

```python
from app.test_engine.neural import NeuralTestGenerator

class GeneralGenerator:

    @staticmethod
    def generate_test_neural(endpoint, method, openapi_spec):
        generator = NeuralTestGenerator(
            examples_dir="./app/test_engine/neural/examples"
        )

        resolved_schema = ResolveScheme.resolve_endpoint(
            openapi_file=openapi_spec,
            endpoint_path=endpoint,
            method=method
        )

        return generator.generate_test(endpoint, method, resolved_schema)
```