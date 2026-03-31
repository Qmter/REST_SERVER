from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    PROJECT_NAME: str

    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int
    SECRET_KEY: str

    class Config:
        env_file = ".env"


settings = Settings()