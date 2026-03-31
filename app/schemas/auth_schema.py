from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):

    username: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    id_role: int = Field(ge=1)


class LoginRequest(BaseModel):

    username: str
    password: str


class TokenResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"