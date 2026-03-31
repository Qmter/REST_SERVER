from fastapi import HTTPException
import json

from app.repositories.connection_repo import (
    create_connection,
    get_connections_by_workspace,
    delete_connection,
    modify_connection
)

from app.repositories.workspace_repo import get_workspace_by_id


def create_connection_service(db, id_user, data):

    auth_payload = data.auth_data.model_dump(exclude_none=True)  # -> dict
    auth_data_json = json.dumps(auth_payload)

    workspace = get_workspace_by_id(db=db, id_workspace=data.id_workspace)

    connection = get_connections_by_workspace(db=db, id_workspace=data.id_workspace)

    if connection:
        raise HTTPException(
            status_code=400,
            detail="Connection already exists"
        )

    if not workspace:
        raise HTTPException(404, "Workspace not found")

    if workspace["id_user"] != id_user:
        raise HTTPException(403, "Forbidden")

    return create_connection(
        db=db,
        id_workspace=data.id_workspace,
        id_auth_type=data.id_auth_type,
        base_url=data.base_url,
        auth_data=auth_data_json
    )

def modify_connection_service(db, id_user, data, id_workspace):
    auth_payload = data.auth_data.model_dump(exclude_none=True)
    auth_data_json = json.dumps(auth_payload)

    workspace = get_workspace_by_id(db=db, id_workspace=id_workspace)

    connection = get_connections_by_workspace(db=db, id_workspace=id_workspace)

    if not connection:
        raise HTTPException(
            status_code=404,
            detail="Connection not found"
        )

    if not workspace:
        raise HTTPException(404, "Workspace not found")

    # if workspace["id_user"]  id_user:
    #     raise HTTPException(403, "Forbidden")
    

    # проверки workspace + user
    return modify_connection(
        db=db,
        id_workspace=id_workspace,
        id_auth_type=data.id_auth_type,
        base_url=data.base_url,
        auth_data=auth_data_json,
    )




def list_connections_service(db, id_user, id_workspace):

    workspace = get_workspace_by_id(db=db, id_workspace=id_workspace)

    if not workspace:
        raise HTTPException(404, "Workspace not found")

    # if workspace["id_user"] != id_user:
    #     raise HTTPException(403, "Forbidden")

    return get_connections_by_workspace(db=db, id_workspace=id_workspace)


def delete_connection_service(db, id_user, id_connection):

    # можно улучшить позже (join + проверка)
    delete_connection(db=db, id_connection=id_connection)