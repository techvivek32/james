import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { WebPagePreview } from "../../src/portals/sales/WebPagePreview";
import { UserProfile } from "../../src/types";

const WebPage: NextPage = () => {
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

  async function handleProfileChange(updatedProfile: UserProfile) {
    setProfile(updatedProfile);
    try {
      await fetch(`/api/users/${updatedProfile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile)
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  }

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <SalesLayout currentView="webPage" userName={profile.name}>
      <WebPagePreview profile={profile} onProfileChange={handleProfileChange} />
    </SalesLayout>
  );
};

export default WebPage;
