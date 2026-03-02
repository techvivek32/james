import { useState } from "react";
import { Layout } from "../../components/Layout";
import { AdminSidebar } from "../../components/AdminSidebar";
import { Header } from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";

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

type AdminLayoutProps = {
  children: React.ReactNode;
  currentView: AdminViewId;
};

export function AdminLayout({ children, currentView }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        <AdminSidebar
          activeId={currentView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      {children}
    </Layout>
  );
}

export type { AdminViewId };
