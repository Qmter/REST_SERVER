from fastapi import APIRouter, Depends

from app.services.user_service import list_users
from app.schemas.user_schema import UserResponse
from app.core.dependencies import get_current_user
from app.db.database import get_db


router = APIRouter()


@router.get("/", response_model=list[UserResponse], description="Get all users")
def get_users(db = Depends(get_db)):

    return list_users(db=db)


@router.get("/me", description="Security endpoint used access-token")
def get_me(user = Depends(get_current_user)):
    return user