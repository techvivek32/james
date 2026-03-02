import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { ManagerLayout } from "../../src/portals/manager/ManagerLayout";
import { ManagerOnlineTrainingPage } from "../../src/portals/manager/OnlineTraining";
import { Course, AuthenticatedUser } from "../../src/types";

const OnlineTrainingPage: NextPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const currentUser: AuthenticatedUser = { id: "manager-1", name: "Manager", role: "manager" };

  useEffect(() => {
    async function loadData() {
      try {
        const coursesRes = await fetch("/api/courses");
        if (coursesRes.ok) setCourses(await coursesRes.json());
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    }
    loadData();
  }, []);

  return (
    <ManagerLayout currentView="onlineTraining">
      <ManagerOnlineTrainingPage currentUser={currentUser} courses={courses} />
    </ManagerLayout>
  );
};

export default OnlineTrainingPage;
