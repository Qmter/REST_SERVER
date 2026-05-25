import json
from fastapi import HTTPException
from typing import Dict, Any, Optional, List

from app.test_engine.neural import NeuralTestGenerator
from app.test_engine.utils.resolve_scheme import ResolveScheme
from app.repositories.connection_repo import get_openapi


# Глобальный экземпляр генератора (ленивая инициализация)
_neural_generator: Optional[NeuralTestGenerator] = None


def get_neural_generator(examples_dir: str = "./app/test_engine/neural/examples") -> NeuralTestGenerator:
    """Получение экземпляра генератора (singleton pattern)."""
    global _neural_generator

    if _neural_generator is None:
        _neural_generator = NeuralTestGenerator(examples_dir=examples_dir)

    return _neural_generator


def generate_neural_test(
    db,
    id_workspace: int,
    endpoint: str,
    method: str,
    examples_dir: str = "./app/test_engine/neural/examples"
) -> Dict[str, Any]:
    """
    Генерация теста для одного эндпоинта через нейросеть.

    Args:
        endpoint: Путь эндпоинта
        method: HTTP метод
        examples_dir: Путь к примерам тестов

    Returns:
        Сгенерированный тест
    """
    try:
        # Инициализируем генератор
        generator = get_neural_generator(examples_dir)

        openapi_spec = get_openapi(db=db, id_workspace=id_workspace)

        if not openapi_spec or openapi_spec is None:
            raise HTTPException(404, "OpenAPI not found")

        content_openapi = openapi_spec['openapi_schema']
        if isinstance(content_openapi, str):
            content_openapi = json.loads(content_openapi)

        # Разрешаем схему эндпоинта
        resolved_schema = ResolveScheme.resolve_endpoint(
            openapi_file=content_openapi,
            endpoint_path=endpoint,
            method=method.lower()
        )

        # Генерируем тест
        test = generator.generate_test(
            endpoint=endpoint,
            method=method.lower(),
            resolved_schema=resolved_schema
        )

        if test is None:
            raise HTTPException(500, "Не удалось сгенерировать тест")

        return {
            "success": True,
            "test": test,
            "endpoint": endpoint,
            "method": method.upper()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Ошибка при генерации теста: {str(e)}")


def generate_neural_test_batch(
    endpoints_info: List[Dict[str, Any]],
    openapi_spec: Dict[str, Any],
    examples_dir: str = "./app/test_engine/neural/examples"
) -> Dict[str, Any]:
    """
    Пакетная генерация тестов для нескольких эндпоинтов.

    Args:
        endpoints_info: Список эндпоинтов с методами
                       Каждый элемент: {"endpoint": "/path", "method": "post"}
        openapi_spec: OpenAPI спецификация
        examples_dir: Путь к примерам тестов

    Returns:
        Результаты генерации
    """
    try:
        generator = get_neural_generator(examples_dir)

        # Подготавливаем информацию для генерации
        prepared_endpoints = []
        for info in endpoints_info:
            endpoint = info.get("endpoint")
            method = info.get("method", "post").lower()

            try:
                resolved_schema = ResolveScheme.resolve_endpoint(
                    openapi_file=openapi_spec,
                    endpoint_path=endpoint,
                    method=method
                )

                prepared_endpoints.append({
                    "endpoint": endpoint,
                    "method": method,
                    "resolved_schema": resolved_schema
                })
            except Exception as e:
                print(f"Ошибка разрешения схемы для {endpoint}: {e}")
                continue

        # Генерируем тесты
        results = generator.generate_test_batch(prepared_endpoints)

        return {
            "success": len(results["success"]) > 0,
            "tests": results["tests"],
            "generated_count": len(results["success"]),
            "failed_count": len(results["failed"]),
            "generated_endpoints": results["success"],
            "failed_endpoints": results["failed"]
        }

    except Exception as e:
        raise HTTPException(500, f"Ошибка при пакетной генерации: {str(e)}")