"""
Сервис геокодирования с использованием Yandex Maps API.
"""
from typing import Optional
import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.event import GeocodeResponse

settings = get_settings()


class YandexGeocoder:
    """Клиент для Yandex Maps Geocoder API."""

    GEOCODER_URL = "https://geocode-maps.yandex.ru/1.x/"

    @staticmethod
    async def geocode(address: str) -> GeocodeResponse:
        """
        Геокодировать адрес в координаты.

        Args:
            address: Адрес для геокодирования

        Returns:
            GeocodeResponse с координатами и форматированным адресом

        Raises:
            HTTPException: Если геокодирование не удалось
        """
        if not settings.YANDEX_MAPS_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Yandex Maps API key is not configured",
            )

        params = {
            "apikey": settings.YANDEX_MAPS_API_KEY,
            "geocode": address,
            "format": "json",
            "results": 1,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    YandexGeocoder.GEOCODER_URL,
                    params=params,
                    timeout=10.0,
                )
                response.raise_for_status()

                data = response.json()

                # Парсим ответ Yandex API
                feature_member = data.get("response", {}).get("GeoObjectCollection", {}).get("featureMember", [])

                if not feature_member:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Address not found: {address}",
                    )

                geo_object = feature_member[0].get("GeoObject", {})
                point = geo_object.get("Point", {}).get("pos", "")
                formatted_address = geo_object.get("metaDataProperty", {}).get("GeocoderMetaData", {}).get("text", address)

                # Yandex возвращает координаты в формате "longitude,latitude"
                if point:
                    longitude, latitude = point.split(" ")
                    return GeocodeResponse(
                        longitude=float(longitude),
                        latitude=float(latitude),
                        formatted_address=formatted_address,
                    )

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Could not parse coordinates for address: {address}",
                )

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Geocoding service unavailable: {str(e)}",
                )

    @staticmethod
    async def reverse_geocode(longitude: float, latitude: float) -> str:
        """
        Обратное геокодирование (координаты в адрес).

        Args:
            longitude: Долгота
            latitude: Широта

        Returns:
            Форматированный адрес

        Raises:
            HTTPException: Если геокодирование не удалось
        """
        if not settings.YANDEX_MAPS_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Yandex Maps API key is not configured",
            )

        params = {
            "apikey": settings.YANDEX_MAPS_API_KEY,
            "geocode": f"{longitude},{latitude}",
            "format": "json",
            "results": 1,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    YandexGeocoder.GEOCODER_URL,
                    params=params,
                    timeout=10.0,
                )
                response.raise_for_status()

                data = response.json()

                feature_member = data.get("response", {}).get("GeoObjectCollection", {}).get("featureMember", [])

                if not feature_member:
                    return f"{latitude}, {longitude}"

                geo_object = feature_member[0].get("GeoObject", {})
                formatted_address = geo_object.get("metaDataProperty", {}).get("GeocoderMetaData", {}).get("text", "")

                return formatted_address or f"{latitude}, {longitude}"

            except httpx.HTTPError:
                return f"{latitude}, {longitude}"


# Создаем экземпляр сервиса
yandex_geocoder = YandexGeocoder()
