from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings, Environment
import os

Base = declarative_base()

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Database engines for different environments
# Use connect_args only for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL_DEV else {}

engines = {
    Environment.DEV: create_engine(settings.DATABASE_URL_DEV, connect_args=connect_args),
    Environment.TEST: create_engine(settings.DATABASE_URL_TEST, connect_args=connect_args),
    Environment.STAGE: create_engine(settings.DATABASE_URL_STAGE, connect_args=connect_args),
    Environment.PROD: create_engine(settings.DATABASE_URL_PROD, connect_args=connect_args),
}

# Metadata database engine
metadata_connect_args = {"check_same_thread": False} if "sqlite" in settings.METADATA_DB_URL else {}
metadata_engine = create_engine(settings.METADATA_DB_URL, connect_args=metadata_connect_args)
MetadataSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=metadata_engine)

def get_session_for_environment(env: Environment):
    """Get database session for specific environment"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engines[env])
    return SessionLocal

def get_metadata_db():
    """Get metadata database session"""
    db = MetadataSessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_databases():
    """Initialize all databases with tables"""
    # Create metadata tables
    from .models import User, ChangeRequest, Snapshot
    Base.metadata.create_all(bind=metadata_engine)
    
    # Create sample tables in each environment
    for env in Environment:
        engine = engines[env]
        # Create sample tables (users, products)
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    full_name VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
    
    # Insert default admin user and sample data
    from .services.auth_service import get_password_hash
    from .models.user import Role
    db = MetadataSessionLocal()
    try:
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                email="admin@example.com",
                role=Role.ADMIN
            )
            db.add(admin_user)
            
            regular_user = User(
                username="user",
                password_hash=get_password_hash("user123"),
                email="user@example.com",
                role=Role.REGULAR_USER
            )
            db.add(regular_user)
            db.commit()
            
        # Add sample data to dev environment
        dev_engine = engines[Environment.DEV]
        with dev_engine.connect() as conn:
            # Insert sample users
            conn.execute(text("""
                INSERT OR IGNORE INTO users (username, email, full_name) VALUES 
                ('john_doe', 'john@example.com', 'John Doe'),
                ('jane_smith', 'jane@example.com', 'Jane Smith'),
                ('bob_wilson', 'bob@example.com', 'Bob Wilson')
            """))
            
            # Insert sample products
            conn.execute(text("""
                INSERT OR IGNORE INTO products (name, price, category, description) VALUES 
                ('Laptop Pro', 1299.99, 'Electronics', 'High-performance laptop'),
                ('Wireless Mouse', 29.99, 'Electronics', 'Ergonomic wireless mouse'),
                ('Office Chair', 199.99, 'Furniture', 'Comfortable office chair'),
                ('Standing Desk', 399.99, 'Furniture', 'Adjustable standing desk'),
                ('Coffee Mug', 12.99, 'Accessories', 'Ceramic coffee mug')
            """))
            conn.commit()
            
    finally:
        db.close()