from fastapi import HTTPException
import requests
from app.core.config import settings


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


# Интеграция  
def integration_register_service(db, username, password):
    try:
        # Authorization Credentials
        data = {
            "username": username,
            "password": password
        }

        # Запрос на сервер интеграции (исправлена опечатка в URL)
        response = requests.post(
            settings.INTEGRATION_HOST + '/login/integration',
            json=data,
            timeout=5.0 
        )
        
        # Обработка специфичных статус-кодов
        if response.status_code == 401:
            raise HTTPException(status_code=404, detail="User not found")
        elif response.status_code == 403:
            raise HTTPException(status_code=403, detail="Access denied to integration service")
        elif 400 <= response.status_code < 500:
            # Клиентские ошибки
            try:
                error_detail = response.json().get("detail", "Unknown client error")
            except:
                error_detail = "Unknown client error"
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Integration service client error: {error_detail}"
            )
        
        # Проверяем успешный статус (все 2xx)
        if 200 <= response.status_code < 300:
            try:
                data = response.json()
                user_data = data.get("user")

                if not user_data:
                    raise HTTPException(status_code=500, detail="Invalid response format from integration service")

                roles_dicts = {
                    "operator": 2,
                    "user": 2,
                    "admin": 1
                }

                username_int = user_data.get("username")
                role_int = user_data.get("role")
                
                # Проверяем наличие обязательных полей
                if not username_int or not role_int:
                    raise HTTPException(
                        status_code=500, 
                        detail="Missing required fields in user data"
                    )
                
                # Проверяем корректность роли
                if role_int not in roles_dicts:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Invalid role: {role_int}. Expected one of: {', '.join(list(roles_dicts.keys()))}"
                    )
                
                email_int = f"{username_int}@istokmw.ru"
                role_id_int = roles_dicts[role_int]

                register_data = register_user(
                    db=db, 
                    username=username_int, 
                    password=password,
                    email=email_int,
                    id_role=role_id_int
                )
                
                return register_data
            except ValueError:
                raise HTTPException(
                    status_code=500, 
                    detail="Invalid JSON response from integration service"
                )
        else:
            # Обработка других статус-кодов (3xx, 5xx)
            raise HTTPException(
                status_code=502,
                detail=f"Unexpected status code from integration service: {response.status_code}"
            )
                
    except HTTPException:
        raise
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Integration service timed out"
        )
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to integration service"
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Request error: {str(e)}"
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
