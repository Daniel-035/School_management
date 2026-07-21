import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AuthSession, User } from "@/types";
import { authService } from "@/services/authService";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextValue {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const stored = authService.getCurrentSession();
      if (!stored) {
        if (active) setIsLoading(false);
        return;
      }
      try {
        const user = await authService.getCurrentUser();
        if (active && user) {
          setSession({ ...(authService.getCurrentSession() ?? stored), user });
        }
      } catch {
        if (active) setSession(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    const expire = () => setSession(null);
    window.addEventListener("auth:session-expired", expire);
    void hydrate();
    return () => {
      active = false;
      window.removeEventListener("auth:session-expired", expire);
    };
  }, []);

  const login = async (email: string, password: string) => {
    queryClient.clear();
    const next = await authService.login(email, password);
    setSession(next);
  };

  const logout = async () => {
    await authService.logout();
    queryClient.clear();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
