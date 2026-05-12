from app.repositories.admin_repo import (
    get_all_users,
    get_all_workspaces,
    get_all_logs,
    get_all_log_executions
)

from app.repositories.user_repo import get_user_by_id, delete_user
from fastapi import HTTPException, status


def list_all_users_service(db):
    return get_all_users(db=db)


def list_all_workspaces_service(db):
    return get_all_workspaces(db=db)


def list_all_logs_service(db, limit: int = 100, offset: int = 0):
    return get_all_logs(db=db, limit=limit, offset=offset)


def list_all_log_executions_service(db, limit: int = 100, offset: int = 0):
    return get_all_log_executions(db=db, limit=limit, offset=offset)


def remove_user(db, user_id: int):
    # Проверка существования пользователя
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    # Выполнение удаления
    success = delete_user(db, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при удалении пользователя"
        )
    
    return {"id_user": user_id, "message": "Пользователь успешно удален"}