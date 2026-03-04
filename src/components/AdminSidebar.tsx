import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "userManagement", label: "User Management" },
  { id: "roleHierarchy", label: "Role & Hierarchy Manager" },
  { id: "businessUnits", label: "Sales Business Plan" },
  { id: "courseManagement", label: "Course Management" },
  { id: "materialsLibrary", label: "Marketing Materials Library" },
  { id: "aiBots", label: "AI Bot Management" },
  { id: "webTemplates", label: "Web Page Approval" },
  { id: "webText", label: "Web Page Text" },
  { id: "appsTools", label: "Apps/Tool" },
  { id: "socialMediaMetrics", label: "Social Media Metrics" }
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
