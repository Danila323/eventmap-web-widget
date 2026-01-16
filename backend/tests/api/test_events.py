"""
Тесты для API событий.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestEventsList:
    """Тесты получения списка событий."""

    async def test_list_events_empty(self, client: AsyncClient, auth_headers: dict):
        """Получение пустого списка событий."""
        response = await client.get("/api/v1/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_events_with_data(self, client: AsyncClient, auth_headers: dict, test_event):
        """Получение списка с событиями."""
        response = await client.get("/api/v1/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["id"] == str(test_event.id)

    async def test_list_events_pagination(self, client: AsyncClient, auth_headers: dict, db_session):
        """Тест пагинации."""
        from app.models.event import Event
        from datetime import datetime

        # Создаем несколько событий
        for i in range(5):
            event = Event(
                title=f"Event {i}",
                event_datetime=datetime.now(),
                longitude=37.6173,
                latitude=55.7558,
            )
            db_session.add(event)
        await db_session.commit()

        response = await client.get(
            "/api/v1/events?page=1&page_size=3",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3
        assert data["total"] == 5

    async def test_list_events_unauthorized(self, client: AsyncClient):
        """Получение событий без авторизации."""
        response = await client.get("/api/v1/events")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestEventsCreate:
    """Тесты создания событий."""

    async def test_create_event_success(self, client: AsyncClient, auth_headers: dict, test_event_data: dict):
        """Успешное создание события."""
        response = await client.post(
            "/api/v1/events",
            json=test_event_data,
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == test_event_data["title"]
        assert data["longitude"] == test_event_data["longitude"]
        assert data["latitude"] == test_event_data["latitude"]
        assert "id" in data

    async def test_create_event_unauthorized(self, client: AsyncClient, test_event_data: dict):
        """Создание события без авторизации."""
        response = await client.post("/api/v1/events", json=test_event_data)
        assert response.status_code == 401

    async def test_create_event_invalid_coordinates(self, client: AsyncClient, auth_headers: dict):
        """Создание события с невалидными координатами."""
        response = await client.post(
            "/api/v1/events",
            json={
                "title": "Test Event",
                "event_datetime": "2026-12-31T19:00:00",
                "longitude": 200,  # Невалидная долгота
                "latitude": 55.7558,
            },
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_event_missing_required_fields(self, client: AsyncClient, auth_headers: dict):
        """Создание события без обязательных полей."""
        response = await client.post(
            "/api/v1/events",
            json={"title": "Test Event"},
            headers=auth_headers,
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestEventsDetail:
    """Тесты получения деталей события."""

    async def test_get_event_success(self, client: AsyncClient, auth_headers: dict, test_event):
        """Успешное получение события."""
        response = await client.get(
            f"/api/v1/events/{test_event.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_event.id)
        assert data["title"] == test_event.title

    async def test_get_event_not_found(self, client: AsyncClient, auth_headers: dict):
        """Получение несуществующего события."""
        response = await client.get(
            "/api/v1/events/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_get_event_unauthorized(self, client: AsyncClient, test_event):
        """Получение события без авторизации."""
        response = await client.get(f"/api/v1/events/{test_event.id}")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestEventsUpdate:
    """Тесты обновления событий."""

    async def test_update_event_success(self, client: AsyncClient, auth_headers: dict, test_event):
        """Успешное обновление события."""
        response = await client.put(
            f"/api/v1/events/{test_event.id}",
            json={"title": "Updated Title"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    async def test_update_event_not_found(self, client: AsyncClient, auth_headers: dict):
        """Обновление несуществующего события."""
        response = await client.put(
            "/api/v1/events/00000000-0000-0000-0000-000000000000",
            json={"title": "Updated Title"},
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestEventsDelete:
    """Тесты удаления событий."""

    async def test_delete_event_success(self, client: AsyncClient, auth_headers: dict, test_event, db_session):
        """Успешное удаление события."""
        response = await client.delete(
            f"/api/v1/events/{test_event.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Проверяем, что событие удалено
        response = await client.get(
            f"/api/v1/events/{test_event.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_delete_event_not_found(self, client: AsyncClient, auth_headers: dict):
        """Удаление несуществующего события."""
        response = await client.delete(
            "/api/v1/events/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404
