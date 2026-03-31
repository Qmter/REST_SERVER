from pydantic import BaseModel, Field


class AuthData(BaseModel):
    username: str | None = None
    password: str | None = None

    token: str | None = None
    api_key: str | None = None

class ConnectionCreate(BaseModel):

    id_workspace: int
    id_auth_type: int = Field(ge=1)
    base_url: str


    auth_data: AuthData

class ConnectionModify(BaseModel):

    id_auth_type: int = Field(ge=1)
    base_url: str

    auth_data: AuthData



class ConnectionResponse(BaseModel):

    id_connection: int
    id_workspace: int
    id_auth_type: int
    base_url: str | None = None

