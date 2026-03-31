from fastapi import FastAPI

from app.api import users
from app.api import auth
from app.api import workspaces
from app.api import connections

from app.core.config import settings


app = FastAPI(
    title=settings.PROJECT_NAME
)

app.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)


app.include_router(
    workspaces.router,
    prefix="/workspaces",
    tags=["workspaces"]
)


app.include_router(
    connections.router,
    prefix="/connections",
    tags=["connections"]
)