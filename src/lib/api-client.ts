import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Import for structured logging (will be used when available)
// import { useStructuredLogger } from '../components/NotificationProvider';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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

    // Request interceptor to add auth token and contextual headers
    this.client.interceptors.request.use(
      async (config) => {
        let token = this.getAccessToken();
        
        // Skip token refresh for authentication endpoints and if already in a refresh process
        const isAuthEndpoint = config.url?.includes('/api/auth/');
        
        if (token && !isAuthEndpoint) {
          // Pre-emptive refresh: check if token is expired or about to expire
          if (this.isTokenExpired(token)) {
            try {
              // If already refreshing, this will wait for the same promise
              token = await this.refreshAccessToken();
            } catch (error) {
              // If refresh fails, let it proceed to trigger 401 response handling
              console.warn("Pre-emptive token refresh failed, proceeding to response handler.");
            }
          }
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add God Mode header if active
        const isGodMode = localStorage.getItem('lumins_god_mode') === 'true';
        if (isGodMode) {
          config.headers['X-God-Mode'] = 'true';
        }

        // Add Workspace ID header if available
        const workspaceId = localStorage.getItem('lastActiveWorkspaceId');
        if (workspaceId) {
          config.headers['X-Workspace-ID'] = workspaceId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh and retries
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        // Handle network errors or server downtime (502, 503, 504)
        const isRetryableError = !error.response || (error.response.status >= 502 && error.response.status <= 504);
        
        if (isRetryableError && (originalRequest._retryCount || 0) < 2) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          const delay = originalRequest._retryCount * 2000;
          
          console.warn(`Connection error (${error.message}). Retrying in ${delay}ms... (Attempt ${originalRequest._retryCount}/2)`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client(originalRequest);
        }

        // Skip token refresh for authentication endpoints
        const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/');
        
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
          } catch (refreshError: any) {
            processQueue(refreshError as Error, null);
            
            // Only clear tokens and redirect if the server explicitly rejected the refresh token
            // with a 401 or 403 error. For network errors (no response) or 5xx server errors, 
            // we keep the session to allow retrying when the server is back up.
            if (refreshError.response && (refreshError.response.status === 401 || refreshError.response.status === 403)) {
              this.clearTokens();
              window.location.href = '/login';
            } else {
              console.warn("Server unavailable or temporary error during token refresh. Keeping session...");
            }
            
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

  // Helper to check if JWT token is expired
  private isTokenExpired(token: string): boolean {
    try {
      // Decode JWT payload (middle part)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const { exp } = JSON.parse(jsonPayload);
      const now = Math.floor(Date.now() / 1000);
      
      // Consider expired if it will expire in the next 10 seconds
      return exp < (now + 10);
    } catch (e) {
      return true; // If invalid, treat as expired
    }
  }

  // Refresh token logic
  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        isRefreshing = true;
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true
        });

        const { accessToken } = response.data.data;
        this.setTokens(accessToken);
        
        // Notify other components (like Socket Context)
        window.dispatchEvent(new CustomEvent('lumins:token-refreshed', { 
          detail: { accessToken } 
        }));
        
        processQueue(null, accessToken);
        resolve(accessToken);
      } catch (error: any) {
        // Only clear tokens if the server explicitly returns an authentication error
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          this.clearTokens();
        }
        processQueue(error, null);
        reject(error);
      } finally {
        isRefreshing = false;
        this.refreshPromise = null;
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
