from pydantic import BaseModel
from typing import Optional, Dict, Any


class NeuralTestGenerateRequest(BaseModel):
    """Запрос на генерацию теста через нейросеть."""
    endpoint: str
    method: str = "post"
    seed: Optional[int] = 42


class NeuralTestGenerateResponse(BaseModel):
    """Ответ с сгенерированным тестом."""
    success: bool
    test: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class NeuralTestBatchGenerateRequest(BaseModel):
    """Запрос на пакетную генерацию тестов."""
    endpoints: list[Dict[str, Any]]
    """Каждый элемент содержит: endpoint, method"""