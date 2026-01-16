"""
Тесты для API ключей.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestApiKeysList:
    """Тесты получения списка API ключей."""

    async def test_list_api_keys_empty(self, client: AsyncClient, auth_headers: dict):
        """Получение пустого списка API ключей."""
        response = await client.get("/api/v1/api-keys", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data == []

    async def test_list_api_keys_with_data(self, client: AsyncClient, auth_headers: dict, test_api_key):
        """Получение списка с API ключами."""
        response = await client.get("/api/v1/api-keys", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == str(test_api_key.id)
        assert data[0]["name"] == test_api_key.name
        assert "key" in data[0]

    async def test_list_api_keys_unauthorized(self, client: AsyncClient):
        """Получение API ключей без авторизации."""
        response = await client.get("/api/v1/api-keys")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestApiKeysCreate:
    """Тесты создания API ключей."""

    async def test_create_api_key_success(self, client: AsyncClient, auth_headers: dict):
        """Успешное создание API ключа."""
        response = await client.post(
            "/api/v1/api-keys",
            json={"name": "My API Key"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "My API Key"
        assert "key" in data
        assert data["key"].startswith("emk_")
        assert "usage_count" in data

    async def test_create_api_key_with_domains(self, client: AsyncClient, auth_headers: dict):
        """Создание API ключа с разрешенными доменами."""
        response = await client.post(
            "/api/v1/api-keys",
            json={
                "name": "Restricted API Key",
                "allowed_domains": ["example.com", "*.example.com"],
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["allowed_domains"] == ["example.com", "*.example.com"]

    async def test_create_api_key_unauthorized(self, client: AsyncClient):
        """Создание API ключа без авторизации."""
        response = await client.post(
            "/api/v1/api-keys",
            json={"name": "My API Key"},
        )
        assert response.status_code == 401

    async def test_create_api_key_missing_name(self, client: AsyncClient, auth_headers: dict):
        """Создание API ключа без имени."""
        response = await client.post(
            "/api/v1/api-keys",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestApiKeysDelete:
    """Тесты удаления API ключей."""

    async def test_delete_api_key_success(self, client: AsyncClient, auth_headers: dict, test_api_key, db_session):
        """Успешное удаление API ключа."""
        response = await client.delete(
            f"/api/v1/api-keys/{test_api_key.id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        # Проверяем, что ключ удален
        response = await client.get("/api/v1/api-keys", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    async def test_delete_api_key_not_found(self, client: AsyncClient, auth_headers: dict):
        """Удаление несуществующего API ключа."""
        response = await client.delete(
            "/api/v1/api-keys/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_delete_api_key_unauthorized(self, client: AsyncClient, test_api_key):
        """Удаление API ключа без авторизации."""
        response = await client.delete(f"/api/v1/api-keys/{test_api_key.id}")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestApiKeysGet:
    """Тесты получения API ключа."""

    async def test_get_api_key_success(self, client: AsyncClient, auth_headers: dict, test_api_key):
        """Успешное получение API ключа."""
        response = await client.get(
            f"/api/v1/api-keys/{test_api_key.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_api_key.id)
        assert data["name"] == test_api_key.name

    async def test_get_api_key_not_found(self, client: AsyncClient, auth_headers: dict):
        """Получение несуществующего API ключа."""
        response = await client.get(
            "/api/v1/api-keys/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )
        assert response.status_code == 404
