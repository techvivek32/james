import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { ManagerSidebar } from "../../src/components/ManagerSidebar";
import { Header } from "../../src/components/Header";
import { TaskTracker } from "../../src/portals/manager/TaskTracker";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile, Course } from "../../src/types";

const TaskTrackerPage: NextPage = () => {
  const { logout } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, coursesRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/courses")
        ]);
        if (usersRes.ok) {
          const users = await usersRes.json();
          setTeamMembers(users.filter((u: UserProfile) => u.role === "sales"));
        }
        if (coursesRes.ok) setCourses(await coursesRes.json());
      } catch (error) {
        console.error("Failed to load task tracker data:", error);
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
          activeId="taskTracker"
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      <TaskTracker teamMembers={teamMembers} courses={courses} />
    </Layout>
  );
};

export default TaskTrackerPage;
