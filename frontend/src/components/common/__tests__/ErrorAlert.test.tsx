import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorAlert } from '../ErrorAlert';

describe('ErrorAlert', () => {
  it('renders error message from string', () => {
    const errorMessage = 'Something went wrong';
    render(<ErrorAlert error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders error message from Error object', () => {
    const error = new Error('Network error');
    render(<ErrorAlert error={error} />);
    
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders user-friendly message for known error codes', () => {
    const error = {
      message: 'Raw database error',
      code: 'DATABASE_CONNECTION_ERROR'
    };
    render(<ErrorAlert error={error} />);
    
    expect(screen.getByText('Unable to connect to the database. Please try again later.')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorAlert error="Test error" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn();
    render(<ErrorAlert error="Test error" onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByText('Dismiss');
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('expands to show technical details when details button is clicked', () => {
    const error = {
      message: 'Test error',
      code: 'TEST_ERROR',
      request_id: 'req-123',
      status_code: 500,
      details: { field: 'value' }
    };
    
    render(<ErrorAlert error={error} showDetails={true} />);
    
    const detailsButton = screen.getByText('Details');
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
    expect(screen.getByText('TEST_ERROR')).toBeInTheDocument();
    expect(screen.getByText('req-123')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders with warning severity', () => {
    render(<ErrorAlert error="Warning message" severity="warning" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-colorWarning');
  });

  it('renders custom title when provided', () => {
    render(<ErrorAlert error="Test error" title="Custom Title" />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
});