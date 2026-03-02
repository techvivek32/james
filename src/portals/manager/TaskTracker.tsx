import { useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { Course, UserProfile } from "../../types";

type AssignedTask = {
  id: string;
  userId: string;
  label: string;
  status: "open" | "completed";
};

export function TaskTracker(props: { teamMembers: UserProfile[]; courses: Course[] }) {
  const [selection, setSelection] = useState<
    Record<
      string,
      {
        profile: boolean;
        plan: boolean;
        modules: Record<string, boolean>;
      }
    >
  >({});
  const [tasks, setTasks] = useState<AssignedTask[]>([]);

  function getProfileCompletion(member: UserProfile) {
    const hasHeadshot =
      typeof member.headshotUrl === "string" &&
      member.headshotUrl.trim().length > 0;
    return hasHeadshot ? 100 : 75;
  }

  function getBusinessPlanCompletion(member: UserProfile) {
    const plan = member.businessPlan;
    if (!plan) {
      return 0;
    }
    if (plan.committed) {
      return 100;
    }
    return 75;
  }

  function getModuleCompletion(_member: UserProfile, _course: Course) {
    return 0;
  }

  function toggleStage(
    userId: string,
    stage: "profile" | "plan" | "module",
    moduleId?: string
  ) {
    setSelection((prev) => {
      const existing =
        prev[userId] ?? {
          profile: false,
          plan: false,
          modules: {}
        };
      const nextModules = { ...existing.modules };
      if (stage === "module" && moduleId) {
        nextModules[moduleId] = !nextModules[moduleId];
      }
      const next = {
        profile: stage === "profile" ? !existing.profile : existing.profile,
        plan: stage === "plan" ? !existing.plan : existing.plan,
        modules: nextModules
      };
      return {
        ...prev,
        [userId]: next
      };
    });
  }

  function assignTasksForMember(userId: string) {
    const stages = selection[userId];
    if (!stages) {
      return;
    }

    const member = props.teamMembers.find((m) => m.id === userId);
    if (!member) {
      return;
    }

    const newTasks: AssignedTask[] = [];

    if (stages.profile) {
      newTasks.push({
        id: `task-${member.id}-profile-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        userId: member.id,
        label: "Complete profile & upload headshot",
        status: "open"
      });
    }

    if (stages.plan) {
      newTasks.push({
        id: `task-${member.id}-plan-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        userId: member.id,
        label: "Commit business plan",
        status: "open"
      });
    }

    Object.entries(stages.modules).forEach(([moduleId, checked]) => {
      if (!checked) {
        return;
      }
      const course = props.courses.find((c) => c.id === moduleId);
      const courseTitle = course ? course.title : "Training module";
      newTasks.push({
        id: `task-${member.id}-${moduleId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        userId: member.id,
        label: `Catch up on ${courseTitle}`,
        status: "open"
      });
    });

    if (newTasks.length === 0) {
      return;
    }

    setTasks((prev) => [...prev, ...newTasks]);
    setSelection((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  function markTaskCompleted(taskId: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "completed" } : task
      )
    );
  }

  const totalAssigned = tasks.length;
  const completedCount = tasks.filter((task) => task.status === "completed")
    .length;
  const outstandingCount = totalAssigned - completedCount;

  return (
    <div>
      <div className="grid grid-3">
        <DashboardCard
          title="Total Tasks Assigned"
          value={totalAssigned.toString()}
        />
        <DashboardCard
          title="Total Tasks Completed"
          value={completedCount.toString()}
        />
        <DashboardCard
          title="Outstanding Tasks"
          value={outstandingCount.toString()}
        />
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Task Tracker</span>
          </div>
        </div>
        <div className="panel-body">
          {props.teamMembers.length === 0 ? (
            <div className="panel-empty">
              No team members yet. Add sales reps to track tasks.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `minmax(0, 180px) repeat(${
                    3 + props.courses.length
                  }, minmax(0, 140px))`,
                  columnGap: 8,
                  rowGap: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 8,
                  padding: "4px 0",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#6b7280"
                }}
              >
                <div>Rep</div>
                <div>Profile</div>
                <div>Business Plan</div>
                {props.courses.map((course) => (
                  <div key={course.id}>{course.title}</div>
                ))}
                <div style={{ textAlign: "right" }}>Actions</div>
              </div>
              {props.teamMembers.map((member, rowIndex) => {
                const profilePct = getProfileCompletion(member);
                const planPct = getBusinessPlanCompletion(member);
                const selectionForMember = selection[member.id];
                const hasModuleSelection = selectionForMember
                  ? Object.values(selectionForMember.modules).some(Boolean)
                  : false;
                const hasAnySelection =
                  !!selectionForMember?.profile ||
                  !!selectionForMember?.plan ||
                  hasModuleSelection;
                return (
                  <div
                    key={member.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: `minmax(0, 180px) repeat(${
                        3 + props.courses.length
                      }, minmax(0, 140px))`,
                      columnGap: 8,
                      rowGap: 4,
                      alignItems: "center",
                      padding: "8px 0",
                      borderTop:
                        rowIndex === 0
                          ? "1px solid #e5e7eb"
                          : "1px solid #f1f5f9",
                      backgroundColor:
                        rowIndex % 2 === 0 ? "#ffffff" : "#f9fafb"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {member.role.toUpperCase()} •{" "}
                        {member.territory ?? "No territory"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12 }}>
                        {profilePct}% complete
                      </div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                          fontSize: 11
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selection[member.id]?.profile ?? false}
                          onChange={() =>
                            toggleStage(member.id, "profile")
                          }
                        />
                        <span>Assign follow-up</span>
                      </label>
                    </div>
                    <div>
                      <div style={{ fontSize: 12 }}>
                        {planPct}% complete
                      </div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                          fontSize: 11
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selection[member.id]?.plan ?? false}
                          onChange={() => toggleStage(member.id, "plan")}
                        />
                        <span>Assign follow-up</span>
                      </label>
                    </div>
                    {props.courses.map((course) => {
                      const completionPct = getModuleCompletion(
                        member,
                        course
                      );
                      const isChecked =
                        selection[member.id]?.modules?.[course.id] ?? false;
                      return (
                        <div key={course.id}>
                          <div style={{ fontSize: 12 }}>
                            {completionPct}% complete
                          </div>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginTop: 4,
                              fontSize: 11
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                toggleStage(member.id, "module", course.id)
                              }
                            />
                            <span>Assign task</span>
                          </label>
                        </div>
                      );
                    })}
                    <div style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-primary btn-success btn-small"
                        disabled={!hasAnySelection}
                        onClick={() => assignTasksForMember(member.id)}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
      {tasks.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <div className="panel-header-row">
              <span>Assigned Tasks</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="list">
              {tasks.map((task) => {
                const member = props.teamMembers.find(
                  (m) => m.id === task.userId
                );
                return (
                  <div key={task.id} className="list-item">
                    <div className="list-item-title">{task.label}</div>
                    <div className="list-item-subtitle">
                      {member ? member.name : "Unknown rep"}
                    </div>
                    <div className="list-item-actions">
                      {task.status === "open" ? (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => markTaskCompleted(task.id)}
                        >
                          Mark completed
                        </button>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#16a34a",
                            fontWeight: 500
                          }}
                        >
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
