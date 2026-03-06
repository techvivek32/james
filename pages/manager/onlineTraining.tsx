import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { ManagerLayout } from "../../src/portals/manager/ManagerLayout";
import { ManagerOnlineTrainingPage } from "../../src/portals/manager/OnlineTraining";
import { Course, AuthenticatedUser } from "../../src/types";

const OnlineTrainingPage: NextPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUser: AuthenticatedUser = { id: "manager-1", name: "Manager", role: "manager" };

  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      setIsLoading(true);
      
      try {
        const coursesRes = await fetch(`/api/courses?userId=${currentUser.id}&userRole=${currentUser.role}`);
        if (coursesRes.ok && mounted) {
          const data = await coursesRes.json();
          // Sort courses by order field
          const sortedData = data.sort((a: Course, b: Course) => {
            const orderA = a.order ?? 999999;
            const orderB = b.order ?? 999999;
            return orderA - orderB;
          });
          setCourses(sortedData);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ManagerLayout currentView="onlineTraining">
      <ManagerOnlineTrainingPage currentUser={currentUser} courses={courses} isLoading={isLoading} />
    </ManagerLayout>
  );
};

export default OnlineTrainingPage;
