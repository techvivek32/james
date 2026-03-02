import type { NextPage } from "next";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { MaterialsLibrary } from "../../src/portals/admin/MaterialsLibrary";

const MaterialsLibraryPage: NextPage = () => {
  return (
    <AdminPageWrapper currentView="materialsLibrary">
      <MaterialsLibrary />
    </AdminPageWrapper>
  );
};

export default MaterialsLibraryPage;
