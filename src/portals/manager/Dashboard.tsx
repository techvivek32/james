import { useState, useEffect } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";

export function ManagerDashboard(props: { teamMembers: UserProfile[] }) {
  const [committedPlans, setCommittedPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamData() {
      try {
        // Fetch business plans for all team members
        const plansPromises = props.teamMembers.map(member =>
          fetch(`/api/business-plan?userId=${member.id}`)
            .then(r => r.json())
            .then(data => {
              const userPlan = data.find((p: any) => p.userId === member.id);
              return {
                userId: member.id,
                userName: member.name,
                businessPlan: userPlan?.businessPlan
              };
            })
        );
        
        const plans = await Promise.all(plansPromises);
        
        // Filter only committed plans
        const committed = plans.filter(p => p.businessPlan?.committed);
        setCommittedPlans(committed);
      } catch (error) {
        console.error('Failed to fetch team data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (props.teamMembers.length > 0) {
      fetchTeamData();
    } else {
      setLoading(false);
    }
  }, [props.teamMembers]);

  // Calculate totals from committed plans
  const totals = committedPlans.reduce(
    (acc, plan) => {
      const bp = plan.businessPlan;
      if (!bp) {
        return acc;
      }
      const dealsPerYear = bp.dealsPerYear || 0;
      const claimsPerYear = Math.round(dealsPerYear - (dealsPerYear * 0.25));
      const inspectionsPerYear = Math.round(claimsPerYear - (claimsPerYear * 0.30));
      
      acc.incomeGoal += bp.revenueGoal || 0;
      acc.dealsPerYear += dealsPerYear;
      acc.dealsPerMonth += dealsPerYear / 12;
      acc.claimsPerYear += claimsPerYear;
      acc.claimsPerMonth += claimsPerYear / 12;
      acc.inspectionsPerYear += inspectionsPerYear;
      acc.inspectionsPerMonth += inspectionsPerYear / 12;
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

  if (loading) {
    return <div style={{ padding: 24 }}>Loading team data...</div>;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Team Business Plans Overview</span>
      </div>
      
      <div className="panel-body">
        {/* First Row - Totals */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 16 }}>
            Team Totals
          </h3>
          
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <DashboardCard
              title="Total Income Goal"
              value={`$${totals.incomeGoal.toLocaleString()}`}
              description="Sum of all reps"
            />
            <DashboardCard
              title="Claims Ratio"
              value="25%"
              description="Hardcoded"
            />
            <DashboardCard
              title="Inspection Ratio"
              value="30%"
              description="Hardcoded"
            />
          </div>
        </div>

        {/* Yearly Targets */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
            Yearly Targets
          </h3>

          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <DashboardCard
              title="Deals Per Year"
              value={totals.dealsPerYear.toLocaleString()}
              description="Total from all reps"
            />
            <DashboardCard
              title="Claims Per Year"
              value={totals.claimsPerYear.toLocaleString()}
              description="Total from all reps"
            />
            <DashboardCard
              title="Inspections Per Year"
              value={totals.inspectionsPerYear.toLocaleString()}
              description="Total from all reps"
            />
          </div>
        </div>

        {/* Monthly Targets */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
            Monthly Targets
          </h3>

          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <DashboardCard
              title="Deals Per Month"
              value={totals.dealsPerMonth % 1 !== 0 ? totals.dealsPerMonth.toFixed(2) : totals.dealsPerMonth.toLocaleString()}
              description="Total from all reps"
            />
            <DashboardCard
              title="Claims Per Month"
              value={totals.claimsPerMonth % 1 !== 0 ? totals.claimsPerMonth.toFixed(2) : totals.claimsPerMonth.toLocaleString()}
              description="Total from all reps"
            />
            <DashboardCard
              title="Inspections Per Month"
              value={totals.inspectionsPerMonth % 1 !== 0 ? totals.inspectionsPerMonth.toFixed(2) : totals.inspectionsPerMonth.toLocaleString()}
              description="Total from all reps"
            />
          </div>
        </div>

        {/* Sales User Table */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
            Sales Team Plans
          </h3>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 600, color: "#111827" }}>Rep Name</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Income Goal</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deal Ave</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deals/Year</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Deals/Month</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Claims/Year</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Claims/Month</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Inspections/Year</th>
                  <th style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "#111827" }}>Inspections/Month</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 600, color: "#111827" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {committedPlans.length > 0 ? (
                  committedPlans.map((plan, idx) => {
                    const bp = plan.businessPlan;
                    const dealsPerYear = bp?.dealsPerYear || 0;
                    const claimsPerYear = Math.round(dealsPerYear - (dealsPerYear * 0.25));
                    const inspectionsPerYear = Math.round(claimsPerYear - (claimsPerYear * 0.30));
                    
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                        <td style={{ padding: 12, color: "#111827", fontWeight: 500 }}>{plan.userName}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>${(bp?.revenueGoal || 0).toLocaleString()}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>${(bp?.averageDealSize || 0).toLocaleString()}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>{dealsPerYear.toLocaleString()}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>{(dealsPerYear / 12).toFixed(2)}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>{claimsPerYear.toLocaleString()}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>{(claimsPerYear / 12).toFixed(2)}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>{inspectionsPerYear.toLocaleString()}</td>
                        <td style={{ padding: 12, textAlign: "right", color: "#374151" }}>{(inspectionsPerYear / 12).toFixed(2)}</td>
                        <td style={{ padding: 12, textAlign: "center" }}>
                          <span style={{ padding: "4px 8px", backgroundColor: "#d1fae5", color: "#065f46", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            Committed
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
                      No committed plans yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
