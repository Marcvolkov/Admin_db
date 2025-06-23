# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a database administration system called "Admin_db" that is currently in the planning phase. The project will be a full-stack application with:
- **Backend**: FastAPI with PostgreSQL
- **Frontend**: React with TypeScript and Material-UI
- **Architecture**: Multi-environment database administration with approval workflows

## Current Status

The project is in early development with only planning documents available:
- `Roadmap.md` contains a comprehensive 23-step development plan
- Virtual environment (`venv/`) is set up but no application code exists yet

## Development Environment

- **Python Environment**: Virtual environment located in `venv/`
- **Activation**: `source venv/bin/activate` (macOS/Linux) or `venv\Scripts\activate` (Windows)

## Planned Architecture (from Roadmap)

### Backend Structure
- FastAPI application with role-based access control
- PostgreSQL with multiple environment databases (dev, test, stage, prod)
- Approval workflow system for database changes
- JWT authentication with admin/regular user roles

### Frontend Structure
- React + TypeScript with Material-UI components
- Multi-environment selector
- Data grid with inline editing
- Approval workflow interface with diff viewer

### Key Features (Planned)
- Environment switching (dev/test/stage/prod)
- Table browsing and editing with approval workflows
- Change request system with diff visualization
- Role-based permissions (admin can edit, users view-only)
- Snapshot creation on approved changes

## Development Commands

Since the project is not yet implemented, refer to the Roadmap.md for the planned setup:

### Backend (when implemented)
- Install dependencies: `pip install -r backend/requirements.txt`
- Run server: `uvicorn app.main:app --reload`
- Database setup: Docker Compose with PostgreSQL

### Frontend (when implemented)
- Install dependencies: `npm install`
- Run development server: `npm start`
- Build for production: `npm run build`

## Next Steps

Follow the sequential development plan in `Roadmap.md` starting with:
1. Project structure creation
2. Docker PostgreSQL setup
3. Backend FastAPI implementation
4. Frontend React implementation
5. Integration and testing