import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { ManagerSidebar } from "../../src/components/ManagerSidebar";
import { Header } from "../../src/components/Header";
import { TeamTrainingProgressPage } from "../../src/portals/manager/TeamTrainingProgress";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile, Course, AuthenticatedUser } from "../../src/types";

const TrainingPage: NextPage = () => {
  const { logout } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentUser: AuthenticatedUser = { id: "manager-1", name: "Manager", role: "manager" };

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
        console.error("Failed to load training data:", error);
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
          activeId="training"
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      }
    >
      <TeamTrainingProgressPage currentUser={currentUser} teamMembers={teamMembers} courses={courses} />
    </Layout>
  );
};

export default TrainingPage;
