import axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios';

// Mock localStorage for SSR
const localStorageMock = {
  getItem: () => null,
  setItem: () => { },
  removeItem: () => { },
  clear: () => { },
};

const safeLocalStorage = typeof window !== 'undefined' ? window.localStorage : localStorageMock;

// Use environment variable for API base URL (defaults to same origin)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const localApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
});


// Check if the URL is for the refresh token endpoint to avoid infinite loops
const isRefreshTokenEndpoint = (url: string): boolean => {
  return url.includes("/api/auth/refresh");
};

// Safe localStorage access
const getLocalStorageItem = (key: string): string | null => {
  try {
    return safeLocalStorage.getItem(key);
  } catch {
    return null;
  }
};

const setLocalStorageItem = (key: string, value: string): void => {
  try {
    safeLocalStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
};

const removeLocalStorageItem = (key: string): void => {
  try {
    safeLocalStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
};

const redirectToLogin = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const setupInterceptors = (apiInstance: AxiosInstance) => {
  apiInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      const token = getLocalStorageItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
  );

  apiInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError): Promise<unknown> => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Only refresh token when we get a 401/403 error (token is invalid/expired)
      if (error.response?.status && [401, 403].includes(error.response.status) &&
        !originalRequest._retry &&
        originalRequest.url && !isRefreshTokenEndpoint(originalRequest.url)) {
        originalRequest._retry = true;

        try {
          const refreshToken = getLocalStorageItem('refreshToken');
          if (!refreshToken) {
            // If no refresh token, we can't do anything, so just reject and redirect
            redirectToLogin();
            return Promise.reject(error);
          }

          const response = await localApi.post(`/api/auth/refresh`, {
            refreshToken,
          });

          if (response.data.data) {
            const newAccessToken = response.data.data.accessToken;
            const newRefreshToken = response.data.data.refreshToken;

            setLocalStorageItem('accessToken', newAccessToken);
            setLocalStorageItem('refreshToken', newRefreshToken);

            // Update original request headers and retry
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            return localApi(originalRequest);
          } else {
            throw new Error('Invalid response from refresh token endpoint');
          }
        } catch (err) {
          removeLocalStorageItem('refreshToken');
          removeLocalStorageItem('accessToken');
          redirectToLogin();
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );
};

setupInterceptors(localApi);


const api = {
  request: (config: AxiosRequestConfig) => {
    const apiInstance = localApi;
    return apiInstance(config);
  },
  get: (url: string, config?: AxiosRequestConfig) => {
    const apiInstance = localApi;
    return apiInstance.get(url, config);
  },
  post: (url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const apiInstance = localApi;
    return apiInstance.post(url, data, config);
  },
  put: (url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const apiInstance = localApi;
    return apiInstance.put(url, data, config);
  },
  patch: (url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const apiInstance = localApi;
    return apiInstance.patch(url, data, config);
  },
  delete: (url: string, config?: AxiosRequestConfig) => {
    const apiInstance = localApi;
    return apiInstance.delete(url, config);
  },
};

export default api;
