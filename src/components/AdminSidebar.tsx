import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";

const allSidebarItems = [
  { id: "socialMediaMetrics", label: "Social Media Executive View", toggleKey: "socialMediaMetrics" },
  { id: "businessUnits", label: "Business Planner Executive View", toggleKey: "businessUnits" },
  { id: "trainingExecutive", label: "Course Leaderboard", toggleKey: "trainingCenter" },
  { id: "userManagement", label: "User Management", toggleKey: "userManagement" },
  { id: "courseManagement", label: "Course Builder", toggleKey: "courseManagement" },
  { id: "appsTools", label: "Apps & Tool Builder", toggleKey: "appsTools" },
  { id: "courseAiBots", label: "Course Bots Builder", toggleKey: "courseAiBots" },
  { id: "aiBots", label: "Master Bot Builder", toggleKey: "aiBots" },
  { id: "messaging", label: "SMS Config", toggleKey: "messaging" },
  { id: "leaderboard", label: "Zapier Config", toggleKey: "leaderboard" },
  { id: "emailConfig", label: "Email Config", toggleKey: "emailConfig" },
];

type AdminSidebarProps = {
  activeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

function getCached(userId: string): Record<string, boolean> | null {
  try {
    const raw = sessionStorage.getItem(`ft_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCache(userId: string, toggles: Record<string, boolean>) {
  try { sessionStorage.setItem(`ft_${userId}`, JSON.stringify(toggles)); } catch {}
}

export function AdminSidebar({ activeId, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean> | null>(
    user?.id ? getCached(user.id) : null
  );

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/users/${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.featureToggles) {
          setCache(user.id, data.featureToggles);
          setFeatureToggles(data.featureToggles);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const sidebarItems = featureToggles
    ? allSidebarItems.filter(item => featureToggles[item.toggleKey] !== false)
    : allSidebarItems;

  function handleNavigation(id: string) {
    router.push(`/admin/${id === "dashboard" ? "dashboard" : id.replace(/([A-Z])/g, "-$1").toLowerCase()}`);
  }

  return (
    <Sidebar
      header={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="sidebar-title">Admin Portal</span><img src="/ChatGPT_Image_Feb_23__2026__07_00_52_PM-removebg-preview.png" alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} /></div>}
      items={sidebarItems}
      activeId={activeId}
      onSelect={handleNavigation}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}
