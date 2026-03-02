import type { NextPage } from "next";
import { useState } from "react";
import { Layout } from "../../src/components/Layout";
import { MarketingSidebar } from "../../src/components/MarketingSidebar";
import { Header } from "../../src/components/Header";
import { Placeholder } from "../../src/portals/marketing/Placeholder";
import { useAuth } from "../../src/contexts/AuthContext";

const TrainingPage: NextPage = () => {
  const { logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Unified Sales & Marketing OS"
          subtitle="Marketing view"
          userName="Marketing"
          roleLabel="Marketing"
          onLogout={logout}
        />
      }
      sidebar={
        <MarketingSidebar
          activeId="training"
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      <Placeholder
        title="Marketing Training Center"
        description="Courses and resources for marketing team members."
      />
    </Layout>
  );
};

export default TrainingPage;
