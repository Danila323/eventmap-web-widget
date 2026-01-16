"""
Публичные API эндпоинты для конфигурации виджета.
Не требуют аутентификации, используются виджетом и админской панелью.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import get_settings

settings = get_settings()

router = APIRouter()


class YandexMapsKeyResponse(BaseModel):
    """Ответ с API ключом Яндекс Карт."""
    api_key: str


@router.get("/yandex-maps-key", response_model=YandexMapsKeyResponse)
async def get_yandex_maps_key():
    """
    Получить API ключ Яндекс Карт для использования в виджете.

    Публичный endpoint, не требует аутентификации.
    API ключ используется для загрузки Яндекс Карт на стороне клиента.
    """
    if not settings.YANDEX_MAPS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Yandex Maps API key not configured",
        )

    return YandexMapsKeyResponse(api_key=settings.YANDEX_MAPS_API_KEY)
