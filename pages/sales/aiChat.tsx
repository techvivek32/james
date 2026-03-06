import type { NextPage } from "next";
import { SalesLayout } from "../../src/portals/sales/SalesLayout";
// import { AiChatPanel } from "../../src/portals/sales/AiChatPanel";
import { useAuth } from "../../src/contexts/AuthContext";

const AiChat: NextPage = () => {
  const { user } = useAuth();
  if (!user) return <div>Loading...</div>;

  return (
    <SalesLayout currentView="aiChat" userName={user.name} userId={user.id}>
      {/* <AiChatPanel /> */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '48px', 
          marginBottom: '24px' 
        }}>
          🚧
        </div>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 600, 
          color: '#111827',
          marginBottom: '12px'
        }}>
          Coming Soon
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#6b7280' 
        }}>
          This feature is under development
        </p>
      </div>
    </SalesLayout>
  );
};

export default AiChat;
