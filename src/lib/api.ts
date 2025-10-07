/**
 * HTTP client with authentication and error handling.
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config, endpoints, storage } from './config';

// Request/Response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

// Create axios instance
const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config) => {
      const token = storage.getToken();
      console.log('🔐 Axios interceptor - Token:', token ? 'Found' : 'Missing');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('📤 Axios interceptor - Added Authorization header');
      } else {
        console.log('❌ Axios interceptor - No token found');
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle token refresh and errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      
      // Handle 401 Unauthorized - attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        const refreshToken = storage.getRefreshToken();
        if (refreshToken) {
          try {
            const response = await axios.post(
              `${config.apiBaseUrl}${endpoints.auth.refresh}`,
              { refresh_token: refreshToken }
            );
            
            const { access_token, refresh_token } = response.data;
            storage.setTokens(access_token, refresh_token);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            
            return client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            storage.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token, redirect to login
          storage.clearTokens();
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create the HTTP client instance
export const httpClient = createHttpClient();

// Utility functions for making requests
export const api = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await httpClient.get<T>(url, config);
    return response.data;
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await httpClient.post<T>(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await httpClient.put<T>(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await httpClient.delete<T>(url, config);
    return response.data;
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await httpClient.patch<T>(url, data, config);
    return response.data;
  },
};

// API service functions
export const authApi = {
  requestOtp: async (email: string) => {
    return api.post(endpoints.auth.otpRequest, { email });
  },

  verifyOtp: async (email: string, code: string, deviceFingerprint?: string) => {
    return api.post(endpoints.auth.otpVerify, {
      email,
      code,
      device_fingerprint: deviceFingerprint,
    });
  },

  refreshToken: async () => {
    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return api.post(endpoints.auth.refresh, { refresh_token: refreshToken });
  },

  logout: async () => {
    const refreshToken = storage.getRefreshToken();
    if (refreshToken) {
      await api.post(endpoints.auth.logout, { refresh_token: refreshToken });
    }
    storage.clearTokens();
  },
};

export const userApi = {
  getProfile: async () => {
    return api.get(endpoints.user.profile);
  },

  updateProfile: async (data: { username?: string }) => {
    return api.put(endpoints.user.profile, data);
  },

  requestAccountDeletion: async () => {
    return api.post(endpoints.user.delete);
  },

  cancelAccountDeletion: async () => {
    return api.post(endpoints.user.cancelDeletion);
  },
};

export const serversApi = {
  list: async (page?: number) => {
    const params = page ? { page } : {};
    const response = await api.get(endpoints.servers.list, { params });
    // Extract servers array from response format { servers: [...], next: "..." }
    return response.servers || response;
  },

  create: async (data: {
    name: string;
    url: string;
    auth_method: 'none' | 'api_key' | 'oauth' | 'enrollment';
    credentials?: object;
    timeout?: number;
    ssl_verify?: boolean;
  }) => {
    return api.post(endpoints.servers.create, data);
  },

  update: async (id: string, data: {
    name?: string;
    url?: string;
    auth_method?: 'none' | 'api_key' | 'oauth' | 'enrollment';
    credentials?: object;
    timeout?: number;
    ssl_verify?: boolean;
  }) => {
    return api.put(endpoints.servers.update(id), data);
  },

  delete: async (id: string) => {
    return api.delete(endpoints.servers.delete(id));
  },

  test: async (data: {
    url: string;
    auth_method: 'none' | 'api_key' | 'oauth' | 'enrollment';
    credentials?: object;
    timeout?: number;
    ssl_verify?: boolean;
  }) => {
    return api.post(endpoints.servers.test, data);
  },

  getStatus: async (id: string) => {
    return api.get(endpoints.servers.status(id));
  },

  enroll: async (data: {
    name: string;
    host: string;
    port: number;
    enrollment_id: string;
    enrollment_token: string;
    ssl_verify: boolean;
  }) => {
    return api.post(endpoints.servers.enroll, data);
  },
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'An unexpected error occurred';
};

export * from './ollama';

export default api;