import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { ManagerDashboard } from "../../src/portals/manager/Dashboard";
import { UserProfile, Course } from "../../src/types";
import { useRouter } from "next/router";

const sidebarItems = [
  { id: "dashboard", label: "My Dashboard" },
  { id: "team", label: "My Team" },
  { id: "plans", label: "Team Business Plans" },
  { id: "training", label: "Team Training Progress" },
  { id: "onlineTraining", label: "Online Course Training" },
  { id: "taskTracker", label: "Task Tracker" }
];

const DashboardPage: NextPage = () => {
  const router = useRouter();
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

  function handleNavigation(id: string) {
    router.push(`/manager/${id === "dashboard" ? "dashboard" : id}`);
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
          subtitle="Manager view"
          userName="Manager"
          roleLabel="Manager"
          onLogout={handleLogout}
        />
      }
      sidebar={
        <Sidebar
          header={<div className="sidebar-title">Manager Portal</div>}
          items={sidebarItems}
          activeId="dashboard"
          onSelect={handleNavigation}
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
