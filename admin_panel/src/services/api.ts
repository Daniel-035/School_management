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

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new ApiError(json.error?.message || `Request failed: ${response.status}`, response.status, json.error?.code);
  }
  return json.data as T;
}

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshRequest) return refreshRequest;
  const session = getSession();
  if (!session?.refreshToken) {
    clearSession();
    throw new ApiError("Your session has expired", 401, "UNAUTHORIZED");
  }

  refreshRequest = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })
    .then((response) => parseResponse<{ token: string; accessToken?: string; refreshToken: string; user: unknown }>(response))
    .then((result) => {
      const token = result.accessToken ?? result.token;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ token, refreshToken: result.refreshToken, user: result.user }));
      return token;
    })
    .catch((error) => {
      clearSession();
      throw error;
    })
    .finally(() => {
      refreshRequest = null;
    });

  return refreshRequest;
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && retry && path !== "/auth/login" && path !== "/auth/refresh") {
    await refreshAccessToken();
    return request<T>(method, path, body, false);
  }
  return parseResponse<T>(response);
}

async function formRequest<T>(path: string, formData: FormData, retry = true): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getSession()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
  if (response.status === 401 && retry) {
    await refreshAccessToken();
    return formRequest<T>(path, formData, false);
  }
  return parseResponse<T>(response);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  postForm: <T>(path: string, formData: FormData) => formRequest<T>(path, formData),
};
