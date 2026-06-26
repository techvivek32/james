import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { getToken, setToken, clearToken, installAuthFetch } from "../lib/authToken";

// Install the global Authorization-header fetch wrapper as early as possible,
// before any component fires off API requests.
installAuthFetch();

type Role = "admin" | "manager" | "sales" | "marketing";

type User = {
  _id?: string; // MongoDB ID
  id: string;
  name: string;
  email: string;
  role: Role;
  managerId?: string;
  // ── Impersonation flags (set only while an admin is "viewing as") ──
  isImpersonating?: boolean;
  originalRole?: Role | null;
  impersonatedBy?: string | null;
  adminName?: string | null;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isImpersonating: boolean;
  viewAs: (userId: string) => Promise<void>;
  exitImpersonation: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// localStorage keys used to back up the admin session while impersonating, so
// we can always return to the admin even if the exit API call fails.
const BACKUP_TOKEN_KEY = "ms_admin_backup_token";
const BACKUP_USER_KEY = "ms_admin_backup_user";

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin/social-media-metrics",
  manager: "/manager/dashboard",
  sales: "/sales/dashboard",
  marketing: "/marketing/dashboard",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    installAuthFetch();
    let storedUser: User | null = null;
    const raw = localStorage.getItem("user");
    if (raw && raw !== "undefined") {
      try {
        storedUser = JSON.parse(raw);
        setUser(storedUser);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);

    // Reconcile with the server so impersonation flags survive a page refresh
    // and an expired token logs the user out. Best-effort; never blocks render.
    if (storedUser) {
      void reconcileFromServer();
    }
  }, []);

  // Pull the authoritative current user (incl. impersonation status) from the
  // server. A 401 means the token is gone/expired → log out.
  async function reconcileFromServer() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) return;
      const me = await res.json();
      const next: User = {
        _id: me._id,
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        managerId: me.managerId,
        isImpersonating: !!me.isImpersonating,
        originalRole: me.originalRole ?? null,
        impersonatedBy: me.impersonatedBy ?? null,
        adminName: (() => {
          try {
            const b = localStorage.getItem(BACKUP_USER_KEY);
            return b ? (JSON.parse(b).name ?? null) : null;
          } catch {
            return null;
          }
        })(),
      };
      setUser(next);
      localStorage.setItem("user", JSON.stringify(next));
    } catch {
      /* offline / network — keep the cached user */
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const userData = await response.json();

    // A fresh real login can never be an impersonation — clear any stale backup.
    clearBackup();

    // Store the server-issued token so every subsequent API request can send
    // it as an Authorization: Bearer header (see installAuthFetch).
    if (userData.token) {
      setToken(userData.token);
    }

    const nextUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      managerId: userData.managerId,
      isImpersonating: false,
    };

    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
    router.push(ROLE_HOME[nextUser.role] || "/login");
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("user");
    clearBackup();
    clearToken();
    router.push("/login");
  }

  // ── Impersonation ────────────────────────────────────────────────────────

  function clearBackup() {
    try {
      localStorage.removeItem(BACKUP_TOKEN_KEY);
      localStorage.removeItem(BACKUP_USER_KEY);
    } catch {
      /* ignore */
    }
  }

  // Admin starts "viewing as" the target user.
  async function viewAs(userId: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/view-as`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Unable to view as this user.");
    }
    const data = await res.json();

    // Back up the current admin session BEFORE swapping tokens, so we can
    // always restore even if the exit endpoint later fails.
    const currentToken = getToken();
    if (currentToken) localStorage.setItem(BACKUP_TOKEN_KEY, currentToken);
    if (user) localStorage.setItem(BACKUP_USER_KEY, JSON.stringify(user));

    if (data.token) setToken(data.token);

    const impersonatedUser: User = {
      _id: data.user._id,
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      managerId: data.user.managerId,
      isImpersonating: true,
      originalRole: (data.originalRole ?? user?.role ?? "admin") as Role,
      impersonatedBy: data.impersonatedBy ?? user?.id ?? null,
      adminName: data.adminName ?? user?.name ?? null,
    };
    setUser(impersonatedUser);
    localStorage.setItem("user", JSON.stringify(impersonatedUser));
    router.push(data.redirect || ROLE_HOME[impersonatedUser.role] || "/login");
  }

  // Restore the original admin session.
  async function exitImpersonation() {
    try {
      const res = await fetch("/api/admin/impersonation/exit", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.token) setToken(data.token);
        const adminUser: User = {
          _id: data.user._id,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          managerId: data.user.managerId,
          isImpersonating: false,
        };
        setUser(adminUser);
        localStorage.setItem("user", JSON.stringify(adminUser));
        clearBackup();
        router.push(data.redirect || ROLE_HOME[adminUser.role] || "/admin/social-media-metrics");
        return;
      }
    } catch {
      /* fall through to client-side restore below */
    }

    // Fallback (e.g. impersonation token expired): restore from the local backup.
    const backupToken = localStorage.getItem(BACKUP_TOKEN_KEY);
    const backupUser = localStorage.getItem(BACKUP_USER_KEY);
    if (backupToken && backupUser) {
      try {
        const restored: User = { ...JSON.parse(backupUser), isImpersonating: false };
        setToken(backupToken);
        setUser(restored);
        localStorage.setItem("user", JSON.stringify(restored));
        clearBackup();
        router.push(ROLE_HOME[restored.role] || "/admin/social-media-metrics");
        return;
      } catch {
        /* corrupt backup — fall through to logout */
      }
    }
    // Nothing to restore — force a clean re-login.
    logout();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isImpersonating: !!user?.isImpersonating,
        viewAs,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
