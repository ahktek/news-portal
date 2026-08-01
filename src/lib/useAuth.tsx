"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Client-side auth for the TANGENT CMS.
 *
 * AUTH MODEL (Phase 1): Token-based.
 *   - POST /api/auth/login    → { success, session: { access_token, refresh_token, expires_in }, user }
 *   - POST /api/auth/register → { success, user } (does NOT auto-login)
 *   - POST /api/auth/logout   → { success: true } (stateless ack; client discards the token)
 *
 * The access token + user profile are persisted to localStorage under "tangent_auth"
 * and restored on mount, so a refresh keeps the session. Protected CMS API calls
 * should send it as `Authorization: Bearer <token>`.
 */

// ─── Types ────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  role?: string;
}

interface StoredAuth {
  token: string;
  user: AuthUser;
}

/** Result of login()/register() — forms branch on `.success`. */
export interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  /** True while the persisted session is being restored on mount. */
  isLoading: boolean;
  /** Last auth error (also returned from login/register results). */
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "tangent_auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Storage helpers ──────────────────────────────────────

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    // Corrupt/unreadable payload — treat as logged out.
    return null;
  }
}

function writeStoredAuth(auth: StoredAuth) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Storage unavailable (private mode / quota) — session lives until reload.
  }
}

function clearStoredAuth() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

/** Pull a human-readable message out of an API error response. */
async function parseErrorResponse(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // Non-JSON body — fall through to default.
  }
  return fallback;
}

// ─── Provider ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore the persisted session on mount (client only — localStorage).
  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          body && typeof body.error === "string"
            ? body.error
            : "Invalid email or password.";
        setError(message);
        return { success: false, error: message };
      }

      const auth: StoredAuth = {
        token: body.session.access_token as string,
        user: {
          id: body.user.id as string,
          email: body.user.email as string,
          role: body.user.role as string | undefined,
        },
      };

      writeStoredAuth(auth);
      setToken(auth.token);
      setUser(auth.user);
      return { success: true };
    } catch {
      const message = "Network error — please try again.";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string): Promise<AuthResult> => {
      setError(null);
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            display_name: displayName.trim(),
          }),
        });

        const body = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            body && typeof body.error === "string"
              ? body.error
              : "Registration failed. Please try again.";
          setError(message);
          return { success: false, error: message };
        }

        // NOTE: register() deliberately does NOT auto-login or persist a token —
        // the user confirms their account (Supabase confirmation email) and signs in.
        return { success: true };
      } catch {
        const message = "Network error — please try again.";
        setError(message);
        return { success: false, error: message };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setError(null);
    try {
      // Stateless server ack — local token discard is the real logout.
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort; local session is already cleared.
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoggedIn: token !== null,
      isLoading,
      error,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, error, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
