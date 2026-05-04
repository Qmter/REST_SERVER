from pydantic import BaseModel
from datetime import datetime


class TestPreview(BaseModel):
    id_test: int
    id_scenario: int
    name_test: str
    last_status: str | None = None
    last_start: datetime | None = None


class TestDetail(BaseModel):
    id_test: int
    id_scenario: int
    name_test: str
    content_test: dict
    last_seed: str
    generated_at: datetime | None = None
    last_status: str | None = None
    last_start: datetime | None = None
