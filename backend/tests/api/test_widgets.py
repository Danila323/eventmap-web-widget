"""
Тесты для API виджетов.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestWidgetsList:
    """Тесты получения списка виджетов."""

    async def test_list_widgets_empty(self, client: AsyncClient, auth_headers: dict):
        """Получение пустого списка виджетов."""
        response = await client.get("/api/v1/widgets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_widgets_with_data(self, client: AsyncClient, auth_headers: dict, test_widget):
        """Получение списка с виджетами."""
        response = await client.get("/api/v1/widgets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["id"] == str(test_widget.id)

    async def test_list_widgets_unauthorized(self, client: AsyncClient):
        """Получение виджетов без авторизации."""
        response = await client.get("/api/v1/widgets")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestWidgetsCreate:
    """Тесты создания виджетов."""

    async def test_create_widget_success(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_api_key,
        test_widget_data: dict,
    ):
        """Успешное создание виджета."""
        response = await client.post(
            "/api/v1/widgets",
            json={**test_widget_data, "api_key_id": str(test_api_key.id)},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == test_widget_data["title"]
        assert data["api_key_id"] == str(test_api_key.id)

    async def test_create_widget_with_events(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_api_key,
        test_widget_data: dict,
        test_event,
    ):
        """Создание виджета с событиями."""
        response = await client.post(
            "/api/v1/widgets",
            json={
                **test_widget_data,
                "api_key_id": str(test_api_key.id),
                "event_ids": [str(test_event.id)],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["event_ids"] == [str(test_event.id)]

    async def test_create_widget_unauthorized(self, client: AsyncClient, test_widget_data: dict):
        """Создание виджета без авторизации."""
        response = await client.post("/api/v1/widgets", json=test_widget_data)
        assert response.status_code == 401

    async def test_create_widget_missing_api_key(
        self, client: AsyncClient, auth_headers: dict, test_widget_data: dict
    ):
        """Создание виджета без API ключа."""
        response = await client.post(
            "/api/v1/widgets",
            json=test_widget_data,
            headers=auth_headers,
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestWidgetsDetail:
    """Тесты получения деталей виджета."""

    async def test_get_widget_success(self, client: AsyncClient, auth_headers: dict, test_widget):
        """Успешное получение виджета."""
        response = await client.get(
            f"/api/v1/widgets/{test_widget.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_widget.id)
        assert data["title"] == test_widget.title

    async def test_get_widget_not_found(self, client: AsyncClient, auth_headers: dict):
        """Получение несуществующего виджета."""
        response = await client.get(
            "/api/v1/widgets/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestWidgetsUpdate:
    """Тесты обновления виджетов."""

    async def test_update_widget_success(self, client: AsyncClient, auth_headers: dict, test_widget):
        """Успешное обновление виджета."""
        response = await client.put(
            f"/api/v1/widgets/{test_widget.id}",
            json={"title": "Updated Widget"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Widget"

    async def test_update_widget_not_found(self, client: AsyncClient, auth_headers: dict):
        """Обновление несуществующего виджета."""
        response = await client.put(
            "/api/v1/widgets/00000000-0000-0000-0000-000000000000",
            json={"title": "Updated Widget"},
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestWidgetsDelete:
    """Тесты удаления виджетов."""

    async def test_delete_widget_success(self, client: AsyncClient, auth_headers: dict, test_widget):
        """Успешное удаление виджета."""
        response = await client.delete(
            f"/api/v1/widgets/{test_widget.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Проверяем, что виджет удален
        response = await client.get(
            f"/api/v1/widgets/{test_widget.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestWidgetsEmbed:
    """Тесты генерации embed кода."""

    async def test_generate_embed_success(self, client: AsyncClient, auth_headers: dict, test_widget):
        """Успешная генерация embed кода."""
        response = await client.get(
            f"/api/v1/widgets/{test_widget.id}/embed",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "embed_code" in data
        assert "script_url" in data
        assert "<script" in data["embed_code"]

    async def test_generate_embed_not_found(self, client: AsyncClient, auth_headers: dict):
        """Генерация embed кода для несуществующего виджета."""
        response = await client.get(
            "/api/v1/widgets/00000000-0000-0000-0000-000000000000/embed",
            headers=auth_headers,
        )
        assert response.status_code == 404
