def create_workspace(db, id_user, name_workspace, description, id_access_type):
    with db.cursor() as cursor:
        # порядковый номер OUT‑параметра в сигнатуре процедуры — последний (индекс 5, если считать с 0)
        cursor.callproc(
            "create_workspace_full",
            (
                id_user,
                name_workspace,
                description,
                id_access_type,
                True,          # p_with_default_conn
                0,             # заглушка для OUT
            ),
        )
        cursor.execute("SELECT @_create_workspace_full_5 AS id_workspace;")
        row = cursor.fetchone()
    return row["id_workspace"]




def get_access_type_by_name(db, name_access_type: str):

    with db.cursor() as cursor:
        
        cursor.execute(
            """
            SELECT * FROM access_type WHERE name_access_type = %s
            """,
            (name_access_type, )
        )

        return cursor.fetchone()


def get_workspaces_by_user(db, id_user: int):

    with db.cursor() as cursor:

        cursor.execute(
            """
            SELECT w.id_workspace,
                   w.name_workspace,
                   w.description,
                   w_s.id_access_type,
                   at.name_access_type
            FROM workspaces w
            JOIN workspace_users w_s ON w.id_workspace = w_s.id_workspace
            JOIN access_type at ON at.id_access_type = w_s.id_access_type
            WHERE w_s.id_user=%s
            """,
            (id_user,)
        )

        return cursor.fetchall()

def get_workspace_by_id(db, id_workspace: int):

    with db.cursor() as cursor:

        cursor.execute(
            """
            SELECT w.id_workspace,
                   w.name_workspace,
                   w.description,
                   wu_owner.id_user AS id_user
            FROM workspaces w
            LEFT JOIN workspace_users wu_owner
              ON wu_owner.id_workspace = w.id_workspace
            LEFT JOIN access_type at_owner
              ON at_owner.id_access_type = wu_owner.id_access_type
             AND at_owner.name_access_type = 'owner'
            WHERE w.id_workspace = %s
            LIMIT 1;
            """,
            (id_workspace,)
        )

        return cursor.fetchone()


def get_workspace_membership(db, id_workspace: int, id_user: int):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_user, id_access_type
            FROM workspace_users
            WHERE id_workspace = %s AND id_user = %s
            LIMIT 1;
            """,
            (id_workspace, id_user)
        )
        return cursor.fetchone()



def delete_workspace(db, id_workspace: int):

    with db.cursor() as cursor:

        cursor.execute(
            "DELETE FROM workspaces WHERE id_workspace=%s",
            (id_workspace,)
        )

        db.commit()


def delete_workspace_users(db, id_workspace: int):
    with db.cursor() as cursor:
        cursor.execute(
            "DELETE FROM workspace_users WHERE id_workspace=%s",
            (id_workspace,)
        )
        db.commit()


def list_workspace_members(db, id_workspace: int):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT wu.id_user, u.username, u.email, at.name_access_type
            FROM workspace_users wu
            JOIN users u ON wu.id_user = u.id_user
            JOIN access_type at ON wu.id_access_type = at.id_access_type
            WHERE wu.id_workspace = %s
            ORDER BY at.id_access_type DESC, u.username
            """,
            (id_workspace,)
        )
        return cursor.fetchall()


def add_workspace_member(db, id_workspace: int, id_user: int, id_access_type: int):
    with db.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO workspace_users (id_workspace, id_user, id_access_type)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE id_access_type = VALUES(id_access_type)
            """,
            (id_workspace, id_user, id_access_type)
        )
        db.commit()
