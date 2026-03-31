from fastapi import HTTPException

from app.repositories.workspace_repo import (
    create_workspace,
    get_workspaces_by_user,
    get_workspace_by_id,
    get_access_type_by_name,
    delete_workspace
)


def create_workspace_service(db, id_user, name_workspace, description):

    dict_id_access_type = get_access_type_by_name(db=db, name_access_type="owner")
    id_access_type = dict_id_access_type["id_access_type"]

    return create_workspace(
        db=db, 
        id_user=id_user, 
        name_workspace=name_workspace, 
        description=description,
        id_access_type=id_access_type
        )
    


def list_workspaces_service(db, id_user):

    return get_workspaces_by_user(
        db=db, 
        id_user=id_user
        )


def delete_workspace_service(db, id_user, id_workspace):

    workspace = get_workspace_by_id(
        db=db, 
        id_workspace=id_workspace
        )

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if workspace["id_user"] != id_user:
        raise HTTPException(status_code=403, detail="Forbidden")

    delete_workspace(
        db=db, 
        id_workspace=id_workspace
        )