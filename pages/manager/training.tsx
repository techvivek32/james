import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { ManagerLayout } from "../../src/portals/manager/ManagerLayout";
import { TeamTrainingProgressPage } from "../../src/portals/manager/TeamTrainingProgress";
import { UserProfile, Course, AuthenticatedUser } from "../../src/types";
import { useCourses } from "../../src/hooks/useCourses";

const TrainingPage: NextPage = () => {
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const currentUser: AuthenticatedUser = { id: "manager-1", name: "Manager", role: "manager" };
  const { courses } = useCourses(currentUser.id, currentUser.role);

  useEffect(() => {
    async function loadData() {
      try {
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const users = await usersRes.json();
          setTeamMembers(users.filter((u: UserProfile) => u.role === "sales"));
        }
      } catch (error) {
        console.error("Failed to load training data:", error);
      }
    }
    loadData();
  }, []);

  return (
    <ManagerLayout currentView="training">
      <TeamTrainingProgressPage currentUser={currentUser} teamMembers={teamMembers} courses={courses} />
    </ManagerLayout>
  );
};

export default TrainingPage;
