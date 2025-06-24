import { api, tokenStorage } from './api';
import { User, UserLogin, Token } from '../types';

class AuthService {
  /**
   * Login user with username and password
   */
  async login(credentials: UserLogin): Promise<Token> {
    try {
      console.log('Attempting login with:', { username: credentials.username, password: '***' });
      console.log('API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
      
      const response = await api.post<Token>('/auth/login', credentials);
      
      console.log('Login response received:', { 
        hasToken: !!response.access_token, 
        hasUser: !!response.user 
      });
      
      // Store token in localStorage
      if (response.access_token) {
        tokenStorage.set(response.access_token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error details:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      const errorMessage = (error as any)?.message || (error as any)?.details?.message || 'Unknown error occurred';
      throw new Error(`Login failed: ${errorMessage}`);
    }
  }

  /**
   * Logout user and clear stored token
   */
  logout(): void {
    tokenStorage.remove();
    window.location.href = '/login';
  }

  /**
   * Get current authenticated user info
   */
  async getCurrentUser(): Promise<User> {
    try {
      return await api.get<User>('/auth/me');
    } catch (error) {
      throw new Error(`Failed to get current user: ${error}`);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = tokenStorage.get();
    if (!token) return false;

    try {
      // Check if token is expired (basic JWT parsing)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return tokenStorage.get();
  }

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.role === 'admin';
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();