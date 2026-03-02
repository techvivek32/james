import { useEffect, useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { BusinessPlan, UserProfile } from "../../types";

function recomputeBusinessPlan(plan: BusinessPlan): BusinessPlan {
  const averageDealSize = plan.averageDealSize ?? 12000;
  const inspectionToDealRate = 0.4;
  const doorsToInspectionRate = 0.08;

  const dealsPerYear =
    averageDealSize > 0
      ? Math.ceil(plan.revenueGoal / averageDealSize)
      : 0;
  const dealsPerMonth = Math.ceil(dealsPerYear / 12);
  const inspectionsNeeded =
    dealsPerYear > 0
      ? Math.ceil(dealsPerYear / inspectionToDealRate)
      : 0;
  const doorsPerYear =
    inspectionsNeeded > 0
      ? Math.ceil(inspectionsNeeded / doorsToInspectionRate)
      : 0;
  const weeksPerYear = 52;
  const doorsPerDay =
    plan.daysPerWeek > 0
      ? Math.ceil(doorsPerYear / (weeksPerYear * plan.daysPerWeek))
      : 0;

  return {
    ...plan,
    averageDealSize,
    dealsPerYear,
    dealsPerMonth,
    inspectionsNeeded,
    doorsPerYear,
    doorsPerDay
  };
}

export function TeamBusinessPlansPage(props: {
  teamMembers: UserProfile[];
  onTeamMembersChange: (members: UserProfile[]) => void;
}) {
  const [profiles, setProfiles] = useState<UserProfile[]>(props.teamMembers);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [draftPlan, setDraftPlan] = useState<BusinessPlan | null>(null);

  useEffect(() => {
    setProfiles(props.teamMembers);
  }, [props.teamMembers]);

  function ensurePlan(member: UserProfile): BusinessPlan {
    const existing = member.businessPlan;
    if (existing) {
      return {
        ...existing,
        averageDealSize: existing.averageDealSize ?? 12000
      };
    }
    const base: BusinessPlan = {
      revenueGoal: 100000,
      daysPerWeek: 5,
      territories:
        member.territory && member.territory.length > 0
          ? [member.territory]
          : [],
      selectedPresetId: undefined,
      averageDealSize: 12000,
      dealsPerYear: 0,
      dealsPerMonth: 0,
      inspectionsNeeded: 0,
      doorsPerYear: 0,
      doorsPerDay: 0,
      committed: false
    };
    return recomputeBusinessPlan(base);
  }

  function startEditing(member: UserProfile) {
    const basePlan = ensurePlan(member);
    setEditingMemberId(member.id);
    setDraftPlan(basePlan);
  }

  function cancelEditing() {
    setEditingMemberId(null);
    setDraftPlan(null);
  }

  function saveEditing(memberId: string) {
    if (!draftPlan || editingMemberId !== memberId) {
      return;
    }
    updatePlanForMember(memberId, {
      revenueGoal: draftPlan.revenueGoal,
      daysPerWeek: draftPlan.daysPerWeek,
      averageDealSize: draftPlan.averageDealSize
    });
    setEditingMemberId(null);
    setDraftPlan(null);
  }

  function updateDraftPlan(values: Partial<BusinessPlan>) {
    if (!draftPlan) {
      return;
    }
    const merged: BusinessPlan = { ...draftPlan, ...values };
    const recomputed = recomputeBusinessPlan(merged);
    setDraftPlan(recomputed);
  }

  function updatePlanForMember(
    memberId: string,
    updates: Partial<BusinessPlan>
  ) {
    setProfiles((prev) => {
      const nextProfiles = prev.map((member) => {
        if (member.id !== memberId) {
          return member;
        }
        const withPlan = ensurePlan(member);
        const merged: BusinessPlan = {
          ...withPlan,
          ...updates
        };
        const recomputed = recomputeBusinessPlan(merged);
        return {
          ...member,
          businessPlan: recomputed
        };
      });
      props.onTeamMembersChange(nextProfiles);
      return nextProfiles;
    });
  }

  const totals = profiles.reduce(
    (acc, member) => {
      const plan = member.businessPlan;
      if (!plan) {
        return acc;
      }
      acc.revenueGoal += plan.revenueGoal;
      acc.dealsPerYear += plan.dealsPerYear;
      acc.inspectionsNeeded += plan.inspectionsNeeded;
      acc.doorsPerYear += plan.doorsPerYear;
      return acc;
    },
    {
      revenueGoal: 0,
      dealsPerYear: 0,
      inspectionsNeeded: 0,
      doorsPerYear: 0
    }
  );

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
          {profiles.length === 0 ? (
            <div className="panel-empty">
              No team members yet. Assign sales reps to this manager.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: 1040
                }}
              >
                <thead>
                  <tr
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#6b7280"
                    }}
                  >
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "left"
                      }}
                    >
                      Rep
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Revenue Goal
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Avg Rev / Deal
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Deals / Year
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Deals / Month
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Inspections Needed
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Door Knocks / Year
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Days / Week
                    </th>
                    <th
                      style={{
                        padding: "8px 12px",
                        textAlign: "center"
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((member, index) => {
                    const plan = member.businessPlan
                      ? {
                          ...member.businessPlan,
                          averageDealSize:
                            member.businessPlan.averageDealSize ?? 12000
                        }
                      : ensurePlan(member);
                    const isEditing = editingMemberId === member.id;
                    const displayPlan =
                      isEditing && draftPlan ? draftPlan : plan;
                    return (
                      <tr
                        key={member.id}
                        style={{
                          fontSize: 13,
                          backgroundColor:
                            index % 2 === 0 ? "#ffffff" : "#f9fafb",
                          borderTop:
                            index === 0
                              ? "1px solid #e5e7eb"
                              : "1px solid #f1f5f9"
                        }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {member.role.toUpperCase()} •{" "}
                            {member.territory ?? "No territory"}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle",
                            textAlign: "center"
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              className="field-input"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                width: "100%",
                                maxWidth: 140
                              }}
                              value={displayPlan.revenueGoal}
                              onChange={(e) =>
                                updateDraftPlan({
                                  revenueGoal: Number(e.target.value) || 0
                                })
                              }
                            />
                          ) : (
                            <div
                              style={{
                                fontSize: 13,
                                whiteSpace: "nowrap",
                                textAlign: "center"
                              }}
                            >
                              ${displayPlan.revenueGoal.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle",
                            textAlign: "center"
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              className="field-input"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                width: "100%",
                                maxWidth: 140
                              }}
                              value={displayPlan.averageDealSize ?? 0}
                              onChange={(e) =>
                                updateDraftPlan({
                                  averageDealSize:
                                    Number(e.target.value) || 0
                                })
                              }
                            />
                          ) : (
                            <div
                              style={{
                                fontSize: 13,
                                whiteSpace: "nowrap",
                                textAlign: "center"
                              }}
                            >
                              ${(
                                displayPlan.averageDealSize ?? 0
                              ).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle",
                            textAlign: "center"
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              whiteSpace: "nowrap"
                            }}
                          >
                            {displayPlan.dealsPerYear.toLocaleString()}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle",
                            textAlign: "center"
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              whiteSpace: "nowrap"
                            }}
                          >
                            {displayPlan.dealsPerMonth.toLocaleString()}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle",
                            textAlign: "center"
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              whiteSpace: "nowrap"
                            }}
                          >
                            {displayPlan.inspectionsNeeded.toLocaleString()}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle",
                            textAlign: "center"
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              whiteSpace: "nowrap"
                            }}
                          >
                            {displayPlan.doorsPerYear.toLocaleString()}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle"
                          }}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              className="field-input"
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                textAlign: "center",
                                width: "100%",
                                maxWidth: 100
                              }}
                              value={displayPlan.daysPerWeek}
                              onChange={(e) =>
                                updateDraftPlan({
                                  daysPerWeek: Number(e.target.value) || 0
                                })
                              }
                            />
                          ) : (
                            <div
                              style={{
                                fontSize: 13,
                                textAlign: "center",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {displayPlan.daysPerWeek.toString()}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            verticalAlign: "middle",
                            textAlign: "center",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn-primary btn-success"
                                style={{ marginRight: 8 }}
                                onClick={() => saveEditing(member.id)}
                              >
                                Send
                              </button>
                              <button
                                type="button"
                                className="btn-secondary btn-cancel"
                                onClick={cancelEditing}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => startEditing(member)}
                            >
                              Edit
                            </button>
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
