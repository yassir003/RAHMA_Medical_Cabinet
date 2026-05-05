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
import {
  login as apiLogin,
  register as apiRegister,
  changePasswordApi,
  type AuthResponse,
  type PageItem,
  type RegisterRequestDto,
  ApiError,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decode the payload of a JWT without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "ADMIN" | "MEDECIN" | "SECRETAIRE" | "PATIENT";

export interface AuthUser {
  email: string;
  role: Role;
  token: string;
  passwordChanged: boolean;
  pages?: PageItem[];
  /** User entity ID extracted from the JWT `userId` claim. */
  userId?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequestDto) => Promise<void>;
  changePassword: (ancien: string, nouveau: string) => Promise<void>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "rahma_auth_user";

// ---------------------------------------------------------------------------
// Role → default landing page
// ---------------------------------------------------------------------------

export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":      return "/dashboard";
    case "MEDECIN":    return "/dashboard/doctors";
    case "SECRETAIRE": return "/dashboard/secretary";
    case "PATIENT":    return "/dashboard/appointments";
    default:           return "/dashboard";
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  // Persist user to localStorage whenever it changes
  const persistUser = useCallback((authUser: AuthUser | null) => {
    if (authUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res: AuthResponse = await apiLogin(email, password);

      const payload = decodeJwtPayload(res.token);
      const authUser: AuthUser = {
        email: res.email,
        role: res.role,
        token: res.token,
        passwordChanged: res.passwordChanged,
        pages: res.pages,
        userId: typeof payload.userId === "number" ? payload.userId : undefined,
      };

      persistUser(authUser);

      // Patients with a temporary password must change it before anything else
      if (!res.passwordChanged) {
        router.push("/change-password");
      } else {
        router.push(defaultRouteForRole(authUser.role));
      }
    },
    [router, persistUser]
  );

  const register = useCallback(
    async (data: RegisterRequestDto) => {
      const res: AuthResponse = await apiRegister(data);

      const payload = decodeJwtPayload(res.token);
      const authUser: AuthUser = {
        email: res.email,
        role: res.role,
        token: res.token,
        passwordChanged: res.passwordChanged,
        pages: res.pages,
        userId: typeof payload.userId === "number" ? payload.userId : undefined,
      };

      persistUser(authUser);

      // Self-registered patients start with passwordChanged=false (set via /auth/register)
      if (!res.passwordChanged) {
        router.push("/change-password");
      } else {
        router.push(defaultRouteForRole(authUser.role));
      }
    },
    [router, persistUser]
  );

  const changePassword = useCallback(
    async (ancien: string, nouveau: string) => {
      await changePasswordApi({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });

      // Mark passwordChanged in local state and storage
      if (user) {
        const updated: AuthUser = { ...user, passwordChanged: true };
        persistUser(updated);
        router.push(defaultRouteForRole(user.role));
      }
    },
    [user, router, persistUser]
  );

  const logout = useCallback(() => {
    persistUser(null);
    router.push("/login");
  }, [router, persistUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      changePassword,
      logout,
    }),
    [user, isLoading, login, register, changePassword, logout]
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
