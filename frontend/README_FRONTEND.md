# Admin DB Frontend

React TypeScript frontend for the Admin DB database administration system.

## Features

- **Authentication**: JWT-based login with role-based access control
- **Environment Management**: Switch between dev, test, stage, and prod environments
- **Database Administration**: Browse tables, view data, and manage records
- **Approval Workflow**: Admin approval system for database changes
- **Modern UI**: Material-UI components with responsive design

## Tech Stack

- **React 19** with TypeScript
- **Material-UI (MUI)** for components and theming
- **React Router** for navigation
- **TanStack Query** for data fetching and caching
- **Axios** for API communication
- **Notistack** for notifications

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   ├── tables/          # Table-related components
│   ├── approvals/       # Approval workflow components
│   └── layout/          # Layout components
├── pages/               # Page components
├── services/            # API service layers
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000

### Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
```

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Authentication

The app uses JWT authentication with the following demo credentials:

- **Admin**: `admin` / `admin123`
- **User**: `user` / `user123`

## Key Features

### Environment Switching
- Visual indicators for different environments
- Confirmation dialogs for production switches
- Automatic data refresh on environment change

### Role-Based Access
- Admin users can create, update, and delete records
- Regular users have read-only access
- Protected routes based on user roles

### Change Approval Workflow
- All data modifications create change requests
- Admin approval required before applying changes
- Diff viewer for comparing old vs new data

## API Integration

The frontend communicates with the FastAPI backend through:

- **Authentication**: `/auth/login`, `/auth/me`
- **Environments**: `/environments/`
- **Tables**: `/tables/`
- **Data**: `/data/`
- **Approvals**: `/approvals/`

## Development Notes

### State Management
- Authentication state managed via custom `useAuth` hook
- Environment state managed via `useEnvironment` hook
- API state managed via TanStack Query

### Error Handling
- Global error boundary for unhandled errors
- API error interceptors with automatic token refresh
- User-friendly error messages and retry options

### Performance
- Component lazy loading
- API response caching
- Optimized re-renders with proper dependency arrays

## Building for Production

```bash
npm run build
```

The build artifacts will be in the `build/` directory, ready for deployment to any static hosting service.

## Deployment

The frontend can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Nginx static server

Make sure to configure the `REACT_APP_API_URL` environment variable to point to your production API endpoint.