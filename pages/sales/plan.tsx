import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { SalesSidebar } from "../../src/components/SalesSidebar";
import { Header } from "../../src/components/Header";
import { BusinessPlanPage } from "../../src/portals/sales/BusinessPlanPage";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile } from "../../src/types";

const Plan: NextPage = () => {
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

  async function handleProfileChange(updatedProfile: UserProfile) {
    setProfile(updatedProfile);
    try {
      await fetch(`/api/users/${updatedProfile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile)
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  }

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <Layout
      isSidebarCollapsed={isSidebarCollapsed}
      sidebar={
        <SalesSidebar
          activeId="plan"
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
      <BusinessPlanPage profile={profile} onProfileChange={handleProfileChange} />
    </Layout>
  );
};

export default Plan;
