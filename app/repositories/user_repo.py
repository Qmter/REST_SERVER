def get_users(db):

    with db.cursor() as cursor:

        cursor.execute(
            "SELECT id_user, username, email, id_role FROM users"
        )

        result = cursor.fetchall()

    return result


def get_user_by_username(db, username: str):

    with db.cursor() as cursor:

        cursor.execute(
            "SELECT * FROM users WHERE username=%s",
            (username,)
        )

        return cursor.fetchone()
    
def get_user_by_email(db, email: str):

    with db.cursor() as cursor:

        cursor.execute(
            "SELECT * FROM users WHERE email=%s",
            (email,)
        )

        return cursor.fetchone()


def get_user_by_id(db, id_user: int):


    with db.cursor() as cursor:

        cursor.execute(
            "SELECT id_user, username, email FROM users WHERE id_user=%s",
            (id_user,)
        )

        return cursor.fetchone()


def create_user(db, username, email, password_hash, id_role):

    with db.cursor() as cursor:

        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, id_role)
            VALUES (%s,%s,%s, %s)
            """,
            (username, email, password_hash, id_role)
        )

        db.commit()
        return cursor.lastrowid