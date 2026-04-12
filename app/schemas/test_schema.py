from pydantic import BaseModel
from datetime import datetime


class TestPreview(BaseModel):
    id_test: int
    name_test: str


class TestDetail(BaseModel):
    id_test: int
    id_scenario: int
    name_test: str
    content_test: dict
    last_seed: str
    generated_at: datetime | None = None