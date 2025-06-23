-- Initialize databases with sample data

-- Connect to metadata_db to create admin tables
\c metadata_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'regular_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create change_requests table
CREATE TABLE IF NOT EXISTS change_requests (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    operation VARCHAR(10) NOT NULL,
    old_data TEXT,
    new_data TEXT,
    requested_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create snapshots table
CREATE TABLE IF NOT EXISTS snapshots (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    snapshot_data TEXT NOT NULL,
    change_request_id INTEGER REFERENCES change_requests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default users
INSERT INTO users (username, password_hash, email, role) VALUES 
('admin', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin@example.com', 'admin'),  -- password: admin123
('user', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'user@example.com', 'regular_user')  -- password: user123
ON CONFLICT (username) DO NOTHING;

-- Connect to app_dev database
\c app_dev;

-- Create sample tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO users (username, email, full_name) VALUES 
('john_doe', 'john@example.com', 'John Doe'),
('jane_smith', 'jane@example.com', 'Jane Smith'),
('bob_wilson', 'bob@example.com', 'Bob Wilson'),
('alice_brown', 'alice@example.com', 'Alice Brown'),
('charlie_davis', 'charlie@example.com', 'Charlie Davis')
ON CONFLICT (username) DO NOTHING;

INSERT INTO products (name, price, category, description) VALUES 
('Laptop Pro', 1299.99, 'Electronics', 'High-performance laptop'),
('Wireless Mouse', 29.99, 'Electronics', 'Ergonomic wireless mouse'),
('Office Chair', 199.99, 'Furniture', 'Comfortable office chair'),
('Standing Desk', 399.99, 'Furniture', 'Adjustable standing desk'),
('Coffee Mug', 12.99, 'Accessories', 'Ceramic coffee mug'),
('Notebook', 8.99, 'Stationery', 'Spiral notebook'),
('Pen Set', 15.99, 'Stationery', 'Set of 5 pens'),
('Monitor', 299.99, 'Electronics', '24-inch LED monitor'),
('Keyboard', 79.99, 'Electronics', 'Mechanical keyboard'),
('Desk Lamp', 39.99, 'Accessories', 'LED desk lamp')
ON CONFLICT DO NOTHING;

-- Replicate structure to other environment databases
\c app_test;
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\c app_stage;
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

\c app_prod;
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);