from fastapi import APIRouter, Depends

from app.schemas.connection_schema import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectionModify,
    OpenAPISchema
)

from app.services.connection_service import (
    create_connection_service,
    list_connections_service,
    delete_connection_service,
    modify_connection_service,
    get_openapi_service,
    delete_openapi_service,
    update_openapi_service,
    check_connection_service
)

from app.core.dependencies import get_current_user
from app.core.dependencies_access import check_workspace_access_dep
from app.db.database import get_db


router = APIRouter()


@router.post("/", response_model=int)
def create_connection(
    data: ConnectionCreate,
    user = Depends(get_current_user),
    db = Depends(get_db)
):

    return create_connection_service(db, user["id_user"], data)

@router.patch("/{id_workspace}/modify")
def modify_connection(
    id_workspace: int,
    data: ConnectionModify,
    user=Depends(get_current_user),
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("write"))
):
    return modify_connection_service(db=db, id_user=user["id_user"], id_workspace=id_workspace, data=data)



@router.get("/{id_workspace}", response_model=list[ConnectionResponse])
def get_connections(
    id_workspace: int,
    user = Depends(get_current_user),
    db = Depends(get_db)
):

    return list_connections_service(db=db, id_user=user["id_user"], id_workspace=id_workspace)


@router.delete("/{id_connection}")
def delete_connection(
    id_connection: int,
    user = Depends(get_current_user),
    db = Depends(get_db)
):

    delete_connection_service(db, user["id_user"], id_connection)

    return {"status": "deleted"}

@router.put("/openapi/{id_workspace}")
def update_openapi(
    id_workspace: int,
    data: OpenAPISchema,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("write"))
):
    return update_openapi_service(db, id_workspace, data)


@router.get("/openapi/{id_workspace}")
def get_openapi(
    id_workspace: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return get_openapi_service(db, id_workspace)


@router.delete("/openapi/{id_workspace}")
def delete_openapi(
    id_workspace: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("delete"))
):
    return delete_openapi_service(db, id_workspace)


@router.get("/check/{id_workspace}")
def check_connection(
    id_workspace: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return check_connection_service(db, id_workspace)
