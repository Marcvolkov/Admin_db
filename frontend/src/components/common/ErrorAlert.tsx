import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  Typography,
  Chip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  BugReport,
  Error as ErrorIcon
} from '@mui/icons-material';

interface ErrorDetails {
  message: string;
  code?: string;
  details?: Record<string, any>;
  request_id?: string;
  status_code?: number;
}

interface ErrorAlertProps {
  error: string | Error | ErrorDetails;
  onRetry?: () => void;
  onDismiss?: () => void;
  severity?: 'error' | 'warning';
  showDetails?: boolean;
  title?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  severity = 'error',
  showDetails = false,
  title
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Parse error into structured format
  const errorDetails: ErrorDetails = React.useMemo(() => {
    if (typeof error === 'string') {
      return { message: error };
    }
    
    if (error instanceof Error) {
      return { message: error.message };
    }
    
    return error;
  }, [error]);

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const getUserFriendlyMessage = (errorDetails: ErrorDetails): string => {
    const { message, code, status_code } = errorDetails;
    
    // Map common error codes to user-friendly messages
    const messageMap: Record<string, string> = {
      'DATABASE_CONNECTION_ERROR': 'Unable to connect to the database. Please try again later.',
      'TABLE_NOT_FOUND': 'The requested table could not be found.',
      'RECORD_NOT_FOUND': 'The requested record could not be found.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'PERMISSION_DENIED': 'You do not have permission to perform this action.',
      'AUTHENTICATION_ERROR': 'Please log in to continue.',
      'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
      'QUERY_EXECUTION_ERROR': 'There was an error executing your query.',
      'CHANGE_REQUEST_ERROR': 'There was an error processing your request.',
    };

    // Check for specific error codes
    if (code && messageMap[code]) {
      return messageMap[code];
    }

    // Check for HTTP status codes
    if (status_code) {
      if (status_code >= 500) {
        return 'A server error occurred. Please try again later.';
      }
      if (status_code === 404) {
        return 'The requested resource was not found.';
      }
      if (status_code === 403) {
        return 'You do not have permission to access this resource.';
      }
      if (status_code === 401) {
        return 'Please log in to continue.';
      }
      if (status_code >= 400) {
        return 'There was an error with your request. Please check your input and try again.';
      }
    }

    // Fall back to the original message
    return message || 'An unexpected error occurred.';
  };

  const getErrorIcon = () => {
    if (severity === 'warning') {
      return undefined; // Use default warning icon
    }
    return <ErrorIcon />;
  };

  const displayMessage = getUserFriendlyMessage(errorDetails);
  const hasDetails = errorDetails.code || errorDetails.details || errorDetails.request_id || errorDetails.status_code;

  return (
    <Alert 
      severity={severity}
      icon={getErrorIcon()}
      action={
        <Box display="flex" gap={1}>
          {hasDetails && showDetails && (
            <Button
              size="small"
              onClick={handleToggleExpanded}
              startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            >
              Details
            </Button>
          )}
          {onRetry && (
            <Button
              size="small"
              onClick={onRetry}
              startIcon={<Refresh />}
              variant="outlined"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              size="small"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </Box>
      }
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <Typography variant="body2">
        {displayMessage}
      </Typography>

      {hasDetails && showDetails && (
        <Collapse in={expanded} sx={{ mt: 2 }}>
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderRadius: 1,
              p: 2,
              mt: 1
            }}
          >
            <Box display="flex" alignItems="center" mb={1}>
              <BugReport fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" fontWeight="bold">
                Technical Details
              </Typography>
            </Box>
            
            <Box display="flex" flexDirection="column" gap={1}>
              {errorDetails.code && (
                <Box>
                  <Typography variant="caption" fontWeight="bold">
                    Error Code:
                  </Typography>
                  <Chip label={errorDetails.code} size="small" sx={{ ml: 1 }} />
                </Box>
              )}
              
              {errorDetails.status_code && (
                <Box>
                  <Typography variant="caption" fontWeight="bold">
                    Status Code:
                  </Typography>
                  <Chip label={errorDetails.status_code} size="small" sx={{ ml: 1 }} />
                </Box>
              )}
              
              {errorDetails.request_id && (
                <Box>
                  <Typography variant="caption" fontWeight="bold">
                    Request ID:
                  </Typography>
                  <Typography variant="caption" sx={{ ml: 1, fontFamily: 'monospace' }}>
                    {errorDetails.request_id}
                  </Typography>
                </Box>
              )}
              
              <Box>
                <Typography variant="caption" fontWeight="bold">
                  Raw Message:
                </Typography>
                <Typography variant="caption" sx={{ ml: 1, fontFamily: 'monospace' }}>
                  {errorDetails.message}
                </Typography>
              </Box>
              
              {errorDetails.details && Object.keys(errorDetails.details).length > 0 && (
                <Box>
                  <Typography variant="caption" fontWeight="bold">
                    Additional Details:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(0, 0, 0, 0.06)',
                      borderRadius: 1,
                      p: 1,
                      mt: 0.5,
                      overflow: 'auto',
                      maxHeight: 200
                    }}
                  >
                    {JSON.stringify(errorDetails.details, null, 2)}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};