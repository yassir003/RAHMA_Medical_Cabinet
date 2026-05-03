"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, type AuthResponse, type PageItem, ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "ADMIN" | "MEDECIN" | "SECRETAIRE" | "PATIENT";

export interface AuthUser {
  email: string;
  role: Role;
  token: string;
  pages?: PageItem[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEY = "rahma_auth_user";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Role → default landing page
// ---------------------------------------------------------------------------

export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard";
    case "MEDECIN":
      return "/dashboard/doctors";
    case "SECRETAIRE":
      return "/dashboard/secretary";
    case "PATIENT":
      return "/dashboard/appointments";
    default:
      return "/dashboard";
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        if (parsed.token && parsed.role && parsed.email) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res: AuthResponse = await apiLogin(email, password);

      const authUser: AuthUser = {
        email: res.email,
        role: res.role,
        token: res.token,
        pages: res.pages,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);

      // Navigate to role-appropriate page
      router.push(defaultRouteForRole(authUser.role));
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
