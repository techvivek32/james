import type { NextPage } from "next";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { TrainingExecutiveView } from "../../src/portals/admin/TrainingExecutiveView";

const TrainingExecutivePage: NextPage = () => {
  return (
    <AdminPageWrapper currentView="trainingExecutive">
      <TrainingExecutiveView />
    </AdminPageWrapper>
  );
};

export default TrainingExecutivePage;
