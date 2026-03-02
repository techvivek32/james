import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { SalesSidebar } from "../../src/components/SalesSidebar";
import { Header } from "../../src/components/Header";
import { SalesDashboard } from "../../src/portals/sales/Dashboard";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile } from "../../src/types";

const DashboardPage: NextPage = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const users = await usersRes.json();
          const salesUser = users.find((u: UserProfile) => u.role === "sales");
          if (salesUser) setProfile(salesUser);
        }
      } catch (error) {
        console.error("Failed to load sales data:", error);
      }
    }
    loadData();
  }, []);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["sales"]}>
      <Layout
        isSidebarCollapsed={isSidebarCollapsed}
        sidebar={
          <SalesSidebar
            activeId="dashboard"
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        }
        header={
          <Header
            title="Sales OS"
            subtitle="Sales rep view"
            userName={profile.name}
            roleLabel="Sales Rep"
            onLogout={logout}
          />
        }
      >
        <SalesDashboard profile={profile} />
      </Layout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
