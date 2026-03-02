import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
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
    <AdminPageWrapper currentView="businessUnits">
      <BusinessUnitsManager users={users} />
    </AdminPageWrapper>
  );
};

export default BusinessUnitsPage;
