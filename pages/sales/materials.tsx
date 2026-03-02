import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { SalesSidebar } from "../../src/components/SalesSidebar";
import { Header } from "../../src/components/Header";
import { MarketingMaterials } from "../../src/portals/sales/MarketingMaterials";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile } from "../../src/types";

const Materials: NextPage = () => {
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
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      sidebar={
        <SalesSidebar
          activeId="materials"
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
      <MarketingMaterials />
    </Layout>
  );
};

export default Materials;
