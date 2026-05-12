from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class AdminUserResponse(BaseModel):
    id_user: int
    username: str
    email: Optional[str]
    id_role: int
    created_at: datetime


class AdminWorkspaceResponse(BaseModel):
    id_workspace: int
    name_workspace: str
    description: Optional[str]
    created_at: datetime


class AdminLogResponse(BaseModel):
    id_log: int
    object_id: Optional[int]
    object_type: Optional[str]
    action: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    log_date: datetime


class AdminLogExecutionResponse(BaseModel):
    id_log_exec: int
    id_test_execution: int
    detail: Optional[str]
    created_at: datetime

class MessageResponse(BaseModel):
    message: str

class UserDeleteResponse(BaseModel):
    id_user: int
    message: str