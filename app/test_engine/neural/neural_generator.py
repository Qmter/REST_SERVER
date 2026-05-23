"""
Нейронный генератор тестов на основе Ollama (локальная LLM).
Использует few-shot learning с примерами из JSON файлов.
"""

import json
import os
import random
from typing import List, Dict, Any, Optional
from pathlib import Path


class NeuralTestGenerator:
    """
    Генератор тестов с использованием локальной LLM через Ollama API.
    Работает по принципу few-shot learning - выбирает случайные примеры
    из имеющихся JSON файлов и использует их в промпте.
    """

    def __init__(self, examples_dir: str, model_name: str = "qwen2.5:7b"):
        """
        Инициализация генератора.

        Args:
            examples_dir: Путь к директории с JSON файлами примеров тестов
            model_name: Название модели Ollama для генерации
        """
        self.examples_dir = Path(examples_dir)
        self.model_name = model_name
        self.examples: List[Dict[str, Any]] = []
        self._load_examples()

    def _load_examples(self):
        """Загрузка всех примеров тестов из JSON файлов."""
        if not self.examples_dir.exists():
            print(f"Директория с примерами не найдена: {self.examples_dir}")
            return

        json_files = list(self.examples_dir.glob("*.json"))
        print(f"Найдено {len(json_files)} JSON файлов с примерами")

        for file_path in json_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.examples.append({
                        "filename": file_path.name,
                        "content": data
                    })
            except Exception as e:
                print(f"Ошибка загрузки файла {file_path}: {e}")

        print(f"Загружено {len(self.examples)} примеров тестов")

    def _select_few_shot_examples(self, n: int = 3) -> List[Dict[str, Any]]:
        """
        Выбор случайных примеров для few-shot обучения.

        Args:
            n: Количество примеров для выбора

        Returns:
            Список выбранных примеров
        """
        if len(self.examples) == 0:
            return []

        n = min(n, len(self.examples))
        return random.sample(self.examples, n)

    def _build_prompt(self, endpoint: str, method: str, resolved_schema: Dict[str, Any]) -> str:
        """
        Построение промпта для LLM.

        Args:
            endpoint: Путь эндпоинта
            method: HTTP метод
            resolved_schema: Распаршенная схема эндпоинта

        Returns:
            Промпт для генерации теста
        """
        # Выбираем few-shot примеры
        few_shot_examples = self._select_few_shot_examples(3)

        # Формируем часть с примерами
        examples_text = ""
        for i, example in enumerate(few_shot_examples, 1):
            examples_text += f"\n\n--- Пример {i} ---\n"
            examples_text += f"Файл: {example['filename']}\n"
            examples_text += f"Тест:\n{json.dumps(example['content'], indent=2, ensure_ascii=False)}\n"

        # Формируем основную часть промпта
        prompt = f"""Ты - экспертный инженер по тестированию API. Твоя задача - создать тест для указанного эндпоинта на основе его схемы OpenAPI.

{examples_text}

--- Текущая задача ---
Эндпоинт: {endpoint}
Метод: {method.upper()}

Схема эндпоинта (распаршенная):
{json.dumps(resolved_schema, indent=2, ensure_ascii=False)}

Инструкция:
1. Проанализируй схему эндпоинта
2. Определи необходимые параметры (query, path, body)
3. Создай тест в формате JSON со следующей структурой:
   - Для POST методов используй ключ "schema" для параметров тела запроса
   - Для GET/PUT/DELETE используй ключ "arguments" для query/path параметров
   - Укажи ожидаемые коды ответа (httpCode, errCode)
4. Сгенерируй валидные тестовые данные, соответствующие схеме

Ответ должен содержать ТОЛЬКО JSON объекта теста без дополнительных пояснений.
Пример формата ответа:
{{
    "test_1": {{
        "description": "Описание теста",
        "step_1": {{
            "endpoint": "{endpoint}",
            "type": "{method.upper()}",
            "schema/arguments": {{...}},
            "expected": {{
                "httpCode": 200,
                "errCode": 0
            }}
        }}
    }}
}}
"""
        return prompt

    def generate_test(self, endpoint: str, method: str, resolved_schema: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Генерация теста для эндпоинта через Ollama API.

        Args:
            endpoint: Путь эндпоинта
            method: HTTP метод
            resolved_schema: Распаршенная схема эндпоинта

        Returns:
            Сгенерированный тест или None при ошибке
        """
        import requests

        try:
            # Строим промпт
            prompt = self._build_prompt(endpoint, method, resolved_schema)

            # Отправляем запрос к Ollama API
            ollama_url = "http://localhost:11434/api/generate"

            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "num_predict": 2048
                }
            }

            response = requests.post(ollama_url, json=payload, timeout=120)
            response.raise_for_status()

            result = response.json()
            generated_text = result.get("response", "")

            # Парсим JSON из ответа
            test_data = self._extract_json_from_response(generated_text)

            if test_data:
                print(f"Успешно сгенерирован тест для {method.upper()} {endpoint}")
                return test_data
            else:
                print(f"Не удалось распарсить JSON из ответа для {endpoint}")
                return None

        except requests.exceptions.ConnectionError:
            print("Ошибка: Не удалось подключиться к Ollama. Убедитесь, что сервис запущен.")
            print("Для установки: curl -fsSL https://ollama.com/install.sh | sh")
            print("Для запуска модели: ollama run qwen2.5:7b")
            return None
        except requests.exceptions.Timeout:
            print(f"Таймаут при генерации теста для {endpoint}")
            return None
        except Exception as e:
            print(f"Ошибка при генерации теста: {e}")
            return None

    def _extract_json_from_response(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Извлечение JSON объекта из текста ответа LLM.

        Args:
            text: Текст ответа от LLM

        Returns:
            Распаршенный JSON или None
        """
        # Пробуем найти JSON между фигурными скобками
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1

        if start_idx != -1 and end_idx > start_idx:
            json_str = text[start_idx:end_idx]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"Ошибка парсинга JSON: {e}")
                print(f"Попытка распарсить: {json_str[:200]}...")

        # Если не получилось, пробуем распарсить весь текст
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None

    def generate_test_batch(self, endpoints_info: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Генерация тестов для нескольких эндпоинтов.

        Args:
            endpoints_info: Список словарей с информацией об эндпоинтах
                           Каждый словарь должен содержать:
                           - endpoint: путь эндпоинта
                           - method: HTTP метод
                           - resolved_schema: распаршенная схема

        Returns:
            Словарь с результатами генерации
        """
        results = {
            "success": [],
            "failed": [],
            "tests": {}
        }

        for info in endpoints_info:
            endpoint = info.get("endpoint")
            method = info.get("method", "post")
            schema = info.get("resolved_schema", {})

            print(f"\nГенерация теста для {method.upper()} {endpoint}...")

            test = self.generate_test(endpoint, method, schema)

            if test:
                results["success"].append(f"{method.upper()} {endpoint}")
                key = f"{method.lower()}_{endpoint.replace('/', '_').strip('_')}"
                results["tests"][key] = test
            else:
                results["failed"].append(f"{method.upper()} {endpoint}")

        return results