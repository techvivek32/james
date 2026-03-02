import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { SalesDashboard } from "../../src/portals/sales/Dashboard";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { UserProfile } from "../../src/types";

const DashboardPage: NextPage = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const users = await usersRes.json();
          const salesUser = users.find((u: UserProfile) => u.role === "sales");
          if (salesUser) setProfile(salesUser);
        }
      } catch (error) {
        console.error("Failed to load sales data:", error);
      }
    }
    loadData();
  }, []);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["sales"]}>
      <SalesLayout currentView="dashboard" userName={profile.name}>
        <SalesDashboard profile={profile} />
      </SalesLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
