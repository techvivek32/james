import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { TrainingCenter } from "../../src/portals/sales/TrainingCenter";
import { useAuth } from "../../src/contexts/AuthContext";
import { Course } from "../../src/types";

const Training: NextPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function loadCourses() {
      if (!user?.id) {
        if (mounted) setIsLoading(false);
        return;
      }
      
      try {
        const coursesRes = await fetch(`/api/courses?userId=${user.id}&userRole=${user.role}`);
        if (coursesRes.ok && mounted) {
          const data = await coursesRes.json();
          setCourses(data);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadCourses();
    
    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <SalesLayout currentView="training" userName={user.name} userId={user.id}>
      <TrainingCenter courses={courses} />
    </SalesLayout>
  );
};

export default Training;
