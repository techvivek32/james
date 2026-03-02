import type { NextPage } from "next";
import { MarketingLayout } from "../../src/portals/marketing/MarketingLayout";
import { Placeholder } from "../../src/portals/marketing/Placeholder";

const AssetsPage: NextPage = () => {
  return (
    <MarketingLayout currentView="assets">
      <Placeholder
        title="Asset Library"
        description="Manage campaign assets, evergreen content, and field resources."
      />
    </MarketingLayout>
  );
};

export default AssetsPage;
