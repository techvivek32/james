import type { NextPage } from "next";
import { MarketingLayout } from "../../src/portals/marketing/MarketingLayout";
import { BotChatWidget } from "../../src/components/BotChatWidget";

const MarketingAiChat: NextPage = () => {
  return (
    <MarketingLayout currentView="ai-chat">
      <div className="page-header">
        <h1 className="page-title">AI Assistant</h1>
      </div>
      <div style={{ padding: "0 24px 24px" }}>
        <BotChatWidget role="marketing" />
      </div>
    </MarketingLayout>
  );
};

export default MarketingAiChat;
