from fastapi import APIRouter, Depends

from app.schemas.workspace_schema import (
    WorkspaceCreate,
    WorkspaceResponse
)

from app.services.workspace_service import (
    create_workspace_service,
    list_workspaces_service,
    delete_workspace_service
)

from app.core.dependencies import get_current_user
from app.db.database import get_db


router = APIRouter()


@router.post("/", response_model=int, description="Create workspace by authorized user")
def create_workspace(
    data: WorkspaceCreate,
    user = Depends(get_current_user),
    db = Depends(get_db)

):

    id_workspace = create_workspace_service(
        db=db,
        id_user=user["id_user"],
        name_workspace=data.name_workspace,
        description=data.description
    )

    return id_workspace


@router.get("/", response_model=list[WorkspaceResponse], description="Get list workspaces by authorized user")
def list_workspaces(
    user = Depends(get_current_user),
    db = Depends(get_db)
):

    return list_workspaces_service(db=db, id_user=user["id_user"])


@router.delete("/{id_workspace}", description="Delete workspace by authorized user")
def delete_workspace(
    id_workspace: int,
    user = Depends(get_current_user),
    db = Depends(get_db)
):

    delete_workspace_service(
        db=db,
        id_user=user["id_user"],
        id_workspace=id_workspace
    )

    return {"status": "deleted"}