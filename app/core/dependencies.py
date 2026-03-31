from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials

from app.repositories.user_repo import get_user_by_id
from app.db.database import get_db
from app.core.security import security, decode_token


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
):
    
    token = credentials.credentials

    id_user = decode_token(token=token)

    user = get_user_by_id(
        db=db,
        id_user=id_user
        )

    return user