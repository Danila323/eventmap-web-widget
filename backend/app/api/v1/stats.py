"""
API эндпоинт для получения статистики пользователя.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.user import User
from app.models.event import Event
from app.models.widget_config import WidgetConfig
from app.models.api_key import ApiKey
from app.api.dependencies.auth import get_current_active_user

router = APIRouter()


@router.get("")
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить статистику пользователя.

    Возвращает количество:
    - событий (всего и опубликованных)
    - виджетов
    - API ключей
    """
    # Подсчитываем количество событий
    events_result = await db.execute(
        select(func.count(Event.id)).where(Event.user_id == current_user.id)
    )
    total_events = events_result.scalar() or 0

    # Подсчитываем опубликованные события
    published_events_result = await db.execute(
        select(func.count(Event.id)).where(
            Event.user_id == current_user.id,
            Event.is_published == True
        )
    )
    published_events = published_events_result.scalar() or 0

    # Подсчитываем количество виджетов
    widgets_result = await db.execute(
        select(func.count(WidgetConfig.id)).where(WidgetConfig.user_id == current_user.id)
    )
    total_widgets = widgets_result.scalar() or 0

    # Подсчитываем количество API ключей
    api_keys_result = await db.execute(
        select(func.count(ApiKey.id)).where(ApiKey.user_id == current_user.id)
    )
    total_api_keys = api_keys_result.scalar() or 0

    return {
        "events": {
            "total": total_events,
            "published": published_events,
        },
        "widgets": total_widgets,
        "api_keys": total_api_keys,
    }
