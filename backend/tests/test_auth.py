"""
Tests for authentication endpoints and services.
"""

import pytest
from httpx import AsyncClient


class TestAuthEndpoints:
    """Test authentication API endpoints."""

    async def test_login_success(self, client: AsyncClient):
        """Test successful login."""
        response = await client.post(
            "/auth/login",
            json={
                "username": "test_admin",
                "password": "admin123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "user" in data
        assert data["user"]["username"] == "test_admin"
        assert data["user"]["role"] == "admin"

    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials."""
        response = await client.post(
            "/auth/login",
            json={
                "username": "test_admin",
                "password": "wrong_password"
            }
        )
        
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent user."""
        response = await client.post(
            "/auth/login",
            json={
                "username": "nonexistent",
                "password": "password"
            }
        )
        
        assert response.status_code == 401

    async def test_get_current_user(self, client: AsyncClient, admin_headers: dict):
        """Test getting current user information."""
        response = await client.get("/auth/me", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "test_admin"
        assert data["role"] == "admin"

    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without authorization."""
        response = await client.get("/auth/me")
        
        assert response.status_code == 401

    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/auth/me", headers=headers)
        
        assert response.status_code == 401


class TestAuthService:
    """Test authentication service functions."""

    def test_password_hashing(self):
        """Test password hashing and verification."""
        from app.services.auth_service import get_password_hash, verify_password
        
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrong_password", hashed) is False

    def test_jwt_token_creation_and_verification(self):
        """Test JWT token creation and verification."""
        from app.services.auth_service import create_access_token, verify_token
        
        data = {"sub": "test_user"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        
        # Verify token
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "test_user"

    def test_jwt_token_expiration(self):
        """Test JWT token expiration."""
        from app.services.auth_service import create_access_token, verify_token
        from datetime import timedelta
        
        # Create token that expires immediately
        data = {"sub": "test_user"}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        
        # Token should be invalid due to expiration
        payload = verify_token(token)
        assert payload is None