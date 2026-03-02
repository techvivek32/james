import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { ManagerSidebar } from "../../src/components/ManagerSidebar";
import { Header } from "../../src/components/Header";
import { ManagerDashboard } from "../../src/portals/manager/Dashboard";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile } from "../../src/types";

const DashboardPage: NextPage = () => {
  const { logout } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const users = await usersRes.json();
          setTeamMembers(users.filter((u: UserProfile) => u.role === "sales"));
        }
      } catch (error) {
        console.error("Failed to load manager dashboard data:", error);
      }
    }
    loadData();
  }, []);

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      header={
        <Header
          title="Unified Sales & Marketing OS"
          subtitle="Manager view"
          userName="Manager"
          roleLabel="Manager"
          onLogout={logout}
        />
      }
      sidebar={
        <ManagerSidebar
          activeId="dashboard"
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      <ManagerDashboard teamMembers={teamMembers} />
    </Layout>
  );
};

export default DashboardPage;
