import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';

interface LoadingStateProps {
  type?: 'spinner' | 'linear' | 'skeleton';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  rows?: number; // For skeleton type
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'spinner',
  message = 'Loading...',
  size = 'medium',
  fullScreen = false,
  rows = 3
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      default: return 40;
    }
  };

  const containerProps = fullScreen ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999
  } : {};

  if (type === 'linear') {
    return (
      <Box sx={containerProps}>
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
          {message && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 1 }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  if (type === 'skeleton') {
    return (
      <Box sx={containerProps}>
        {Array.from({ length: rows }).map((_, index) => (
          <Card key={index} sx={{ mb: 1 }}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="40%" height={20} />
              <Box display="flex" gap={1} mt={1}>
                <Skeleton variant="rectangular" width={60} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Default spinner type
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={fullScreen ? '100vh' : '200px'}
      sx={containerProps}
    >
      <CircularProgress size={getSpinnerSize()} />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

// Specialized loading components for common use cases
export const TableLoadingState: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, index) => (
      <Box key={index} display="flex" gap={2} mb={1} p={1}>
        <Skeleton variant="rectangular" width={40} height={40} />
        <Box flex={1}>
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="60%" height={16} />
        </Box>
        <Box display="flex" gap={1}>
          <Skeleton variant="rectangular" width={60} height={32} />
          <Skeleton variant="rectangular" width={60} height={32} />
        </Box>
      </Box>
    ))}
  </Box>
);

export const CardLoadingState: React.FC = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
      <Box display="flex" gap={1}>
        <Skeleton variant="rectangular" width={80} height={36} />
        <Skeleton variant="rectangular" width={80} height={36} />
      </Box>
    </CardContent>
  </Card>
);

export const InlineLoadingState: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <Box display="flex" alignItems="center" gap={1}>
    <CircularProgress size={16} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);