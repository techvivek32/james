import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { ManagerSidebar } from "../../src/components/ManagerSidebar";
import { Header } from "../../src/components/Header";
import { ManagerOnlineTrainingPage } from "../../src/portals/manager/OnlineTraining";
import { useAuth } from "../../src/contexts/AuthContext";
import { Course, AuthenticatedUser } from "../../src/types";

const OnlineTrainingPage: NextPage = () => {
  const { logout } = useAuth();
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
          activeId="onlineTraining"
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
