import { api } from './api';
import { Environment } from '../types';

class EnvironmentService {
  /**
   * Get list of available environments
   */
  async getEnvironments(): Promise<string[]> {
    try {
      return await api.get<string[]>('/environments');
    } catch (error) {
      throw new Error(`Failed to get environments: ${error}`);
    }
  }

  /**
   * Get current active environment for user
   */
  async getCurrentEnvironment(): Promise<string> {
    try {
      return await api.get<string>('/environments/current');
    } catch (error) {
      throw new Error(`Failed to get current environment: ${error}`);
    }
  }

  /**
   * Switch to a different environment
   */
  async switchEnvironment(environment: string): Promise<{ message: string; environment: string }> {
    try {
      const response = await api.post<{ message: string; environment: string }>(
        '/environments/switch',
        environment,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      return response;
    } catch (error) {
      throw new Error(`Failed to switch environment: ${error}`);
    }
  }

  /**
   * Validate environment name
   */
  isValidEnvironment(env: string): boolean {
    return Object.values(Environment).includes(env as Environment);
  }

  /**
   * Get environment display name
   */
  getEnvironmentDisplayName(env: string): string {
    const displayNames: Record<string, string> = {
      [Environment.DEV]: 'Development',
      [Environment.TEST]: 'Testing',
      [Environment.STAGE]: 'Staging',
      [Environment.PROD]: 'Production',
    };
    
    return displayNames[env] || env.toUpperCase();
  }

  /**
   * Get environment color for UI
   */
  getEnvironmentColor(env: string): string {
    const colors: Record<string, string> = {
      [Environment.DEV]: '#4caf50',    // Green
      [Environment.TEST]: '#ff9800',   // Orange  
      [Environment.STAGE]: '#2196f3',  // Blue
      [Environment.PROD]: '#f44336',   // Red
    };
    
    return colors[env] || '#757575';
  }
}

export const environmentService = new EnvironmentService();