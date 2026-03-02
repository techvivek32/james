import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { BusinessCardsRequest } from "../../src/portals/sales/BusinessCardsRequest";
import { UserProfile } from "../../src/types";

const BusinessCards: NextPage = () => {
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
    <SalesLayout currentView="businessCards" userName={profile.name}>
      <BusinessCardsRequest />
    </SalesLayout>
  );
};

export default BusinessCards;
