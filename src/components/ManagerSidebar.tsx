import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "team", label: "My Team" },
  { id: "plans", label: "Team Plans" },
  { id: "training", label: "Training Center" },
  { id: "onlineTraining", label: "Online Training" },
  { id: "taskTracker", label: "Task Tracker" },
  { id: "web-templates", label: "Web Page Approvals" }
];

type ManagerSidebarProps = {
  activeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function ManagerSidebar({ activeId, isCollapsed, onToggleCollapse }: ManagerSidebarProps) {
  const router = useRouter();

  function handleNavigation(id: string) {
    router.push(`/manager/${id}`);
  }

  return (
    <Sidebar
      header={<div className="sidebar-title">Manager Portal</div>}
      items={sidebarItems}
      activeId={activeId}
      onSelect={handleNavigation}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}
