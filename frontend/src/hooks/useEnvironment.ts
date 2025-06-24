import { useState, useEffect, useCallback } from 'react';
import { Environment } from '../types';
import { environmentService } from '../services/environment.service';

interface UseEnvironmentReturn {
  currentEnvironment: string;
  availableEnvironments: string[];
  isLoading: boolean;
  switchEnvironment: (env: string) => Promise<void>;
  getEnvironmentColor: (env: string) => string;
  getEnvironmentDisplayName: (env: string) => string;
  refreshEnvironments: () => Promise<void>;
}

const STORAGE_KEY = 'admin_db_current_environment';

export const useEnvironment = (): UseEnvironmentReturn => {
  const [currentEnvironment, setCurrentEnvironment] = useState<string>(Environment.DEV);
  const [availableEnvironments, setAvailableEnvironments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial environment state
  useEffect(() => {
    const loadEnvironmentState = async () => {
      try {
        setIsLoading(true);
        
        // Load available environments
        const environments = await environmentService.getEnvironments();
        setAvailableEnvironments(environments);
        
        // Load current environment from server
        try {
          const serverCurrentEnv = await environmentService.getCurrentEnvironment();
          setCurrentEnvironment(serverCurrentEnv);
          
          // Persist to localStorage
          localStorage.setItem(STORAGE_KEY, serverCurrentEnv);
        } catch (error) {
          // Fallback to localStorage or default
          const storedEnv = localStorage.getItem(STORAGE_KEY);
          if (storedEnv && environments.includes(storedEnv)) {
            setCurrentEnvironment(storedEnv);
          } else {
            setCurrentEnvironment(Environment.DEV);
          }
        }
      } catch (error) {
        console.error('Failed to load environment state:', error);
        // Use default values
        setAvailableEnvironments(Object.values(Environment));
        setCurrentEnvironment(Environment.DEV);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnvironmentState();
  }, []);

  // Switch environment
  const switchEnvironment = useCallback(async (env: string): Promise<void> => {
    if (!environmentService.isValidEnvironment(env)) {
      throw new Error(`Invalid environment: ${env}`);
    }

    try {
      setIsLoading(true);
      await environmentService.switchEnvironment(env);
      setCurrentEnvironment(env);
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, env);
      
      // Reload page to refresh data for new environment
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch environment:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get environment color
  const getEnvironmentColor = useCallback((env: string): string => {
    return environmentService.getEnvironmentColor(env);
  }, []);

  // Get environment display name
  const getEnvironmentDisplayName = useCallback((env: string): string => {
    return environmentService.getEnvironmentDisplayName(env);
  }, []);

  // Refresh environments from server
  const refreshEnvironments = useCallback(async (): Promise<void> => {
    try {
      const environments = await environmentService.getEnvironments();
      setAvailableEnvironments(environments);
      
      const serverCurrentEnv = await environmentService.getCurrentEnvironment();
      setCurrentEnvironment(serverCurrentEnv);
      localStorage.setItem(STORAGE_KEY, serverCurrentEnv);
    } catch (error) {
      console.error('Failed to refresh environments:', error);
      throw error;
    }
  }, []);

  return {
    currentEnvironment,
    availableEnvironments,
    isLoading,
    switchEnvironment,
    getEnvironmentColor,
    getEnvironmentDisplayName,
    refreshEnvironments,
  };
};