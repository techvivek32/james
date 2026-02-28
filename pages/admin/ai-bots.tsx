import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../src/portals/admin/AdminLayout";
import { AiBotManagement } from "../../src/portals/admin/AIBots";
import { Course } from "../../src/types";

const AIBotsPage: NextPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) setCourses(await res.json());
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    }
    loadData();
  }, []);

  return (
    <AdminLayout currentView="aiBots">
      <AiBotManagement courses={courses} />
    </AdminLayout>
  );
};

export default AIBotsPage;
