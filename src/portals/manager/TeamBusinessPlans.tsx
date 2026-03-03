import { useEffect, useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

export function TeamBusinessPlansPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<BusinessPlan | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  async function fetchUsers() {
    try {
      const [usersRes, plansRes] = await Promise.all([
        fetch(`/api/users`),
        fetch(`/api/business-plan?managerId=${user?.id}`)
      ]);
      
      if (usersRes.ok && plansRes.ok) {
        const allUsers = await usersRes.json();
        const plansData = await plansRes.json();
        
        // Merge business plans into users
        const usersWithPlans = allUsers.map((u: UserProfile) => {
          const planData = plansData.find((p: any) => p.userId === u.id);
          return {
            ...u,
            businessPlan: planData?.businessPlan || u.businessPlan
          };
        });
        
        setUsers(usersWithPlans);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editingUser || !editForm) return;
    try {
      await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          businessPlan: editForm
        })
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  }

  if (loading) {
    return <div>Loading business plans...</div>;
  }

  if (!user || user.role !== 'manager') {
    return <div>Access denied</div>;
  }

  const teamMembers = users.filter((u) => u.managerId === user.id);
  const teamPlans = teamMembers.filter((m) => !!m.businessPlan).map((m) => m.businessPlan!);
  const teamRevenue = teamPlans.reduce((sum, p) => sum + (p.revenueGoal || 0), 0);
  const totalDeals = teamPlans.reduce((sum, p) => sum + (p.dealsPerYear || 0), 0);
  const totalInspections = teamPlans.reduce((sum, p) => sum + (p.inspectionsNeeded || 0), 0);
  const totalDoors = teamPlans.reduce((sum, p) => sum + (p.doorsPerYear || 0), 0);

  return (
    <div>
      <div className="grid grid-4">
        <DashboardCard
          title="Team Revenue Goal"
          value={`$${teamRevenue.toLocaleString()}`}
          description="Sum of rep plans"
        />
        <DashboardCard
          title="Deals Needed (Year)"
          value={totalDeals.toLocaleString()}
          description="Across all reps"
        />
        <DashboardCard
          title="Inspections Needed"
          value={totalInspections.toLocaleString()}
          description="From plan assumptions"
        />
        <DashboardCard
          title="Door Knocks (Year)"
          value={totalDoors.toLocaleString()}
          description="Team goal"
        />
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Team Business Plans</span>
          </div>
        </div>
        <div className="panel-body">
          {teamMembers.length === 0 ? (
            <div className="panel-empty">
              No team members assigned.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Rep</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Revenue Goal</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Days/Week</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Deals/Year</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Deals/Month</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Inspections</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Door Knocks</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => {
                    const plan = member.businessPlan;
                    return (
                      <tr
                        key={member.id}
                        style={{
                          fontSize: 13,
                          backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                          borderTop: index === 0 ? "1px solid #e5e7eb" : "1px solid #f1f5f9"
                        }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {member.role.toUpperCase()}
                          </div>
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {plan ? `$${plan.revenueGoal?.toLocaleString() || 'N/A'}` : 'N/A'}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {plan ? (plan.daysPerWeek || 'N/A') : 'N/A'}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {plan ? (plan.dealsPerYear?.toLocaleString() || 'N/A') : 'N/A'}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {plan ? (plan.dealsPerMonth?.toLocaleString() || 'N/A') : 'N/A'}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {plan ? (plan.inspectionsNeeded?.toLocaleString() || 'N/A') : 'N/A'}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {plan ? (plan.doorsPerYear?.toLocaleString() || 'N/A') : 'N/A'}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          {plan ? (
                            plan.committed ? (
                              <span style={{ color: "#10b981", fontWeight: 500 }}>Committed</span>
                            ) : (
                              <span style={{ color: "#f59e0b", fontWeight: 500 }}>Draft</span>
                            )
                          ) : (
                            <span style={{ color: "#6b7280" }}>Not Set</span>
                          )}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setEditingUser(member);
                              setEditForm(member.businessPlan || {
                                revenueGoal: 0,
                                daysPerWeek: 0,
                                territories: [],
                                dealsPerYear: 0,
                                dealsPerMonth: 0,
                                inspectionsNeeded: 0,
                                doorsPerYear: 0,
                                doorsPerDay: 0,
                                committed: false
                              });
                            }}
                            className="btn-secondary btn-small"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {editingUser && editForm && (
        <div className="overlay" onClick={() => setEditingUser(null)}>
          <div className="dialog" style={{ width: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Edit Business Plan - {editingUser.name}</div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="field">
                <label className="field-label">Revenue Goal</label>
                <input className="field-input" type="number" value={editForm.revenueGoal || 0} onChange={(e) => setEditForm({...editForm, revenueGoal: Number(e.target.value)})} />
              </div>
              <div className="field">
                <label className="field-label">Days Per Week</label>
                <input className="field-input" type="number" value={editForm.daysPerWeek || 0} onChange={(e) => setEditForm({...editForm, daysPerWeek: Number(e.target.value)})} />
              </div>
              <div className="field">
                <label className="field-label">Deals Per Year</label>
                <input className="field-input" type="number" value={editForm.dealsPerYear || 0} onChange={(e) => setEditForm({...editForm, dealsPerYear: Number(e.target.value)})} />
              </div>
              <div className="field">
                <label className="field-label">Deals Per Month</label>
                <input className="field-input" type="number" value={editForm.dealsPerMonth || 0} onChange={(e) => setEditForm({...editForm, dealsPerMonth: Number(e.target.value)})} />
              </div>
              <div className="field">
                <label className="field-label">Inspections Needed</label>
                <input className="field-input" type="number" value={editForm.inspectionsNeeded || 0} onChange={(e) => setEditForm({...editForm, inspectionsNeeded: Number(e.target.value)})} />
              </div>
              <div className="field">
                <label className="field-label">Door Knocks Per Year</label>
                <input className="field-input" type="number" value={editForm.doorsPerYear || 0} onChange={(e) => setEditForm({...editForm, doorsPerYear: Number(e.target.value)})} />
              </div>
            </div>
            <div className="dialog-footer">
              <button className="btn-secondary btn-cancel" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn-primary solid" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
