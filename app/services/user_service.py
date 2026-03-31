from app.repositories.user_repo import get_users


def list_users(db):

    users = get_users(db=db)

    return users