import type { AuthSession, User } from "@/types";
import { api } from "./api";

const SESSION_KEY = "educonnect.session";
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    const result = await api.post<{ token: string; accessToken?: string; refreshToken: string; user: User }>("/auth/login", { email, password });
    const session: AuthSession = {
      token: result.accessToken ?? result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const result = await api.post<{ token: string; accessToken?: string; refreshToken: string; user: User }>("/auth/register", payload);
    const session: AuthSession = {
      token: result.accessToken ?? result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/forgot-password", { email });
  },

  async resetPassword(oobCode: string, newPassword: string): Promise<void> {
    await api.post("/auth/reset-password", { oobCode, newPassword });
  },

  async logout(): Promise<void> {
    const session = this.getCurrentSession();
    if (session?.refreshToken) {
      await api.post("/auth/logout", { refreshToken: session.refreshToken }).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const session = this.getCurrentSession();
    if (!session) return null;
    const result = await api.get<{ user: User }>("/auth/me");
    const refreshedSession = this.getCurrentSession() ?? session;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...refreshedSession, user: result.user }));
    return result.user;
  },
};
