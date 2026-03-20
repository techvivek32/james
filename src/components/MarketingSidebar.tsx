import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
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
