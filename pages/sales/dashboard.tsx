import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { SalesDashboard } from "../../src/portals/sales/Dashboard";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/contexts/AuthContext";
import { UserProfile } from "../../src/types";

const DashboardPage: NextPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      if (!user?.id) return;
      
      try {
        const [userRes, planRes] = await Promise.all([
          fetch(`/api/users/${user.id}`),
          fetch(`/api/business-plan?userId=${user.id}`)
        ]);
        
        if (userRes.ok) {
          const userProfile = await userRes.json();
          
          if (planRes.ok) {
            const plansData = await planRes.json();
            const userPlan = plansData.find((p: any) => p.userId === user.id);
            if (userPlan?.businessPlan) {
              userProfile.businessPlan = userPlan.businessPlan;
            }
          }
          
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    }
    loadUserProfile();
  }, [user?.id]);

  if (!profile || !user) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["sales"]}>
      <SalesLayout currentView="dashboard" userName={user.name}>
        <SalesDashboard profile={profile} />
      </SalesLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
