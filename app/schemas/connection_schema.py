from pydantic import BaseModel, Field, model_validator


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

    @model_validator(mode="after")
    def validate_basic(self):
        if self.id_auth_type == 1:
            if not self.auth_data or not self.auth_data.username or not self.auth_data.password:
                raise ValueError("Для Basic укажите username и password")
        return self

class ConnectionModify(BaseModel):

    id_auth_type: int = Field(ge=1)
    base_url: str

    auth_data: AuthData

    @model_validator(mode="after")
    def validate_basic(self):
        if self.id_auth_type == 1:
            if not self.auth_data or not self.auth_data.username or not self.auth_data.password:
                raise ValueError("Для Basic укажите username и password")
        return self



class ConnectionResponse(BaseModel):

    id_connection: int
    id_workspace: int
    id_auth_type: int
    base_url: str | None = None
    auth_data: dict | None = None


class OpenAPISchema(BaseModel):
    openapi_schema: dict
