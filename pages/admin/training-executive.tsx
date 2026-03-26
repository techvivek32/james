import type { NextPage } from "next";
import { useState } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { TrainingExecutiveView } from "../../src/portals/admin/TrainingExecutiveView";
import { CourseLeaderboard } from "../../src/portals/admin/CourseLeaderboard";

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: "10px 24px",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: active ? 700 : 400,
  color: active ? "#2563eb" : "#6b7280",
  background: "none",
  borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
});

const TrainingExecutivePage: NextPage = () => {
  const [tab, setTab] = useState<"overview" | "leaderboard">("leaderboard");

  return (
    <AdminPageWrapper currentView="trainingExecutive">
      {/* Tab bar */}
      <div style={{
        display: "flex", borderBottom: "1px solid #e5e7eb",
        marginBottom: 24, background: "#fff",
        borderRadius: "8px 8px 0 0", overflow: "hidden",
      }}>
        {/* Hidden tab - keeping code but not displaying */}
        {/* <button style={TAB_STYLE(tab === "overview")} onClick={() => setTab("overview")}>
          Training Center Executive View
        </button> */}
        <button style={TAB_STYLE(tab === "leaderboard")} onClick={() => setTab("leaderboard")}>
          🏆 Course Leaderboard
        </button>
      </div>

      {tab === "overview" ? <TrainingExecutiveView /> : <CourseLeaderboard />}
    </AdminPageWrapper>
  );
};

export default TrainingExecutivePage;
