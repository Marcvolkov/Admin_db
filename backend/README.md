# Admin DB Backend

FastAPI backend for the Admin DB database administration system.

## 🏗️ Architecture

The backend is built using FastAPI and follows a modular architecture:

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration and environment variables
│   ├── database.py          # Database connection and session management
│   ├── core/                # Core application components
│   │   ├── exceptions.py    # Custom exception classes
│   │   └── middleware.py    # Request/response middleware
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py         # User model
│   │   ├── change_request.py # Change request model
│   │   └── snapshot.py     # Snapshot model
│   ├── schemas/             # Pydantic schemas for validation
│   │   ├── user.py         # User schemas
│   │   ├── table.py        # Table schemas
│   │   ├── query.py        # Query schemas
│   │   └── change_request.py # Change request schemas
│   ├── services/            # Business logic services
│   │   ├── auth_service.py  # Authentication service
│   │   ├── db_manager.py    # Database management service
│   │   ├── approval_logic.py # Approval workflow service
│   │   └── query_service.py # Query execution service
│   ├── routers/             # API route handlers
│   │   ├── auth.py         # Authentication routes
│   │   ├── tables.py       # Table management routes
│   │   ├── data.py         # Data manipulation routes
│   │   ├── approvals.py    # Approval workflow routes
│   │   └── environments.py # Environment switching routes
│   └── data/                # Static data files
│       └── queries.json    # Predefined queries
├── tests/                   # Test files
├── requirements.txt         # Python dependencies
├── requirements-test.txt    # Testing dependencies
└── pytest.ini             # Pytest configuration
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- pip (Python package manager)

### Installation

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-test.txt  # For development
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Make sure PostgreSQL is running
   python -c "from app.database import init_databases; init_databases()"
   ```

5. **Start Development Server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Database URLs for different environments
DATABASE_URL_DEV=postgresql://postgres:password@localhost:5432/app_dev
DATABASE_URL_TEST=postgresql://postgres:password@localhost:5432/app_test
DATABASE_URL_STAGE=postgresql://postgres:password@localhost:5432/app_stage
DATABASE_URL_PROD=postgresql://postgres:password@localhost:5432/app_prod

# Metadata database (for users, change requests, etc.)
METADATA_DB_URL=postgresql://postgres:password@localhost:5432/metadata_db

# Authentication settings
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application settings
DEBUG=true
ENVIRONMENT=development
```

### Database Configuration

The system uses multiple PostgreSQL databases:

- **metadata_db**: Stores users, roles, change requests, and snapshots
- **app_dev**: Development environment data
- **app_test**: Testing environment data
- **app_stage**: Staging environment data
- **app_prod**: Production environment data

Each environment database contains the same schema but different data.

## 📊 Database Schema

### Metadata Database

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change requests table
CREATE TABLE change_requests (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255),
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    requested_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    comment TEXT
);

