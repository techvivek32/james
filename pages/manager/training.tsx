import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { Sidebar } from "../../src/components/Sidebar";
import { Header } from "../../src/components/Header";
import { TeamTrainingProgressPage } from "../../src/portals/manager/TeamTrainingProgress";
import { UserProfile, Course, AuthenticatedUser } from "../../src/types";
import { useRouter } from "next/router";

const sidebarItems = [
  { id: "dashboard", label: "My Dashboard" },
  { id: "team", label: "My Team" },
  { id: "plans", label: "Team Business Plans" },
  { id: "training", label: "Team Training Progress" },
  { id: "onlineTraining", label: "Online Course Training" },
  { id: "taskTracker", label: "Task Tracker" }
];

const TrainingPage: NextPage = () => {
  const router = useRouter();
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
          activeId="training"
          onSelect={handleNavigation}
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
