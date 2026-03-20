import type { NextPage } from "next";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
import { BotChatWidget } from "../../src/components/BotChatWidget";
import { useAuth } from "../../src/contexts/AuthContext";

const AiChat: NextPage = () => {
  const { user } = useAuth();
  if (!user) return <div>Loading...</div>;

  return (
    <SalesLayout currentView="aiChat" userName={user.name} userId={user.id}>
      <div className="page-header">
        <h1 className="page-title">AI Assistant</h1>
      </div>
      <div style={{ padding: "0 24px 24px" }}>
        <BotChatWidget role="sales" />
      </div>
    </SalesLayout>
  );
};

export default AiChat;
