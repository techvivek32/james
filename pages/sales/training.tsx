import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { TrainingCenter } from "../../src/portals/sales/TrainingCenter";
import { useAuth } from "../../src/contexts/AuthContext";
import { Course } from "../../src/types";

const Training: NextPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadCourses() {
      if (!user?.id) return;
      
      try {
        const coursesRes = await fetch(`/api/courses?userId=${user.id}&userRole=${user.role}`);
        if (coursesRes.ok) setCourses(await coursesRes.json());
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    }
    loadCourses();
  }, [user?.id, user?.role]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <SalesLayout currentView="training" userName={user.name}>
      <TrainingCenter courses={courses} />
    </SalesLayout>
  );
};

export default Training;
