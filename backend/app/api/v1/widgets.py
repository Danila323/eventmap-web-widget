"""
API эндпоинты управления конфигурациями виджета.
Требуют аутентификации.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.api_key import ApiKey
from app.models.widget_config import WidgetConfig
from app.models.event import Event
from app.models.event_widget import EventWidget
from app.schemas.widget import (
    WidgetConfigCreate,
    WidgetConfigUpdate,
    WidgetConfigResponse,
)
from app.schemas.api_key import ApiKeyResponse
from app.api.dependencies.auth import get_current_active_user
from app.services.widget_cache import get_widget_cache_service
from app.core.security import generate_api_key

router = APIRouter()
cache_service = get_widget_cache_service()


@router.post("", response_model=WidgetConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_widget_config(
    config_data: WidgetConfigCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Создать новую конфигурацию виджета.

    Требует JWT токен в заголовке Authorization.

    - **api_key_id**: ID существующего API ключа
    - **title**: Название виджета
    - **width, height**: Размеры виджета
    - **primary_color, marker_color**: Цвета
    - **default_period**: Период по умолчанию
    - **event_ids**: Опциональный список ID событий для отображения
    """
    # Проверяем существование API ключа
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.id == config_data.api_key_id,
            ApiKey.user_id == current_user.id,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found or doesn't belong to you",
        )

    # Проверяем события, если они указаны
    event_ids = config_data.event_ids or []
    events = []
    if event_ids:
        result = await db.execute(
            select(Event).where(
                Event.id.in_(event_ids),
                Event.user_id == current_user.id,
            )
        )
        events = result.scalars().all()

        if len(events) != len(event_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some events not found or don't belong to you",
            )

    # Создаем конфигурацию
    config_dict = config_data.model_dump(exclude={'event_ids'})
    new_config = WidgetConfig(
        **config_dict,
        user_id=current_user.id,
    )

    db.add(new_config)
    await db.flush()

    # Добавляем связи с событиями напрямую через EventWidget
    for event in events:
        event_widget = EventWidget(
            event_id=event.id,
            widget_id=new_config.id,
        )
        db.add(event_widget)

    # Публикуем события, добавленные в виджет
    for event in events:
        if not event.is_published:
            event.is_published = True

    await db.commit()

    # Вручную мапим в схему ответа - используем уже загруженные события
    return {
        "id": str(new_config.id),
        "user_id": str(new_config.user_id),
        "api_key_id": str(new_config.api_key_id),
        "api_key": api_key.key,
        "title": new_config.title,
        "width": new_config.width,
        "height": new_config.height,
        "primary_color": new_config.primary_color,
        "marker_color": new_config.marker_color,
        "default_period": new_config.default_period,
        "show_search": new_config.show_search,
        "show_filters": new_config.show_filters,
        "show_categories": new_config.show_categories,
        "auto_refresh": new_config.auto_refresh,
        "zoom_level": new_config.zoom_level,
        "center_lat": new_config.center_lat,
        "center_lon": new_config.center_lon,
        "created_at": new_config.created_at,
        "updated_at": new_config.updated_at,
        "event_ids": [str(e.id) for e in events],
    }


