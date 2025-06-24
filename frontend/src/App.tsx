import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PrivateRoute } from './components/common/PrivateRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TablesPage } from './pages/TablesPage';
import { TablePage } from './pages/TablePage';
import { PendingApprovals } from './pages/PendingApprovals';
import { SnapshotsPage } from './pages/SnapshotsPage';
import { ChangeDetails } from './components/approvals/ChangeDetails';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider 
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/tables" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <TablesPage />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/tables/:tableName" 
                  element={
                    <PrivateRoute>
                      <Layout>
                        <TablePage />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/approvals" 
                  element={
                    <PrivateRoute adminOnly>
                      <Layout>
                        <PendingApprovals />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/approvals/:changeId" 
                  element={
                    <PrivateRoute adminOnly>
                      <Layout>
                        <ChangeDetails />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/snapshots" 
                  element={
                    <PrivateRoute adminOnly>
                      <Layout>
                        <SnapshotsPage />
                      </Layout>
                    </PrivateRoute>
                  } 
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
