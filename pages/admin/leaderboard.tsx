import type { NextPage } from "next";
import { useEffect, useState, useCallback } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";

const statusColor: Record<string, string> = {
  processed: "#16a34a", duplicate: "#d97706", failed: "#dc2626",
};
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const LeaderboardPage: NextPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<{ inspections: any[]; claims: any[] }>({ inspections: [], claims: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch("/api/admin/integration-events"),
        fetch("/api/leaderboard")
      ]);
      
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const inspections = stats.inspections || [];
  const claims = stats.claims || [];

  const cols = ["#", "Rep Name", "Count", "Revenue"];

  function LeaderboardTable({ rows, type }: { rows: any[]; type: "inspection" | "claim" }) {
    return (
      <div style={{ overflowX: "auto", marginBottom: 32 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={th}>#</th>
              <th style={th}>Rep Name</th>
              <th style={th}>{type === "inspection" ? "Inspections" : "Claims"}</th>
              {type === "claim" && <th style={th}>Total Revenue</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={type === "claim" ? 4 : 3} style={{ textAlign: "center", padding: 16, color: "#9ca3af" }}>No ranking data yet</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r._id || i} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={td}>{i + 1}</td>
                <td style={{ ...td, fontWeight: 600 }}>{r.repName}</td>
                <td style={{ ...td, fontWeight: 600, color: "#2563eb" }}>
                  {type === "inspection" ? r.inspectionCount : r.claimCount}
                </td>
                {type === "claim" && <td style={{ ...td, fontWeight: 600, color: "#16a34a" }}>{fmt(r.revenueTotal)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AdminPageWrapper currentView="leaderboard">
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Sales Leaderboard</h1>
          <button onClick={load} style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Refresh</button>
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Top Inspections</h2>
            <LeaderboardTable rows={inspections} type="inspection" />

            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Top Claims & Revenue</h2>
            <LeaderboardTable rows={claims} type="claim" />

            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, marginTop: 40 }}>Recent Events Activity</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    {["Time", "Rep Name", "Event Type", "Job Number", "Amount", "Location", "Status"].map(c => <th key={c} style={th}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 16, color: "#9ca3af" }}>No events yet</td></tr>
                  ) : events.map((e) => (
                    <tr key={e._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={td}>{new Date(e.createdAt).toLocaleString()}</td>
                      <td style={td}>{e.repName}</td>
                      <td style={td}>{e.eventType}</td>
                      <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{e.externalEventId}</td>
                      <td style={td}>{e.revenue ? fmt(e.revenue) : (e.rawPayload?.amount ? fmt(e.rawPayload.amount) : "—")}</td>
                      <td style={td}>{e.location || "—"}</td>
                      <td style={td}><span style={{ color: statusColor[e.status] ?? "#555", fontWeight: 600 }}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminPageWrapper>
  );
};

const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13 };

export default LeaderboardPage;
