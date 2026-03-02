import { useEffect, useRef, useState } from "react";
import { UserProfile, FeatureToggles } from "../../types";
import { WebPagePreview as SalesWebPagePreview } from "../SalesPortal";

type UserRole = "admin" | "manager" | "sales" | "marketing";

type UserEditorProps = {
  users: UserProfile[];
  deletedUsers: UserProfile[];
  onUsersChange: (users: UserProfile[]) => void;
  onDeletedUsersChange: (users: UserProfile[]) => void;
};

export function UserManagement(props: UserEditorProps) {
  const [draftUsers, setDraftUsers] = useState<UserProfile[]>(props.users);
  const [draftDeletedUsers, setDraftDeletedUsers] = useState<UserProfile[]>(props.deletedUsers);
  const [isDirty, setIsDirty] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const saveNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedUserId, setSelectedUserId] = useState(props.users[0]?.id ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [showWebPreview, setShowWebPreview] = useState(false);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const [managerDraftId, setManagerDraftId] = useState<string>(props.users.find((u) => u.id === selectedUserId)?.managerId ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [pendingImportUsers, setPendingImportUsers] = useState<any[]>([]);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const featureToggleKeysByRole: Record<UserProfile["role"], (keyof FeatureToggles)[]> = {
    admin: ["dashboard", "userManagement", "roleHierarchy", "businessUnits", "salesOverview", "marketingOverview", "courseManagement", "materialsLibrary", "approvalWorkflows", "aiBots", "webTemplates"],
    manager: ["dashboard", "teamBusinessPlans", "teamTraining", "teamFunnelMetrics", "trainingCenter"],
    sales: ["dashboard", "businessPlan", "trainingCenter", "marketingMaterials", "aiChat", "repWebPage", "businessCards"],
    marketing: ["dashboard", "trainingCenter", "assetLibrary", "contentApprovals", "socialMetrics"]
  };

  const selectedUser = draftUsers.find((u) => u.id === selectedUserId);
  const visibleToggleKeys = selectedUser ? featureToggleKeysByRole[selectedUser.role].filter((key) => key in selectedUser.featureToggles) : [];

  useEffect(() => {
    const current = draftUsers.find((u) => u.id === selectedUserId);
    setManagerDraftId(current?.managerId ?? "");
  }, [selectedUserId, draftUsers]);

  useEffect(() => {
    setShowWebPreview(false);
  }, [selectedUserId]);

  useEffect(() => {
    if (!isDirty) {
      setDraftUsers(props.users);
      setDraftDeletedUsers(props.deletedUsers);
      if (!props.users.find((u) => u.id === selectedUserId)) {
        setSelectedUserId(props.users[0]?.id ?? "");
      }
    }
  }, [props.users, props.deletedUsers, isDirty, selectedUserId]);

  useEffect(() => {
    if (!draftUsers.length) {
      if (selectedUserId) setSelectedUserId("");
      return;
    }
    if (!draftUsers.find((u) => u.id === selectedUserId)) {
      setSelectedUserId(draftUsers[0].id);
    }
  }, [draftUsers, selectedUserId]);

  useEffect(() => {
    return () => {
      if (saveNoticeTimeout.current) clearTimeout(saveNoticeTimeout.current);
    };
  }, []);

  function updateUser(updated: UserProfile) {
    const nextUser = updated.id.startsWith("user-") && updated.email.trim().length > 0 ? { ...updated, id: updated.email.trim() } : updated;
    const next = draftUsers.map((u) => (u.id === updated.id ? nextUser : u));
    setDraftUsers(next);
    setIsDirty(true);
    if (selectedUserId === updated.id && nextUser.id !== updated.id) {
      setSelectedUserId(nextUser.id);
    }
  }

  function createUser() {
    const template = draftUsers[0];
    const baseToggles: FeatureToggles = template ? { ...template.featureToggles } : ({} as FeatureToggles);
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: "New User",
      email: "",
      password: "",
      role: "sales",
      strengths: "",
      weaknesses: "",
      phone: "",
      territory: "",
      publicProfile: { showHeadshot: false, showEmail: false, showPhone: false, showStrengths: false, showWeaknesses: false, showTerritory: false },
      featureToggles: baseToggles
    };
    const next = [...draftUsers, newUser];
    setDraftUsers(next);
    setIsDirty(true);
    setSelectedUserId(newUser.id);
  }

  function deleteUser(userId: string) {
    const next = draftUsers.filter((u) => u.id !== userId);
    const deleted = draftUsers.find((u) => u.id === userId);
    if (deleted) setDraftDeletedUsers([...draftDeletedUsers, deleted]);
    setDraftUsers(next);
    setIsDirty(true);
    if (!next.length) {
      setSelectedUserId("");
      return;
    }
    if (selectedUserId === userId) setSelectedUserId(next[0].id);
  }

  function updateFeatureToggles(user: UserProfile, toggles: Partial<FeatureToggles>) {
    updateUser({ ...user, featureToggles: { ...user.featureToggles, ...toggles } });
  }

  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",").map(h => h.trim());
      const hasFeatureToggles = headers.some(h => h.startsWith("featureToggles."));
      
      const users = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const user: any = { featureToggles: {} };
        headers.forEach((header, i) => {
          if (header.startsWith("featureToggles.")) {
            const key = header.replace("featureToggles.", "");
            user.featureToggles[key] = values[i]?.toUpperCase() === "TRUE";
          } else {
            user[header] = values[i];
          }
        });
        
        if (!hasFeatureToggles && user.role) {
          const roleToggles = featureToggleKeysByRole[user.role as UserRole];
          if (roleToggles) {
            roleToggles.forEach(key => {
              user.featureToggles[key] = true;
            });
          }
        }
        
        return user;
      });

      setPendingImportUsers(users);
      setShowImportConfirm(true);
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to parse CSV file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function confirmImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: pendingImportUsers })
      });

      if (res.ok) {
        const result = await res.json();
        setSaveNotice(`Imported ${result.count} users successfully`);
        if (saveNoticeTimeout.current) clearTimeout(saveNoticeTimeout.current);
        saveNoticeTimeout.current = setTimeout(() => setSaveNotice(""), 3000);
        setShowImportConfirm(false);
        setPendingImportUsers([]);
        window.location.reload();
      } else {
        alert("Failed to import users");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import users");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="admin-user-management">
      {showImportConfirm && (
        <div className="overlay">
          <div className="dialog" style={{ width: 600, maxWidth: "90vw" }}>
            <div className="dialog-title">Confirm User Import</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
              {pendingImportUsers.length} user(s) will be imported:
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <table style={{ width: "100%", fontSize: 12 }}>
                <thead style={{ position: "sticky", top: 0, backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Name</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Email</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingImportUsers.map((user, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px" }}>{user.name}</td>
                      <td style={{ padding: "8px 12px" }}>{user.email}</td>
                      <td style={{ padding: "8px 12px", textTransform: "capitalize" }}>{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dialog-footer">
              <div />
              <div className="dialog-actions">
                <button type="button" className="btn-secondary btn-cancel" onClick={() => { setShowImportConfirm(false); setPendingImportUsers([]); }} disabled={importing}>
                  Cancel
                </button>
                <button type="button" className="btn-primary btn-success" onClick={confirmImport} disabled={importing}>
                  {importing ? "Importing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="panel panel-left">
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Users</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-secondary btn-small" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                {importing ? "Importing..." : "Import CSV"}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImportCSV} />
              <button type="button" className="btn-primary btn-success" onClick={createUser}>+ Add User</button>
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div className="panel-section">
            <div className="panel-section-title">Active Users</div>
            <div className="list">
              {draftUsers.map((user) => {
                const isActive = user.id === selectedUserId;
                return (
                  <button key={user.id} className={isActive ? "list-item active" : "list-item"} onClick={() => setSelectedUserId(user.id)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <div className="list-item-title">{user.name}</div>
                        <div className="list-item-subtitle">
                          {(user.roles || [user.role]).map(r => r.toUpperCase()).join(", ")} • {user.email}
                          {user.suspended && <span style={{ color: "#dc2626", marginLeft: 8 }}>• SUSPENDED</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {draftDeletedUsers.length > 0 && (
            <div className="panel-section">
              <div className="panel-section-title">Deleted Users</div>
              <div className="list">
                {draftDeletedUsers.map((user) => (
                  <div key={user.id} className="list-item">
                    <div style={{ flex: 1 }}>
                      <div className="list-item-title">{user.name}</div>
                      <div className="list-item-subtitle">{(user.roles || [user.role]).map(r => r.toUpperCase()).join(", ")} • {user.email}</div>
                    </div>
                    <button type="button" className="btn-secondary btn-success btn-small" onClick={() => {
                      const restored = draftDeletedUsers.find((u) => u.id === user.id);
                      if (restored) {
                        setDraftUsers([...draftUsers, restored]);
                        setDraftDeletedUsers(draftDeletedUsers.filter((u) => u.id !== user.id));
                        setIsDirty(true);
                      }
                    }}>Restore User</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="panel panel-right">
        {selectedUser ? (
          <div className="panel-scroll">
            <div className="panel-header">
              <div className="panel-header-row">
                <span>User Details</span>
                <div className="panel-header-actions">
                  <button type="button" className="btn-primary btn-small" disabled={!isDirty} onClick={() => {
                    const usersToSave = draftUsers.map((user) => {
                      if (user.password && user.password.trim().length > 0) return { ...user };
                      const { password, ...rest } = user;
                      return rest;
                    });
                    props.onUsersChange(usersToSave);
                    props.onDeletedUsersChange(draftDeletedUsers);
                    setDraftUsers(usersToSave.map((user) => {
                      const { password, ...rest } = user as UserProfile;
                      return rest;
                    }));
                    setIsDirty(false);
                    setSaveNotice("Changes saved successfully");
                    if (saveNoticeTimeout.current) clearTimeout(saveNoticeTimeout.current);
                    saveNoticeTimeout.current = setTimeout(() => setSaveNotice(""), 2000);
                  }}>Save Changes</button>
                  {saveNotice && <span style={{ fontSize: 12, color: "#16a34a" }}>{saveNotice}</span>}
                  <button type="button" className="btn-secondary btn-warning btn-small" onClick={() => {
                    if (window.confirm(`Suspend ${selectedUser.name}?`)) updateUser({ ...selectedUser, suspended: true });
                  }}>Suspend User</button>
                  <button type="button" className="btn-ghost btn-danger" onClick={() => {
                    if (window.confirm(`Delete ${selectedUser.name}?`)) deleteUser(selectedUser.id);
                  }}>Delete User</button>
                </div>
              </div>
            </div>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Name</span>
                <input className="field-input" value={selectedUser.name} onChange={(e) => updateUser({ ...selectedUser, name: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input className="field-input" value={selectedUser.email} onChange={(e) => updateUser({ ...selectedUser, email: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Password (leave blank to keep current)</span>
                <div className="field-input" style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 8 }}>
                  <input type={showPassword ? "text" : "password"} value={selectedUser.password ?? ""} onChange={(e) => updateUser({ ...selectedUser, password: e.target.value })} placeholder="Set a login password" style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 0 }} />
                  <button type="button" className="btn-ghost btn-small" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? "Hide password" : "Show password"} style={{ padding: 4 }}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94 6.06 6.06" />
                        <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                        <path d="M6.23 6.23C4.05 7.62 2.54 9.8 2 12c1.73 4.11 5.7 7 10 7 1.59 0 3.11-.38 4.45-1.07" />
                        <path d="M14.12 5.1C13.44 4.88 12.73 4.76 12 4.76c-4.3 0-8.27 2.89-10 7 0 .02 0 .04.01.06" />
                        <path d="M19.78 19.78C21.04 18.26 21.99 16.28 22 12c-1.33-3.17-4.09-5.71-7.33-6.72" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
              <label className="field">
                <span className="field-label">Roles (Multiple Selection)</span>
                <div className="territory-field">
                  <button type="button" className={showRolesDropdown ? "territory-trigger territory-trigger-open" : "territory-trigger"} onClick={() => setShowRolesDropdown(!showRolesDropdown)}>
                    <span className="territory-trigger-value">
                      {(selectedUser.roles || [selectedUser.role]).map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ")}
                    </span>
                    <span className="territory-trigger-icon">{showRolesDropdown ? "▲" : "▼"}</span>
                  </button>
                  {showRolesDropdown && (
                    <div className="territory-dropdown" style={{ gridTemplateColumns: "1fr" }}>
                      {(["admin", "manager", "sales", "marketing"] as UserRole[]).map((role) => (
                        <div key={role} className={(selectedUser.roles || [selectedUser.role]).includes(role) ? "territory-option territory-option-active" : "territory-option"} onClick={() => {
                          const currentRoles = selectedUser.roles || [selectedUser.role];
                          const newRoles = currentRoles.includes(role) ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];
                          if (newRoles.length === 0) return;
                          updateUser({ ...selectedUser, role: newRoles[0], roles: newRoles, managerId: newRoles.includes("sales") ? selectedUser.managerId : undefined });
                        }}>
                          <input type="checkbox" checked={(selectedUser.roles || [selectedUser.role]).includes(role)} readOnly />
                          <span style={{ textTransform: "capitalize" }}>{role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </label>
              {(selectedUser.roles || [selectedUser.role]).includes("sales") && (
                <label className="field">
                  <span className="field-label">Manager</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select className="field-input" style={{ flex: 1 }} value={managerDraftId} onChange={(e) => {
                      const nextManagerId = e.target.value;
                      setManagerDraftId(nextManagerId);
                      updateUser({ ...selectedUser, managerId: nextManagerId || undefined });
                    }}>
                      <option value="">No manager</option>
                      {draftUsers.filter((u) => u.role === "manager").map((manager) => (
                        <option key={manager.id} value={manager.id}>{manager.name}</option>
                      ))}
                    </select>
                  </div>
                </label>
              )}
            </div>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Strengths / Superpowers</span>
                <textarea className="field-input" rows={3} value={selectedUser.strengths} onChange={(e) => updateUser({ ...selectedUser, strengths: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label">Weaknesses / Insecurities</span>
                <textarea className="field-input" rows={3} value={selectedUser.weaknesses} onChange={(e) => updateUser({ ...selectedUser, weaknesses: e.target.value })} />
              </label>
            </div>
            <div className="panel-section">
              <div className="panel-section-title">Rep Web Page Status</div>
              <div className="status-row">
                <span className="status-label">Status</span>
                <span className={"status-chip " + (selectedUser.webPage?.status ?? "draft")}>
                  {selectedUser.webPage?.status ?? "draft"}
                </span>
              </div>
              <div className="status-actions">
                <button className="btn-secondary btn-dark btn-small" type="button" onClick={() => setShowWebPreview((prev) => !prev)}>
                  <span className="btn-with-icon">
                    {showWebPreview ? (
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm-7-5l-2-2 10-6 2 2-10 6z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <path fill="currentColor" d="M12 5c7 0 10 7 10 7s-3 7-10 7S2 12 2 12s3-7 10-7zm0 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
                      </svg>
                    )}
                    <span>{showWebPreview ? "Hide" : "View"}</span>
                  </span>
                </button>
              </div>
            </div>
            {showWebPreview && selectedUser && (
              <div className="panel-section">
                <div className="panel-section-title">Rep Web Page Preview</div>
                <SalesWebPagePreview profile={selectedUser} onProfileChange={updateUser} />
              </div>
            )}
            <div style={{ marginTop: 40 }}></div>
            <div className="panel-section">
              <div className="panel-section-title">Feature Toggles</div>
              <div className="toggle-grid">
                {visibleToggleKeys.map((key) => {
                  const enabled = selectedUser.featureToggles[key];
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).replace(/ai/gi, "AI").trim();
                  return (
                    <label key={key} className="toggle-item">
                      <input type="checkbox" checked={enabled} onChange={(e) => updateFeatureToggles(selectedUser, { [key]: e.target.checked } as Partial<FeatureToggles>)} />
                      <span className="toggle-label">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="panel-empty">Select a user to manage details.</div>
        )}
      </div>
    </div>
  );
}
