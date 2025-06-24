import { useState, useEffect, useCallback } from 'react';
import { User, UserLogin, Role } from '../types';
import { authService } from '../services/auth.service';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
  checkRole: (requiredRole: Role) => boolean;
  isAdmin: () => boolean;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = authService.isAuthenticated() && user !== null;

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to get current user:', error);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: UserLogin): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback((): void => {
    setUser(null);
    authService.logout();
  }, []);

  // Check if user has required role
  const checkRole = useCallback((requiredRole: Role): boolean => {
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === Role.ADMIN) return true;
    
    // Check specific role
    return user.role === requiredRole;
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return user?.role === Role.ADMIN || false;
  }, [user]);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!authService.isAuthenticated()) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      authService.logout();
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkRole,
    isAdmin,
    refreshUser,
  };
};