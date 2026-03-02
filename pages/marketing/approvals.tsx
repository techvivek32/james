import type { NextPage } from "next";
import { useState } from "react";
import { Layout } from "../../src/components/Layout";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { Placeholder } from "../../src/portals/marketing/Placeholder";
import { useRouter } from "next/router";

const sidebarItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "training", label: "Training Center" },
  { id: "assets", label: "Asset Library" },
  { id: "approvals", label: "Content Approvals" },
  { id: "socialMetrics", label: "Social Metrics Dashboard" }
];

const ApprovalsPage: NextPage = () => {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  function handleNavigation(id: string) {
    router.push(`/marketing/${id}`);
  }

  function handleLogout() {
    router.push("/");
  }

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Unified Sales & Marketing OS"
          subtitle="Marketing view"
          userName="Marketing"
          roleLabel="Marketing"
          onLogout={handleLogout}
        />
      }
      sidebar={
        <Sidebar
          header={<div className="sidebar-title">Marketing Portal</div>}
          items={sidebarItems}
          activeId="approvals"
          onSelect={handleNavigation}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      <Placeholder
        title="Content Approvals"
        description="Track content requests and approvals across the org."
      />
    </Layout>
  );
};

export default ApprovalsPage;
