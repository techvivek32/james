import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { AdminDashboard } from "../../src/portals/admin/Dashboard";
import { Course, UserProfile } from "../../src/types";

const DashboardPage: NextPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, coursesRes] = await Promise.all([fetch("/api/users"), fetch("/api/courses")]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (coursesRes.ok) setCourses(await coursesRes.json());
      } catch (error) {
        console.error("Failed to load admin dashboard data:", error);
      }
    }
    loadData();
  }, []);

  return (
    <AdminPageWrapper currentView="dashboard">
      <AdminDashboard users={users} courses={courses} />
    </AdminPageWrapper>
  );
};

export default DashboardPage;
