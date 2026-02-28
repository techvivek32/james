import type { NextPage } from "next";
import { AdminLayout } from "../../src/portals/admin/AdminLayout";
import { AppsToolManagement } from "../../src/portals/admin/AppsTools";

const AppsToolsPage: NextPage = () => {
  return (
    <AdminLayout currentView="appsTools">
      <AppsToolManagement />
    </AdminLayout>
  );
};

export default AppsToolsPage;
