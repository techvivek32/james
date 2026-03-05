import { useState } from "react";
import { Layout } from "../../components/Layout";
import { SalesSidebar } from "../../components/SalesSidebar";
import { Header } from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";

type SalesViewId = "dashboard" | "profile" | "plan" | "training" | "materials" | "aiChat" | "webPage" | "businessCards" | "apps-tools";

type SalesLayoutProps = {
  children: React.ReactNode;
  currentView: SalesViewId;
  userName?: string;
  userId?: string;
};

export function SalesLayout({ children, currentView, userName, userId }: SalesLayoutProps) {
  const { logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Sales Operating System"
          subtitle="Sales Professional View"
          userName={userName ?? "Sales Rep"}
          userId={userId}
          roleLabel="Sales Rep"
          onLogout={logout}
          showProfileDropdown={true}
        />
      }
      sidebar={
        <SalesSidebar
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

export type { SalesViewId };
