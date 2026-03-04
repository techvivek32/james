import { useState, useEffect } from "react";

type SocialMetric = {
  _id?: string;
  id: string;
  platform: "instagram" | "facebook" | "tiktok" | "youtube";
  platformName: string;
  followers: number;
  posts30d: number;
  views30d: number;
  lastUpdated?: string;
};

const platformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" }
];

export function SocialMediaMetrics() {
  const [metrics, setMetrics] = useState<SocialMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setLoading(true);
    try {
      console.log("Loading metrics...");
      const res = await fetch("/api/social-media-metrics");
      if (res.ok) {
        const data = await res.json();
        console.log("Loaded metrics:", data);
        setMetrics(data);
      } else {
        console.error("Failed to load metrics:", await res.text());
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  function addNewMetric() {
    const newMetric: SocialMetric = {
      id: `social-new-${Date.now()}`,
      platform: "instagram",
      platformName: "Instagram",
      followers: 0,
      posts30d: 0,
      views30d: 0
    };
    setMetrics([...metrics, newMetric]);
    setEditingId(newMetric.id);
  }

  function updateMetric(id: string, field: keyof SocialMetric, value: any) {
    setMetrics(metrics.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        // Auto-update platformName when platform changes
        if (field === "platform") {
          const option = platformOptions.find(opt => opt.value === value);
          if (option) {
            updated.platformName = option.label;
          }
        }
        return updated;
      }
      return m;
    }));
  }

  async function deleteMetric(id: string) {
    if (!window.confirm("Are you sure you want to delete this metric?")) {
      return;
    }

    try {
      // If it's a new unsaved metric, just remove from state
      if (id.startsWith("social-new-")) {
        setMetrics(metrics.filter(m => m.id !== id));
        return;
      }

      const res = await fetch(`/api/social-media-metrics/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setMetrics(metrics.filter(m => m.id !== id));
        alert("Metric deleted successfully");
      } else {
        alert("Failed to delete metric");
      }
    } catch (error) {
      console.error("Failed to delete metric:", error);
      alert("Failed to delete metric");
    }
  }

  async function saveMetrics() {
    setSaving(true);
    try {
      console.log("Saving metrics:", metrics);
      
      const res = await fetch("/api/social-media-metrics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics)
      });

      const data = await res.json();
      console.log("Save response:", data);

      if (res.ok) {
        alert("Metrics saved successfully!");
        setEditingId(null);
        await loadMetrics(); // Reload to get updated data
      } else {
        console.error("Save failed:", data);
        alert(`Failed to save metrics: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to save metrics:", error);
      alert("Failed to save metrics. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  const totalFollowers = metrics.reduce((sum, m) => sum + (m.followers || 0), 0);
  const totalPosts = metrics.reduce((sum, m) => sum + (m.posts30d || 0), 0);
  const totalViews = metrics.reduce((sum, m) => sum + (m.views30d || 0), 0);

  if (loading) {
    return <div className="panel-empty">Loading metrics...</div>;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-header-row">
          <span>Social Media Metrics Management</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn-primary btn-success btn-small"
              onClick={addNewMetric}
            >
              + Add Platform
            </button>
            <button
              type="button"
              className="btn-primary btn-small"
              onClick={saveMetrics}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="panel-body">
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Followers</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#111827" }}>{totalFollowers.toLocaleString()}</div>
          </div>
          <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Posts (Last 30 Days)</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#111827" }}>{totalPosts.toLocaleString()}</div>
          </div>
          <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Views (Last 30 Days)</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#111827" }}>{totalViews.toLocaleString()}</div>
          </div>
        </div>

        {/* Metrics Table */}
        {metrics.length === 0 ? (
          <div className="panel-empty">No social media metrics yet. Click "+ Add Platform" to create one.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6b7280" }}>Platform</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>Followers</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>Posts (30d)</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>Views (30d)</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#6b7280" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => {
                  const isEditing = editingId === metric.id;
                  return (
                    <tr key={metric.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px" }}>
                        {isEditing ? (
                          <select
                            className="field-input"
                            value={metric.platform}
                            onChange={(e) => updateMetric(metric.id, "platform", e.target.value)}
                            style={{ width: "100%", maxWidth: 200 }}
                          >
                            {platformOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 20 }}>
                              {metric.platform === "instagram" && "📷"}
                              {metric.platform === "facebook" && "👥"}
                              {metric.platform === "tiktok" && "🎵"}
                              {metric.platform === "youtube" && "▶️"}
                            </span>
                            <span style={{ fontWeight: 500 }}>{metric.platformName}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            className="field-input"
                            value={metric.followers}
                            onChange={(e) => updateMetric(metric.id, "followers", parseInt(e.target.value) || 0)}
                            style={{ width: "100%", maxWidth: 120, textAlign: "right" }}
                          />
                        ) : (
                          metric.followers.toLocaleString()
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            className="field-input"
                            value={metric.posts30d}
                            onChange={(e) => updateMetric(metric.id, "posts30d", parseInt(e.target.value) || 0)}
                            style={{ width: "100%", maxWidth: 120, textAlign: "right" }}
                          />
                        ) : (
                          metric.posts30d.toLocaleString()
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            className="field-input"
                            value={metric.views30d}
                            onChange={(e) => updateMetric(metric.id, "views30d", parseInt(e.target.value) || 0)}
                            style={{ width: "100%", maxWidth: 120, textAlign: "right" }}
                          />
                        ) : (
                          metric.views30d.toLocaleString()
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          {isEditing ? (
                            <button
                              type="button"
                              className="btn-secondary btn-small"
                              onClick={() => setEditingId(null)}
                            >
                              Done
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-secondary btn-small"
                              onClick={() => setEditingId(metric.id)}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-ghost btn-danger btn-small"
                            onClick={() => deleteMetric(metric.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {metrics.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: "#eff6ff", borderRadius: 6, fontSize: 12, color: "#1e40af" }}>
            💡 Tip: Click "Edit" to modify values, then click "Save All Changes" to update the database. These metrics will appear on the Admin Dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
