#!/usr/bin/env python3
"""
Script to populate sample data in all environments (test, stage, prod)
"""

from sqlalchemy import create_engine, text
from app.config import settings, Environment
import random

def populate_environment_data():
    """Populate sample data in test, stage, and prod environments"""
    
    # Sample users data
    sample_users = [
        ('john_doe', 'john@example.com', 'John Doe'),
        ('jane_smith', 'jane@example.com', 'Jane Smith'),
        ('bob_wilson', 'bob@example.com', 'Bob Wilson'),
        ('alice_brown', 'alice@example.com', 'Alice Brown'),
        ('mike_johnson', 'mike@example.com', 'Mike Johnson'),
        ('sarah_wilson', 'sarah@example.com', 'Sarah Wilson'),
        ('david_garcia', 'david@example.com', 'David Garcia'),
    ]
    
    # Sample products data with categories from actual database
    sample_products = [
        ('Laptop Pro Ultimate', 1799.99, 'Electronics', 'Top-tier laptop for professionals'),
        ('Wireless Mouse', 29.99, 'Electronics', 'Ergonomic wireless mouse'),
        ('Office Chair', 199.99, 'Furniture', 'Comfortable ergonomic office chair'),
        ('Standing Desk', 399.99, 'Furniture', 'Height-adjustable standing desk'),
        ('Coffee Mug', 12.99, 'Accessories', 'Ceramic coffee mug with handle'),
        ('Notebook', 8.99, 'Stationery', 'Lined notebook for notes'),
        ('Pen Set', 15.99, 'Stationery', 'Set of ballpoint pens'),
        ('Desk Lamp', 39.99, 'Accessories', 'LED desk lamp with dimmer'),
        ('Laptop Pro', 1299.99, 'Electronics', 'High-performance laptop'),
        ('Tablet', 599.99, 'Electronics', 'Portable tablet device'),
    ]
    
    # Additional products to make it more realistic
    electronics_products = [
        ('Smartphone', 799.99, 'Electronics', 'Latest smartphone model'),
        ('Headphones', 149.99, 'Electronics', 'Noise-canceling headphones'),
        ('Monitor 24"', 299.99, 'Electronics', '24-inch LED monitor'),
        ('Keyboard', 89.99, 'Electronics', 'Mechanical keyboard'),
        ('Webcam', 79.99, 'Electronics', 'HD webcam for video calls'),
    ]
    
    furniture_products = [
        ('Bookshelf', 149.99, 'Furniture', 'Wooden bookshelf with 5 shelves'),
        ('Computer Desk', 249.99, 'Furniture', 'L-shaped computer desk'),
        ('Filing Cabinet', 179.99, 'Furniture', '3-drawer filing cabinet'),
    ]
    
    accessories_products = [
        ('Mouse Pad', 14.99, 'Accessories', 'Large gaming mouse pad'),
        ('Phone Stand', 19.99, 'Accessories', 'Adjustable phone stand'),
        ('Cable Organizer', 9.99, 'Accessories', 'Desktop cable management'),
    ]
    
    all_products = sample_products + electronics_products + furniture_products + accessories_products
    
    # Create engines for environments that need data
    environments_to_populate = [Environment.TEST, Environment.STAGE, Environment.PROD]
    
    for env in environments_to_populate:
        print(f"Populating {env.value} environment...")
        
        if env == Environment.TEST:
            engine = create_engine(settings.DATABASE_URL_TEST, pool_pre_ping=True)
        elif env == Environment.STAGE:
            engine = create_engine(settings.DATABASE_URL_STAGE, pool_pre_ping=True)
        elif env == Environment.PROD:
            engine = create_engine(settings.DATABASE_URL_PROD, pool_pre_ping=True)
        
        with engine.connect() as conn:
            # Clear existing data first
            print(f"  Clearing existing data in {env.value}...")
            conn.execute(text("DELETE FROM products"))
            conn.execute(text("DELETE FROM users"))
            
            # Insert users
            print(f"  Inserting {len(sample_users)} users...")
            for username, email, full_name in sample_users:
                conn.execute(text("""
                    INSERT INTO users (username, email, full_name) 
                    VALUES (:username, :email, :full_name)
                """), {
                    "username": username,
                    "email": email,
                    "full_name": full_name
                })
            
            # Insert products
            print(f"  Inserting {len(all_products)} products...")
            for name, price, category, description in all_products:
                conn.execute(text("""
                    INSERT INTO products (name, price, category, description) 
                    VALUES (:name, :price, :category, :description)
                """), {
                    "name": name,
                    "price": price,
                    "category": category,
                    "description": description
                })
            
            # For test and stage, add some additional randomized data to make it realistic
            if env in [Environment.TEST, Environment.STAGE]:
                print(f"  Adding additional randomized data for {env.value}...")
                
                # Add more products with variations
                for i in range(20):
                    base_products = [
                        ('Laptop Pro', 1299.99, 'Electronics'),
                        ('Office Chair', 199.99, 'Furniture'),
                        ('Coffee Mug', 12.99, 'Accessories'),
                        ('Standing Desk', 399.99, 'Furniture'),
                    ]
                    
                    for base_name, base_price, category in base_products:
                        # Add some variation to price and name
                        price_variation = random.uniform(0.9, 1.1)
                        new_price = round(base_price * price_variation, 2)
                        new_name = f"{base_name}"
                        
                        conn.execute(text("""
                            INSERT INTO products (name, price, category, description) 
                            VALUES (:name, :price, :category, :description)
                        """), {
                            "name": new_name,
                            "price": new_price,
                            "category": category,
                            "description": f"Variant of {base_name}"
                        })
            
            conn.commit()
            print(f"  ✅ {env.value} environment populated successfully!")
    
    print("\n🎉 All environments populated with sample data!")

if __name__ == "__main__":
    populate_environment_data()