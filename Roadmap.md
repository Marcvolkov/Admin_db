## Phase 1: Project Setup & Infrastructure

### Step 1: Initialize Project Structure
**Task for Cursor:**
```
Create a new project with the following structure:
sagole-db-admin/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── change_request.py
│   │   │   └── snapshot.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── environments.py
│   │   │   ├── tables.py
│   │   │   ├── data.py
│   │   │   └── approvals.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── db_manager.py
│   │   │   ├── approval_logic.py
│   │   │   └── auth_service.py
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── user.py
│   │       ├── table.py
│   │       └── change_request.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── tables/
│   │   │   ├── approvals/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── docker/
│   ├── postgres/
│   │   └── init.sql
│   └── docker-compose.yml
├── .gitignore
└── README.md
```

### Step 2: Docker Setup
**Task for Cursor:**
```
Create docker-compose.yml with PostgreSQL setup:
- PostgreSQL service with multiple databases (dev, test, stage, prod)
- Metadata database for storing users, roles, pending_changes, snapshots
- Volume persistence
- Network configuration
```

**Task for Cursor:**
```
Create docker/postgres/init.sql with:
- Create databases: metadata_db, app_dev, app_test, app_stage, app_prod
- Create schemas in each app database
- Create tables: users (id, username, email, role), products (id, name, price, category)
- Insert sample data (10-20 records per table)
- Create metadata tables: users, roles, pending_changes, snapshots
```

### Step 3: Backend Initial Setup
**Task for Cursor:**
```
Create backend/requirements.txt with:
- fastapi
- uvicorn
- sqlalchemy
- psycopg2-binary
- pydantic
- python-dotenv
- python-jose[cryptography]
- passlib[bcrypt]
- python-multipart
```

**Task for Cursor:**
```
Create backend/.env.example with:
- DATABASE_URL templates for each environment
- METADATA_DB_URL
- SECRET_KEY
- ALGORITHM=HS256
- ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Phase 2: Backend Development

### Step 4: Database Configuration
**Task for Cursor:**
```
Create backend/app/config.py:
- Load environment variables
- Database URLs configuration
- JWT settings
- Environment enum (DEV, TEST, STAGE, PROD)
```

**Task for Cursor:**
```
Create backend/app/database.py:
- SQLAlchemy engine factory for different environments
- Session management
- Dynamic database connection switching
- Metadata database connection
```

### Step 5: Models
**Task for Cursor:**
```
Create backend/app/models/user.py:
- User model with id, username, password_hash, email, role, created_at
- Role enum (ADMIN, REGULAR_USER)
```

**Task for Cursor:**
```
Create backend/app/models/change_request.py:
- ChangeRequest model with:
  - id, environment, table_name, record_id
  - operation (CREATE, UPDATE, DELETE)
  - old_data (JSON), new_data (JSON)
  - requested_by, requested_at
  - status (PENDING, APPROVED, REJECTED)
  - reviewed_by, reviewed_at
```

**Task for Cursor:**
```
Create backend/app/models/snapshot.py:
- Snapshot model with:
  - id, environment, table_name
  - snapshot_data (JSON)
  - change_request_id
  - created_at
