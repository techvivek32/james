import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  admin: "Super Admin",
  manager: "Manager",
  sales: "Sales",
  marketing: "Marketing",
};

// Fixed top banner shown on EVERY page while an admin is "viewing as" another
// user. Rendered once in pages/_app.tsx so it appears across all portals.
export function ImpersonationBanner() {
  const { user, isImpersonating, exitImpersonation } = useAuth();
  const [exiting, setExiting] = useState(false);

  if (!isImpersonating || !user) return null;

  const originalLabel = ROLE_LABEL[user.originalRole || "admin"] || "Admin";

  async function handleExit() {
    setExiting(true);
    try {
      await exitImpersonation();
    } finally {
      setExiting(false);
    }
  }

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100000,
        background: "linear-gradient(90deg, #b45309, #ea580c)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
      <span style={{ textAlign: "center" }}>
        You are currently viewing this account as{" "}
        <strong>{user.name}</strong>{" "}
        <span style={{ fontWeight: 400, opacity: 0.9 }}>
          (originally logged in as {originalLabel})
        </span>
      </span>
      <button
        type="button"
        onClick={handleExit}
        disabled={exiting}
        style={{
          marginLeft: 8,
          background: "#fff",
          color: "#b45309",
          border: "none",
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 13,
          fontWeight: 700,
          cursor: exiting ? "default" : "pointer",
          opacity: exiting ? 0.7 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {exiting ? "Exiting…" : "Exit View"}
      </button>
    </div>
  );
}
