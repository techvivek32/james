import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

const baseItems = [
  { id: "dashboard", label: "Team Dashboard", toggleKey: "dashboard" },
  { id: "plans", label: "Team Business Planners", toggleKey: "plans" },
  { id: "onlineTraining", label: "Training Center", toggleKey: "onlineTraining" },
  { id: "jays-ai-clone", label: "Jay's AI Clone (coming soon)", toggleKey: "aiChat" },
  { id: "apps-tools", label: "Apps & Tools", toggleKey: "appsTools" },
  { id: "my-profile", label: "My Profile", toggleKey: "profile" },
  { id: "task-manager", label: "Task Manager (coming soon)", toggleKey: "taskTracker" },
];

type ManagerSidebarProps = {
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

export function ManagerSidebar({ activeId, isCollapsed, onToggleCollapse }: ManagerSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [hasBotAccess, setHasBotAccess] = useState(false);
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean> | null>(
    user?.id ? getCached(user.id) : null
  );

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/ai-bots").then(r => r.ok ? r.json() : []).then((bots: any[]) => {
      setHasBotAccess(bots.some((b: any) => b.teamMembers?.includes(user.id)));
    });
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

  const allItems = hasBotAccess
    ? [...baseItems, { id: "ai-bot-builder", label: "Master Bot Builder", toggleKey: "aiBots" }]
    : baseItems;

  const sidebarItems = featureToggles
    ? allItems.filter(item => featureToggles[item.toggleKey] !== false)
    : allItems;

  function handleNavigation(id: string) {
    router.push(`/manager/${id}`);
  }

  return (
    <Sidebar
      header={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="sidebar-title">Manager Portal</span><img src="/ChatGPT_Image_Feb_23__2026__07_00_52_PM-removebg-preview.png" alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} /></div>}
      items={sidebarItems}
      activeId={activeId}
      onSelect={handleNavigation}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}
