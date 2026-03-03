import { useEffect, useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { BusinessPlan, UserProfile } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

type BusinessPlanWithUser = {
  userId: string;
  userName: string;
  userRole: string;
  businessPlan: BusinessPlan | null;
  updatedAt: Date | null;
};

export function TeamBusinessPlansPage() {
  const [businessPlans, setBusinessPlans] = useState<BusinessPlanWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBusinessPlans();
    }
  }, [user]);

  async function fetchBusinessPlans() {
    try {
      if (!user || user.role !== 'manager') {
        console.log('No manager user found');
        return;
      }
      
      console.log('Current logged-in manager:', user.name, user.id);
      const response = await fetch(`/api/users`);
      if (response.ok) {
        const users = await response.json();
        const teamMembers = users.filter((u: UserProfile) => u.managerId === user.id && u.role === 'sales');
        const plansData = teamMembers.map((member: UserProfile) => ({
          userId: member.id,
          userName: member.name,
          userRole: member.role,
          businessPlan: member.businessPlan || null,
          updatedAt: null
        }));
        setBusinessPlans(plansData);
      }
    } catch (error) {
      console.error('Failed to fetch business plans:', error);
    } finally {
      setLoading(false);
    }
  }

  const salesPlans = businessPlans.filter(plan => plan.userRole === 'sales');
  
  const totals = salesPlans.reduce(
    (acc, planData) => {
      const plan = planData.businessPlan;
      if (plan) {
        acc.revenueGoal += plan.revenueGoal || 0;
        acc.dealsPerYear += plan.dealsPerYear || 0;
        acc.inspectionsNeeded += plan.inspectionsNeeded || 0;
        acc.doorsPerYear += plan.doorsPerYear || 0;
      }
      return acc;
    },
    { revenueGoal: 0, dealsPerYear: 0, inspectionsNeeded: 0, doorsPerYear: 0 }
  );

  if (loading) {
    return <div>Loading business plans...</div>;
  }

  return (
    <div>
      <div className="grid grid-4">
        <DashboardCard
          title="Team Revenue Goal"
          value={`$${totals.revenueGoal.toLocaleString()}`}
          description="Sum of rep plans"
        />
        <DashboardCard
          title="Deals Needed (Year)"
          value={totals.dealsPerYear.toLocaleString()}
          description="Across all reps"
        />
        <DashboardCard
          title="Inspections Needed"
          value={totals.inspectionsNeeded.toLocaleString()}
          description="From plan assumptions"
        />
        <DashboardCard
          title="Door Knocks (Year)"
          value={totals.doorsPerYear.toLocaleString()}
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
          {salesPlans.length === 0 ? (
            <div className="panel-empty">
              No sales team members found.
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
                  </tr>
                </thead>
                <tbody>
                  {salesPlans.map((planData, index) => {
                    const plan = planData.businessPlan;
                    return (
                      <tr
                        key={planData.userId}
                        style={{
                          fontSize: 13,
                          backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                          borderTop: index === 0 ? "1px solid #e5e7eb" : "1px solid #f1f5f9"
                        }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {planData.userName}
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {planData.userRole.toUpperCase()}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
