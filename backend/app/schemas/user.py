"""
Схемы пользователя (Pydantic).
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_serializer


class UserBase(BaseModel):
    """Базовая схема пользователя."""

    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    """Схема для создания пользователя."""

    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Схема для входа пользователя."""

    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Схема ответа с данными пользователя."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)


class Token(BaseModel):
    """Схема JWT токена."""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Данные из токена."""

    user_id: Optional[str] = None
    email: Optional[str] = None
