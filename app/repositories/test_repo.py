def get_tests_preview_by_workspace(db, id_workspace):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT t.id_test,
                   t.name_test,
                   te.test_status AS last_status,
                   te.start_at   AS last_start
            FROM tests t
            JOIN scenarios s ON t.id_scenario = s.id_scenario
            LEFT JOIN (
                SELECT te1.*
                FROM tests_executions te1
                JOIN (
                    SELECT id_test, MAX(start_at) AS max_start
                    FROM tests_executions
                    GROUP BY id_test
                ) tmax ON tmax.id_test = te1.id_test AND tmax.max_start = te1.start_at
            ) te ON te.id_test = t.id_test
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


def create_test_execution(db, id_test, id_user, status, failed_indexes, time_execution):
    with db.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO tests_executions 
            (id_test, id_user, test_status, failed_indexes, time_execution, start_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (id_test, id_user, status, failed_indexes, time_execution)
        )
        db.commit()
        return cursor.lastrowid


def create_log_execution(db, id_test_execution, detail):
    with db.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO log_executions (id_test_execution, detail)
            VALUES (%s, %s)
            """,
            (id_test_execution, detail)
        )
        db.commit()
        return cursor.lastrowid


def get_test_executions_by_test(db, id_test, limit=20):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_test_execution, id_test, id_user, test_status, failed_indexes, time_execution, start_at
            FROM tests_executions
            WHERE id_test = %s
            ORDER BY start_at DESC
            LIMIT %s
            """,
            (id_test, limit)
        )
        return cursor.fetchall()


def get_test_execution(db, id_test_execution):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT te.*, t.id_scenario, s.id_workspace
            FROM tests_executions te
            JOIN tests t ON te.id_test = t.id_test
            JOIN scenarios s ON t.id_scenario = s.id_scenario
            WHERE te.id_test_execution = %s
            """,
            (id_test_execution,)
        )
        return cursor.fetchone()


def get_log_execution(db, id_test_execution):
    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT detail
            FROM log_executions
            WHERE id_test_execution = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (id_test_execution,)
        )
        return cursor.fetchone()


def delete_test_execution_with_logs(db, id_test_execution):
    with db.cursor() as cursor:
        cursor.execute(
            """
            DELETE FROM log_executions
            WHERE id_test_execution = %s
            """,
            (id_test_execution,)
        )
        deleted_logs = cursor.rowcount

        cursor.execute(
            """
            DELETE FROM tests_executions
            WHERE id_test_execution = %s
            """,
            (id_test_execution,)
        )
        deleted_executions = cursor.rowcount

        db.commit()
        return {
            "deleted_logs": deleted_logs,
            "deleted_executions": deleted_executions
        }


def delete_test_executions_with_logs_by_test(db, id_test):
    with db.cursor() as cursor:
        cursor.execute(
            """
            DELETE FROM log_executions
            WHERE id_test_execution IN (
                SELECT id_test_execution
                FROM tests_executions
                WHERE id_test = %s
            )
            """,
            (id_test,)
        )
        deleted_logs = cursor.rowcount

        cursor.execute(
            """
            DELETE FROM tests_executions
            WHERE id_test = %s
            """,
            (id_test,)
        )
        deleted_executions = cursor.rowcount

        db.commit()
        return {
            "deleted_logs": deleted_logs,
            "deleted_executions": deleted_executions
        }
