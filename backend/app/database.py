from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings, Environment
import os

Base = declarative_base()

# Database engines for different environments
engines = {
    Environment.DEV: create_engine(settings.DATABASE_URL_DEV, pool_pre_ping=True),
    Environment.TEST: create_engine(settings.DATABASE_URL_TEST, pool_pre_ping=True),
    Environment.STAGE: create_engine(settings.DATABASE_URL_STAGE, pool_pre_ping=True),
    Environment.PROD: create_engine(settings.DATABASE_URL_PROD, pool_pre_ping=True),
}

# Metadata database engine
metadata_engine = create_engine(settings.METADATA_DB_URL, pool_pre_ping=True)
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
        # Create sample tables (users, products) for PostgreSQL
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    full_name VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
            
        # Add sample data to all environments
        sample_users = [
            ('john_doe', 'john@example.com', 'John Doe'),
            ('jane_smith', 'jane@example.com', 'Jane Smith'),
            ('bob_wilson', 'bob@example.com', 'Bob Wilson'),
            ('alice_brown', 'alice@example.com', 'Alice Brown'),
        ]
        
        sample_products = [
            ('Laptop Pro', 1299.99, 'Electronics', 'High-performance laptop'),
            ('Wireless Mouse', 29.99, 'Electronics', 'Ergonomic wireless mouse'),
            ('Office Chair', 199.99, 'Furniture', 'Comfortable office chair'),
            ('Standing Desk', 399.99, 'Furniture', 'Adjustable standing desk'),
            ('Coffee Mug', 12.99, 'Accessories', 'Ceramic coffee mug'),
            ('Notebook', 8.99, 'Stationery', 'Lined notebook for notes'),
            ('Pen Set', 15.99, 'Stationery', 'Set of ballpoint pens'),
            ('Desk Lamp', 39.99, 'Accessories', 'LED desk lamp with dimmer'),
        ]
        
        for env in Environment:
            engine = engines[env]
            with engine.connect() as conn:
                # Insert sample users
                for username, email, full_name in sample_users:
                    conn.execute(text("""
                        INSERT INTO users (username, email, full_name) VALUES 
                        (:username, :email, :full_name)
                        ON CONFLICT (username) DO NOTHING
                    """), {"username": username, "email": email, "full_name": full_name})
                
                # Insert sample products
                for name, price, category, description in sample_products:
                    conn.execute(text("""
                        INSERT INTO products (name, price, category, description) VALUES 
                        (:name, :price, :category, :description)
                        ON CONFLICT DO NOTHING
                    """), {"name": name, "price": price, "category": category, "description": description})
                
                conn.commit()
            
    finally:
        db.close()