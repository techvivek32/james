import { useState } from "react";
import { Layout } from "../../components/Layout";
import { MarketingSidebar } from "../../components/MarketingSidebar";
import { Header } from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";

type MarketingViewId = "dashboard" | "assets" | "approvals" | "socialMetrics" | "training" | "apps-tools" | "ai-chat" | "ai-bot-builder";

type MarketingLayoutProps = {
  children: React.ReactNode;
  currentView: MarketingViewId;
};

export function MarketingLayout({ children, currentView }: MarketingLayoutProps) {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Miller Storm Operating System"
          userName={user?.name ?? "Marketing"}
          roleLabel="Marketing"
          panelName="Marketing Portal"
          onLogout={logout}
        />
      }
      sidebar={
        <MarketingSidebar
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

export type { MarketingViewId };
