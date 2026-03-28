import { useState, useMemo, ChangeEvent } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";

export function BusinessUnitsManager(props: { users: UserProfile[] }) {
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());
  const [hiddenManagers, setHiddenManagers] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("hiddenManagers");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [showHiddenSection, setShowHiddenSection] = useState(false);

  function hideManager(id: string) {
    const n = new Set(hiddenManagers);
    n.add(id);
    setHiddenManagers(n);
    localStorage.setItem("hiddenManagers", JSON.stringify([...n]));
  }

  function unhideManager(id: string) {
    const n = new Set(hiddenManagers);
    n.delete(id);
    setHiddenManagers(n);
    localStorage.setItem("hiddenManagers", JSON.stringify([...n]));
  }
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    incomeGoal: number;
    dealAve: number;
    workingDaysPerWeek: number;
    committed: boolean;
  } | null>(null);
  const managers = props.users.filter((u) => u.role === "manager" || (u.roles || []).includes("manager"));
  const salesReps = props.users.filter((u) => u.role === "sales" || (u.roles || []).includes("sales"));

  // Calculate metrics
  const calculateMetrics = (incomeGoal: number, dealAve: number) => {
    const dealsPerYear = dealAve > 0 ? Math.round(incomeGoal / dealAve) : 0;
    const dealsPerMonth = dealsPerYear / 12;
    const claimsPerYear = Math.round(dealsPerYear - (dealsPerYear * 0.25));
    const claimsPerMonth = claimsPerYear / 12;
    const inspectionsPerYear = Math.round(claimsPerYear - (claimsPerYear * 0.30));
    const inspectionsPerMonth = inspectionsPerYear / 12;

    return {
      dealsPerYear,
      dealsPerMonth,
      claimsPerYear,
      claimsPerMonth,
      inspectionsPerYear,
      inspectionsPerMonth
    };
  };

  // Get all committed plans
  const allCommittedPlans = useMemo(() => {
    return salesReps.filter(rep => rep.businessPlan?.committed).map(rep => ({
      ...rep,
      metrics: calculateMetrics(rep.businessPlan?.revenueGoal || 0, rep.businessPlan?.averageDealSize || 0)
    }));
  }, [salesReps]);

  // Calculate global totals from all committed plans
  const globalTotals = useMemo(() => {
    return allCommittedPlans.reduce(
      (acc, rep) => {
        const bp = rep.businessPlan;
        if (!bp) return acc;
        
        acc.incomeGoal += bp.revenueGoal || 0;
        acc.dealsPerYear += rep.metrics.dealsPerYear;
        acc.dealsPerMonth += rep.metrics.dealsPerMonth;
        acc.claimsPerYear += rep.metrics.claimsPerYear;
        acc.claimsPerMonth += rep.metrics.claimsPerMonth;
        acc.inspectionsPerYear += rep.metrics.inspectionsPerYear;
        acc.inspectionsPerMonth += rep.metrics.inspectionsPerMonth;
        return acc;
      },
      {
        incomeGoal: 0,
        dealsPerYear: 0,
        dealsPerMonth: 0,
        claimsPerYear: 0,
        claimsPerMonth: 0,
        inspectionsPerYear: 0,
        inspectionsPerMonth: 0
      }
    );
  }, [allCommittedPlans]);

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

  function getTeamMembers(managerId: string) {
    return props.users.filter((u) => u.managerId === managerId && u.role === "sales");
  }

  async function handleSave() {
    if (!editingUserId || !editForm) return;
    
    const member = salesReps.find(m => m.id === editingUserId);
    if (!member) return;

    const metrics = calculateMetrics(editForm.incomeGoal, editForm.dealAve);

    const plan: BusinessPlan = {
      revenueGoal: editForm.incomeGoal,
      daysPerWeek: editForm.workingDaysPerWeek,
      territories: [member.territory || ""],
      averageDealSize: editForm.dealAve,
      dealsPerYear: metrics.dealsPerYear,
      dealsPerMonth: Math.round(metrics.dealsPerMonth),
      inspectionsNeeded: Math.round(metrics.inspectionsPerMonth),
      doorsPerYear: 0,
      doorsPerDay: 0,
      committed: editForm.committed
    };

    try {
      await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUserId,
          businessPlan: plan
        })
      });

      // Create notification for sales rep
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUserId,
          type: 'plan_updated',
          title: 'Business Plan Updated',
          message: `Admin updated your business plan.`,
          metadata: { updatedBy: 'admin', businessPlan: plan }
        })
      });

      setEditingUserId(null);
      setEditForm(null);
      window.location.reload();
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  }

  return (
    <div>
      {/* Global Dashboard */}
      <div className="panel" style={{ marginBottom: 32 }}>
        <div className="panel-header">
          <span>All Committed Sales Plans - Global Dashboard</span>
        </div>
        <div className="panel-body">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #e5e7eb" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#111827", border: "1px solid #e5e7eb" }}>Metric</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827", border: "1px solid #e5e7eb" }}>Value</th>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#111827", border: "1px solid #e5e7eb" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {/* Global Totals Section */}
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={3} style={{ padding: 12, fontWeight: 600, color: "#111827", fontSize: 14, border: "1px solid #e5e7eb" }}>
                    Global Totals
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Total Income Goal</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>
                    ${globalTotals.incomeGoal.toLocaleString()}
                  </td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Sum of all committed reps</td>
                </tr>
                <tr style={{ display: "none" }}>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Claims Ratio</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>25%</td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Hardcoded</td>
                </tr>
                <tr style={{ display: "none" }}>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Inspection Ratio</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>30%</td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Hardcoded</td>
                </tr>

                {/* Yearly Targets Section */}
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={3} style={{ padding: 12, fontWeight: 600, color: "#111827", fontSize: 14, paddingTop: 24, border: "1px solid #e5e7eb" }}>
                    Yearly Targets
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Deals Per Year</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>
                    {globalTotals.dealsPerYear.toLocaleString()}
                  </td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Total from all reps</td>
                </tr>
                <tr>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Claims Per Year</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>
                    {globalTotals.claimsPerYear.toLocaleString()}
                  </td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Total from all reps</td>
                </tr>
                <tr>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Inspections Per Year</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>
                    {globalTotals.inspectionsPerYear.toLocaleString()}
                  </td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Total from all reps</td>
                </tr>

                {/* Monthly Targets Section */}
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={3} style={{ padding: 12, fontWeight: 600, color: "#111827", fontSize: 14, paddingTop: 24, border: "1px solid #e5e7eb" }}>
                    Monthly Targets
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Deals Per Month</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>
                    {Math.ceil(globalTotals.dealsPerMonth).toLocaleString()}
                  </td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Total from all reps</td>
                </tr>
                <tr>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Claims Per Month</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>
                    {Math.ceil(globalTotals.claimsPerMonth).toLocaleString()}
                  </td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Total from all reps</td>
                </tr>
                <tr>
                  <td style={{ padding: 12, color: "#374151", paddingLeft: 24, border: "1px solid #e5e7eb" }}>Inspections Per Month</td>
                  <td style={{ padding: 12, textAlign: "right", color: "#111827", fontWeight: 600, border: "1px solid #e5e7eb" }}>
                    {Math.ceil(globalTotals.inspectionsPerMonth).toLocaleString()}
                  </td>
                  <td style={{ padding: 12, color: "#6b7280", fontSize: 12, border: "1px solid #e5e7eb" }}>Total from all reps</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Per-Manager Tables */}
      {managers.length === 0 ? (
        <div className="panel">
          <div className="panel-header">
            <span>Business Units</span>
          </div>
          <div className="panel-body">
            <div className="panel-empty">No managers found.</div>
          </div>
        </div>
      ) : (
        <>
        {managers.filter(m => !hiddenManagers.has(m.id)).map((manager) => {
          const teamMembers = getTeamMembers(manager.id);
          const teamCommittedPlans = teamMembers.filter(m => m.businessPlan?.committed);
          
          const teamTotals = teamCommittedPlans.reduce(
            (acc, member) => {
              const bp = member.businessPlan;
              if (!bp) return acc;
              
              const metrics = calculateMetrics(bp.revenueGoal || 0, bp.averageDealSize || 0);
              
              acc.incomeGoal += bp.revenueGoal || 0;
              acc.dealsPerYear += metrics.dealsPerYear;
              acc.dealsPerMonth += metrics.dealsPerMonth;
              acc.claimsPerYear += metrics.claimsPerYear;
              acc.claimsPerMonth += metrics.claimsPerMonth;
              acc.inspectionsPerYear += metrics.inspectionsPerYear;
              acc.inspectionsPerMonth += metrics.inspectionsPerMonth;
              return acc;
            },
            {
              incomeGoal: 0,
              dealsPerYear: 0,
              dealsPerMonth: 0,
              claimsPerYear: 0,
              claimsPerMonth: 0,
              inspectionsPerYear: 0,
              inspectionsPerMonth: 0
            }
          );

          return (
            <div key={manager.id} className="panel" style={{ marginBottom: 16 }}>
              <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{manager.name} - Manager</span>
                <button
                  onClick={() => hideManager(manager.id)}
                  style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #fff", background: "#fff", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Hide
                </button>
              </div>
              <div className="panel-body">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#111827" }}>Name</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Income Goal</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deal Ave</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deals/Year</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deals/Month</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Claims/Year</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Claims/Month</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Inspections/Year</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Inspections/Month</th>
                        <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "#111827" }}>Status</th>
                        <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "#111827" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Manager Row */}
                      <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8fafc" }}>
                        <td style={{ padding: 12, color: "#111827", fontWeight: 600 }}>
                          {manager.name} (Manager)
                        </td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151", fontWeight: 600 }}>
                          ${teamTotals.incomeGoal.toLocaleString()}
                        </td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>-</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151", fontWeight: 600 }}>
                          {teamTotals.dealsPerYear.toLocaleString()}
                        </td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151", fontWeight: 600 }}>
                          {Math.ceil(teamTotals.dealsPerMonth).toLocaleString()}
                        </td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151", fontWeight: 600 }}>
                          {teamTotals.claimsPerYear.toLocaleString()}
                        </td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151", fontWeight: 600 }}>
                          {Math.ceil(teamTotals.claimsPerMonth).toLocaleString()}
                        </td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151", fontWeight: 600 }}>
                          {teamTotals.inspectionsPerYear.toLocaleString()}
                        </td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151", fontWeight: 600 }}>
                          {Math.ceil(teamTotals.inspectionsPerMonth).toLocaleString()}
                        </td>
                        <td style={{ padding: 12, textAlign: "center" }}>
                          <span style={{ padding: "4px 8px", backgroundColor: "#e5e7eb", color: "#374151", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            Team ({teamMembers.length})
                          </span>
                        </td>
                        <td style={{ padding: 12, textAlign: "center" }}>
                          <button
                            onClick={() => toggleManager(manager.id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#10b981",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            See Team
                          </button>
                        </td>
                      </tr>

                      {/* Team Members Rows (when expanded) */}
                      {expandedManagers.has(manager.id) && teamMembers.map((member, idx) => {
                        const bp = member.businessPlan;
                        const metrics = calculateMetrics(bp?.revenueGoal || 0, bp?.averageDealSize || 0);
                        
                        return (
                          <tr key={`${manager.id}-${member.id}`} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
                            <td style={{ padding: 12, color: "#111827", fontWeight: 500, paddingLeft: 32 }}>
                              └ {member.name}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              ${(bp?.revenueGoal || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              ${(bp?.averageDealSize || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              {metrics.dealsPerYear.toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              {Math.ceil(metrics.dealsPerMonth).toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              {metrics.claimsPerYear.toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              {Math.ceil(metrics.claimsPerMonth).toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              {metrics.inspectionsPerYear.toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>
                              {Math.ceil(metrics.inspectionsPerMonth).toLocaleString()}
                            </td>
                            <td style={{ padding: 12, textAlign: "center" }}>
                              <span style={{ 
                                padding: "4px 8px", 
                                backgroundColor: bp?.committed ? "#d1fae5" : "#fef3c7", 
                                color: bp?.committed ? "#065f46" : "#78350f", 
                                borderRadius: 4, 
                                fontSize: 11, 
                                fontWeight: 600 
                              }}>
                                {bp?.committed ? "Committed" : "Draft"}
                              </span>
                            </td>
                            <td style={{ padding: 12, textAlign: "center" }}>
                              <button
                                onClick={() => {
                                  setEditingUserId(member.id);
                                  setEditForm({
                                    incomeGoal: bp?.revenueGoal || 0,
                                    dealAve: bp?.averageDealSize || 0,
                                    workingDaysPerWeek: bp?.daysPerWeek || 5,
                                    committed: bp?.committed || false
                                  });
                                }}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#3b82f6",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 4,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
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
              </div>
            </div>
          );
        })}

        {/* Hidden Managers Section */}
        {hiddenManagers.size > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setShowHiddenSection(p => !p)}
              style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #f3f4f6", background: "#f3f4f6", color: "#f3f4f6", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 16 }}
            >
              {showHiddenSection ? "▲" : "▼"} Hidden Managers ({hiddenManagers.size})
            </button>
            {showHiddenSection && managers.filter(m => hiddenManagers.has(m.id)).map(manager => {
              const teamMembers = getTeamMembers(manager.id);
              const teamCommittedPlans = teamMembers.filter(m => m.businessPlan?.committed);
              const teamTotals = teamCommittedPlans.reduce((acc, member) => {
                const bp = member.businessPlan;
                if (!bp) return acc;
                const metrics = calculateMetrics(bp.revenueGoal || 0, bp.averageDealSize || 0);
                acc.incomeGoal += bp.revenueGoal || 0;
                acc.dealsPerYear += metrics.dealsPerYear;
                acc.dealsPerMonth += metrics.dealsPerMonth;
                acc.claimsPerYear += metrics.claimsPerYear;
                acc.claimsPerMonth += metrics.claimsPerMonth;
                acc.inspectionsPerYear += metrics.inspectionsPerYear;
                acc.inspectionsPerMonth += metrics.inspectionsPerMonth;
                return acc;
              }, { incomeGoal: 0, dealsPerYear: 0, dealsPerMonth: 0, claimsPerYear: 0, claimsPerMonth: 0, inspectionsPerYear: 0, inspectionsPerMonth: 0 });

              return (
                <div key={manager.id} className="panel" style={{ marginBottom: 16 }}>
                  <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#6b7280" }}>{manager.name} - Manager</span>
                    <button
                      onClick={() => unhideManager(manager.id)}
                      style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #3b82f6", background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Unhide
                    </button>
                  </div>
                  <div className="panel-body">
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                            <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#111827" }}>Name</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Income Goal</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deal Ave</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deals/Year</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deals/Month</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Claims/Year</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Claims/Month</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Inspections/Year</th>
                            <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Inspections/Month</th>
                            <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "#111827" }}>Status</th>
                            <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "#111827" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8fafc" }}>
                            <td style={{ padding: 12, color: "#111827", fontWeight: 600 }}>{manager.name} (Manager)</td>
                            <td style={{ padding: 12, textAlign: "right" }}>${teamTotals.incomeGoal.toLocaleString()}</td>
                            <td style={{ padding: 12, textAlign: "right" }}>-</td>
                            <td style={{ padding: 12, textAlign: "right" }}>{teamTotals.dealsPerYear.toLocaleString()}</td>
                            <td style={{ padding: 12, textAlign: "right" }}>{Math.ceil(teamTotals.dealsPerMonth).toLocaleString()}</td>
                            <td style={{ padding: 12, textAlign: "right" }}>{teamTotals.claimsPerYear.toLocaleString()}</td>
                            <td style={{ padding: 12, textAlign: "right" }}>{Math.ceil(teamTotals.claimsPerMonth).toLocaleString()}</td>
                            <td style={{ padding: 12, textAlign: "right" }}>{teamTotals.inspectionsPerYear.toLocaleString()}</td>
                            <td style={{ padding: 12, textAlign: "right" }}>{Math.ceil(teamTotals.inspectionsPerMonth).toLocaleString()}</td>
                            <td style={{ padding: 12, textAlign: "center" }}><span style={{ padding: "4px 8px", backgroundColor: "#e5e7eb", color: "#374151", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Team ({teamMembers.length})</span></td>
                            <td style={{ padding: 12, textAlign: "center" }}>
                              <button onClick={() => toggleManager(manager.id)} style={{ padding: "6px 12px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>See Team</button>
                            </td>
                          </tr>
                          {expandedManagers.has(manager.id) && teamMembers.map((member) => {
                            const bp = member.businessPlan;
                            const metrics = calculateMetrics(bp?.revenueGoal || 0, bp?.averageDealSize || 0);
                            return (
                              <tr key={member.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <td style={{ padding: 12, paddingLeft: 32 }}>└ {member.name}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>${(bp?.revenueGoal || 0).toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>${(bp?.averageDealSize || 0).toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{metrics.dealsPerYear.toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{Math.ceil(metrics.dealsPerMonth).toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{metrics.claimsPerYear.toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{Math.ceil(metrics.claimsPerMonth).toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{metrics.inspectionsPerYear.toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{Math.ceil(metrics.inspectionsPerMonth).toLocaleString()}</td>
                                <td style={{ padding: 12, textAlign: "center" }}>
                                  <span style={{ padding: "4px 8px", backgroundColor: bp?.committed ? "#d1fae5" : "#fef3c7", color: bp?.committed ? "#065f46" : "#78350f", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                                    {bp?.committed ? "Committed" : "Draft"}
                                  </span>
                                </td>
                                <td style={{ padding: 12, textAlign: "center" }}>
                                  <button onClick={() => { setEditingUserId(member.id); setEditForm({ incomeGoal: bp?.revenueGoal || 0, dealAve: bp?.averageDealSize || 0, workingDaysPerWeek: bp?.daysPerWeek || 5, committed: bp?.committed || false }); }} style={{ padding: "6px 12px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
      )}

      {/* Edit Modal */}
      {editingUserId && editForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setEditingUserId(null)}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: 8,
            padding: 24,
            width: "90%",
            maxWidth: 500,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 20 }}>
              Edit Plan - {salesReps.find(m => m.id === editingUserId)?.name}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <label className="field">
                <span className="field-label">Income Goal</span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 12, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>$</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editForm.incomeGoal}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setEditForm({ ...editForm, incomeGoal: Number(e.target.value) });
                    }}
                    style={{ width: "100%", padding: "10px 12px 10px 28px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }}
                  />
                </div>
              </label>

              <label className="field">
                <span className="field-label">Deal Ave</span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 12, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={editForm.dealAve}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setEditForm({ ...editForm, dealAve: Number(e.target.value) });
                    }}
                    style={{ width: "100%", padding: "10px 12px 10px 28px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }}
                  />
                </div>
              </label>

              <label className="field">
                <span className="field-label">Working Days Per Week</span>
                <input
                  type="number"
                  min={1}
                  max={7}
                  step={0.5}
                  value={editForm.workingDaysPerWeek}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const value = Number(e.target.value);
                    if (value >= 1 && value <= 7) {
                      setEditForm({ ...editForm, workingDaysPerWeek: value });
                    }
                  }}
                  style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }}
                />
              </label>

              <label className="field">
                <span className="field-label">Status</span>
                <select
                  value={editForm.committed ? "committed" : "draft"}
                  onChange={e => setEditForm({ ...editForm, committed: e.target.value === "committed" })}
                  style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6, background: "#fff" }}
                >
                  <option value="draft">Draft</option>
                  <option value="committed">Committed</option>
                </select>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingUserId(null)}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#e5e7eb",
                  color: "#111827",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}