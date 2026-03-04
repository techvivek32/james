import { useState } from "react";
import { Layout } from "../../components/Layout";
import { ManagerSidebar } from "../../components/ManagerSidebar";
import { Header } from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";

type ManagerViewId = "dashboard" | "team" | "plans" | "training" | "onlineTraining" | "taskTracker" | "webTemplates" | "apps-tools";

type ManagerLayoutProps = {
  children: React.ReactNode;
  currentView: ManagerViewId;
};

export function ManagerLayout({ children, currentView }: ManagerLayoutProps) {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Unified Sales & Marketing OS"
          subtitle="Manager view"
          userName={user?.name ?? "Manager"}
          userId={user?.id}
          roleLabel="Manager"
          onLogout={logout}
        />
      }
      sidebar={
        <ManagerSidebar
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

export type { ManagerViewId };
