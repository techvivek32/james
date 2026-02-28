import { useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile } from "../../types";

export function BusinessUnitsManager(props: { users: UserProfile[] }) {
  const managers = props.users.filter((u) => u.role === "manager" || (u.roles || []).includes("manager"));

  function getTeamMembers(managerId: string) {
    return props.users.filter((u) => u.managerId === managerId);
  }

  return (
    <div>
      {managers.length === 0 ? (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-header-row">
              <span>Business Units</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-empty">No managers found.</div>
          </div>
        </div>
      ) : (
        managers.map((manager) => {
          const teamMembers = getTeamMembers(manager.id);
          return (
            <div key={manager.id} className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-header">
                <div className="panel-header-row">
                  <span>{manager.name} - Team Business Plans</span>
                </div>
              </div>
              <div className="panel-body">
                {manager.businessPlan && (
                  <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f9fafb", borderRadius: 6 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{manager.name} (Manager)</div>
                    <div className="grid grid-4">
                      <DashboardCard title="Target Revenue" value={`$${(manager.businessPlan.targetRevenue || 0).toLocaleString()}`} />
                      <DashboardCard title="Days to Close" value={(manager.businessPlan.daysToClose || 0).toString()} />
                    </div>
                  </div>
                )}
                {teamMembers.length === 0 ? (
                  <div className="panel-empty">No team members assigned.</div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={member.id} style={{ marginBottom: 12, padding: 12, border: "1px solid #e5e7eb", borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{member.name}</div>
                      {member.businessPlan ? (
                        <div className="grid grid-4">
                          <DashboardCard title="Target Revenue" value={`$${(member.businessPlan.targetRevenue || 0).toLocaleString()}`} />
                          <DashboardCard title="Days to Close" value={(member.businessPlan.daysToClose || 0).toString()} />
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: "#6b7280" }}>No business plan set</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
