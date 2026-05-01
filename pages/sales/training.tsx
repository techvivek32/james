import type { NextPage } from "next";
import React from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { TrainingCenter } from "../../src/portals/sales/TrainingCenter";
import { useAuth } from "../../src/contexts/AuthContext";
import { Course } from "../../src/types";
import { useCourses } from "../../src/hooks/useCourses";

const TrainingCenterComponent = TrainingCenter as React.ComponentType<{ courses: Course[]; isLoading?: boolean }>;

const Training: NextPage = () => {
  const { user } = useAuth();
  const { courses, isLoading } = useCourses(user?.id, user?.role);

  if (!user) {
    return (
      <SalesLayout currentView="training">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <div style={{ color: '#6b7280' }}>Loading...</div>
          </div>
        </div>
      </SalesLayout>
    );
  }

  return (
    <SalesLayout currentView="training">
      <TrainingCenterComponent courses={courses} isLoading={isLoading} />
    </SalesLayout>
  );
};

export default Training;
