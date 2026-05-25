from fastapi import APIRouter, Depends, Body
from typing import Dict, Any, List

from app.schemas.neural_schema import (
    NeuralTestGenerateRequest,
    NeuralTestGenerateResponse,
    NeuralTestBatchGenerateRequest
)
from app.services.neural_service import (
    generate_neural_test,
    generate_neural_test_batch
)
from app.db.database import get_db
from app.core.dependencies import get_current_user


router = APIRouter()


@router.post("/{id_workspace}/generate", response_model=NeuralTestGenerateResponse)
def generate_test(
    id_workspace: int,
    request: NeuralTestGenerateRequest = Body(...),
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Генерация теста для одного эндпоинта через нейросеть.

    Требуется:
    - endpoint: путь эндпоинта
    - method: HTTP метод
    - openapi_spec: OpenAPI спецификация
    """
    result = generate_neural_test(
        db=db,
        id_workspace=id_workspace,
        endpoint=request.endpoint,
        method=request.method,
    )

    return NeuralTestGenerateResponse(
        success=result["success"],
        test=result.get("test"),
        error=None
    )


@router.post("/generate/batch")
def generate_test_batch(
    endpoints: List[Dict[str, str]] = Body(..., description="Список эндпоинтов: [{\"endpoint\": \"/path\", \"method\": \"post\"}]"),
    openapi_spec: Dict[str, Any] = Body(..., description="OpenAPI спецификация"),
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    """
    Пакетная генерация тестов для нескольких эндпоинтов.

    Возвращает:
    - tests: сгенерированные тесты
    - generated_count: количество успешно сгенерированных
    - failed_count: количество неудачных попыток
    - generated_endpoints: список успешных эндпоинтов
    - failed_endpoints: список неудачных эндпоинтов
    """
    result = generate_neural_test_batch(
        endpoints_info=endpoints,
        openapi_spec=openapi_spec
    )

    return result


@router.get("/status")
def get_status(db=Depends(get_db), user=Depends(get_current_user)):
    """
    Проверка статуса нейронного генератора.
    Показывает количество загруженных примеров.
    """
    from app.services.neural_service import get_neural_generator

    try:
        generator = get_neural_generator()
        examples_count = len(generator.examples)

        return {
            "status": "ready" if examples_count > 0 else "no_examples",
            "examples_loaded": examples_count,
            "model": generator.model_name
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }