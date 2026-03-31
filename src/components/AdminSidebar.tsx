import { useRouter } from "next/router";
import { Sidebar } from "./Sidebar";

const sidebarItems = [
  { id: "socialMediaMetrics", label: "Social Media Executive View" },
  { id: "businessUnits", label: "Business Planner Executive View" },
  { id: "trainingExecutive", label: "Training Center Executive View" },
  { id: "userManagement", label: "User Management" },
  { id: "courseManagement", label: "Course Builder" },
  { id: "appsTools", label: "Apps & Tool Builder" },
  { id: "courseAiBots", label: "Course Bots Builder" },
  { id: "aiBots", label: "Master Bot Builder" },
  { id: "messaging", label: "SMS Config" },
  { id: "leaderboard", label: "Zapier Config" },
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
      header={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="sidebar-title">Admin Portal</span><img src="/ChatGPT_Image_Feb_23__2026__07_00_52_PM-removebg-preview.png" alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} /></div>}
      items={sidebarItems}
      activeId={activeId}
      onSelect={handleNavigation}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}
