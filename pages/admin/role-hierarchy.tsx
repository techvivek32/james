import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../src/portals/admin/AdminLayout";
import { RoleHierarchyManager } from "../../src/portals/admin/RoleHierarchy";
import { UserProfile } from "../../src/types";

const RoleHierarchyPage: NextPage = () => {
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

  function handleUsersChange(next: UserProfile[]) {
    setUsers(next);
    fetch("/api/users/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    }).catch((err) => console.error("Failed to save users:", err));
  }

  return (
    <AdminLayout currentView="roleHierarchy">
      <RoleHierarchyManager users={users} onUsersChange={handleUsersChange} />
    </AdminLayout>
  );
};

export default RoleHierarchyPage;
