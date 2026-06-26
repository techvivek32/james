import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { NotificationBell } from "./NotificationBell";
import { TicketButton } from "./TicketButton";
import { useAuth } from "../contexts/AuthContext";

type HeaderProps = {
  title: string;
  subtitle?: string;
  userName: string;
  roleLabel: string;
  userId?: string;
  onLogout: () => void;
  showProfileDropdown?: boolean;
  panelName?: string; // Add panel name prop
};

export function Header(props: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isImpersonating, exitImpersonation } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="header">
      <div className="header-titles">
        {/* Show panel name on mobile/tablet next to hamburger menu */}
        {props.panelName && (
          <div className="header-panel-name">
            {props.panelName}
          </div>
        )}
        <h1 className="header-title">{props.title} {props.panelName && <span style={{ fontSize: '1em', marginLeft: 2 }}><span style={{ color: 'inherit' }}>| </span><span style={{ color: '#dc2626' }}>{props.panelName}</span></span>}</h1>
        {props.subtitle && (
          <p className="header-subtitle">{props.subtitle}</p>
        )}
      </div>
      <div className="header-profile">
        {isImpersonating && (
          <>
            <span
              title="You are viewing the app as another user"
              style={{
                background: "#ea580c",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                whiteSpace: "nowrap",
              }}
            >
              Viewing As
            </span>
            <button
              type="button"
              disabled={exiting}
              onClick={async () => {
                setExiting(true);
                try {
                  await exitImpersonation();
                } finally {
                  setExiting(false);
                }
              }}
              style={{
                background: "#fff",
                color: "#b45309",
                border: "1px solid #ea580c",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 700,
                cursor: exiting ? "default" : "pointer",
                opacity: exiting ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {exiting ? "Exiting…" : "Exit View"}
            </button>
          </>
        )}
        <TicketButton />
        {props.userId && <NotificationBell userId={props.userId} />}
        <div className="header-user-info" style={{ position: "relative" }} ref={dropdownRef}>
          <span 
            className="header-user-name" 
            onClick={() => props.showProfileDropdown && setShowDropdown(!showDropdown)}
            style={props.showProfileDropdown ? { cursor: "pointer" } : {}}
          >
            {props.userName}
          </span>
          <span 
            className="header-user-role"
            onClick={() => props.showProfileDropdown && setShowDropdown(!showDropdown)}
            style={props.showProfileDropdown ? { cursor: "pointer" } : {}}
          >
            {props.roleLabel}
          </span>
          {props.showProfileDropdown && showDropdown && (
            <div style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "8px",
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              minWidth: "150px",
              zIndex: 1000
            }}>
              <div 
                onClick={() => {
                  setShowDropdown(false);
                  router.push("/sales/profile");
                }}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                My Profile
              </div>
            </div>
          )}
        </div>
        <button className="header-logout" onClick={props.onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
