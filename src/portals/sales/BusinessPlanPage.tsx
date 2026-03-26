import { useState, useMemo, ChangeEvent, useEffect } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";

// Business logic calculations
const calculateMetrics = (incomeGoal: number, dealAve: number, workingDaysPerWeek: number) => {
  // Deals Per Year = Income Goal / Deal Ave
  const dealsPerYear = dealAve > 0 ? Math.round(incomeGoal / dealAve) : 0;
  
  // Deals Per Month = Deals Per Year / 12
  const dealsPerMonth = dealsPerYear / 12;
  
  // Claims Per Year = Deals Per Year * 3
  const claimsPerYear = Math.round(dealsPerYear * 3);
  
  // Claims Per Month = Claims Per Year / 12
  const claimsPerMonth = claimsPerYear / 12;
  
  // Inspections Per Year = Claims Per Year * 3
  const inspectionsPerYear = Math.round(claimsPerYear * 3);
  
  // Inspections Per Month = Inspections Per Year / 12
  const inspectionsPerMonth = inspectionsPerYear / 12;

  return {
    dealsPerYear,
    dealsPerMonth,
    claimsPerYear,
    claimsPerMonth,
    inspectionsPerYear,
    inspectionsPerMonth,
    workingDaysPerWeek
  };
};

export function BusinessPlanPage(props: {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}) {
  const [existingPlan, setExistingPlan] = useState<BusinessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [incomeGoal, setIncomeGoal] = useState(100000);
  const [dealAve, setDealAve] = useState(12000);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(5);
  const [saved, setSaved] = useState(false);
  const [committed, setCommitted] = useState(false);

  // Load user's business plan from database
  useEffect(() => {
    async function loadBusinessPlan() {
      try {
        const response = await fetch(`/api/business-plan?userId=${props.profile.id}`);
        if (response.ok) {
          const data = await response.json();
          const userPlan = data.find((plan: any) => plan.userId === props.profile.id);
          if (userPlan?.businessPlan) {
            setExistingPlan(userPlan.businessPlan);
            setIncomeGoal(userPlan.businessPlan.revenueGoal || 100000);
            setDealAve(userPlan.businessPlan.averageDealSize || 12000);
            setWorkingDaysPerWeek(userPlan.businessPlan.daysPerWeek || 5);
            setCommitted(userPlan.businessPlan.committed || false);
            setSaved(true);
          }
        }
      } catch (error) {
        console.error('Failed to load business plan:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadBusinessPlan();
  }, [props.profile.id]);

  const metrics = useMemo(() => {
    return calculateMetrics(incomeGoal, dealAve, workingDaysPerWeek);
  }, [incomeGoal, dealAve, workingDaysPerWeek]);

  async function handleSavePlan() {
    const plan: BusinessPlan = {
      revenueGoal: incomeGoal,
      daysPerWeek: workingDaysPerWeek,
      territories: [props.profile.territory || ""],
      averageDealSize: dealAve,
      dealsPerYear: metrics.dealsPerYear,
      dealsPerMonth: Math.round(metrics.dealsPerMonth),
      inspectionsNeeded: Math.round(metrics.inspectionsPerMonth),
      doorsPerYear: 0,
      doorsPerDay: 0,
      committed: false
    };

    try {
      await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: props.profile.id,
          businessPlan: plan
        })
      });

      setExistingPlan(plan);
      setSaved(true);
      setCommitted(false);
    } catch (error) {
      console.error('Failed to save business plan:', error);
    }
  }

  async function handleCommitPlan() {
    const plan: BusinessPlan = {
      revenueGoal: incomeGoal,
      daysPerWeek: workingDaysPerWeek,
      territories: [props.profile.territory || ""],
      averageDealSize: dealAve,
      dealsPerYear: metrics.dealsPerYear,
      dealsPerMonth: Math.round(metrics.dealsPerMonth),
      inspectionsNeeded: Math.round(metrics.inspectionsPerMonth),
      doorsPerYear: 0,
      doorsPerDay: 0,
      committed: true
    };

    try {
      // Save to database
      await fetch('/api/business-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: props.profile.id,
          businessPlan: plan
        })
      });

      // Build change details
      const changes: string[] = [];
      if (existingPlan?.revenueGoal !== plan.revenueGoal) {
        changes.push(`Income Goal: ${existingPlan?.revenueGoal?.toLocaleString() || 0} → ${plan.revenueGoal?.toLocaleString()}`);
      }
      if (existingPlan?.averageDealSize !== plan.averageDealSize) {
        changes.push(`Deal Ave: ${existingPlan?.averageDealSize?.toLocaleString() || 0} → ${plan.averageDealSize?.toLocaleString()}`);
      }
      if (existingPlan?.daysPerWeek !== plan.daysPerWeek) {
        changes.push(`Working Days/Week: ${existingPlan?.daysPerWeek || 0} → ${plan.daysPerWeek}`);
      }
      const changeMessage = changes.length > 0 ? changes.join(', ') : 'Plan committed';

      // Create notifications for manager and admins
      const allUsers = await fetch('/api/users').then(r => r.json());
      const admins = allUsers.filter((u: any) => u.role === 'admin');
      const notifications = [];

      if (props.profile.managerId) {
        notifications.push({
          userId: props.profile.managerId,
          type: 'plan_updated',
          title: 'Sales Rep Updated Plan',
          message: `${props.profile.name} updated their business plan. ${changeMessage}`,
          metadata: { updatedBy: 'sales', targetUser: props.profile.id }
        });
      }

      notifications.push(
        ...admins.map((admin: any) => ({
          userId: admin.id,
          type: 'plan_updated',
          title: 'Sales Rep Updated Plan',
          message: `${props.profile.name} updated their business plan. ${changeMessage}`,
          metadata: { updatedBy: 'sales', targetUser: props.profile.id }
        }))
      );

      await Promise.all(
        notifications.map(n => 
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n)
          })
        )
      );

      props.onProfileChange({
        ...props.profile,
        businessPlan: plan
      });
      setCommitted(true);
    } catch (error) {
      console.error('Failed to commit business plan:', error);
    }
  }

  if (loading) {
    return <div className="panel-empty">Loading your business plan...</div>;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span>My Business Plan - {props.profile.name}</span>
      </div>
      
      <div className="panel-body">
        {/* Input Section */}
        <div style={{ marginBottom: 32, backgroundColor: "#f9fafb", padding: 16, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 16 }}>
            Plan Inputs
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Income Goal */}
            <label className="field">
              <span className="field-label">Income Goal</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: 12, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>$</span>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  step={1000}
                  value={incomeGoal}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const value = Number(e.target.value);
                    setIncomeGoal(value);
                  }}
                  style={{ width: "100%", padding: "10px 12px 10px 28px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }}
                />
              </div>
            </label>

            {/* Deal Ave */}
            <label className="field">
              <span className="field-label">Deal Ave (Average Deal Size)</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: 12, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>$</span>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  step={100}
                  value={dealAve}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const value = Number(e.target.value);
                    setDealAve(value);
                  }}
                  style={{ width: "100%", padding: "10px 12px 10px 28px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 6 }}
                />
              </div>
            </label>


          </div>
        </div>

        {/* Hardcoded Ratios Display */}
        <div style={{ display: "none", marginBottom: 32, gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 12, backgroundColor: "#fce7f3", borderRadius: 8, border: "1px solid #ec4899" }}>
            <div style={{ fontSize: 11, color: "#831843", fontWeight: 600, marginBottom: 4 }}>Claims Ratio</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#831843" }}>25%</div>
          </div>
          
          <div style={{ padding: 12, backgroundColor: "#fef3c7", borderRadius: 8, border: "1px solid #f59e0b" }}>
            <div style={{ fontSize: 11, color: "#78350f", fontWeight: 600, marginBottom: 4 }}>Inspection Ratio</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#78350f" }}>30%</div>
          </div>
        </div>

        {/* Results Section - Yearly */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
            Yearly Targets
          </h3>

          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <DashboardCard
              title="Deals Per Year"
              value={metrics.dealsPerYear.toLocaleString()}
              description="Income Goal / Deal Ave"
            />
            <DashboardCard
              title="Claims Per Year"
              value={metrics.claimsPerYear.toLocaleString()}
              description="Deals Per Year × 3"
            />
            <DashboardCard
              title="Inspections Per Year"
              value={metrics.inspectionsPerYear.toLocaleString()}
              description="Claims Per Year × 3"
            />
          </div>
        </div>

        {/* Results Section - Monthly */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
            Monthly Targets
          </h3>

          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <DashboardCard
              title="Deals Per Month"
              value={Math.ceil(metrics.dealsPerMonth).toLocaleString()}
              description="Deals Per Year / 12"
            />
            <DashboardCard
              title="Claims Per Month"
              value={Math.ceil(metrics.claimsPerMonth).toLocaleString()}
              description="Claims Per Year / 12"
            />
            <DashboardCard
              title="Inspections Per Month"
              value={Math.ceil(metrics.inspectionsPerMonth).toLocaleString()}
              description="Inspections Per Year / 12"
            />
          </div>
        </div>

        {/* Commitment Section */}
        <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, marginBottom: 4 }}>
              {committed ? "Plan Committed" : "Save Your Plan"}
            </h3>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
              {committed ? "Your plan has been committed to your manager" : "Save as draft or commit your plan"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {committed && (
              <span style={{
                padding: "6px 12px",
                backgroundColor: "#d1fae5",
                color: "#065f46",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600
              }}>
                ✓ Committed
              </span>
            )}
            <button
              className="btn-primary"
              onClick={handleSavePlan}
              style={{ padding: "10px 24px", fontSize: 13, fontWeight: 600, backgroundColor: "#f59e0b" }}
            >
              Save as Draft
            </button>
            <button
              className="btn-primary"
              onClick={handleCommitPlan}
              style={{ padding: "10px 24px", fontSize: 13, fontWeight: 600 }}
            >
              {committed ? "Update Commitment" : "Commit Plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
