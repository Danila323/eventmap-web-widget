"""
API эндпоинт геокодирования.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.event import GeocodeRequest, GeocodeResponse
from app.api.dependencies.auth import get_current_active_user
from app.services.geocoder import yandex_geocoder

router = APIRouter()


@router.post("", response_model=GeocodeResponse)
async def geocode_address(
    request: GeocodeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Геокодировать адрес в координаты.

    - **address**: Адрес для геокодирования

    Возвращает координаты (широта, долгота) и форматированный адрес.

    Требует JWT токен в заголовке Authorization.
    """
    try:
        result = await yandex_geocoder.geocode(request.address)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Geocoding failed: {str(e)}",
        )


@router.get("/reverse", response_model=dict[str, str])
async def reverse_geocode(
    longitude: float,
    latitude: float,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Обратное геокодирование (координаты в адрес).

    - **longitude**: Долгота
    - **latitude**: Широта

    Возвращает форматированный адрес.

    Требует JWT токен в заголовке Authorization.
    """
    try:
        address = await yandex_geocoder.reverse_geocode(longitude, latitude)
        return {"address": address}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reverse geocoding failed: {str(e)}",
        )
