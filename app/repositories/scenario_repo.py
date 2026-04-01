def create_scenario(db, id_workspace, name_scenario, content_scenario):
    with db.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO scenarios (id_workspace, name_scenario, content_scenario)
            VALUES (%s, %s, %s)
            """,
            (id_workspace, name_scenario, content_scenario)
        )
        db.commit()
        return cursor.lastrowid


def get_scenarios_by_workspace(db, id_workspace):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_scenario, id_workspace, name_scenario, content_scenario
            FROM scenarios
            WHERE id_workspace = %s
            """,
            (id_workspace,)
        )
        return cursor.fetchall()


def delete_scenario(db, id_scenario):
    with db.cursor() as cursor:
        cursor.execute(
            "DELETE FROM scenarios WHERE id_scenario = %s",
            (id_scenario,)
        )
        db.commit()


def get_scenarios_preview(db, id_workspace):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_scenario, name_scenario
            FROM scenarios
            WHERE id_workspace = %s
            """,
            (id_workspace,)
        )
        return cursor.fetchall()

def get_scenario_by_id(db, id_scenario):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_scenario, id_workspace, name_scenario, content_scenario
            FROM scenarios
            WHERE id_scenario = %s
            """,
            (id_scenario,)
        )
        return cursor.fetchone()

def update_scenario(db, id_scenario, name_scenario, content_scenario):
    with db.cursor() as cursor:
        cursor.execute(
            """
            UPDATE scenarios
            SET name_scenario = %s,
                content_scenario = %s
            WHERE id_scenario = %s
            """,
            (name_scenario, content_scenario, id_scenario)
        )
        db.commit()