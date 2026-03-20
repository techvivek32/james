import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
  { id: "socialMediaMetrics", label: "Social Media Executive View" },
  { id: "businessUnits", label: "Business Planner Executive View" },
  { id: "trainingExecutive", label: "Training Center Executive View" },
  { id: "userManagement", label: "User Management" },
  { id: "courseManagement", label: "Course Builder" },
  { id: "appsTools", label: "Apps & Tool Builder" },
  { id: "courseAiBots", label: "Course AI Bots Builder" },
  { id: "aiBots", label: "Master AI Bot Builder" },
  { id: "messaging", label: "SMS Configuration" },
  // Hidden modules - don't delete
  // { id: "dashboard", label: "Dashboard" },
  // { id: "roleHierarchy", label: "Role & Hierarchy Manager" },
  // { id: "materialsLibrary", label: "Marketing Materials Library" },
  // { id: "webTemplates", label: "Web Page Approval" },
  // { id: "webText", label: "Web Page Text" },
];

type AdminSidebarProps = {
  activeId: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function AdminSidebar({ activeId, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const router = useRouter();

  function handleNavigation(id: string) {
    router.push(`/admin/${id === "dashboard" ? "dashboard" : id.replace(/([A-Z])/g, "-$1").toLowerCase()}`);
  }

  return (
    <Sidebar
      header={<div className="sidebar-title">Admin Portal</div>}
      items={sidebarItems}
      activeId={activeId}
      onSelect={handleNavigation}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}
