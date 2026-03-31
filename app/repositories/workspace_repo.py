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
            SELECT w.id_workspace, w.name_workspace, w.description
            FROM workspaces w
            JOIN workspace_users w_s ON w.id_workspace = w_s.id_workspace
            WHERE id_user=%s
            """,
            (id_user,)
        )

        return cursor.fetchall()

def get_workspace_by_id(db, id_workspace: int):

    with db.cursor() as cursor:

        cursor.execute(
            """
            SELECT w.id_workspace, w_s.id_user, w.name_workspace, w.description
            FROM workspaces w
            LEFT JOIN workspace_users w_s 
            ON w.id_workspace = w_s.id_workspace
            WHERE w.id_workspace = %s;
            """,
            (id_workspace,)
        )

        return cursor.fetchone()



def delete_workspace(db, id_workspace: int):

    with db.cursor() as cursor:

        cursor.execute(
            "DELETE FROM workspaces WHERE id_workspace=%s",
            (id_workspace,)
        )

        db.commit()