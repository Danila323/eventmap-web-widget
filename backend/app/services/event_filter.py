"""
Сервис фильтрации событий.
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event


class EventFilterService:
    """Сервис для фильтрации событий."""

    @staticmethod
    def get_today_start() -> datetime:
        """Получить начало сегодняшнего дня."""
        return datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    @staticmethod
    def get_today_end() -> datetime:
        """Получить конец сегодняшнего дня."""
        return EventFilterService.get_today_start() + timedelta(days=1)

    @staticmethod
    def get_tomorrow_start() -> datetime:
        """Получить начало завтрашнего дня."""
        return EventFilterService.get_today_start() + timedelta(days=1)

    @staticmethod
    def get_tomorrow_end() -> datetime:
        """Получить конец завтрашнего дня."""
        return EventFilterService.get_tomorrow_start() + timedelta(days=1)

    @staticmethod
    def get_week_end() -> datetime:
        """Получить конец недели (7 дней от сегодня)."""
        return EventFilterService.get_today_start() + timedelta(days=7)

    @staticmethod
    def get_month_end() -> datetime:
        """Получить конец месяца (30 дней от сегодня)."""
        return EventFilterService.get_today_start() + timedelta(days=30)

    @staticmethod
    def apply_period_filter(query, period: Optional[str] = None):
        """
        Применить фильтр по периоду времени.

        Args:
            query: SQLAlchemy query
            period: Период (today, tomorrow, week, month, all)

        Returns:
            Query с примененным фильтром
        """
        now = datetime.now()

        if period == "today":
            return query.filter(
                and_(
                    Event.event_datetime >= EventFilterService.get_today_start(),
                    Event.event_datetime < EventFilterService.get_today_end(),
                )
            )
        elif period == "tomorrow":
            return query.filter(
                and_(
                    Event.event_datetime >= EventFilterService.get_tomorrow_start(),
                    Event.event_datetime < EventFilterService.get_tomorrow_end(),
                )
            )
        elif period == "week":
            return query.filter(
                and_(
                    Event.event_datetime >= EventFilterService.get_today_start(),
                    Event.event_datetime < EventFilterService.get_week_end(),
                )
            )
        elif period == "month":
            return query.filter(
                and_(
                    Event.event_datetime >= EventFilterService.get_today_start(),
                    Event.event_datetime < EventFilterService.get_month_end(),
                )
            )
        # Для "all" или None не применяем фильтр по времени
        return query

    @staticmethod
    def apply_category_filter(query, category: Optional[str] = None):
        """
        Применить фильтр по категории.

        Args:
            query: SQLAlchemy query
            category: Категория события

        Returns:
            Query с примененным фильтром
        """
        if category:
            return query.filter(Event.category == category)
        return query

    @staticmethod
    def apply_search_filter(query, search: Optional[str] = None):
        """
        Применить поисковый фильтр.

        Args:
            query: SQLAlchemy query
            search: Строка поиска (ищет в названии и описании)

        Returns:
            Query с примененным фильтром
        """
        if search:
            search_pattern = f"%{search}%"
            return query.filter(
                or_(
                    Event.title.ilike(search_pattern),
                    Event.description.ilike(search_pattern),
                )
            )
        return query

    @staticmethod
    def apply_published_filter(query, only_published: bool = True):
        """
        Применить фильтр по статусу публикации.

        Args:
            query: SQLAlchemy query
            only_published: Только опубликованные события

        Returns:
            Query с примененным фильтром
        """
        if only_published:
            return query.filter(Event.is_published == True)
        return query

    @staticmethod
    def apply_user_filter(query, user_id: str):
        """
        Применить фильтр по пользователю (только события пользователя).

        Args:
            query: SQLAlchemy query
            user_id: ID пользователя

        Returns:
            Query с примененным фильтром
        """
        return query.filter(Event.user_id == user_id)

    @staticmethod
    def apply_date_range_filter(
        query,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ):
        """
        Применить фильтр по диапазону дат.

        Args:
            query: SQLAlchemy query
            date_from: Начальная дата
            date_to: Конечная дата

        Returns:
            Query с примененным фильтром
        """
        if date_from:
            query = query.filter(Event.event_datetime >= date_from)
        if date_to:
            query = query.filter(Event.event_datetime <= date_to)
        return query
