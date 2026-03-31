import { useEffect, useState } from "react";
import { EMAIL_DEFAULTS } from "../../lib/emailTemplates";

type EmailKey = keyof typeof EMAIL_DEFAULTS;

const EMAIL_LABELS: Record<string, string> = {
  passwordReset: "Password Reset",
  registrationConfirmation: "Registration Confirmation",
  accountApproved: "Account Approved",
  accountRejected: "Account Rejected",
  quickStartUser: "Quick Start (User)",
  quickStartManager: "Quick Start (Manager)",
  userAccountUpdated: "User Account Updated",
  adminConfirmation: "Admin Confirmation",
};

type ConfigMap = Record<string, { subject: string; body: string }>;

export function EmailConfig() {
  const [configs, setConfigs] = useState<ConfigMap>({});
  const [activeKey, setActiveKey] = useState<string>("passwordReset");
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email-config")
      .then(r => r.ok ? r.json() : {})
      .then((saved: ConfigMap) => {
        const merged: ConfigMap = {};
        Object.keys(EMAIL_DEFAULTS).forEach(key => {
          merged[key] = {
            subject: saved[key]?.subject ?? EMAIL_DEFAULTS[key].subject,
            body: saved[key]?.body ?? EMAIL_DEFAULTS[key].body,
          };
        });
        setConfigs(merged);
        setLoaded(true);
      });
  }, []);

  function updateField(key: string, field: "subject" | "body", value: string) {
    setConfigs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function resetToDefault(key: string) {
    setConfigs(prev => ({
      ...prev,
      [key]: {
        subject: EMAIL_DEFAULTS[key].subject,
        body: EMAIL_DEFAULTS[key].body,
      }
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/admin/email-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs),
      });
      setSaveNotice("Email templates saved successfully");
      setTimeout(() => setSaveNotice(""), 3000);
    } catch {
      setSaveNotice("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const active = configs[activeKey];
  const variables = EMAIL_DEFAULTS[activeKey]?.variables || [];

  if (!loaded) return <div style={{ padding: 40, color: "#6b7280", textAlign: "center" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 80px)", overflow: "hidden" }}>
      {/* Left tab list */}
      <div style={{ width: 220, borderRight: "1px solid #e5e7eb", overflowY: "auto", flexShrink: 0, background: "#f9fafb" }}>
        <div style={{ padding: "16px 16px 8px", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>
          Email Templates
        </div>
        {Object.keys(EMAIL_DEFAULTS).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveKey(key)}
            style={{
              width: "100%", textAlign: "left", padding: "12px 16px",
              border: "none", background: activeKey === key ? "#eff6ff" : "transparent",
              borderLeft: activeKey === key ? "3px solid #2563eb" : "3px solid transparent",
              cursor: "pointer", fontSize: 13, fontWeight: activeKey === key ? 600 : 400,
              color: activeKey === key ? "#1d4ed8" : "#374151",
            }}
          >
            {EMAIL_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Right editor */}
      <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
              {EMAIL_LABELS[activeKey]}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Edit the subject and body. Use the dynamic fields below in your content.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {saveNotice && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>{saveNotice}</span>}
            <button
              type="button"
              onClick={() => resetToDefault(activeKey)}
              style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer", color: "#374151" }}
            >
              Reset to Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save All Templates"}
            </button>
          </div>
        </div>

        {/* Dynamic variables reference */}
        <div style={{ marginBottom: 20, padding: 14, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>Available Dynamic Fields:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {variables.map(v => (
              <span key={v} style={{ padding: "3px 10px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: "#78350f" }}>
                {v}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 8 }}>
            Copy and paste these exactly into your subject or body. They will be replaced with real values when the email is sent.
          </div>
        </div>

        {/* Subject */}
        <label style={{ display: "block", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Subject Line</div>
          <input
            className="field-input"
            value={active?.subject || ""}
            onChange={e => updateField(activeKey, "subject", e.target.value)}
            style={{ width: "100%", fontSize: 14 }}
          />
        </label>

        {/* Body */}
        <label style={{ display: "block", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email Body</div>
          <textarea
            className="field-input"
            rows={18}
            value={active?.body || ""}
            onChange={e => updateField(activeKey, "body", e.target.value)}
            style={{ width: "100%", fontSize: 13, fontFamily: "monospace", lineHeight: 1.7, resize: "vertical" }}
          />
        </label>

        {/* Live preview */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Preview</div>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: "#f3f4f6", padding: "10px 16px", fontSize: 12, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>
              <strong>Subject:</strong> {active?.subject}
            </div>
            <div style={{ padding: 24, background: "#fff", fontSize: 14, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "Arial, sans-serif" }}>
              {active?.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
