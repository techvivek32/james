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

  if (isLoading) {
    return (
      <ManagerLayout currentView="onlineTraining">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <div style={{ color: '#6b7280' }}>Loading courses...</div>
          </div>
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout currentView="onlineTraining">
      <ManagerOnlineTrainingPage currentUser={currentUser} courses={courses} />
    </ManagerLayout>
  );
};

export default OnlineTrainingPage;
