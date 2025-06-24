"""
Pytest configuration and fixtures for testing.
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator
from httpx import AsyncClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_session_for_environment
from app.config import Environment
from app.models.user import User
from app.services.auth_service import get_password_hash, create_access_token


# Test database URL (uses in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def test_db():
    """Create a test database session."""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    session = TestingSessionLocal()
    
    # Create test data
    admin_user = User(
        username="test_admin",
        email="admin@test.com",
        password_hash=get_password_hash("admin123"),
        role="admin"
    )
    regular_user = User(
        username="test_user",
        email="user@test.com", 
        password_hash=get_password_hash("user123"),
        role="user"
    )
    
    session.add(admin_user)
    session.add(regular_user)
    session.commit()
    
    # Create test tables and data
    session.execute(text("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL
        )
    """))
    
    session.execute(text("""
        INSERT INTO products (name, price, category) VALUES
        ('Laptop', 999.99, 'Electronics'),
        ('Mouse', 29.99, 'Electronics'),
        ('Book', 19.99, 'Books')
    """))
    
    session.commit()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def override_get_db(test_db):
    """Override the database dependency for testing."""
    def _override_get_db():
        return test_db
    
    # Override the dependency
    app.dependency_overrides[get_session_for_environment] = lambda env: test_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def admin_token(test_db) -> str:
    """Create an admin user token for testing."""
    admin_user = test_db.query(User).filter(User.username == "test_admin").first()
    return create_access_token(data={"sub": admin_user.username})


@pytest.fixture
def user_token(test_db) -> str:
    """Create a regular user token for testing."""
    regular_user = test_db.query(User).filter(User.username == "test_user").first()
    return create_access_token(data={"sub": regular_user.username})


@pytest.fixture
def admin_headers(admin_token) -> dict:
    """Create headers with admin authorization."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def user_headers(user_token) -> dict:
    """Create headers with user authorization."""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def sample_change_request_data() -> dict:
    """Sample change request data for testing."""
    return {
        "table_name": "products",
        "operation": "CREATE",
        "new_data": {
            "name": "Test Product",
            "price": 99.99,
            "category": "Test"
        }
    }