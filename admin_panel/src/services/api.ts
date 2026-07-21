import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const SESSION_KEY = "educonnect.session";

interface StoredSession {
  token: string;
  refreshToken: string;
  user: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function getSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("auth:session-expired"));
}

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getSession()?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    const resData = response.data as ApiResponse;
    if (!resData.success) {
      throw new ApiError(
        resData.error?.message || "Request failed",
        response.status,
        resData.error?.code
      );
    }
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Handle structured API error formats
    if (error.response?.data) {
      const resData = error.response.data;
      if (!resData.success) {
        return Promise.reject(
          new ApiError(
            resData.error?.message || "Request failed",
            status || 500,
            resData.error?.code
          )
        );
      }
    }

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/login" &&
      originalRequest.url !== "/auth/refresh"
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const session = getSession();
      if (!session?.refreshToken) {
        clearSession();
        return Promise.reject(new ApiError("Your session has expired", 401, "UNAUTHORIZED"));
      }

      try {
        const response = await axios.post<ApiResponse<{ token: string; accessToken?: string; refreshToken: string; user: unknown }>>(
          `${API_BASE}/auth/refresh`,
          { refreshToken: session.refreshToken }
        );
        const result = response.data;
        if (!result.success || !result.data) {
          throw new Error("Token refresh failed");
        }
        const token = result.data.accessToken ?? result.data.token;
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            token,
            refreshToken: result.data.refreshToken,
            user: result.data.user,
          })
        );
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearSession();
        return Promise.reject(
          new ApiError("Your session has expired", 401, "UNAUTHORIZED")
        );
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(
      new ApiError(error.message || "Network Error", status || 500, "NETWORK_ERROR")
    );
  }
);

export const api = {
  get: <T>(path: string) => apiClient.get<ApiResponse<T>>(path).then((res) => res.data.data as T),
  post: <T>(path: string, body?: unknown) =>
    apiClient.post<ApiResponse<T>>(path, body).then((res) => res.data.data as T),
  put: <T>(path: string, body?: unknown) =>
    apiClient.put<ApiResponse<T>>(path, body).then((res) => res.data.data as T),
  delete: <T>(path: string) =>
    apiClient.delete<ApiResponse<T>>(path).then((res) => res.data.data as T),
  postForm: <T>(path: string, formData: FormData) =>
    apiClient
      .post<ApiResponse<T>>(path, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data.data as T),
};
