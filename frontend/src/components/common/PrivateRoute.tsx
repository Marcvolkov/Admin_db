import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';
import { LoadingSpinner } from './LoadingSpinner';
import { Box, Alert } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  adminOnly?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
  adminOnly = false
}) => {
  const { isAuthenticated, isLoading, checkRole, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check admin-only access
  if (adminOnly && !isAdmin()) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  // Check specific role requirement
  if (requiredRole && !checkRole(requiredRole)) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Required role: {requiredRole}
        </Alert>
      </Box>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};