def create_connection(
    db,
    id_workspace,
    id_auth_type,
    base_url,
    auth_data
):

    with db.cursor() as cursor:

        cursor.execute(
            """
            INSERT INTO workspaces_connections
            (id_workspace, id_auth_type, base_url, auth_data)
            VALUES (%s,%s,%s,%s)
            """,
            (
                id_workspace,
                id_auth_type,
                base_url,
                auth_data
            )
        )

        db.commit()

        return cursor.lastrowid

def modify_connection(
        db,
        id_workspace,
        id_auth_type,
        base_url,
        auth_data
):
    
    with db.cursor() as cursor:

        cursor.execute(
            """
            UPDATE workspaces_connections
            SET base_url = %s,
                id_auth_type = %s,
                auth_data = %s
            WHERE id_workspace = %s
            """,
            (base_url, id_auth_type, auth_data, id_workspace),
        )


        db.commit()
        return {"success": "workspace connection has been updated"}



def get_connections_by_workspace(db, id_workspace):

    with db.cursor() as cursor:

        cursor.execute(
            """
            SELECT id_connection, id_workspace, id_auth_type, base_url, auth_data
            FROM workspaces_connections
            WHERE id_workspace=%s
            """,
            (id_workspace,)
        )

        return cursor.fetchone()


def delete_connection(db, id_connection):

    with db.cursor() as cursor:

        cursor.execute(
            "DELETE FROM workspaces_connections WHERE id_connection=%s",
            (id_connection,)
        )

        db.commit()


def delete_connections_by_workspace(db, id_workspace):
    with db.cursor() as cursor:
        cursor.execute(
            "DELETE FROM workspaces_connections WHERE id_workspace=%s",
            (id_workspace,)
        )
        db.commit()


def update_openapi(db, id_workspace, schema_json):
    with db.cursor() as cursor:
        cursor.execute(
            """
            UPDATE workspaces_connections
            SET openapi_schema = %s
            WHERE id_workspace = %s
            """,
            (schema_json, id_workspace)
        )
        db.commit()


def get_openapi(db, id_workspace):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT openapi_schema
            FROM workspaces_connections
            WHERE id_workspace = %s
            """,
            (id_workspace,)
        )
        return cursor.fetchone()


def delete_openapi(db, id_workspace):
    with db.cursor() as cursor:
        cursor.execute(
            """
            UPDATE workspaces_connections
            SET openapi_schema = NULL
            WHERE id_workspace = %s
            """,
            (id_workspace,)
        )
        db.commit()
