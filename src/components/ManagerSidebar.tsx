import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

const baseItems = [
  { id: "dashboard", label: "Team Dashboard" },
  { id: "plans", label: "Team Business Planners" },
  { id: "onlineTraining", label: "Training Center" },
  { id: "jays-ai-clone", label: "Jay's AI Clone (coming soon)" },
  { id: "apps-tools", label: "Apps & Tools" },
  { id: "my-profile", label: "My Profile" },
  { id: "task-manager", label: "Task Manager (coming soon)" },
];

type ManagerSidebarProps = {
  activeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function ManagerSidebar({ activeId, isCollapsed, onToggleCollapse }: ManagerSidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [hasBotAccess, setHasBotAccess] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/ai-bots").then(r => r.ok ? r.json() : []).then((bots: any[]) => {
      const hasAccess = bots.some((b: any) => b.teamMembers?.includes(user.id));
      setHasBotAccess(hasAccess);
    });
  }, [user?.id]);

  const sidebarItems = hasBotAccess
    ? [...baseItems, { id: "ai-bot-builder", label: "Master Bot Builder" }]
    : baseItems;

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
