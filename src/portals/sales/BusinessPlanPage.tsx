import { useState, useMemo, ChangeEvent, useEffect } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";

export function BusinessPlanPage(props: {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}) {
  const [existingPlan, setExistingPlan] = useState<BusinessPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const revenueOptions = Array.from(
    { length: 19 },
    (_, index) => 100000 + index * 50000
  );
  const [revenueGoal, setRevenueGoal] = useState(
    existingPlan?.revenueGoal ?? 100000
  );
  const [daysPerWeek, setDaysPerWeek] = useState(
    existingPlan?.daysPerWeek ?? 5
  );
  const [averageIncomePerDeal, setAverageIncomePerDeal] = useState(
    existingPlan?.averageDealSize ?? 12000
  );
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
            setRevenueGoal(userPlan.businessPlan.revenueGoal || 100000);
            setDaysPerWeek(userPlan.businessPlan.daysPerWeek || 5);
            setAverageIncomePerDeal(userPlan.businessPlan.averageDealSize || 12000);
            setCommitted(userPlan.businessPlan.committed || false);
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
    const averageDealSize = averageIncomePerDeal;
    const knockToConversationRate = 0.10; // 10%
    const conversationToInspectionRate = 0.30; // 30%
    const inspectionToClaimRate = 0.50; // 50%

    const dealsPerYear = Math.ceil(revenueGoal / averageDealSize);
    const dealsPerMonth = Math.ceil(dealsPerYear / 12);
    const inspectionsNeeded = Math.ceil(dealsPerYear / inspectionToClaimRate);
    const conversationsNeeded = Math.ceil(inspectionsNeeded / conversationToInspectionRate);
    const doorsPerYear = Math.ceil(conversationsNeeded / knockToConversationRate);
    const inspectionsPerMonth = Math.ceil(inspectionsNeeded / 12);
    const conversationsPerMonth = Math.ceil(conversationsNeeded / 12);
    const doorsPerMonth = Math.ceil(doorsPerYear / 12);
    const weeksPerYear = 52;
    const workingDaysPerWeek = daysPerWeek;
    const workingDaysPerYear = weeksPerYear * workingDaysPerWeek;
    const doorsPerDay =
      workingDaysPerYear > 0
        ? Math.ceil(doorsPerYear / workingDaysPerYear)
        : 0;
    const conversationsPerDay =
      workingDaysPerYear > 0
        ? Math.ceil(conversationsNeeded / workingDaysPerYear)
        : 0;
    const inspectionsPerDay =
      workingDaysPerYear > 0
        ? Math.ceil(inspectionsNeeded / workingDaysPerYear)
        : 0;

    return {
      dealsPerYear,
      dealsPerMonth,
      inspectionsNeeded,
      conversationsNeeded,
      doorsPerYear,
      inspectionsPerMonth,
      conversationsPerMonth,
      doorsPerMonth,
      doorsPerDay,
      conversationsPerDay,
      inspectionsPerDay
    };
  }, [averageIncomePerDeal, revenueGoal, daysPerWeek]);

  async function handleCommit() {
    const territoryInput = existingPlan?.territories.join(", ") ?? props.profile.territory ?? "";
    const territories = territoryInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const plan: BusinessPlan = {
      revenueGoal,
      daysPerWeek,
      territories,
      averageDealSize: averageIncomePerDeal,
      dealsPerYear: metrics.dealsPerYear,
      dealsPerMonth: metrics.dealsPerMonth,
      inspectionsNeeded: metrics.inspectionsNeeded,
      doorsPerYear: metrics.doorsPerYear,
      doorsPerDay: metrics.doorsPerDay,
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
        changes.push(`Revenue Goal: $${existingPlan?.revenueGoal?.toLocaleString() || 0} → $${plan.revenueGoal?.toLocaleString()}`);
      }
      if (existingPlan?.daysPerWeek !== plan.daysPerWeek) {
        changes.push(`Days/Week: ${existingPlan?.daysPerWeek || 0} → ${plan.daysPerWeek}`);
      }
      if (existingPlan?.dealsPerYear !== plan.dealsPerYear) {
        changes.push(`Deals/Year: ${existingPlan?.dealsPerYear || 0} → ${plan.dealsPerYear}`);
      }
      if (existingPlan?.dealsPerMonth !== plan.dealsPerMonth) {
        changes.push(`Deals/Month: ${existingPlan?.dealsPerMonth || 0} → ${plan.dealsPerMonth}`);
      }
      if (existingPlan?.inspectionsNeeded !== plan.inspectionsNeeded) {
        changes.push(`Inspections: ${existingPlan?.inspectionsNeeded || 0} → ${plan.inspectionsNeeded}`);
      }
      if (existingPlan?.doorsPerYear !== plan.doorsPerYear) {
        changes.push(`Door Knocks: ${existingPlan?.doorsPerYear?.toLocaleString() || 0} → ${plan.doorsPerYear?.toLocaleString()}`);
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
      console.error('Failed to save business plan:', error);
    }
  }

  if (loading) {
    return <div>Loading your business plan...</div>;
  }

  return (
    <div className="business-plan">
      <div className="panel-header">My Business Plan</div>
      <div className="plan-form-row">
        <label className="field plan-field-days">
          <span className="field-label">Revenue Goal</span>
          <select
            className="field-input"
            value={revenueGoal.toString()}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setRevenueGoal(Number(e.target.value) || 0)
            }
          >
            {revenueOptions.map((amount) => (
              <option key={amount} value={amount.toString()}>
                ${amount.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <label className="field plan-field-days">
          <span className="field-label">Average Income per Deal</span>
          <input
            className="field-input"
            type="number"
            min={100}
            step={100}
            value={averageIncomePerDeal}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = Number(e.target.value);
              if (value >= 100) {
                setAverageIncomePerDeal(value);
              }
            }}
          />
        </label>
        <label className="field plan-field-days">
          <span className="field-label">Days per week working</span>
          <div className="plan-days-row">
            <select
              className="field-input"
              value={daysPerWeek.toString()}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  setDaysPerWeek(value);
                }
              }}
            >
              {Array.from({ length: 14 }, (_, i) => 0.5 + i * 0.5).map((days) => (
                <option key={days} value={days.toString()}>
                  {days}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-primary plan-calculate-button"
            >
              Calculate
            </button>
          </div>
        </label>
      </div>
      <div className="grid grid-3 plan-metrics">
        <DashboardCard
          title="Deals Needed Per Year"
          value={String(metrics.dealsPerYear)}
        />
        <DashboardCard
          title="Deals Needed Per Month"
          value={String(metrics.dealsPerMonth)}
        />
        <DashboardCard
          title="Inspections Needed Per Month"
          value={String(metrics.inspectionsPerMonth)}
        />
        <DashboardCard
          title="Conversations Per Month"
          value={String(metrics.conversationsPerMonth)}
        />
        <DashboardCard
          title="Doors Knocked Per month"
          value={String(metrics.doorsPerMonth)}
        />
      </div>
      <div className="grid grid-3 plan-metrics">
        <DashboardCard
          title="Doors To Knock Per Day"
          value={String(metrics.doorsPerDay)}
        />
        <DashboardCard
          title="Conversations Per Day"
          value={String(metrics.conversationsPerDay)}
        />
        <DashboardCard
          title="Inspections Needed Per Day"
          value={String(metrics.inspectionsPerDay)}
        />
      </div>
      <div className="panel-section plan-actions">
        <button
          className={committed ? "btn-primary solid" : "btn-primary"}
          onClick={handleCommit}
        >
          I'm Committed To My Plan – send to manager for approval
        </button>
        {committed && (
          <span className="plan-commitment-badge">
            Commitment recorded for this plan
          </span>
        )}
      </div>
    </div>
  );
}
