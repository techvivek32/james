import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
  { id: "dashboard", label: "Team Dashboard" },
  { id: "plans", label: "Team Business Planners" },
  { id: "onlineTraining", label: "Training Center" },
  { id: "jays-ai-clone", label: "Jay's AI Clone (coming soon)" },
  { id: "apps-tools", label: "Apps & Tools" },
  { id: "my-profile", label: "My Profile" },
  { id: "task-manager", label: "Task Manager (coming soon)" },
  // Hidden modules - don't delete
  // { id: "training", label: "Training Progress" },
  // { id: "team", label: "My Team" },
  // { id: "taskTracker", label: "Task Tracker" },
  // { id: "web-templates", label: "Web Page Approvals" },
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
