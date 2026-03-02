import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile } from "../../types";

export function SalesDashboard(props: { profile: UserProfile }) {
  const plan = props.profile.businessPlan;
  const incomeGoal = plan?.revenueGoal ?? 0;
  const dealsNeeded = plan?.dealsPerYear ?? 0;
  const claimsNeeded = Math.ceil(dealsNeeded * 1.2);
  const inspectionsNeeded = plan?.inspectionsNeeded ?? 0;
  const convosNeeded = Math.ceil(inspectionsNeeded * 2.5);
  const doorsNeeded = plan?.doorsPerYear ?? 0;
  const locationFromPlan =
    plan && plan.territories.length > 0 ? plan.territories[0] : undefined;
  const location = props.profile.territory ?? locationFromPlan ?? "";

  const incomeActual = 84000;
  const dealsActual = 6;
  const claimsActual = 8;
  const inspectionsActual = 32;
  const convosActual = 85;
  const doorsActual = 420;

  const incomeDelta = incomeActual - incomeGoal;
  const dealsDelta = dealsActual - dealsNeeded;
  const claimsDelta = claimsActual - claimsNeeded;
  const inspectionsDelta = inspectionsActual - inspectionsNeeded;
  const convosDelta = convosActual - convosNeeded;
  const doorsDelta = doorsActual - doorsNeeded;

  const comparisonItems = [
    {
      id: "income",
      label: "Income",
      goal: incomeGoal,
      actual: incomeActual,
      format: (value: number) => `$${value.toLocaleString()}`
    },
    {
      id: "deals",
      label: "Deals",
      goal: dealsNeeded,
      actual: dealsActual,
      format: (value: number) => value.toLocaleString()
    },
    {
      id: "claims",
      label: "Claims",
      goal: claimsNeeded,
      actual: claimsActual,
      format: (value: number) => value.toLocaleString()
    },
    {
      id: "inspections",
      label: "Inspections",
      goal: inspectionsNeeded,
      actual: inspectionsActual,
      format: (value: number) => value.toLocaleString()
    },
    {
      id: "convos",
      label: "Convos",
      goal: convosNeeded,
      actual: convosActual,
      format: (value: number) => value.toLocaleString()
    },
    {
      id: "doors",
      label: "Doors",
      goal: doorsNeeded,
      actual: doorsActual,
      format: (value: number) => value.toLocaleString()
    }
  ];

  const maxComparisonValue = Math.max(
    ...comparisonItems.map((item) => Math.max(item.goal, item.actual))
  );

  return (
    <div className="sales-dashboard">
      <div className="sales-plan-summary">
        <div className="sales-plan-summary-main">
          <div className="sales-plan-summary-name">{props.profile.name}</div>
          {location && (
            <div className="sales-plan-summary-location">{location}</div>
          )}
        </div>
      </div>
      <div className="sales-plan-heading">
        <div className="sales-plan-summary-main">
          <div className="sales-plan-summary-name">Goals Committed to</div>
        </div>
      </div>
      <div className="grid grid-4">
        <DashboardCard
          title="Income Goal"
          value={`$${incomeGoal.toLocaleString()}`}
        />
        <DashboardCard
          title="Deals Needed"
          value={dealsNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Claims Needed"
          value={claimsNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Inspections Needed"
          value={inspectionsNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Convos Needed"
          value={convosNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Doors Needed"
          value={doorsNeeded.toLocaleString()}
        />
      </div>
      <div className="sales-plan-heading">
        <div className="sales-plan-summary-main">
          <div className="sales-plan-summary-name">Actuals</div>
        </div>
      </div>
      <div className="grid grid-4">
        <DashboardCard
          title="Income Actual"
          value={`$${incomeActual.toLocaleString()}`}
        />
        <DashboardCard title="Deals Actual" value={String(dealsActual)} />
        <DashboardCard
          title="Claims Actual"
          value={claimsActual.toLocaleString()}
        />
        <DashboardCard
          title="Inspections Actual"
          value={inspectionsActual.toLocaleString()}
        />
        <DashboardCard
          title="Convos Actual"
          value={convosActual.toLocaleString()}
        />
        <DashboardCard
          title="Doors Actual"
          value={doorsActual.toLocaleString()}
        />
      </div>
      <div className="sales-plan-heading">
        <div className="sales-plan-summary-main">
          <div className="sales-plan-summary-name">Delta</div>
        </div>
      </div>
      <div className="grid grid-4">
        <DashboardCard
          title="Income Delta"
          value={`$${incomeDelta.toLocaleString()}`}
        />
        <DashboardCard
          title="Deals Delta"
          value={dealsDelta.toLocaleString()}
        />
        <DashboardCard
          title="Claims Delta"
          value={claimsDelta.toLocaleString()}
        />
        <DashboardCard
          title="Inspections Delta"
          value={inspectionsDelta.toLocaleString()}
        />
        <DashboardCard
          title="Convos Delta"
          value={convosDelta.toLocaleString()}
        />
        <DashboardCard
          title="Doors Delta"
          value={doorsDelta.toLocaleString()}
        />
      </div>
      <div className="sales-chart-card">
        <div className="sales-chart-header">Monthly Reports & Analysis</div>
        <div className="sales-chart-body">
          {comparisonItems.map((item) => {
            const goalWidth =
              maxComparisonValue > 0
                ? (item.goal / maxComparisonValue) * 100
                : 0;
            const actualWidth =
              maxComparisonValue > 0
                ? (item.actual / maxComparisonValue) * 100
                : 0;

            return (
              <div key={item.id} className="sales-chart-row">
                <div className="sales-chart-label">{item.label}</div>
                <div className="sales-chart-bar-area">
                  <div className="sales-chart-side sales-chart-side-commit">
                    <div className="sales-chart-side-label">Commit</div>
                    <div className="sales-chart-side-value">
                      {item.format(item.goal)}
                    </div>
                  </div>
                  <div className="sales-chart-bar-bg">
                    <div
                      className="sales-chart-bar-fill"
                      style={{ width: `${goalWidth}%` }}
                    />
                    <div
                      className="sales-chart-runner"
                      style={{ left: `${actualWidth}%` }}
                    />
                  </div>
                  <div className="sales-chart-side sales-chart-side-actual">
                    <div className="sales-chart-side-label">Actual</div>
                    <div className="sales-chart-side-value">
                      {item.format(item.actual)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
