import type { NextPage } from "next";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { MarketingMaterials } from "../../src/portals/sales/MarketingMaterials";
import { useAuth } from "../../src/contexts/AuthContext";

const Materials: NextPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <SalesLayout currentView="materials" userName={user.name} userId={user.id}>
      <MarketingMaterials />
    </SalesLayout>
  );
};

export default Materials;
