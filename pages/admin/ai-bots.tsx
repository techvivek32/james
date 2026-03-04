import type { NextPage } from "next";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { ChatHistoryViewer } from "../../src/portals/admin/ChatHistoryViewer";

const AIBotsPage: NextPage = () => {
  return (
    <AdminPageWrapper currentView="aiBots">
      <ChatHistoryViewer />
    </AdminPageWrapper>
  );
};

export default AIBotsPage;
