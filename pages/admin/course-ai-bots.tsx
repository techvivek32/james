import type { NextPage } from "next";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";

const CourseAiBotsPage: NextPage = () => {
  return (
    <AdminPageWrapper currentView="courseAiBots">
      <div className="page-header">
        <h1 className="page-title">Course AI Bots Builder</h1>
      </div>
      <div className="panel">
        <div className="panel-body">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '400px',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              opacity: 0.3
            }}>
              🤖
            </div>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 600, 
              color: '#374151',
              marginBottom: '12px'
            }}>
              Coming Soon
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              maxWidth: '500px'
            }}>
              Course AI Bots Builder is currently under development. This feature will allow you to create and manage AI-powered bots for your courses.
            </p>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
};

export default CourseAiBotsPage;