```

### Step 6: Pydantic Schemas
**Task for Cursor:**
```
Create backend/app/schemas/user.py:
- UserBase, UserCreate, UserLogin, User, Token schemas
- Include role validation
```

**Task for Cursor:**
```
Create backend/app/schemas/table.py:
- TableInfo (name, columns)
- ColumnInfo (name, type, nullable, primary_key)
- TableData (columns, rows)
- DataFilter (column, operator, value)
```

**Task for Cursor:**
```
Create backend/app/schemas/change_request.py:
- ChangeRequestCreate, ChangeRequestUpdate
- ChangeRequestResponse with user details
- ApprovalRequest (approved: bool, comment: optional)
```

### Step 7: Services
**Task for Cursor:**
```
Create backend/app/services/auth_service.py:
- Password hashing/verification
- JWT token creation/validation
- Get current user dependency
- Role-based permissions decorator
```

**Task for Cursor:**
```
Create backend/app/services/db_manager.py:
- get_table_list(environment) - returns all tables
- get_table_schema(environment, table_name) - returns columns info
- get_table_data(environment, table_name, filters, limit, offset)
- execute_query(environment, query) - for predefined queries
- Dynamic SQL generation with proper escaping
```

**Task for Cursor:**
```
Create backend/app/services/approval_logic.py:
- create_change_request(data) - saves pending change
- get_pending_changes(user_role)
- approve_change(change_id, user_id) - applies change and creates snapshot
- reject_change(change_id, user_id, reason)
- apply_database_change(change_request) - actual DB modification
- create_table_snapshot(environment, table_name, change_request_id)
```

### Step 8: API Routers
**Task for Cursor:**
```
Create backend/app/routers/auth.py:
- POST /auth/login - returns JWT token
- GET /auth/me - current user info
- Hardcoded users: admin/admin123, user/user123
```

**Task for Cursor:**
```
Create backend/app/routers/environments.py:
- GET /environments - list available environments
- POST /environments/switch - switch active environment
- GET /environments/current - get current environment
```

**Task for Cursor:**
```
Create backend/app/routers/tables.py:
- GET /tables - list all tables in current environment
- GET /tables/{table_name}/schema - get table columns
- GET /tables/{table_name}/data - get paginated data with filters
- POST /tables/{table_name}/query - execute predefined query
```

**Task for Cursor:**
```
Create backend/app/routers/data.py:
- POST /data/{table_name}/records - create new record (admin only)
- PUT /data/{table_name}/records/{record_id} - update record (admin only)
- DELETE /data/{table_name}/records/{record_id} - delete record (admin only)
- All operations create change requests, not direct changes
```

**Task for Cursor:**
```
Create backend/app/routers/approvals.py:
- GET /approvals/pending - list pending changes (admin only)
- GET /approvals/{change_id} - get change details with diff
- POST /approvals/{change_id}/approve - approve change (admin only)
- POST /approvals/{change_id}/reject - reject change (admin only)
- GET /approvals/history - list all processed changes
```

### Step 9: Main Application
**Task for Cursor:**
```
Create backend/app/main.py:
- FastAPI app initialization
- CORS middleware configuration
- Include all routers
- Exception handlers
- Startup/shutdown events
```

## Phase 3: Frontend Development

### Step 10: React Setup
**Task for Cursor:**
```
Initialize React app with TypeScript:
- npx create-react-app frontend --template typescript
- Install dependencies: axios, react-router-dom, @types/react-router-dom
- Install UI library: @mui/material @emotion/react @emotion/styled
- Install data grid: @mui/x-data-grid
- Install utilities: react-hook-form, react-query, notistack
```

### Step 11: Types and Interfaces
**Task for Cursor:**
```
Create frontend/src/types/index.ts:
- User, Role interfaces
- Environment enum
- TableInfo, ColumnInfo, TableData interfaces
- ChangeRequest, ChangeRequestStatus interfaces
- ApiResponse wrapper type
```

### Step 12: API Service Layer
**Task for Cursor:**
```
Create frontend/src/services/api.ts:
- Axios instance with interceptors
- Token management
- Base URL configuration
- Error handling
```

**Task for Cursor:**
```
Create frontend/src/services/auth.service.ts:
- login(username, password)
- logout()
- getCurrentUser()
- Token storage in localStorage
```

**Task for Cursor:**
```
Create frontend/src/services/environment.service.ts:
- getEnvironments()
- switchEnvironment(env)
- getCurrentEnvironment()
```

**Task for Cursor:**
```
Create frontend/src/services/table.service.ts:
- getTables()
- getTableSchema(tableName)
- getTableData(tableName, filters, pagination)
- executeQuery(tableName, queryId)
```

**Task for Cursor:**
```
Create frontend/src/services/data.service.ts:
- createRecord(tableName, data)
- updateRecord(tableName, recordId, data)
- deleteRecord(tableName, recordId)
```

**Task for Cursor:**
```
Create frontend/src/services/approval.service.ts:
- getPendingChanges()
- getChangeDetails(changeId)
- approveChange(changeId)
- rejectChange(changeId, reason)
```

### Step 13: Layout Components
**Task for Cursor:**
```
Create frontend/src/components/layout/Layout.tsx:
- Main layout with sidebar and content area
- Responsive design
- User info and logout in header
```

**Task for Cursor:**
```
Create frontend/src/components/layout/Sidebar.tsx:
- Environment selector dropdown
- Table list navigation
- Pending approvals link (admin only)
- Collapsible design
```

### Step 14: Authentication Components
**Task for Cursor:**
```
Create frontend/src/pages/Login.tsx:
- Login form with username/password
- Error handling
- Redirect after successful login
- Clean, centered design
```

**Task for Cursor:**
```
Create frontend/src/components/common/PrivateRoute.tsx:
- Route wrapper for authentication
- Role-based access control
- Redirect to login if not authenticated
```

### Step 15: Table Components
**Task for Cursor:**
```
Create frontend/src/components/tables/TableList.tsx:
- Display list of tables
- Click to select table
- Search/filter tables
- Show table row counts
```

**Task for Cursor:**
```
Create frontend/src/components/tables/TableSchema.tsx:
- Display table columns info
- Show data types, constraints
- Collapsible panel design
```

**Task for Cursor:**
```
Create frontend/src/components/tables/DataGrid.tsx:
- Use MUI DataGrid
- Sorting, filtering, pagination
- Inline editing for admin users
- Row selection
- Custom cell renderers for different data types
```

**Task for Cursor:**
```
Create frontend/src/components/tables/EditDialog.tsx:
- Form for editing records
- Dynamic fields based on schema
- Validation
- Show original vs new values
- Submit for approval button
```

### Step 16: Approval Components
**Task for Cursor:**
```
Create frontend/src/pages/PendingApprovals.tsx:
- List of pending changes
- Filter by table, user, date
- Click to view details
- Batch operations
```

**Task for Cursor:**
```
Create frontend/src/components/approvals/ChangeDetails.tsx:
- Show change request details
- Diff viewer for old vs new data
- User who requested change
- Timestamp
- Approve/Reject buttons
```

**Task for Cursor:**
```
Create frontend/src/components/approvals/DiffViewer.tsx:
- Side-by-side comparison
- Highlight changes
- Handle different data types
- Expand/collapse for large objects
```

### Step 17: Common Components
**Task for Cursor:**
```
Create frontend/src/components/common/EnvironmentSelector.tsx:
- Dropdown for environment selection
- Show current environment
- Confirmation dialog for switching
- Visual indicator (color coding)
```

**Task for Cursor:**
```
Create frontend/src/components/common/LoadingSpinner.tsx:
- Reusable loading component
- Full screen and inline variants
```

**Task for Cursor:**
```
Create frontend/src/components/common/ErrorBoundary.tsx:
- Catch and display errors gracefully
- Retry functionality
```

### Step 18: Main App Integration
**Task for Cursor:**
```
Create frontend/src/App.tsx:
- React Router setup
- Theme provider
- Notification provider (notistack)
- Global error handling
- Auth context provider
```

**Task for Cursor:**
```
Create frontend/src/hooks/useAuth.ts:
- Custom hook for authentication
- User state management
- Role checking utilities
```

**Task for Cursor:**
```
Create frontend/src/hooks/useEnvironment.ts:
- Current environment state
- Environment switching logic
- Persist selection
```

## Phase 4: Integration & Polish

### Step 19: Predefined Queries
**Task for Cursor:**
```
Create backend/app/data/queries.json:
- List of predefined queries per table
- Query templates with parameters
- Description and usage
```

**Task for Cursor:**
```
Add query execution UI:
- Dropdown to select predefined query
- Parameter inputs if needed
- Execute button
- Results display
```

### Step 20: Error Handling & Validation
**Task for Cursor:**
```
Implement comprehensive error handling:
- Backend: Custom exception classes
- Frontend: Error interceptors
- User-friendly error messages
- Validation for all inputs
```

### Step 21: Testing & Documentation
**Task for Cursor:**
```
Create comprehensive README.md files:
- Root README with project overview
- Backend README with API documentation
- Frontend README with component documentation
- Setup instructions
- Environment variables explanation
```

**Task for Cursor:**
```
Create seed data scripts:
- backend/scripts/seed_data.py
- Generate realistic test data
- Create sample change requests
```

### Step 22: Docker & Deployment
**Task for Cursor:**
```
Create production-ready docker-compose.yml:
- Backend service
- Frontend service (nginx)
- PostgreSQL with proper volumes
- Environment configuration
- Health checks
```

### Step 23: Bonus Features (if time permits)
**Task for Cursor:**
```
Implement JWT authentication:
- Replace hardcoded auth with proper JWT
- Refresh token logic
- Session management
```

**Task for Cursor:**
```
Add export functionality:
- Export table data to CSV
- Export to JSON
- Download change history
```

**Task for Cursor:**
```
Add environment health check:
- Database connection status
- Table row counts
- Recent changes summary
```

## Final Checklist

1. ✅ All CRUD operations create change requests
2. ✅ Role-based UI (admin can edit, user can only view)
3. ✅ Approval workflow with diff viewer
4. ✅ Multi-environment support
5. ✅ Table snapshots on approval
6. ✅ Clean, responsive UI
7. ✅ Comprehensive error handling
8. ✅ Docker setup
9. ✅ Documentation

## Commands for Cursor during development:

1. "Create a FastAPI backend with the structure I provided"
2. "Implement the database manager service with dynamic schema detection"
3. "Create the approval workflow with change tracking"
4. "Build a React TypeScript frontend with MUI components"
5. "Implement the data grid with inline editing for admins"
6. "Create the diff viewer component for comparing changes"
7. "Add comprehensive error handling and validation"
8. "Write docker-compose setup for the entire application"

Each step must be completed sequentially, with testing after each major milestone.