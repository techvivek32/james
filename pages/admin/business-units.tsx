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
        const [usersRes, plansRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/business-plan")
        ]);
        
        if (usersRes.ok && plansRes.ok) {
          const allUsers = await usersRes.json();
          const plansData = await plansRes.json();
          
          // Merge business plans into users
          const usersWithPlans = allUsers.map((u: UserProfile) => {
            const planData = plansData.find((p: any) => p.userId === u.id);
            return {
              ...u,
              businessPlan: planData?.businessPlan || u.businessPlan
            };
          });
          
          setUsers(usersWithPlans);
        }
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
