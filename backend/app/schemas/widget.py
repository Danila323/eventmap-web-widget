"""
Схемы виджета (Pydantic).
"""
from datetime import datetime
from typing import Optional, Literal, List
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, field_serializer, computed_field


class WidgetConfigBase(BaseModel):
    """Базовая схема конфигурации виджета."""

    title: str = Field(..., min_length=1, max_length=255)
    width: str = Field("100%", max_length=50)
    height: str = Field("400px", max_length=50)
    primary_color: str = Field("#007bff", pattern=r"^#[0-9A-Fa-f]{6}$")
    marker_color: str = Field("#ff0000", pattern=r"^#[0-9A-Fa-f]{6}$")
    default_period: Literal["today", "tomorrow", "week", "all"] = "all"
    show_search: bool = True
    show_filters: bool = True
    show_categories: bool = True
    auto_refresh: bool = False
    zoom_level: int = Field(10, ge=1, le=23)
    center_lat: Optional[float] = Field(None, ge=-90, le=90)
    center_lon: Optional[float] = Field(None, ge=-180, le=180)


class WidgetConfigCreate(WidgetConfigBase):
    """Схема для создания конфигурации виджета."""

    api_key_id: str
    event_ids: Optional[List[str]] = Field(None, description="Список ID событий для отображения в виджете")


class WidgetConfigUpdate(BaseModel):
    """Схема для обновления конфигурации виджета."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    width: Optional[str] = Field(None, max_length=50)
    height: Optional[str] = Field(None, max_length=50)
    primary_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    marker_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    default_period: Optional[Literal["today", "tomorrow", "week", "all"]] = None
    show_search: Optional[bool] = None
    show_filters: Optional[bool] = None
    show_categories: Optional[bool] = None
    auto_refresh: Optional[bool] = None
    zoom_level: Optional[int] = Field(None, ge=1, le=23)
    center_lat: Optional[float] = Field(None, ge=-90, le=90)
    center_lon: Optional[float] = Field(None, ge=-180, le=180)
    event_ids: Optional[List[str]] = Field(None, description="Список ID событий для отображения в виджете")


class WidgetConfigResponse(WidgetConfigBase):
    """Схема ответа с конфигурацией виджета."""

    id: str
    user_id: str
    api_key_id: str
    api_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    event_ids: List[str] = Field(default_factory=list, description="Список ID событий, связанных с виджетом")
    css: str = Field(default="", description="Сгенерированные CSS стили для виджета")


class WidgetEventResponse(BaseModel):
    """Схема события для публичного API виджета."""

    id: str
    title: str
    description: Optional[str] = None
    event_datetime: datetime
    longitude: float
    latitude: float
    category: Optional[str] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    image_url: Optional[HttpUrl] = None
    ticket_url: Optional[HttpUrl] = None


class WidgetDataResponse(BaseModel):
    """Схема ответа публичного API виджета."""

    config: WidgetConfigResponse
    events: list[WidgetEventResponse]
    total: int


class EmbedCodeRequest(BaseModel):
    """Запрос на генерацию embed кода."""

    widget_config_id: str
    custom_width: Optional[str] = None
    custom_height: Optional[str] = None


class EmbedCodeResponse(BaseModel):
    """Ответ с embed кодом."""

    script_url: str
    embed_code: str
    preview_url: Optional[str] = None
