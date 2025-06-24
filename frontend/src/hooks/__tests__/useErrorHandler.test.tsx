import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { useErrorHandler } from '../useErrorHandler';

// Wrapper component for SnackbarProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SnackbarProvider maxSnack={3}>
    {children}
  </SnackbarProvider>
);

describe('useErrorHandler', () => {
  it('should initialize with null error', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    expect(result.current.error).toBeNull();
  });

  it('should set error from string', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    act(() => {
      result.current.setError('Test error message');
    });
    
    expect(result.current.error).toEqual({
      message: 'Test error message'
    });
  });

  it('should set error from Error object', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    act(() => {
      result.current.setError(new Error('Network error'));
    });
    
    expect(result.current.error).toEqual({
      message: 'Network error'
    });
  });

  it('should set error from structured error object', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    const errorDetails = {
      message: 'Database error',
      code: 'DATABASE_ERROR',
      status_code: 500,
      request_id: 'req-123'
    };
    
    act(() => {
      result.current.setError(errorDetails);
    });
    
    expect(result.current.error).toEqual(errorDetails);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    act(() => {
      result.current.setError('Test error');
    });
    
    expect(result.current.error).not.toBeNull();
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should set error to null when called with null', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    act(() => {
      result.current.setError('Test error');
    });
    
    expect(result.current.error).not.toBeNull();
    
    act(() => {
      result.current.setError(null);
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should provide snackbar methods', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    expect(typeof result.current.showErrorSnackbar).toBe('function');
    expect(typeof result.current.showSuccessSnackbar).toBe('function');
    expect(typeof result.current.showWarningSnackbar).toBe('function');
    expect(typeof result.current.showInfoSnackbar).toBe('function');
  });

  it('should call snackbar methods without throwing', () => {
    const { result } = renderHook(() => useErrorHandler(), { wrapper });
    
    expect(() => {
      act(() => {
        result.current.showErrorSnackbar('Error message');
        result.current.showSuccessSnackbar('Success message');
        result.current.showWarningSnackbar('Warning message');
        result.current.showInfoSnackbar('Info message');
      });
    }).not.toThrow();
  });
});