import { useState, useEffect, ChangeEvent } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { UserProfile, BusinessPlan } from "../../types";
import { useAuth } from "../../contexts/AuthContext";

export function ManagerDashboard(props: { teamMembers: UserProfile[] }) {
  const [committedPlans, setCommittedPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualData, setActualData] = useState<{[key: string]: number}>({
    dealsActual: 0,
    claimsActual: 0,
    inspectionsActual: 0
  });
  const [editingActuals, setEditingActuals] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchTeamData() {
      try {
        // Get team members for this manager
        const usersRes = await fetch("/api/users");
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          const teamMembers = allUsers.filter((u: UserProfile) => u.managerId === user?.id && u.role === "sales");
          
          // Fetch business plans for team members
          const plansPromises = teamMembers.map((member: UserProfile) =>
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
        }

        // Fetch existing actual data for current month/year
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const actualsRes = await fetch(`/api/manager-actuals?managerId=${user?.id}&month=${currentMonth}&year=${currentYear}`);
        if (actualsRes.ok) {
          const actualsData = await actualsRes.json();
          if (actualsData.length > 0) {
            const latest = actualsData[0];
            setActualData({
              dealsActual: latest.dealsActual || 0,
              claimsActual: latest.claimsActual || 0,
              inspectionsActual: latest.inspectionsActual || 0
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch team data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchTeamData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Calculate totals from committed plans
  const totals = committedPlans.reduce(
    (acc, plan) => {
      const bp = plan.businessPlan;
      if (!bp) return acc;
      
      const dealsPerYear = bp.dealsPerYear || 0;
      const claimsPerYear = Math.round(dealsPerYear - (dealsPerYear * 0.25));
      const inspectionsPerYear = Math.round(claimsPerYear - (claimsPerYear * 0.30));
      
      acc.dealsPerMonth += dealsPerYear / 12;
      acc.claimsPerMonth += claimsPerYear / 12;
      acc.inspectionsPerMonth += inspectionsPerYear / 12;
      return acc;
    },
    {
      dealsPerMonth: 0,
      claimsPerMonth: 0,
      inspectionsPerMonth: 0
    }
  );

  // Calculate deltas
  const deltas = {
    dealsDelta: actualData.dealsActual - totals.dealsPerMonth,
    claimsDelta: actualData.claimsActual - totals.claimsPerMonth,
    inspectionsDelta: actualData.inspectionsActual - totals.inspectionsPerMonth
  };

  const handleSaveActuals = async () => {
    try {
      // Save the actual data to the database
      const response = await fetch('/api/manager-actuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId: user?.id,
          actualData: actualData,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      });

      if (response.ok) {
        setEditingActuals(false);
        // Optionally show success message
        console.log('Actuals saved successfully');
      } else {
        console.error('Failed to save actuals');
      }
    } catch (error) {
      console.error('Error saving actuals:', error);
    }
  };

  const handleActualChange = (field: string, value: number) => {
    setActualData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading team data...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Team Goals Section */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
          Team Goals
        </h2>
        
        <div className="grid grid-3" style={{ gap: 16 }}>
          <DashboardCard
            title="Deals Needed"
            value={Math.round(totals.dealsPerMonth).toLocaleString()}
            description="Monthly target"
          />
          <DashboardCard
            title="Claims Needed"
            value={Math.round(totals.claimsPerMonth).toLocaleString()}
            description="Monthly target"
          />
          <DashboardCard
            title="Inspections Needed"
            value={Math.round(totals.inspectionsPerMonth).toLocaleString()}
            description="Monthly target"
          />
        </div>
      </div>

      {/* Team Actuals Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>
            Team Actuals
          </h2>
          <button
            onClick={() => {
              if (editingActuals) {
                handleSaveActuals();
              } else {
                setEditingActuals(true);
              }
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: editingActuals ? "#10b981" : "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {editingActuals ? "Save" : "Edit Actuals"}
          </button>
        </div>
        
        <div className="grid grid-3" style={{ gap: 16 }}>
          {editingActuals ? (
            <>
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <span className="dashboard-card-title">Deals Actual</span>
                </div>
                <div className="dashboard-card-body">
                  <input
                    type="number"
                    value={actualData.dealsActual}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      handleActualChange('dealsActual', Number(e.target.value))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 16,
                      fontWeight: 600,
                      border: "2px solid #3b82f6",
                      borderRadius: 4,
                      textAlign: "right",
                      backgroundColor: "transparent"
                    }}
                  />
                  <span className="dashboard-card-description">Month to date</span>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <span className="dashboard-card-title">Claims Actual</span>
                </div>
                <div className="dashboard-card-body">
                  <input
                    type="number"
                    value={actualData.claimsActual}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      handleActualChange('claimsActual', Number(e.target.value))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 16,
                      fontWeight: 600,
                      border: "2px solid #3b82f6",
                      borderRadius: 4,
                      textAlign: "right",
                      backgroundColor: "transparent"
                    }}
                  />
                  <span className="dashboard-card-description">Month to date</span>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <span className="dashboard-card-title">Inspections Actual</span>
                </div>
                <div className="dashboard-card-body">
                  <input
                    type="number"
                    value={actualData.inspectionsActual}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      handleActualChange('inspectionsActual', Number(e.target.value))
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 16,
                      fontWeight: 600,
                      border: "2px solid #3b82f6",
                      borderRadius: 4,
                      textAlign: "right",
                      backgroundColor: "transparent"
                    }}
                  />
                  <span className="dashboard-card-description">Month to date</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <DashboardCard
                title="Deals Actual"
                value={actualData.dealsActual.toLocaleString()}
                description="Month to date"
              />
              <DashboardCard
                title="Claims Actual"
                value={actualData.claimsActual.toLocaleString()}
                description="Month to date"
              />
              <DashboardCard
                title="Inspections Actual"
                value={actualData.inspectionsActual.toLocaleString()}
                description="Month to date"
              />
            </>
          )}
        </div>
      </div>

      {/* Team Delta Section */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
          Team Delta
        </h2>
        
        <div className="grid grid-3" style={{ gap: 16 }}>
          <DashboardCard
            title="Deals Delta"
            value={`${deltas.dealsDelta >= 0 ? '+' : ''}${Math.round(deltas.dealsDelta).toLocaleString()}`}
            description="Actual vs Goal"
          />
          <DashboardCard
            title="Claims Delta"
            value={`${deltas.claimsDelta >= 0 ? '+' : ''}${Math.round(deltas.claimsDelta).toLocaleString()}`}
            description="Actual vs Goal"
          />
          <DashboardCard
            title="Inspections Delta"
            value={`${deltas.inspectionsDelta >= 0 ? '+' : ''}${Math.round(deltas.inspectionsDelta).toLocaleString()}`}
            description="Actual vs Goal"
          />
        </div>
      </div>
    </div>
  );
}