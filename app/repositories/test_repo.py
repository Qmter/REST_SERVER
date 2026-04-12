def get_tests_preview_by_workspace(db, id_workspace):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT t.id_test, t.name_test
            FROM tests t
            JOIN scenarios s ON t.id_scenario = s.id_scenario
            WHERE s.id_workspace = %s
            """,
            (id_workspace,)
        )
        return cursor.fetchall()
    
def get_test_by_id(db, id_test):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT t.*, s.id_workspace
            FROM tests t
            JOIN scenarios s ON t.id_scenario = s.id_scenario
            WHERE t.id_test = %s
            """,
            (id_test,)
        )
        return cursor.fetchone()
    
def delete_test(db, id_test):
    with db.cursor() as cursor:
        cursor.execute(
            "DELETE FROM tests WHERE id_test = %s",
            (id_test,)
        )
        db.commit()

def create_test(db, id_scenario, name_test, content_test, last_seed):
    with db.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO tests (id_scenario, name_test, content_test, last_seed)
            VALUES (%s, %s, %s, %s)
            """,
            (id_scenario, name_test, content_test, last_seed)
        )

        db.commit()
        return cursor.lastrowid
    

def get_test_by_id_scenario(db, id_scenario):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT * FROM tests WHERE id_scenario = %s
            """,
            (id_scenario,)
            )
        return cursor.fetchone()
    

def update_test(db, id_scenario, content_test):
    with db.cursor() as cursor:
        cursor.execute(
            """
            UPDATE tests
            SET content_test = %s
            WHERE id_scenario = %s
            """,
            (content_test, id_scenario)
        )
        db.commit()
        return cursor.rowcount
