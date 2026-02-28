import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../src/portals/admin/AdminLayout";
import { BusinessUnitsManager } from "../../src/portals/admin/BusinessUnits";
import { UserProfile } from "../../src/types";

const BusinessUnitsPage: NextPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) setUsers(await res.json());
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    }
    loadData();
  }, []);

  return (
    <AdminLayout currentView="businessUnits">
      <BusinessUnitsManager users={users} />
    </AdminLayout>
  );
};

export default BusinessUnitsPage;
