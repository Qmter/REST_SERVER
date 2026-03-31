from pydantic import BaseModel


class WorkspaceCreate(BaseModel):
    name_workspace: str
    description: str | None = None


class WorkspaceResponse(BaseModel):
    id_workspace: int
    name_workspace: str
    description: str | None