@router.get("", response_model=list[WidgetConfigResponse])
async def list_widget_configs(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить список всех конфигураций виджета пользователя.

    Требует JWT токен в заголовке Authorization.
    """
    result = await db.execute(
        select(WidgetConfig)
        .options(selectinload(WidgetConfig.api_key), selectinload(WidgetConfig.events))
        .where(WidgetConfig.user_id == current_user.id)
        .order_by(WidgetConfig.created_at.desc())
    )
    configs = result.scalars().all()

    # Вручную мапим в схему ответа
    response_data = []
    for config in configs:
        response_data.append({
            "id": str(config.id),
            "user_id": str(config.user_id),
            "api_key_id": str(config.api_key_id),
            "api_key": config.api_key.key if config.api_key else None,
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
            "event_ids": [str(e.id) for e in config.events],
        })

    return response_data


@router.get("/{config_id}", response_model=WidgetConfigResponse)
async def get_widget_config(
    config_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить конфигурацию виджета по ID.

    Требует JWT токен. Пользователь может получить только свои конфигурации.
    """
    result = await db.execute(
        select(WidgetConfig)
        .options(selectinload(WidgetConfig.api_key), selectinload(WidgetConfig.events))
        .where(
            WidgetConfig.id == config_id,
            WidgetConfig.user_id == current_user.id,
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget config not found",
        )

    # Вручную мапим в схему ответа
    return {
        "id": str(config.id),
        "user_id": str(config.user_id),
        "api_key_id": str(config.api_key_id),
        "api_key": config.api_key.key if config.api_key else None,
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
        "event_ids": [str(e.id) for e in config.events],
    }


@router.put("/{config_id}", response_model=WidgetConfigResponse)
async def update_widget_config(
    config_id: str,
    config_data: WidgetConfigUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Обновить конфигурацию виджета.

    Требует JWT токен. Пользователь может обновлять только свои конфигурации.
    """
    result = await db.execute(
        select(WidgetConfig)
        .options(selectinload(WidgetConfig.api_key), selectinload(WidgetConfig.events))
        .where(
            WidgetConfig.id == config_id,
            WidgetConfig.user_id == current_user.id,
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget config not found",
        )

    # Обновляем связи с событиями, если они указаны
    update_data = config_data.model_dump(exclude_unset=True)
    event_ids = update_data.pop('event_ids', None)

    # Логируем для отладки
    print(f"DEBUG: update_data keys = {list(update_data.keys())}")
    print(f"DEBUG: event_ids = {event_ids}")
    print(f"DEBUG: config_data.model_dump(exclude_unset=False).get('event_ids') = {config_data.model_dump(exclude_unset=False).get('event_ids')}")

    # Обновляем только предоставленные поля
    for field, value in update_data.items():
        setattr(config, field, value)

    # Обновляем события, если указаны
    if event_ids is not None:
        # Получаем старые связи для проверки
        result = await db.execute(
            select(EventWidget).where(EventWidget.widget_id == config.id)
        )
        old_links = result.scalars().all()
        old_event_ids = [link.event_id for link in old_links]

        # Удаляем старые связи напрямую через EventWidget
        for link in old_links:
            await db.delete(link)

        # Добавляем новые связи напрямую через EventWidget
        if event_ids:
            result = await db.execute(
                select(Event).where(
                    Event.id.in_(event_ids),
                    Event.user_id == current_user.id,
                )
            )
            events = result.scalars().all()

            if len(events) != len(event_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Some events not found or don't belong to you",
                )

            for event in events:
                event_widget = EventWidget(
                    event_id=event.id,
                    widget_id=config.id,
                )
                db.add(event_widget)

            # Публикуем события, добавленные в виджет
            for event in events:
                if not event.is_published:
                    event.is_published = True

        # Проверяем события, которые были удалены из виджета
        # Если событие больше не привязано ни к одному виджету - скрываем его
        for old_event_id in old_event_ids:
            if old_event_id not in event_ids:
                # Проверяем, есть ли этот event в других виджетах
                result = await db.execute(
                    select(EventWidget).where(EventWidget.event_id == old_event_id)
                )
                other_links = result.scalars().all()
                if not other_links:
                    # Событие больше не привязано ни к одному виджету - скрываем
                    result = await db.execute(
                        select(Event).where(Event.id == old_event_id)
                    )
                    event = result.scalar_one_or_none()
                    if event:
                        event.is_published = False

    # Инвалидируем кэш для этого виджета
    if config.api_key:
        await cache_service.invalidate_widget(config.api_key.key)

    await db.commit()
    await db.refresh(config)

    # Вручную мапим в схему ответа
    return {
        "id": str(config.id),
        "user_id": str(config.user_id),
        "api_key_id": str(config.api_key_id),
        "api_key": config.api_key.key if config.api_key else None,
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
        "event_ids": [str(e.id) for e in config.events],
    }


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_widget_config(
    config_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Удалить конфигурацию виджета.

    Требует JWT токен. Пользователь может удалять только свои конфигурации.
    """
    result = await db.execute(
        select(WidgetConfig)
        .options(selectinload(WidgetConfig.api_key))
        .where(
            WidgetConfig.id == config_id,
            WidgetConfig.user_id == current_user.id,
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget config not found",
        )

    # Инвалидируем кэш
    await cache_service.invalidate_widget(config.api_key.key)

    # Удаляем конфигурацию виджета
    await db.delete(config)
    await db.commit()
