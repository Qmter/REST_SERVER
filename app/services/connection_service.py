from fastapi import HTTPException
import json

from app.repositories.connection_repo import (
    create_connection,
    get_connections_by_workspace,
    delete_connection,
    modify_connection,
    update_openapi,
    get_openapi,
    delete_openapi
)

from app.repositories.workspace_repo import (
    get_workspace_by_id,
    get_access_type_by_name,
    get_workspace_membership,
    get_workspace_by_id_connection
)

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

    # if workspace["id_user"] != id_user:
    #     raise HTTPException(403, "Forbidden")

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

    editor_access = get_access_type_by_name(db=db, name_access_type="editor")
    editor_access_id = editor_access["id_access_type"]

    owner_access = get_access_type_by_name(db=db, name_access_type="owner")
    owner_access_id = owner_access["id_access_type"]

    membership = get_workspace_membership(db=db, id_workspace=id_workspace, id_user=id_user)

    if not membership or membership["id_access_type"] not in [editor_access_id, owner_access_id]:
        raise HTTPException(status_code=403, detail="Forbidden")
    

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

    raw_connections = get_connections_by_workspace(db=db, id_workspace=id_workspace)

    if not raw_connections:
        return []
    if isinstance(raw_connections, dict):
        raw_connections = [raw_connections]

    normalized = []
    for conn in raw_connections:
        # Приводим строковые/tuple результаты к dict
        if isinstance(conn, dict):
            c = conn
        else:
            try:
                c = json.loads(conn)
            except Exception:
                # если пришёл tuple/list, попробуем собрать dict по порядку
                if isinstance(conn, (list, tuple)) and len(conn) >= 4:
                    c = {
                        "id_connection": conn[0],
                        "id_workspace": conn[1],
                        "id_auth_type": conn[2],
                        "base_url": conn[3],
                        "auth_data": conn[4] if len(conn) > 4 else None,
                    }
                else:
                    continue

        if "auth_data" in c and isinstance(c["auth_data"], str):
            try:
                c["auth_data"] = json.loads(c["auth_data"])
            except json.JSONDecodeError:
                c["auth_data"] = None

        normalized.append(c)

    return normalized


def delete_connection_service(db, id_user, id_connection):

    # можно улучшить позже (join + проверка)
    delete_connection(db=db, id_connection=id_connection)


def update_openapi_service(db, id_workspace, data):

    schema_json = json.dumps(data.openapi_schema)

    update_openapi(db, id_workspace, schema_json)

    return {"status": "updated"}


def get_openapi_service(db, id_workspace):

    row = get_openapi(db, id_workspace)

    if not row or not row["openapi_schema"]:
        raise HTTPException(404, "OpenAPI not found")

    schema = row["openapi_schema"]

    if isinstance(schema, str):
        schema = json.loads(schema)

    return schema


def delete_openapi_service(db, id_workspace):

    delete_openapi(db, id_workspace)

    return {"status": "deleted"}
