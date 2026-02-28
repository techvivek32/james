import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../src/portals/admin/AdminLayout";
import { CourseManagement } from "../../src/portals/admin/CourseManagement";
import { Course } from "../../src/types";

const CourseManagementPage: NextPage = () => {
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

  function handleCoursesChange(next: Course[]) {
    setCourses(next);
    fetch("/api/courses/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    }).catch((err) => console.error("Failed to save courses:", err));
  }

  return (
    <AdminLayout currentView="courseManagement">
      <CourseManagement courses={courses} onCoursesChange={handleCoursesChange} />
    </AdminLayout>
  );
};

export default CourseManagementPage;
