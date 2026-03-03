import { useState, useMemo, ChangeEvent } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";

export function BusinessPlanPage(props: {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}) {
  const existingPlan = props.profile.businessPlan;
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
  const [committed, setCommitted] = useState(existingPlan?.committed ?? false);

  const metrics = useMemo(() => {
    const averageDealSize = existingPlan?.averageDealSize ?? 12000;
    const inspectionToDealRate = 0.4;
    const doorsToInspectionRate = 0.08;

    const dealsPerYear = Math.ceil(revenueGoal / averageDealSize);
    const dealsPerMonth = Math.ceil(dealsPerYear / 12);
    const inspectionsNeeded = Math.ceil(dealsPerYear / inspectionToDealRate);
    const doorsPerYear = Math.ceil(inspectionsNeeded / doorsToInspectionRate);
    const inspectionsPerMonth = Math.ceil(inspectionsNeeded / 12);
    const doorsPerMonth = Math.ceil(doorsPerYear / 12);
    const weeksPerYear = 52;
    const doorsPerDay =
      daysPerWeek > 0
        ? Math.ceil(doorsPerYear / (weeksPerYear * daysPerWeek))
        : 0;

    return {
      dealsPerYear,
      dealsPerMonth,
      inspectionsNeeded,
      doorsPerYear,
      inspectionsPerMonth,
      doorsPerMonth,
      doorsPerDay
    };
  }, [existingPlan?.averageDealSize, revenueGoal, daysPerWeek]);

  function handleCommit() {
    const territoryInput = existingPlan?.territories.join(", ") ?? props.profile.territory ?? "";
    const territories = territoryInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const plan: BusinessPlan = {
      revenueGoal,
      daysPerWeek,
      territories,
      averageDealSize: existingPlan?.averageDealSize ?? 12000,
      dealsPerYear: metrics.dealsPerYear,
      dealsPerMonth: metrics.dealsPerMonth,
      inspectionsNeeded: metrics.inspectionsNeeded,
      doorsPerYear: metrics.doorsPerYear,
      doorsPerDay: metrics.doorsPerDay,
      committed: true
    };

    // Save to database
    fetch('/api/business-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: props.profile.id,
        businessPlan: plan
      })
    }).then(() => {
      props.onProfileChange({
        ...props.profile,
        businessPlan: plan
      });
      setCommitted(true);
    }).catch(error => {
      console.error('Failed to save business plan:', error);
    });
  }

  return (
    <div className="business-plan">
      <div className="panel-header">My Business Plan</div>
      <div className="plan-form-row">
        <label className="field plan-field-revenue">
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
          <span className="field-label">Days per week working</span>
          <div className="plan-days-row">
            <input
              className="field-input"
              type="number"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const value = Number(e.target.value);
                if (value >= 1 && value <= 7) {
                  setDaysPerWeek(value);
                } else if (e.target.value === '') {
                  setDaysPerWeek(1);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                  e.preventDefault();
                }
              }}
            />
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
          title="Doors Knocked Per month"
          value={String(metrics.doorsPerMonth)}
        />
        <DashboardCard
          title="Doors To Knock Per Day"
          value={String(metrics.doorsPerDay)}
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
