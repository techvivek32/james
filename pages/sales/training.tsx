import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { Layout } from "../../src/components/Layout";
import { SalesSidebar } from "../../src/components/SalesSidebar";
import { Header } from "../../src/components/Header";
import { TrainingCenter } from "../../src/portals/sales/TrainingCenter";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile, Course } from "../../src/types";

const Training: NextPage = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
          const salesUser = users.find((u: UserProfile) => u.role === "sales");
          if (salesUser) setProfile(salesUser);
        }
        if (coursesRes.ok) setCourses(await coursesRes.json());
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
          activeId="training"
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
      <TrainingCenter courses={courses} />
    </Layout>
  );
};

export default Training;
