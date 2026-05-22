from app.repositories.admin_repo import (
    get_all_users,
    get_all_workspaces,
    get_all_logs,
    get_all_log_executions,
    get_admin_statistics
)

from app.repositories.user_repo import get_user_by_id, delete_user, update_user
from fastapi import HTTPException, status
from app.core.security import hash_password


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


def get_admin_statistics_service(db):
    stats = get_admin_statistics(db=db)
    if not stats:
        return {
            "total_tests": 0,
            "total_scenarios": 0,
            "total_test_executions": 0,
            "passed_tests": 0,
            "failed_tests": 0
        }

    return {
        "total_tests": stats.get("total_tests", 0) or 0,
        "total_scenarios": stats.get("total_scenarios", 0) or 0,
        "total_test_executions": stats.get("total_test_executions", 0) or 0,
        "passed_tests": stats.get("passed_tests", 0) or 0,
        "failed_tests": stats.get("failed_tests", 0) or 0
    }


def update_user_service(db, user_id: int, username: str = None, email: str = None, password: str = None, id_role: int = None):
    # Проверка существования пользователя
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    # Хэширование пароля, если он передан
    password_hash = None
    if password is not None:
        password_hash = hash_password(password)

    # Выполнение обновления
    success = update_user(
        db=db,
        user_id=user_id,
        username=username,
        email=email,
        password_hash=password_hash,
        id_role=id_role
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка при обновлении пользователя"
        )

    return {"id_user": user_id, "message": "Пользователь успешно обновлен"}