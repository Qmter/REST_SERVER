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
            "SELECT id_user, username, email, id_role FROM users WHERE id_user=%s",
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


def delete_user(db, user_id: int) -> bool:
    """
    Удаляет пользователя по ID.
    Возвращает True, если пользователь был найден и удален, иначе False.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        return False

    try:
        with db.cursor() as cursor:

            cursor.execute(
                """
                DELETE FROM users WHERE id_user = %s
                """,
                (user_id,))
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e


def update_user(db, user_id: int, username: str = None, email: str = None, password_hash: str = None, id_role: int = None) -> bool:
    """
    Обновляет данные пользователя по ID.
    Возвращает True, если пользователь был найден и обновлен, иначе False.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        return False

    try:
        updates = []
        values = []

        if username is not None:
            updates.append("username = %s")
            values.append(username)

        if email is not None:
            updates.append("email = %s")
            values.append(email)

        if password_hash is not None:
            updates.append("password_hash = %s")
            values.append(password_hash)

        if id_role is not None:
            updates.append("id_role = %s")
            values.append(id_role)

        if not updates:
            return True  # Нет полей для обновления

        values.append(user_id)

        with db.cursor() as cursor:
            sql = f"UPDATE users SET {', '.join(updates)} WHERE id_user = %s"
            cursor.execute(sql, tuple(values))

        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e