import type { NextPage } from "next";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { AiChatPanel } from "../../src/portals/sales/AiChatPanel";
import { useAuth } from "../../src/contexts/AuthContext";

const AiChat: NextPage = () => {
  const { user } = useAuth();
  if (!user) return <div>Loading...</div>;

  return (
    <SalesLayout currentView="aiChat" userName={user.name}>
      <AiChatPanel />
    </SalesLayout>
  );
};

export default AiChat;