-- Snapshots table
CREATE TABLE snapshots (
    id SERIAL PRIMARY KEY,
    environment VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    snapshot_data JSONB NOT NULL,
    change_request_id INTEGER REFERENCES change_requests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Application Databases

Each application database (dev/test/stage/prod) contains:

```sql
-- Users table (sample data structure)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (sample data structure)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 Authentication

The system uses JWT (JSON Web Token) authentication:

### Default Users

- **Admin**: username=`admin`, password=`admin123`
- **User**: username=`user`, password=`user123`

### JWT Token Flow

1. Client sends login credentials to `/auth/login`
2. Server validates credentials and returns JWT token
3. Client includes token in `Authorization: Bearer <token>` header
4. Server validates token on each protected request

### Role-Based Access

- **Admin**: Full access to all operations
- **User**: Read-only access, can submit change requests

## 📡 API Endpoints

### Authentication

```
POST /auth/login
GET  /auth/me
```

### Environment Management

```
GET  /environments/
POST /environments/switch
GET  /environments/current
```

### Table Management

```
GET  /tables/
GET  /tables/{table_name}/schema
GET  /tables/{table_name}/data
GET  /tables/{table_name}/queries
POST /tables/{table_name}/query
```

### Data Operations

```
POST   /data/{table_name}/records
PUT    /data/{table_name}/records/{record_id}
DELETE /data/{table_name}/records/{record_id}
```

### Approval Workflow

```
GET  /approvals/pending
GET  /approvals/{change_id}
POST /approvals/{change_id}/approve
POST /approvals/{change_id}/reject
GET  /approvals/history
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run tests in parallel
pytest -n auto
```

### Test Structure

- `tests/conftest.py`: Test fixtures and configuration
- `tests/test_auth.py`: Authentication tests
- `tests/test_tables.py`: Table management tests
- `tests/test_approvals.py`: Approval workflow tests

### Test Database

Tests use a separate SQLite database for isolation:

```python
# Test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"
```

## 🔧 Services

### Authentication Service (`auth_service.py`)

- Password hashing and verification
- JWT token creation and validation
- User authentication and authorization
- Role-based access control

### Database Manager (`db_manager.py`)

- Dynamic database connection management
- Table schema introspection
- Data querying with pagination and filtering
- Multi-environment support

### Approval Logic (`approval_logic.py`)

- Change request creation and management
- Approval workflow processing
- Database change execution
- Snapshot creation for rollback

### Query Service (`query_service.py`)

- Predefined query management
- Parameter validation and substitution
- Query execution with safety checks
- Result formatting and export

## 🚀 Deployment

### Development

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
# Install production dependencies
pip install -r requirements.txt

# Run with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or use gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Environment Variables for Production

```bash
# Use strong secret key
SECRET_KEY=your-production-secret-key-256-bits

# Use production database URLs
DATABASE_URL_PROD=postgresql://user:pass@prod-db:5432/app_prod

# Disable debug mode
DEBUG=false
ENVIRONMENT=production
```

## 📝 Error Handling

The application uses custom exception classes and middleware for structured error handling:

### Custom Exceptions

- `DatabaseConnectionError`: Database connectivity issues
- `TableNotFoundError`: Table doesn't exist
- `RecordNotFoundError`: Record doesn't exist
- `ValidationError`: Data validation failures
- `PermissionDeniedError`: Access control violations
- `ChangeRequestError`: Approval workflow errors

### Error Response Format

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {},
  "request_id": "req-12345"
}
```

## 🔒 Security

### Security Features

- JWT authentication with configurable expiration
- Password hashing using bcrypt
- SQL injection prevention via SQLAlchemy ORM
- CORS configuration for frontend integration
- Input validation using Pydantic schemas
- Role-based access control

### Security Headers

The application automatically adds security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## 📊 Logging and Monitoring

### Request Logging

All requests are logged with:

- Request ID for tracing
- HTTP method and path
- Response status code
- Response time
- Client IP address

### Error Logging

Errors are logged with full stack traces and context:

```python
logger.error(f"[{request_id}] Database error: {error}", exc_info=True)
```

## 🧩 Extending the System

### Adding New Tables

1. Create table in target databases
2. Add predefined queries in `data/queries.json`
3. Update table validation if needed

### Adding New Endpoints

1. Create router in `routers/` directory
2. Add business logic in `services/`
3. Create Pydantic schemas in `schemas/`
4. Add tests in `tests/`

### Custom Middleware

Add custom middleware in `core/middleware.py`:

```python
class CustomMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Custom logic here
        response = await call_next(request)
        return response
```

## 📈 Performance Considerations

- Use connection pooling for database connections
- Implement query result caching for frequently accessed data
- Use pagination for large datasets
- Optimize database queries with proper indexing
- Monitor query performance and slow queries

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL service status
   - Verify connection strings in `.env`
   - Check firewall settings

2. **Authentication Issues**
   - Verify JWT secret key configuration
   - Check token expiration settings
   - Validate user credentials in database

3. **Permission Errors**
   - Check user roles in database
   - Verify role-based access decorators
   - Check environment permissions

### Debug Mode

Enable debug mode for detailed error information:

```bash
DEBUG=true
```

This will show detailed stack traces and SQL queries in the logs.