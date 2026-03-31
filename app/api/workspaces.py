from fastapi import APIRouter, Depends, HTTPException

from app.schemas.workspace_schema import (
    WorkspaceCreate,
    WorkspaceResponse
)

from app.services.workspace_service import (
    create_workspace_service,
    list_workspaces_service,
    delete_workspace_service,
    list_workspace_members_service,
    add_workspace_member_service
)

from app.core.dependencies import get_current_user
from app.core.dependencies_access import check_workspace_access_dep
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
    db = Depends(get_db),
    access=Depends(check_workspace_access_dep("delete"))
):

    delete_workspace_service(
        db=db,
        id_user=user["id_user"],
        id_workspace=id_workspace
    )

    return {"status": "deleted"}


@router.get("/{id_workspace}/members", description="List members of workspace")
def list_members(
    id_workspace: int,
    user = Depends(get_current_user),
    db = Depends(get_db),
    access=Depends(check_workspace_access_dep("delete"))  # owner only
):
    return list_workspace_members_service(db=db, id_workspace=id_workspace, id_user=user["id_user"])


@router.post("/{id_workspace}/members", description="Add or update member access (owner only)")
def add_member(
    id_workspace: int,
    payload: dict,
    user = Depends(get_current_user),
    db = Depends(get_db),
    access=Depends(check_workspace_access_dep("delete"))  # owner only
):
    username = payload.get("username")
    access_name = (payload.get("access") or "").lower()
    if access_name not in {"viewer", "editor", "owner"}:
        raise HTTPException(status_code=400, detail="access must be viewer/editor/owner")
    return add_workspace_member_service(
        db=db,
        id_workspace=id_workspace,
        id_user_actor=user["id_user"],
        username=username,
        access_name=access_name
    )
