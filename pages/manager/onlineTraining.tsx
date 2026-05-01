import type { NextPage } from "next";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { ManagerLayout } from "../../src/portals/manager/ManagerLayout";
import { ManagerOnlineTrainingPage } from "../../src/portals/manager/OnlineTraining";
import { AuthenticatedUser } from "../../src/types";
import { useAuth } from "../../src/contexts/AuthContext";
import { useCourses } from "../../src/hooks/useCourses";

const OnlineTrainingPage: NextPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { courses, isLoading } = useCourses(user?.id, user?.role);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  const currentUser: AuthenticatedUser = { id: user.id, name: user.name, role: user.role };

  return (
    <ManagerLayout currentView="onlineTraining">
      <ManagerOnlineTrainingPage currentUser={currentUser} courses={courses} isLoading={isLoading} />
    </ManagerLayout>
  );
};

export default OnlineTrainingPage;
