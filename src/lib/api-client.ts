import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Import for structured logging (will be used when available)
// import { useStructuredLogger } from '../components/NotificationProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Storage keys
const ACCESS_TOKEN_KEY = 'access_token';

// Queue for requests waiting for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Skip token refresh for authentication endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/api/auth/');
        
        // If error is 401 and we haven't retried yet, and it's not an auth endpoint
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (isRefreshing) {
            // If already refreshing, add to queue
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject, config: originalRequest });
            })
              .then((token) => {
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${token}`,
                };
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            processQueue(null, newAccessToken);
            
            // Retry original request with new token
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newAccessToken}`,
            };
            return this.client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError as Error, null);
            this.clearTokens();
            // Redirect to login or handle logout
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public setTokens(accessToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  public clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Refresh token logic
  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true
        });

        const { accessToken } = response.data.data;
        this.setTokens(accessToken);
        resolve(accessToken);
      } catch (error) {
        this.clearTokens();
        reject(error);
      }
    });

    return this.refreshPromise;
  }

  // API methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
export default apiClient;
