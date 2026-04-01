from pydantic import BaseModel


class ScenarioCreate(BaseModel):
    name_scenario: str
    content_scenario: dict


class ScenarioResponse(BaseModel):
    id_scenario: int
    id_workspace: int
    name_scenario: str
    content_scenario: dict

class ScenarioUpdate(BaseModel):
    name_scenario: str | None = None
    content_scenario: dict | None = None