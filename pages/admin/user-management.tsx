import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminLayout } from "../../src/portals/admin/AdminLayout";
import { UserManagement } from "../../src/portals/admin/UserManagement";
import { UserProfile } from "../../src/types";

const UserManagementPage: NextPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<UserProfile[]>([]);

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

  async function handleUsersChange(next: UserProfile[]) {
    setUsers(next);
    try {
      await fetch("/api/users/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      });
    } catch (error) {
      console.error("Failed to save users:", error);
    }
  }

  return (
    <AdminLayout currentView="userManagement">
      <UserManagement
        users={users}
        deletedUsers={deletedUsers}
        onUsersChange={handleUsersChange}
        onDeletedUsersChange={setDeletedUsers}
      />
    </AdminLayout>
  );
};

export default UserManagementPage;
