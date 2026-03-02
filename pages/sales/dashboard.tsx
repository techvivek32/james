import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "../../src/components/Layout";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { SalesDashboard } from "../../src/portals/sales/Dashboard";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile } from "../../src/types";

const sidebarItems = [
  { id: "dashboard", label: "My Dashboard" },
  { id: "profile", label: "My Profile" },
  { id: "plan", label: "My Business Plan" },
  { id: "training", label: "Training Center" },
  { id: "materials", label: "Marketing Materials" },
  { id: "aiChat", label: "Jay Miller's Clone" },
  { id: "webPage", label: "My Web Page" },
  { id: "businessCards", label: "Tools/ Apps" }
];

const DashboardPage: NextPage = () => {
  const router = useRouter();
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

  function handleNavigation(id: string) {
    router.push(`/sales/${id}`);
  }

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["sales"]}>
      <Layout
        isSidebarCollapsed={isSidebarCollapsed}
        sidebar={
          <Sidebar
            header={<div className="sidebar-title">Sales Team Portal</div>}
            items={sidebarItems}
            activeId="dashboard"
            onSelect={handleNavigation}
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
