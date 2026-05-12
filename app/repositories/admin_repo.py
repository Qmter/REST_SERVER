def get_all_users(db):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_user, username, email, id_role, created_at
            FROM users
            ORDER BY created_at DESC
            """
        )
        return cursor.fetchall()


def get_all_workspaces(db):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_workspace, name_workspace, description, created_at
            FROM workspaces
            ORDER BY created_at DESC
            """
        )
        return cursor.fetchall()


def get_all_logs(db, limit: int = 100, offset: int = 0):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_log, object_id, object_type, action, old_value, new_value, log_date
            FROM logs
            ORDER BY log_date DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset)
        )
        return cursor.fetchall()


def get_all_log_executions(db, limit: int = 100, offset: int = 0):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_log_exec, id_test_execution, detail, created_at
            FROM log_executions
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset)
        )
        return cursor.fetchall()