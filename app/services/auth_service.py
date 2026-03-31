from fastapi import HTTPException

from app.repositories.user_repo import (
    get_user_by_username,
    create_user,
    get_user_by_email
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


def register_user(db, username, email, password, id_role):

    user = get_user_by_username(
        db=db, 
        username=username
        )

    if user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )
    
    existing_email = get_user_by_email(
        db=db,
        email=email
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    password_hash = hash_password(password=password)

    user_id = create_user(
        db=db,
        username=username,
        email=email,
        password_hash=password_hash,
        id_role=id_role
    )

    return user_id


def login_user(db, username, password):

    user = get_user_by_username(
        db=db, 
        username=username
        )
    
    print(user)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(data = {"id_user": user["id_user"]})

    return token
