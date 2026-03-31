from fastapi import APIRouter, Depends
from app.db.database import get_db


from app.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    TokenResponse
)

from app.services.auth_service import (
    register_user,
    login_user
)


router = APIRouter()


@router.post("/register", description="Register users")
def register(data: RegisterRequest, db=Depends(get_db)):

    id_user = register_user(
        db=db,
        username=data.username,
        email=data.email,
        password=data.password,
        id_role=data.id_role
    )

    return {"id_user": id_user}


@router.post("/login", response_model=TokenResponse, description="Login")
def login(data: LoginRequest, db = Depends(get_db)):

    token = login_user(
        db=db,
        username=data.username,
        password=data.password
    )

    return {"access_token": token}