from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from app.schemas.admin_schema import (
    AdminUserResponse,
    AdminWorkspaceResponse,
    AdminLogResponse,
    AdminLogExecutionResponse,
    UserDeleteResponse,
    MessageResponse
)
from app.services.admin_service import (
    list_all_users_service,
    list_all_workspaces_service,
    list_all_logs_service,
    list_all_log_executions_service,
    remove_user
)
from app.core.dependencies import get_current_user
from app.db.database import get_db


router = APIRouter()



def require_admin(user=Depends(get_current_user)):
    """Проверяет, что пользователь имеет роль admin (id_role=1)"""
    if not user or user.get("id_role") != 1:
        raise HTTPException(status_code=403, detail="Требуется роль администратора")
    return user


@router.delete("/users/{user_id}", response_model=UserDeleteResponse)
def delete_user_endpoint(
    user_id: int, 
    db=Depends(get_db),
    admin=Depends(require_admin),
    cur_user=Depends(get_current_user)
):
    if user_id == cur_user['id_user']:
        raise HTTPException(403, "Нельзя удалить самого себя")
    return remove_user(db, user_id)

@router.get("/users", response_model=list[AdminUserResponse], description="Get all users (admin only)")
def get_all_users(
    db=Depends(get_db),
    admin=Depends(require_admin)
):
    return list_all_users_service(db=db)


@router.get("/workspaces", response_model=list[AdminWorkspaceResponse], description="Get all workspaces (admin only)")
def get_all_workspaces(
    db=Depends(get_db),
    admin=Depends(require_admin)
):
    return list_all_workspaces_service(db=db)


@router.get("/logs", response_model=list[AdminLogResponse], description="Get system logs (admin only)")
def get_logs(
    limit: int = 100,
    offset: int = 0,
    db=Depends(get_db),
    admin=Depends(require_admin)
):
    return list_all_logs_service(db=db, limit=limit, offset=offset)


@router.get("/log-executions", response_model=list[AdminLogExecutionResponse], description="Get test execution logs (admin only)")
def get_log_executions(
    limit: int = 100,
    offset: int = 0,
    db=Depends(get_db),
    admin=Depends(require_admin)
):
    return list_all_log_executions_service(db=db, limit=limit, offset=offset)