import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { TrainingCenter } from "../../src/portals/sales/TrainingCenter";
import { UserProfile, Course } from "../../src/types";

const Training: NextPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const users = await usersRes.json();
          const salesUser = users.find((u: UserProfile) => u.role === "sales");
          if (salesUser) {
            setProfile(salesUser);
            // Fetch courses with user context
            const coursesRes = await fetch(`/api/courses?userId=${salesUser.id}&userRole=${salesUser.role}`);
            if (coursesRes.ok) setCourses(await coursesRes.json());
          }
        }
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
    <SalesLayout currentView="training" userName={profile.name}>
      <TrainingCenter courses={courses} />
    </SalesLayout>
  );
};

export default Training;
