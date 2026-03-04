import type { NextPage } from "next";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { MarketingMaterialsViewer } from "../../src/components/MarketingMaterialsViewer";
import { useAuth } from "../../src/contexts/AuthContext";

const Materials: NextPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <SalesLayout currentView="materials" userName={user.name} userId={user.id}>
      <div className="page-header">
        <h1 className="page-title">Marketing Materials</h1>
      </div>
      <MarketingMaterialsViewer />
    </SalesLayout>
  );
};

export default Materials;
