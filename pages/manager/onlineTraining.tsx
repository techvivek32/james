import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { ManagerOnlineTrainingPage } from "../../src/portals/manager/OnlineTraining";
import { Course, AuthenticatedUser } from "../../src/types";
import { useRouter } from "next/router";

const sidebarItems = [
  { id: "dashboard", label: "My Dashboard" },
  { id: "team", label: "My Team" },
  { id: "plans", label: "Team Business Plans" },
  { id: "training", label: "Team Training Progress" },
  { id: "onlineTraining", label: "Online Course Training" },
  { id: "taskTracker", label: "Task Tracker" }
];

const OnlineTrainingPage: NextPage = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentUser: AuthenticatedUser = { id: "manager-1", name: "Manager", role: "manager" };

  useEffect(() => {
    async function loadData() {
      try {
        const coursesRes = await fetch("/api/courses");
        if (coursesRes.ok) setCourses(await coursesRes.json());
      } catch (error) {
        console.error("Failed to load courses:", error);
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
          activeId="onlineTraining"
          onSelect={handleNavigation}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      <ManagerOnlineTrainingPage currentUser={currentUser} courses={courses} />
    </Layout>
  );
};

export default OnlineTrainingPage;
