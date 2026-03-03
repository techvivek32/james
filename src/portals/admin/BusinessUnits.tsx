import { useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";

export function BusinessUnitsManager(props: { users: UserProfile[] }) {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<BusinessPlan | null>(null);
  const [originalForm, setOriginalForm] = useState<BusinessPlan | null>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const managers = props.users.filter((u) => u.role === "manager" || (u.roles || []).includes("manager"));
  const salesReps = props.users.filter((u) => u.role === "sales" || (u.roles || []).includes("sales"));
  const plans = props.users.filter((u) => !!u.businessPlan).map((u) => u.businessPlan!);
  const totalRevenue = plans.reduce((sum, p) => sum + (p.revenueGoal || 0), 0);
  const totalDays = plans.reduce((sum, p) => sum + (p.daysPerWeek || 0), 0);
  const avgDays = plans.length > 0 ? Math.round(totalDays / plans.length) : 0;

  function toggleManager(managerId: string) {
    setExpandedManagers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerId)) {
        newSet.delete(managerId);
      } else {
        newSet.add(managerId);
      }
      return newSet;
    });
  }

  async function handleSave() {
    if (!editingUser || !editForm || !originalForm) return;
    try {
      await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          businessPlan: editForm
        })
      });

      // Build change details
      const changes: string[] = [];
      if (originalForm.revenueGoal !== editForm.revenueGoal) {
        changes.push(`Revenue Goal: $${originalForm.revenueGoal?.toLocaleString()} → $${editForm.revenueGoal?.toLocaleString()}`);
      }
      if (originalForm.daysPerWeek !== editForm.daysPerWeek) {
        changes.push(`Days/Week: ${originalForm.daysPerWeek} → ${editForm.daysPerWeek}`);
      }
      if (originalForm.dealsPerYear !== editForm.dealsPerYear) {
        changes.push(`Deals/Year: ${originalForm.dealsPerYear} → ${editForm.dealsPerYear}`);
      }
      if (originalForm.dealsPerMonth !== editForm.dealsPerMonth) {
        changes.push(`Deals/Month: ${originalForm.dealsPerMonth} → ${editForm.dealsPerMonth}`);
      }
      if (originalForm.inspectionsNeeded !== editForm.inspectionsNeeded) {
        changes.push(`Inspections: ${originalForm.inspectionsNeeded} → ${editForm.inspectionsNeeded}`);
      }
      if (originalForm.doorsPerYear !== editForm.doorsPerYear) {
        changes.push(`Door Knocks: ${originalForm.doorsPerYear?.toLocaleString()} → ${editForm.doorsPerYear?.toLocaleString()}`);
      }
      const changeMessage = changes.length > 0 ? changes.join(', ') : 'No changes';

      // Create notifications
      const notifications = [
        {
          userId: editingUser.id,
          type: 'plan_updated',
          title: 'Business Plan Updated',
          message: `Admin updated your business plan. ${changeMessage}`,
          metadata: { updatedBy: 'admin', businessPlan: editForm }
        }
      ];

      if (editingUser.managerId) {
        notifications.push({
          userId: editingUser.managerId,
          type: 'plan_updated',
          title: 'Team Member Plan Updated',
          message: `Admin updated ${editingUser.name}'s business plan. ${changeMessage}`,
          metadata: { updatedBy: 'admin', targetUser: editingUser.id }
        });
      }

      await Promise.all(
        notifications.map(n => 
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n)
          })
        )
      );

      window.location.reload();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  }

  function getTeamMembers(managerId: string) {
    return props.users.filter((u) => u.managerId === managerId);
  }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Business Units Overview</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-4">
            <DashboardCard title="Total Managers" value={managers.length.toString()} />
            <DashboardCard title="Total Sales Reps" value={salesReps.length.toString()} />
            <DashboardCard title="Total Business Plans" value={plans.length.toString()} />
            <DashboardCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} />
            <DashboardCard title="Avg Days Per Week" value={avgDays.toString()} />
          </div>
        </div>
      </div>
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
          const teamPlans = teamMembers.filter((m) => !!m.businessPlan).map((m) => m.businessPlan!);
          const teamRevenue = teamPlans.reduce((sum, p) => sum + (p.revenueGoal || 0), 0);
          const teamDays = teamPlans.reduce((sum, p) => sum + (p.daysPerWeek || 0), 0);
          const teamAvgDays = teamPlans.length > 0 ? Math.round(teamDays / teamPlans.length) : 0;
          return (
            <div key={manager.id} className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-header" style={{ cursor: 'pointer' }} onClick={() => toggleManager(manager.id)}>
                <div className="panel-header-row">
                  <span>{manager.name} - Team Business Plans</span>
                  <span style={{ fontSize: 18 }}>{expandedManagers.has(manager.id) ? '▼' : '▶'}</span>
                </div>
              </div>
              {expandedManagers.has(manager.id) && (
                <div className="panel-body">
                  <div className="grid grid-4" style={{ marginBottom: 12 }}>
                    <DashboardCard title="Team Members" value={teamMembers.length.toString()} />
                    <DashboardCard title="Plans in Team" value={teamPlans.length.toString()} />
                    <DashboardCard title="Team Revenue" value={`$${teamRevenue.toLocaleString()}`} />
                    <DashboardCard title="Avg Days Per Week" value={teamAvgDays.toString()} />
                  </div>
                  {manager.businessPlan && (
                    <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f9fafb", borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{manager.name} (Manager)</div>
                      <div className="grid grid-4">
                        <DashboardCard title="Revenue Goal" value={`$${(manager.businessPlan.revenueGoal || 0).toLocaleString()}`} />
                        <DashboardCard title="Days Per Week" value={(manager.businessPlan.daysPerWeek || 0).toString()} />
                      </div>
                    </div>
                  )}
                  {teamMembers.length === 0 ? (
                    <div className="panel-empty">No team members assigned.</div>
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
                                      const plan = member.businessPlan || {
                                        revenueGoal: 0,
                                        daysPerWeek: 0,
                                        territories: [],
                                        dealsPerYear: 0,
                                        dealsPerMonth: 0,
                                        inspectionsNeeded: 0,
                                        doorsPerYear: 0,
                                        doorsPerDay: 0,
                                        committed: false
                                      };
                                      setEditingUser(member);
                                      setEditForm(plan);
                                      setOriginalForm(plan);
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
              )}
            </div>
          );
        })
      )}
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
