from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name_workspace: str = Field(max_length=25)
    description: str | None = Field(max_length=255)


class WorkspaceResponse(BaseModel):
    id_workspace: int
    name_workspace: str
    description: str | None
    name_access_type: str | None
