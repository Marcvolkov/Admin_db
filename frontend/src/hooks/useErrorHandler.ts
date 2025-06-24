import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';

interface ErrorDetails {
  message: string;
  code?: string;
  details?: Record<string, any>;
  request_id?: string;
  status_code?: number;
}

interface UseErrorHandlerReturn {
  error: ErrorDetails | null;
  setError: (error: ErrorDetails | string | Error | null) => void;
  clearError: () => void;
  showErrorSnackbar: (error: ErrorDetails | string | Error) => void;
  showSuccessSnackbar: (message: string) => void;
  showWarningSnackbar: (message: string) => void;
  showInfoSnackbar: (message: string) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorDetails | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const parseError = useCallback((error: ErrorDetails | string | Error): ErrorDetails => {
    if (typeof error === 'string') {
      return { message: error };
    }
    
    if (error instanceof Error) {
      return { message: error.message };
    }
    
    return error;
  }, []);

  const setError = useCallback((error: ErrorDetails | string | Error | null) => {
    if (error === null) {
      setErrorState(null);
    } else {
      const parsedError = parseError(error);
      setErrorState(parsedError);
    }
  }, [parseError]);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const getUserFriendlyMessage = useCallback((errorDetails: ErrorDetails): string => {
    const { message, code, status_code } = errorDetails;
    
    // Map common error codes to user-friendly messages
    const messageMap: Record<string, string> = {
      'DATABASE_CONNECTION_ERROR': 'Database connection failed',
      'TABLE_NOT_FOUND': 'Table not found',
      'RECORD_NOT_FOUND': 'Record not found',
      'VALIDATION_ERROR': 'Validation failed',
      'PERMISSION_DENIED': 'Permission denied',
      'AUTHENTICATION_ERROR': 'Authentication failed',
      'TOKEN_EXPIRED': 'Session expired',
      'QUERY_EXECUTION_ERROR': 'Query execution failed',
      'CHANGE_REQUEST_ERROR': 'Request processing failed',
    };

    // Check for specific error codes
    if (code && messageMap[code]) {
      return messageMap[code];
    }

    // Check for HTTP status codes
    if (status_code) {
      if (status_code >= 500) {
        return 'Server error occurred';
      }
      if (status_code === 404) {
        return 'Resource not found';
      }
      if (status_code === 403) {
        return 'Access forbidden';
      }
      if (status_code === 401) {
        return 'Authentication required';
      }
      if (status_code >= 400) {
        return 'Request error';
      }
    }

    // Fall back to the original message
    return message || 'An unexpected error occurred';
  }, []);

  const showErrorSnackbar = useCallback((error: ErrorDetails | string | Error) => {
    const parsedError = parseError(error);
    const message = getUserFriendlyMessage(parsedError);
    
    enqueueSnackbar(message, {
      variant: 'error',
      autoHideDuration: 6000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
  }, [parseError, getUserFriendlyMessage, enqueueSnackbar]);

  const showSuccessSnackbar = useCallback((message: string) => {
    enqueueSnackbar(message, {
      variant: 'success',
      autoHideDuration: 4000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
  }, [enqueueSnackbar]);

  const showWarningSnackbar = useCallback((message: string) => {
    enqueueSnackbar(message, {
      variant: 'warning',
      autoHideDuration: 5000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
  }, [enqueueSnackbar]);

  const showInfoSnackbar = useCallback((message: string) => {
    enqueueSnackbar(message, {
      variant: 'info',
      autoHideDuration: 4000,
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
    });
  }, [enqueueSnackbar]);

  return {
    error,
    setError,
    clearError,
    showErrorSnackbar,
    showSuccessSnackbar,
    showWarningSnackbar,
    showInfoSnackbar,
  };
};