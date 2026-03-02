import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "../../components/Layout";
import { Sidebar } from "../../components/Sidebar";
import { Header } from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";
import { Course, UserProfile } from "../../types";

type AdminViewId =
  | "dashboard"
  | "userManagement"
  | "roleHierarchy"
  | "businessUnits"
  | "salesOverview"
  | "marketingOverview"
  | "courseManagement"
  | "materialsLibrary"
  | "approvalWorkflows"
  | "aiBots"
  | "webTemplates"
  | "appsTools";

const sidebarItems: { id: AdminViewId; label: string; route: string }[] = [
  { id: "dashboard", label: "Dashboard", route: "/admin/dashboard" },
  { id: "userManagement", label: "User Management", route: "/admin/user-management" },
  { id: "roleHierarchy", label: "Role & Hierarchy Manager", route: "/admin/role-hierarchy" },
  { id: "businessUnits", label: "Business Units", route: "/admin/business-units" },
  { id: "salesOverview", label: "Sales Team Overview", route: "/admin/sales-overview" },
  { id: "marketingOverview", label: "Marketing Overview", route: "/admin/marketing-overview" },
  { id: "courseManagement", label: "Course Management", route: "/admin/course-management" },
  { id: "materialsLibrary", label: "Marketing Materials Library", route: "/admin/materials-library" },
  { id: "approvalWorkflows", label: "Approval Workflows", route: "/admin/approval-workflows" },
  { id: "aiBots", label: "AI Bot Management", route: "/admin/ai-bots" },
  { id: "webTemplates", label: "Web Page Templates", route: "/admin/web-templates" },
  { id: "appsTools", label: "Apps/Tool", route: "/admin/apps-tools" }
];

type AdminLayoutProps = {
  children: React.ReactNode;
  currentView: AdminViewId;
};

export function AdminLayout({ children, currentView }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  function handleNavigation(viewId: AdminViewId) {
    const item = sidebarItems.find((i) => i.id === viewId);
    if (item) {
      router.push(item.route);
    }
  }

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Sales & Marketing OS"
          subtitle="Enterprise control center"
          userName={user?.name ?? "Admin"}
          roleLabel="Admin"
          onLogout={logout}
        />
      }
      sidebar={
        <Sidebar
          header={<div className="sidebar-title">Admin Portal</div>}
          items={sidebarItems.map((item) => ({ id: item.id, label: item.label }))}
          activeId={currentView}
          onSelect={handleNavigation}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      {children}
    </Layout>
  );
}

export { sidebarItems };
export type { AdminViewId };
