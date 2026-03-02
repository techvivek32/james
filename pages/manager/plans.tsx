import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { ManagerSidebar } from "../../src/components/ManagerSidebar";
import { Header } from "../../src/components/Header";
import { TeamBusinessPlansPage } from "../../src/portals/manager/TeamBusinessPlans";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile } from "../../src/types";

const PlansPage: NextPage = () => {
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
        console.error("Failed to load plans data:", error);
      }
    }
    loadData();
  }, []);

  async function handleTeamMembersChange(members: UserProfile[]) {
    setTeamMembers(members);
    try {
      await fetch("/api/users/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(members)
      });
    } catch (error) {
      console.error("Failed to update team members:", error);
    }
  }

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
          activeId="plans"
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      <TeamBusinessPlansPage teamMembers={teamMembers} onTeamMembersChange={handleTeamMembersChange} />
    </Layout>
  );
};

export default PlansPage;
