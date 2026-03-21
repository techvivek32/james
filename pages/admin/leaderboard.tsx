import type { NextPage } from "next";
import { useEffect, useState, useCallback } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";

const statusColor: Record<string, string> = {
  processed: "#16a34a",
  duplicate: "#d97706",
  failed: "#dc2626",
};

const LeaderboardPage: NextPage = () => {
  const [inspections, setInspections] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lbRes, evRes] = await Promise.all([
        fetch("/api/leaderboard"),
        fetch("/api/admin/integration-events"),
      ]);
      if (lbRes.ok) {
        const data = await lbRes.json();
        setInspections(data.inspections ?? []);
        setClaims(data.claims ?? []);
      }
      if (evRes.ok) setEvents(await evRes.json());
    } catch (e) {
      console.error("Failed to load leaderboard", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminPageWrapper currentView="leaderboard">
      <div style={{ padding: "24px", fontFamily: "inherit" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Sales Leaderboard</h1>
          <button
            onClick={load}
            style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Inspections */}
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Inspections</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={th}>Rank</th>
                  <th style={th}>Rep Name</th>
                  <th style={th}>Inspection Count</th>
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: "center", padding: 16, color: "#888" }}>No data yet</td></tr>
                ) : inspections.map((r, i) => (
                  <tr key={r._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{r.repName}</td>
                    <td style={td}>{r.inspectionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Claims */}
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Claims</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={th}>Rank</th>
                  <th style={th}>Rep Name</th>
                  <th style={th}>Claim Count</th>
                  <th style={th}>Revenue Total</th>
                </tr>
              </thead>
              <tbody>
                {claims.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 16, color: "#888" }}>No data yet</td></tr>
                ) : claims.map((r, i) => (
                  <tr key={r._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{r.repName}</td>
                    <td style={td}>{r.claimCount}</td>
                    <td style={td}>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(r.revenueTotal ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Event Log */}
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>Integration Event Log</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={th}>Time</th>
                  <th style={th}>Rep Name</th>
                  <th style={th}>Event Type</th>
                  <th style={th}>Job ID</th>
                  <th style={th}>Amount</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 16, color: "#888" }}>No events yet</td></tr>
                ) : events.map((e) => (
                  <tr key={e._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={td}>{new Date(e.createdAt).toLocaleString()}</td>
                    <td style={td}>{e.repName}</td>
                    <td style={td}>{e.eventType}</td>
                    <td style={td}>{e.externalEventId}</td>
                    <td style={td}>{e.revenue ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(e.revenue) : "—"}</td>
                    <td style={td}>
                      <span style={{ color: statusColor[e.status] ?? "#555", fontWeight: 600 }}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </AdminPageWrapper>
  );
};

const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 13 };
const td: React.CSSProperties = { padding: "10px 14px", fontSize: 13 };

export default LeaderboardPage;
