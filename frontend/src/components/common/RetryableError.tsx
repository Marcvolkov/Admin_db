import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Refresh,
  Error as ErrorIcon,
  Home,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ErrorAlert } from './ErrorAlert';

interface RetryableErrorProps {
  error: any;
  onRetry?: () => void;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  title?: string;
  description?: string;
  fullPage?: boolean;
}

export const RetryableError: React.FC<RetryableErrorProps> = ({
  error,
  onRetry,
  showHomeButton = true,
  showBackButton = true,
  title = "Something went wrong",
  description,
  fullPage = false
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const content = (
    <Box>
      <ErrorAlert
        error={error}
        onRetry={onRetry}
        showDetails={true}
        title={title}
      />
      
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
          {description}
        </Typography>
      )}

      <Box display="flex" gap={2} flexWrap="wrap">
        {onRetry && (
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
        
        {showBackButton && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
          >
            Go Back
          </Button>
        )}
        
        {showHomeButton && (
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={handleGoHome}
          >
            Home
          </Button>
        )}
      </Box>
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        p={3}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <ErrorIcon color="error" sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h5" component="h1">
                {title}
              </Typography>
            </Box>
            {content}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {content}
    </Box>
  );
};

// Specialized error components for common scenarios
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <RetryableError
    error={{
      message: "Unable to connect to the server. Please check your internet connection and try again.",
      code: "NETWORK_ERROR"
    }}
    onRetry={onRetry}
    title="Network Error"
    description="This usually happens when there's a connection issue or the server is temporarily unavailable."
  />
);

export const NotFoundError: React.FC<{ resource?: string }> = ({ resource = "page" }) => (
  <RetryableError
    error={{
      message: `The ${resource} you're looking for could not be found.`,
      code: "NOT_FOUND",
      status_code: 404
    }}
    title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found`}
    description="This might happen if the URL is incorrect or the resource has been moved or deleted."
    showBackButton={true}
    showHomeButton={true}
  />
);

export const ServerError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <RetryableError
    error={{
      message: "The server encountered an unexpected error. Please try again later.",
      code: "SERVER_ERROR",
      status_code: 500
    }}
    onRetry={onRetry}
    title="Server Error"
    description="Our team has been notified and is working to resolve this issue."
  />
);

export const PermissionError: React.FC = () => (
  <RetryableError
    error={{
      message: "You don't have permission to access this resource.",
      code: "PERMISSION_DENIED",
      status_code: 403
    }}
    title="Access Denied"
    description="Contact your administrator if you believe you should have access to this resource."
    showBackButton={true}
    showHomeButton={true}
    onRetry={undefined}
  />
);