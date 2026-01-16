"""
Тесты для API аутентификации.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuthRegister:
    """Тесты регистрации."""

    async def test_register_success(self, client: AsyncClient):
        """Успешная регистрация."""
        from tests.conftest import get_test_email

        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": get_test_email(),
                "password": "password123",
                "name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "email" not in data  # Email не должен возвращаться в ответе регистрации

    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data: dict):
        """Регистрация с существующим email."""
        await client.post("/api/v1/auth/register", json=test_user_data)
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    async def test_register_weak_password(self, client: AsyncClient):
        """Регистрация со слабым паролем."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "123",
                "name": "Test User",
            },
        )
        assert response.status_code == 422

    async def test_register_invalid_email(self, client: AsyncClient):
        """Регистрация с невалидным email."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "password123",
                "name": "Test User",
            },
        )
        assert response.status_code == 422


@pytest.mark.asyncio
class TestAuthLogin:
    """Тесты входа в систему."""

    async def test_login_success(self, client: AsyncClient, test_user_data: dict):
        """Успешный вход."""
        # Сначала регистрируем пользователя
        await client.post("/api/v1/auth/register", json=test_user_data)

        # Теперь логинимся
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, client: AsyncClient, test_user_data: dict):
        """Вход с неправильным паролем."""
        await client.post("/api/v1/auth/register", json=test_user_data)
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Вход несуществующего пользователя."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAuthMe:
    """Тесты получения информации о текущем пользователе."""

    async def test_get_me_success(self, client: AsyncClient, auth_headers: dict, test_user):
        """Успешное получение информации о себе."""
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_user.id)
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name

    async def test_get_me_unauthorized(self, client: AsyncClient):
        """Получение информации без авторизации."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 403

    async def test_get_me_invalid_token(self, client: AsyncClient):
        """Получение информации с невалидным токеном."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401
