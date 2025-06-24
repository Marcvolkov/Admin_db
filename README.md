# Admin DB - Database Administration System

A professional database administration system with multi-environment support, approval workflows, and role-based access control.

## 🚀 Features

- **Multi-Environment Management**: Switch between dev, test, stage, and production environments
- **Role-Based Access Control**: Admin and regular user roles with appropriate permissions
- **Approval Workflow**: All database changes require admin approval before execution
- **Table Management**: Browse, search, and manage database tables and records
- **Predefined Queries**: Execute predefined queries with parameterization
- **Change Tracking**: Track all database changes with diff visualization
- **Real-time Updates**: Live updates for pending approvals and data changes
- **Responsive Design**: Modern Material-UI interface that works on all devices

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** and **npm**
- **Python 3.11+** and **pip**
- **PostgreSQL 14+** (if not using Docker)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Admin_db
```

### 2. Start with Docker (Recommended)

```bash
# Start PostgreSQL
cd docker
docker-compose up -d

# Start Backend
cd ../backend
source venv/bin/activate  # Create venv first if needed
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Frontend (in new terminal)
cd ../frontend
npm install
npm start

# The application will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - PostgreSQL: localhost:5432
```

### 3. Login

- **Admin User**: `admin` / `admin123`
- **Regular User**: `user` / `user123`

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │───▶│   FastAPI       │───▶│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
│                 │    │                 │    │                 │
│ • Material-UI   │    │ • SQLAlchemy    │    │ • Multi-DB      │
│ • TypeScript    │    │ • Pydantic      │    │ • Change Log    │
│ • React Query   │    │ • JWT Auth      │    │ • Snapshots     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) v5
- React Router v6
- TanStack Query (React Query)
- Axios for HTTP client
- Notistack for notifications

**Backend:**
- FastAPI with Python 3.11
- SQLAlchemy ORM
- Pydantic for validation
- JWT authentication
- PostgreSQL database
- Uvicorn ASGI server

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 14

## 📦 Installation

### Development Setup

#### Backend Setup

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-test.txt  # For testing
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=http://localhost:8000" > .env
   ```

3. **Start Frontend**
   ```bash
   npm start
   ```

#### Database Setup

1. **Start PostgreSQL**
   ```bash
   cd docker
   docker-compose up -d postgres
   ```

2. **Initialize Database**
   ```bash
   cd backend
   python -c "from app.database import init_databases; init_databases()"
   ```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

```bash
# Database Configuration
DATABASE_URL_DEV=postgresql://postgres:password@localhost:5432/app_dev
DATABASE_URL_TEST=postgresql://postgres:password@localhost:5432/app_test
DATABASE_URL_STAGE=postgresql://postgres:password@localhost:5432/app_stage
DATABASE_URL_PROD=postgresql://postgres:password@localhost:5432/app_prod
METADATA_DB_URL=postgresql://postgres:password@localhost:5432/metadata_db

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
DEBUG=true
ENVIRONMENT=development
```

#### Frontend (.env)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Optional: Environment-specific settings
REACT_APP_ENVIRONMENT=development
```

### Database Schema

The system uses multiple PostgreSQL databases:

- **metadata_db**: Users, roles, change requests, snapshots
- **app_dev**: Development environment data
- **app_test**: Testing environment data  
- **app_stage**: Staging environment data
- **app_prod**: Production environment data

## 📖 Usage

### User Roles

**Admin Users:**
- Full access to all environments
- Can approve/reject change requests
- Can directly edit data (with approval workflow)
- Access to system administration features

**Regular Users:**
- Read-only access to data
- Can submit change requests
- Can execute predefined queries
- Cannot approve changes

### Key Features

#### 1. Environment Switching
- Select environment from sidebar dropdown
- Confirm switch when going to production
- All operations use the selected environment

#### 2. Table Management
- Browse all tables in current environment
- View table schema and constraints
- Search and filter table data
- Paginated data grid with sorting

#### 3. Data Modification
- Create, update, delete records (admin only)
- All changes go through approval workflow
- Real-time diff visualization
- Change history tracking

#### 4. Predefined Queries
- Execute parameterized queries
- Category-based query organization
- Parameter validation and type checking
- Results export capabilities

#### 5. Approval Workflow
- Pending changes dashboard (admin only)
- Detailed change review with diff viewer
- Bulk approval/rejection options
- Email notifications (configurable)

## 📚 API Documentation

### Authentication

```bash
# Login
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Get current user
GET /auth/me
Authorization: Bearer <token>
```

### Tables

```bash
# Get tables list
GET /tables/
Authorization: Bearer <token>

# Get table schema
GET /tables/{table_name}/schema
Authorization: Bearer <token>

# Get table data
GET /tables/{table_name}/data?limit=50&offset=0
Authorization: Bearer <token>

# Get predefined queries
GET /tables/{table_name}/queries
Authorization: Bearer <token>

# Execute predefined query
POST /tables/{table_name}/query
Authorization: Bearer <token>
{
  "query_id": "products_by_category",
  "parameters": {
    "category": "Electronics"
  }
}
```

### Change Requests

```bash
# Create change request
POST /data/{table_name}/records
Authorization: Bearer <token>
{
  "name": "New Product",
  "price": 99.99,
  "category": "Electronics"
}

# Get pending changes (admin only)
GET /approvals/pending
Authorization: Bearer <token>

# Approve change (admin only)
POST /approvals/{change_id}/approve
Authorization: Bearer <token>
{
  "comment": "Approved"
}
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Run specific test
npm test -- --testNamePattern="ErrorAlert"
```

## 🚀 Deployment

### Production Deployment

1. **Update Environment Configuration**
   ```bash
   # Update backend/.env with production values
   # Update frontend/.env with production API URL
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

4. **Setup Production Database**
   ```bash
   # Create production PostgreSQL instance
   # Run database initialization
   python -c "from app.database import init_databases; init_databases()"
   ```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# Initialize database
docker-compose exec backend python -c "from app.database import init_databases; init_databases()"
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection settings
psql -h localhost -U postgres -d metadata_db
```

#### Frontend Network Error
```bash
# Check backend is running
curl http://localhost:8000/

# Verify REACT_APP_API_URL in frontend/.env
```

#### Permission Denied
```bash
# Check user role in database
# Verify JWT token is valid
# Check admin_required decorators
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

### Development Guidelines

- Follow TypeScript/Python typing standards
- Write tests for new features
- Update documentation
- Follow commit message conventions
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Material-UI team for the excellent React components
- FastAPI team for the modern Python web framework
- PostgreSQL community for the robust database system

---

For more detailed documentation, see the project documentation and inline code comments.
