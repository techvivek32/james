import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { UserManagement } from "../../src/portals/admin/UserManagement";
import { UserRequests } from "../../src/portals/admin/UserRequests";
import { UserProfile } from "../../src/types";

const UserManagementPage: NextPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");

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
    <AdminPageWrapper currentView="userManagement">
      <div style={{ marginBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", gap: 24, paddingLeft: 24 }}>
          <button
            onClick={() => setActiveTab("users")}
            style={{
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 500,
              color: activeTab === "users" ? "#2563eb" : "#6b7280",
              borderBottom: activeTab === "users" ? "2px solid #2563eb" : "2px solid transparent",
              background: "none",
              border: "none",
              cursor: "pointer"
            }}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            style={{
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 500,
              color: activeTab === "requests" ? "#2563eb" : "#6b7280",
              borderBottom: activeTab === "requests" ? "2px solid #2563eb" : "2px solid transparent",
              background: "none",
              border: "none",
              cursor: "pointer"
            }}
          >
            User Requests
          </button>
        </div>
      </div>

      {activeTab === "users" ? (
        <UserManagement
          users={users}
          deletedUsers={deletedUsers}
          onUsersChange={handleUsersChange}
          onDeletedUsersChange={setDeletedUsers}
        />
      ) : (
        <UserRequests />
      )}
    </AdminPageWrapper>
  );
};

export default UserManagementPage;
