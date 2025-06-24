import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Base API configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'admin_db_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
};

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    console.error('API response error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      tokenStorage.remove();
      window.location.href = '/login';
    }
    
    // Create structured error object
    const errorDetails = {
      message: error.message || 'An unexpected error occurred',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      details: error.response?.data?.details || {},
      request_id: error.response?.data?.request_id || error.response?.headers?.['x-request-id'],
      status_code: error.response?.status
    };
    
    // Use the structured error for better error handling
    if (error.response?.data && typeof error.response.data === 'object') {
      // API returned structured error
      const apiError = error.response.data;
      errorDetails.message = apiError.message || errorDetails.message;
      errorDetails.code = apiError.code || errorDetails.code;
      errorDetails.details = apiError.details || errorDetails.details;
      errorDetails.request_id = apiError.request_id || errorDetails.request_id;
    }
    
    return Promise.reject(errorDetails);
  }
);

// Generic API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get(url, config).then((response) => response.data),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post(url, data, config).then((response) => response.data),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put(url, data, config).then((response) => response.data),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete(url, config).then((response) => response.data),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.patch(url, data, config).then((response) => response.data),
};

export default apiClient;