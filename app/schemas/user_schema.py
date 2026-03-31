from pydantic import BaseModel


class UserResponse(BaseModel):

    id_user: int
    username: str
    email: str | None