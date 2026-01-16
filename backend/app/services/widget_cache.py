"""
Сервис кэширования данных виджета в Redis.
"""
import json
import redis.asyncio as redis
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.models.api_key import ApiKey
from app.models.widget_config import WidgetConfig
from app.models.event import Event
from app.models.event_widget import EventWidget
from app.schemas.widget import WidgetEventResponse, WidgetDataResponse, WidgetConfigResponse

settings = get_settings()


class WidgetCacheService:
    """Сервис для кэширования данных виджета в Redis."""

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._redis: Optional[redis.Redis] = None

    async def get_redis(self) -> redis.Redis:
        """Получить или создать Redis клиент."""
        if not self._redis:
            self._redis = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    async def get_widget_data(self, widget_key: str) -> Optional[dict[str, Any]]:
        """
        Получить данные виджета из кэша.

        Args:
            widget_key: API ключ виджета

        Returns:
            Словарь с данными виджета или None если нет в кэше
        """
        try:
            r = await self.get_redis()
            cached = await r.get(f"widget:data:{widget_key}")
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None

    async def set_widget_data(
        self,
        widget_key: str,
        data: dict[str, Any],
        ttl: int = None,
    ) -> None:
        """
        Сохранить данные виджета в кэш.

        Args:
            widget_key: API ключ виджета
            data: Данные для кэширования
            ttl: Время жизни в секундах (по умолчанию из настроек)
        """
        try:
            r = await self.get_redis()
            ttl = ttl or settings.WIDGET_CACHE_TTL
            await r.setex(
                f"widget:data:{widget_key}",
                ttl,
                json.dumps(data, default=str),
            )
        except Exception:
            pass

    async def get_widget_config(self, widget_key: str) -> Optional[dict[str, Any]]:
        """
        Получить конфигурацию виджета из кэша.

        Args:
            widget_key: API ключ виджета

        Returns:
            Словарь с конфигурацией или None если нет в кэше
        """
        try:
            r = await self.get_redis()
            cached = await r.get(f"widget:config:{widget_key}")
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None

    async def set_widget_config(
        self,
        widget_key: str,
        config: dict[str, Any],
        ttl: int = None,
    ) -> None:
        """
        Сохранить конфигурацию виджета в кэш.

        Args:
            widget_key: API ключ виджета
            config: Конфигурация для кэширования
            ttl: Время жизни в секундах (по умолчанию из настроек)
        """
        try:
            r = await self.get_redis()
            ttl = ttl or settings.WIDGET_CONFIG_CACHE_TTL
            await r.setex(
                f"widget:config:{widget_key}",
                ttl,
                json.dumps(config, default=str),
            )
        except Exception:
            pass

    async def invalidate_widget(self, widget_key: str) -> None:
        """
        Инвалидировать кэш виджета.

        Удаляет все ключи кэша связанные с этим виджетом, включая ключи с параметрами фильтрации.

        Args:
            widget_key: API ключ виджета
        """
        try:
            r = await self.get_redis()
            # Удаляем конфиг
            await r.delete(f"widget:config:{widget_key}")

            # Удаляем все данные виджета (включая кэш с параметрами фильтрации)
            # Ищем все ключи по паттерну widget:data:{widget_key}:*
            pattern = f"widget:data:{widget_key}:*"
            keys = []
            async for key in r.scan_iter(match=pattern):
                keys.append(key)

            # Удаляем базовый ключ без параметров
            await r.delete(f"widget:data:{widget_key}")

            # Удаляем все найденные ключи с параметрами
            if keys:
                await r.delete(*keys)
        except Exception:
            pass

    async def invalidate_user_widgets(self, user_id: str) -> None:
        """
        Инвалидировать все кэши виджетов пользователя.

        Args:
            user_id: ID пользователя
        """
        # В продакшене можно добавить отслеживание ключей по пользователю
        # Сейчас просто пропускаем
        pass

    async def build_widget_data(
        self,
        db: AsyncSession,
        api_key: ApiKey,
        period: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Собрать данные виджета из базы данных.

        Args:
            db: Сессия базы данных
            api_key: API ключ
            period: Фильтр по периоду
            category: Фильтр по категории
            search: Поисковый запрос
            date_from: Начальная дата
            date_to: Конечная дата

        Returns:
            Словарь с данными виджета
        """
        from app.services.event_filter import EventFilterService

        # Получаем конфигурацию виджета
        config_result = await db.execute(
            select(WidgetConfig).where(WidgetConfig.api_key_id == api_key.id)
        )
        config = config_result.scalar_one_or_none()

        if not config:
            return None

        # Получаем только события, связанные с этим виджетом
        # Используем подзапрос для фильтрации по event_widgets
        from sqlalchemy import join
        query = select(Event).join(
            EventWidget, Event.id == EventWidget.event_id
        ).where(
            EventWidget.widget_id == config.id
        )

        # Применяем фильтры
        if period:
            query = EventFilterService.apply_period_filter(query, period)

        if category:
            query = EventFilterService.apply_category_filter(query, category)

        if search:
            query = EventFilterService.apply_search_filter(query, search)

        # Только опубликованные события для публичного API
        query = EventFilterService.apply_published_filter(query, True)

        # Сортировка по дате
        query = query.order_by(Event.event_datetime)

        # Выполняем запрос
        result = await db.execute(query)
        events = result.scalars().all()

        # Формируем ответ - вручную мапим данные
        config_data = {
            "id": str(config.id),
            "user_id": str(config.user_id),
            "api_key_id": str(config.api_key_id),
            "title": config.title,
            "width": config.width,
            "height": config.height,
            "primary_color": config.primary_color,
            "marker_color": config.marker_color,
            "default_period": config.default_period,
            "show_search": config.show_search,
            "show_filters": config.show_filters,
            "show_categories": config.show_categories,
            "auto_refresh": config.auto_refresh,
            "zoom_level": config.zoom_level,
            "center_lat": config.center_lat,
            "center_lon": config.center_lon,
            "created_at": config.created_at,
            "updated_at": config.updated_at,
        }

        events_data = []
        for event in events:
            events_data.append({
                "id": str(event.id),
                "title": event.title,
                "description": event.description,
                "event_datetime": event.event_datetime,
                "longitude": event.longitude,
                "latitude": event.latitude,
                "category": event.category,
                "venue_name": event.venue_name,
                "venue_address": event.venue_address,
                "image_url": event.image_url,
                "ticket_url": event.ticket_url,
            })

        return {
            "config": config_data,
            "events": events_data,
            "total": len(events),
        }

    async def close(self) -> None:
        """Закрыть соединение с Redis."""
        if self._redis:
            await self._redis.close()


# Глобальный экземпляр сервиса
def get_widget_cache_service() -> WidgetCacheService:
    """Получить экземпляр сервиса кэширования."""
    return WidgetCacheService(settings.REDIS_URL)
