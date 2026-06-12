import type { NextPage } from "next";
import { ManagerLayout } from "../../src/portals/manager/ManagerLayout";
import { useEffect, useState } from "react";
import { UserProfile } from "../../src/types";
import { useAuth } from "../../src/contexts/AuthContext";

const TaskManagerPage: NextPage = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadTeamMembers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const users = await res.json();
          // Filter by sales role and managerId matching current user's id
          setTeamMembers(users.filter((u: UserProfile) => 
            u.role === "sales" && u.managerId === user?.id
          ));
        }
      } catch (error) {
        console.error("Failed to load team members:", error);
      }
    }
    if (user) {
      loadTeamMembers();
    }
  }, [user]);

  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId);

  return (
    <ManagerLayout currentView="task-manager">
      <div className="page-header">
        <h1 className="page-title">Team Tasks</h1>
      </div>
      
      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-row">
            <div className="panel-header-actions" style={{ width: '100%' }}>
              <input
                className="field-input"
                placeholder="Search members by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px', 
            marginBottom: '24px' 
          }}>
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: selectedMemberId === member.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: selectedMemberId === member.id ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  fontWeight: selectedMemberId === member.id ? '600' : '400',
                  color: '#374151',
                  transition: 'all 0.2s ease'
                }}
              >
                {member.name}
              </button>
            ))}
            {filteredMembers.length === 0 && (
              <div style={{ color: '#6b7280', padding: '10px' }}>
                No team members match your search.
              </div>
            )}
          </div>
          
          {selectedMember && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '300px',
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                opacity: 0.3
              }}>
                📋
              </div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: '12px'
              }}>
                {selectedMember.name}
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280',
                maxWidth: '500px'
              }}>
                This user doesn't have any tasks assigned right now.
              </p>
            </div>
          )}
          {!selectedMember && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '300px',
              textAlign: 'center',
              padding: '40px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                opacity: 0.3
              }}>
                👥
              </div>
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: '12px'
              }}>
                Select a Team Member
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#6b7280',
                maxWidth: '500px'
              }}>
                Choose a team member from above to view their tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
};

export default TaskManagerPage;
