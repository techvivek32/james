import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile } from "../../types";

export function ManagerDashboard(props: { teamMembers: UserProfile[] }) {
  const repCount = props.teamMembers.length;
  const totals = props.teamMembers.reduce(
    (acc, member) => {
      const plan = member.businessPlan;
      if (!plan) {
        return acc;
      }
      acc.incomeGoal += plan.revenueGoal;
      acc.dealsNeeded += plan.dealsPerYear;
      acc.inspectionsNeeded += plan.inspectionsNeeded;
      acc.doorsNeeded += plan.doorsPerYear;
      return acc;
    },
    {
      incomeGoal: 0,
      dealsNeeded: 0,
      inspectionsNeeded: 0,
      doorsNeeded: 0
    }
  );

  const claimsNeeded = Math.ceil(totals.dealsNeeded * 1.2);
  const convosNeeded = Math.ceil(totals.inspectionsNeeded * 2.5);

  const incomeActual = repCount * 84000;
  const dealsActual = repCount * 6;
  const claimsActual = repCount * 8;
  const inspectionsActual = repCount * 32;
  const convosActual = repCount * 85;
  const doorsActual = repCount * 420;

  const incomeDelta = incomeActual - totals.incomeGoal;
  const dealsDelta = dealsActual - totals.dealsNeeded;
  const claimsDelta = claimsActual - claimsNeeded;
  const inspectionsDelta = inspectionsActual - totals.inspectionsNeeded;
  const convosDelta = convosActual - convosNeeded;
  const doorsDelta = doorsActual - totals.doorsNeeded;

  return (
    <div className="sales-dashboard">
      <div className="sales-plan-heading">
        <div className="sales-plan-summary-main">
          <div className="sales-plan-summary-name">Team Goals</div>
        </div>
      </div>
      <div className="grid grid-4">
        <DashboardCard
          title="Income Goal"
          value={`$${totals.incomeGoal.toLocaleString()}`}
        />
        <DashboardCard
          title="Deals Needed"
          value={totals.dealsNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Claims Needed"
          value={claimsNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Inspections Needed"
          value={totals.inspectionsNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Convos Needed"
          value={convosNeeded.toLocaleString()}
        />
        <DashboardCard
          title="Doors Needed"
          value={totals.doorsNeeded.toLocaleString()}
        />
      </div>
      <div className="sales-plan-heading">
        <div className="sales-plan-summary-main">
          <div className="sales-plan-summary-name">Team Actuals</div>
        </div>
      </div>
      <div className="grid grid-4">
        <DashboardCard
          title="Income Actual"
          value={`$${incomeActual.toLocaleString()}`}
        />
        <DashboardCard
          title="Deals Actual"
          value={dealsActual.toLocaleString()}
        />
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
          <div className="sales-plan-summary-name">Team Delta</div>
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
    </div>
  );
}
