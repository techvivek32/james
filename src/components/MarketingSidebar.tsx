import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

const baseItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "assets", label: "Marketing Assets" },
  { id: "approvals", label: "Approval Queue" },
  { id: "socialMetrics", label: "Social Metrics" },
  { id: "apps-tools", label: "Apps & Tools" },
  { id: "ai-chat", label: "AI Assistant" }
];

type MarketingSidebarProps = {
  activeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function MarketingSidebar({ activeId, isCollapsed, onToggleCollapse }: MarketingSidebarProps) {
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
    ? [...baseItems, { id: "ai-bot-builder", label: "Master AI Bot Builder" }]
    : baseItems;

  function handleNavigation(id: string) {
    router.push(`/marketing/${id}`);
  }

  return (
    <Sidebar
      header={<div className="sidebar-title">Marketing Portal</div>}
      items={sidebarItems}
      activeId={activeId}
      onSelect={handleNavigation}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}
