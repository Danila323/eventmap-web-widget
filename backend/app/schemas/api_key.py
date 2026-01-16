"""
Схемы API ключей (Pydantic).
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class ApiKeyBase(BaseModel):
    """Базовая схема API ключа."""

    name: Optional[str] = None
    allowed_domains: Optional[List[str]] = None


class ApiKeyCreate(ApiKeyBase):
    """Схема для создания API ключа."""

    pass


class ApiKeyUpdate(BaseModel):
    """Схема для обновления API ключа."""

    name: Optional[str] = None
    allowed_domains: Optional[List[str]] = None


class ApiKeyResponse(ApiKeyBase):
    """Схема ответа с данными API ключа."""

    id: UUID
    key: str
    usage_count: int = 0
    created_at: datetime
    last_used_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    @field_serializer('created_at')
    def serialize_created_at(self, value: datetime) -> str:
        """Конвертировать UTC в Moscow time для API ответа."""
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        moscow_tz = timezone(timedelta(hours=3))
        return value.astimezone(moscow_tz).isoformat()

    @field_serializer('last_used_at')
    def serialize_last_used_at(self, value: Optional[datetime]) -> Optional[str]:
        """Конвертировать UTC в Moscow time для API ответа."""
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        moscow_tz = timezone(timedelta(hours=3))
        return value.astimezone(moscow_tz).isoformat()
