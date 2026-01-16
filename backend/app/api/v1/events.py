"""
API эндпоинты управления событиями.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.event import Event
from app.models.widget_config import WidgetConfig
from app.models.event_widget import EventWidget
from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
)
from app.api.dependencies.auth import get_current_active_user
from app.services.event_filter import EventFilterService

router = APIRouter()


async def get_event_widget_ids(event: Event) -> list[str]:
    """Получить список ID виджетов для события."""
    return [str(widget.id) for widget in event.widgets]


async def set_event_widgets(event: Event, widget_ids: list[str], db: AsyncSession):
    """Установить виджеты для события."""
    # Удаляем старые связи
    await db.execute(
        select(EventWidget).where(EventWidget.event_id == event.id)
    )
    # Используем delete для связей
    from sqlalchemy import delete
    await db.execute(
        delete(EventWidget).where(EventWidget.event_id == event.id)
    )

    # Добавляем новые связи
    for widget_id in widget_ids:
        # Проверяем, что виджет принадлежит пользователю
        result = await db.execute(
            select(WidgetConfig).where(
                WidgetConfig.id == widget_id,
                WidgetConfig.user_id == event.user_id,
            )
        )
        widget = result.scalar_one_or_none()
        if widget:
            event_widget = EventWidget(event_id=event.id, widget_id=widget_id)
            db.add(event_widget)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Создать новое событие.

    Требует JWT токен в заголовке Authorization.
    """
    # Извлекаем widget_ids из данных
    widget_ids = event_data.widget_ids or []
    event_dict = event_data.model_dump(exclude={'widget_ids'})

    new_event = Event(
        **event_dict,
        user_id=current_user.id,
    )

    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)

    # Устанавливаем связи с виджетами
    if widget_ids:
        await set_event_widgets(new_event, widget_ids, db)
        await db.commit()
        await db.refresh(new_event)

    # Формируем ответ
    return {
        "id": str(new_event.id),
        "user_id": str(new_event.user_id),
        "widget_ids": widget_ids,
        "title": new_event.title,
        "description": new_event.description,
        "event_datetime": new_event.event_datetime,
        "longitude": new_event.longitude,
        "latitude": new_event.latitude,
        "category": new_event.category,
        "venue_name": new_event.venue_name,
        "venue_address": new_event.venue_address,
        "image_url": new_event.image_url,
        "ticket_url": new_event.ticket_url,
        "is_published": new_event.is_published,
        "created_at": new_event.created_at,
        "updated_at": new_event.updated_at,
    }


@router.get("", response_model=EventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    category: Optional[str] = None,
    search: Optional[str] = None,
    period: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    only_published: bool = False,
    widget_id: Optional[str] = Query(None, description="Фильтр по виджету"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить список событий текущего пользователя с пагинацией и фильтрацией.

    - **page**: Номер страницы (по умолчанию 1)
    - **page_size**: Количество элементов на странице (по умолчанию 20, максимум 1000)
    - **category**: Фильтр по категории
    - **search**: Поиск по названию и описанию
    - **period**: Период (today, tomorrow, week, month, all)
    - **date_from**: Начальная дата для фильтрации
    - **date_to**: Конечная дата для фильтрации
    - **only_published**: Только опубликованные события
    - **widget_id**: Фильтр по ID виджета
    """
    # Базовый запрос - только события пользователя
    query = select(Event).options(selectinload(Event.widgets))

    # Фильтр по виджету
    if widget_id:
        # Подзапрос для получения событий, связанных с виджетом
        from sqlalchemy import join
        query = query.join(EventWidget, Event.id == EventWidget.event_id).where(
            EventWidget.widget_id == widget_id
        )

    query = query.where(Event.user_id == current_user.id)

    # Применяем фильтры
    query = EventFilterService.apply_user_filter(query, str(current_user.id))

    if period:
        query = EventFilterService.apply_period_filter(query, period)

    if date_from or date_to:
        query = EventFilterService.apply_date_range_filter(query, date_from, date_to)

    if category:
        query = EventFilterService.apply_category_filter(query, category)

    if search:
        query = EventFilterService.apply_search_filter(query, search)

    if only_published:
        query = EventFilterService.apply_published_filter(query, True)

    # Сортировка по дате события (ближайшие сначала)
    query = query.order_by(Event.event_datetime)

    # Получаем общее количество
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Применяем пагинацию
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Выполняем запрос
    result = await db.execute(query)
    events = result.scalars().all()

    # Формируем ответ с widget_ids
    items = []
    for event in events:
        items.append({
            "id": str(event.id),
            "user_id": str(event.user_id),
            "widget_ids": [str(w.id) for w in event.widgets],
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
            "is_published": event.is_published,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
        })

    return EventListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить событие по ID.

    Требует JWT токен. Пользователь может получить только свои события.
    """
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.widgets))
        .where(
            Event.id == event_id,
            Event.user_id == current_user.id,
        )
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return {
        "id": str(event.id),
        "user_id": str(event.user_id),
        "widget_ids": [str(w.id) for w in event.widgets],
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
        "is_published": event.is_published,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
    }


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Обновить событие.

    Требует JWT токен. Пользователь может обновлять только свои события.
    """
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.widgets))
        .where(
            Event.id == event_id,
            Event.user_id == current_user.id,
        )
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Обновляем только предоставленные поля
    update_data = event_data.model_dump(exclude_unset=True, exclude={'widget_ids'})
    for field, value in update_data.items():
        setattr(event, field, value)

    # Обновляем widget_ids если предоставлены
    widget_ids = event_data.model_dump(exclude_unset=True).get('widget_ids')
    if widget_ids is not None:
        await set_event_widgets(event, widget_ids, db)

    event.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(event)

    return {
        "id": str(event.id),
        "user_id": str(event.user_id),
        "widget_ids": widget_ids if widget_ids is not None else [str(w.id) for w in event.widgets],
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
        "is_published": event.is_published,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
    }


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Удалить событие.

    Требует JWT токен. Пользователь может удалять только свои события.
    """
    result = await db.execute(
        select(Event).where(
            Event.id == event_id,
            Event.user_id == current_user.id,
        )
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    await db.delete(event)
    await db.commit()
