import { authService } from '../auth.service';
import { api } from '../api';

// Mock the api module
jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'admin',
          created_at: '2024-01-01T00:00:00Z'
        }
      };

      mockApi.post.mockResolvedValue(mockResponse);

      const credentials = { username: 'testuser', password: 'password' };
      const result = await authService.login(credentials);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin_db_token', 'test-token');
      expect(result).toEqual(mockResponse);
    });

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials');
      mockApi.post.mockRejectedValue(mockError);

      const credentials = { username: 'testuser', password: 'wrongpassword' };

      await expect(authService.login(credentials)).rejects.toThrow('Login failed: Error: Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should remove token and redirect to login', () => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin_db_token');
      expect(window.location.href).toBe('/login');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockApi.get.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('should handle getCurrentUser failure', async () => {
      const mockError = new Error('Unauthorized');
      mockApi.get.mockRejectedValue(mockError);

      await expect(authService.getCurrentUser()).rejects.toThrow('Failed to get current user: Error: Unauthorized');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid non-expired token', () => {
      // Create a mock JWT token that doesn't expire for a long time
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockPayload = { sub: 'testuser', exp: futureTime };
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false for expired token', () => {
      // Create a mock JWT token that is expired
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockPayload = { sub: 'testuser', exp: pastTime };
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;

      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false for invalid token format', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return stored token', () => {
      const mockToken = 'test-token';
      mockLocalStorage.getItem.mockReturnValue(mockToken);

      const result = authService.getToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('admin_db_token');
      expect(result).toBe(mockToken);
    });

    it('should return null when no token stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockApi.get.mockResolvedValue(mockUser);

      const result = await authService.isAdmin();

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      const mockUser = {
        id: 2,
        username: 'user',
        email: 'user@example.com',
        role: 'user',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockApi.get.mockResolvedValue(mockUser);

      const result = await authService.isAdmin();

      expect(result).toBe(false);
    });

    it('should return false when getCurrentUser fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.isAdmin();

      expect(result).toBe(false);
    });
  });
});