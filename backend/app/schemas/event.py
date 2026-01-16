"""
Схемы событий (Pydantic).
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, field_serializer, field_validator


class EventBase(BaseModel):
    """Базовая схема события."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    event_datetime: datetime
    longitude: float = Field(..., ge=-180, le=180)
    latitude: float = Field(..., ge=-90, le=90)
    category: Optional[str] = Field(None, max_length=100)
    venue_name: Optional[str] = Field(None, max_length=255)
    venue_address: Optional[str] = Field(None, max_length=500)
    image_url: Optional[HttpUrl] = None
    ticket_url: Optional[HttpUrl] = None
    is_published: bool = False

    @field_serializer('event_datetime')
    def serialize_event_datetime(self, value: datetime) -> datetime:
        # Убираем timezone для сохранения в БД (TIMESTAMP WITHOUT TIME ZONE)
        if value.tzinfo is not None:
            return value.replace(tzinfo=None)
        return value

    @field_validator('event_datetime')
    @classmethod
    def validate_event_datetime(cls, value: datetime) -> datetime:
        # Убираем timezone при получении из запроса
        if value.tzinfo is not None:
            return value.replace(tzinfo=None)
        return value


class EventCreate(EventBase):
    """Схема для создания события."""

    widget_ids: Optional[List[str]] = Field(default_factory=list, description="ID виджетов для отображения события")


class EventUpdate(BaseModel):
    """Схема для обновления события."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    event_datetime: Optional[datetime] = None
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    category: Optional[str] = Field(None, max_length=100)
    venue_name: Optional[str] = Field(None, max_length=255)
    venue_address: Optional[str] = Field(None, max_length=500)
    image_url: Optional[HttpUrl] = None
    ticket_url: Optional[HttpUrl] = None
    is_published: Optional[bool] = None
    widget_ids: Optional[List[str]] = Field(None, description="ID виджетов для отображения события")

    @field_serializer('event_datetime')
    def serialize_event_datetime(self, value: Optional[datetime]) -> Optional[datetime]:
        # Убираем timezone для сохранения в БД (TIMESTAMP WITHOUT TIME ZONE)
        if value is None:
            return None
        if value.tzinfo is not None:
            return value.replace(tzinfo=None)
        return value

    @field_validator('event_datetime')
    @classmethod
    def validate_event_datetime(cls, value: Optional[datetime]) -> Optional[datetime]:
        # Убираем timezone при получении из запроса
        if value is None:
            return None
        if value.tzinfo is not None:
            return value.replace(tzinfo=None)
        return value


class EventResponse(EventBase):
    """Схема ответа с данными события."""

    id: str
    user_id: str
    widget_ids: List[str] = Field(default_factory=list, description="ID виджетов, в которых отображается событие")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventListResponse(BaseModel):
    """Схема ответа со списком событий."""

    items: list[EventResponse]
    total: int
    page: int
    page_size: int


class GeocodeRequest(BaseModel):
    """Запрос на геокодирование."""

    address: str = Field(..., min_length=1, max_length=500)


class GeocodeResponse(BaseModel):
    """Ответ геокодирования."""

    longitude: float
    latitude: float
    formatted_address: str
