import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";

const allSidebarItems = [
  { id: "socialMediaMetrics", label: "Social Media Executive View", toggleKey: "socialMediaMetrics" },
  { id: "businessUnits", label: "Business Planner Executive View", toggleKey: "businessUnits" },
  { id: "trainingExecutive", label: "Training Center Executive View", toggleKey: "trainingCenter" },
  { id: "userManagement", label: "User Management", toggleKey: "userManagement" },
  { id: "courseManagement", label: "Course Builder", toggleKey: "courseManagement" },
  { id: "appsTools", label: "Apps & Tool Builder", toggleKey: "appsTools" },
  { id: "courseAiBots", label: "Course Bots Builder", toggleKey: "courseAiBots" },
  { id: "aiBots", label: "Master Bot Builder", toggleKey: "aiBots" },
  { id: "messaging", label: "SMS Config", toggleKey: "messaging" },
  { id: "leaderboard", label: "Zapier Config", toggleKey: "leaderboard" },
];

type AdminSidebarProps = {
  activeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function AdminSidebar({ activeId, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean> | null>(null);
  const [togglesLoaded, setTogglesLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/users/${user.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.featureToggles) setFeatureToggles(data.featureToggles); })
      .catch(() => {})
      .finally(() => setTogglesLoaded(true));
  }, [user?.id]);

  const sidebarItems = togglesLoaded
    ? (featureToggles ? allSidebarItems.filter(item => featureToggles[item.toggleKey] !== false) : allSidebarItems)
    : [];

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
