import { useState, useEffect } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile } from "../../types";

export function ManagerDashboard(props: { teamMembers: UserProfile[] }) {
  const [teamActuals, setTeamActuals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamActuals() {
      try {
        // Fetch actuals for all team members
        const actualsPromises = props.teamMembers.map(member =>
          fetch(`/api/business-plan?userId=${member.id}`)
            .then(r => r.json())
            .then(data => {
              const userPlan = data.find((p: any) => p.userId === member.id);
              return userPlan?.actuals || {
                incomeActual: 0,
                dealsActual: 0,
                claimsActual: 0,
                inspectionsActual: 0,
                convosActual: 0,
                doorsActual: 0
              };
            })
        );
        
        const actuals = await Promise.all(actualsPromises);
        setTeamActuals(actuals);
      } catch (error) {
        console.error('Failed to fetch team actuals:', error);
      } finally {
        setLoading(false);
      }
    }

    if (props.teamMembers.length > 0) {
      fetchTeamActuals();
    } else {
      setLoading(false);
    }
  }, [props.teamMembers]);

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

  // Calculate team actuals from real data
  const actualTotals = teamActuals.reduce(
    (acc, actuals) => {
      acc.incomeActual += actuals.incomeActual || 0;
      acc.dealsActual += actuals.dealsActual || 0;
      acc.claimsActual += actuals.claimsActual || 0;
      acc.inspectionsActual += actuals.inspectionsActual || 0;
      acc.convosActual += actuals.convosActual || 0;
      acc.doorsActual += actuals.doorsActual || 0;
      return acc;
    },
    {
      incomeActual: 0,
      dealsActual: 0,
      claimsActual: 0,
      inspectionsActual: 0,
      convosActual: 0,
      doorsActual: 0
    }
  );

  const incomeDelta = actualTotals.incomeActual - totals.incomeGoal;
  const dealsDelta = actualTotals.dealsActual - totals.dealsNeeded;
  const claimsDelta = actualTotals.claimsActual - claimsNeeded;
  const inspectionsDelta = actualTotals.inspectionsActual - totals.inspectionsNeeded;
  const convosDelta = actualTotals.convosActual - convosNeeded;
  const doorsDelta = actualTotals.doorsActual - totals.doorsNeeded;

  if (loading) {
    return <div style={{ padding: 24 }}>Loading team data...</div>;
  }

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
          value={`$${actualTotals.incomeActual.toLocaleString()}`}
        />
        <DashboardCard
          title="Deals Actual"
          value={actualTotals.dealsActual.toLocaleString()}
        />
        <DashboardCard
          title="Claims Actual"
          value={actualTotals.claimsActual.toLocaleString()}
        />
        <DashboardCard
          title="Inspections Actual"
          value={actualTotals.inspectionsActual.toLocaleString()}
        />
        <DashboardCard
          title="Convos Actual"
          value={actualTotals.convosActual.toLocaleString()}
        />
        <DashboardCard
          title="Doors Actual"
          value={actualTotals.doorsActual.toLocaleString()}
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
