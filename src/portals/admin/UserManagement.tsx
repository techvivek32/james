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
  const [emailError, setEmailError] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [pendingImportUsers, setPendingImportUsers] = useState<any[]>([]);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showActiveUsers, setShowActiveUsers] = useState(true);
  const [showSuspendedUsers, setShowSuspendedUsers] = useState(true);
  const [sortBy, setSortBy] = useState<"nameAsc" | "nameDesc" | "newest" | "oldest" | "lastModified">("nameAsc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showAssignedSalesUsers, setShowAssignedSalesUsers] = useState(false);
  const [assignedSalesUsers, setAssignedSalesUsers] = useState<any[]>([]);

  const featureToggleKeysByRole: Record<UserProfile["role"], (keyof FeatureToggles)[]> = {
    admin: ["dashboard", "userManagement", "roleHierarchy", "businessUnits", "salesOverview", "marketingOverview", "courseManagement", "materialsLibrary", "approvalWorkflows", "aiBots", "webTemplates", "webText", "appsTools", "socialMediaMetrics"],
    manager: ["dashboard", "team", "plans", "training", "onlineTraining", "taskTracker", "webTemplates"],
    sales: ["dashboard", "profile", "plan", "training", "materials", "aiChat", "webPage", "businessCards"],
    marketing: ["dashboard", "assets", "approvals", "socialMetrics"]
  };

  const featureToggleLabels: Record<string, string> = {
    dashboard: "Dashboard",
    userManagement: "User Management",
    roleHierarchy: "Role & Hierarchy Manager",
    businessUnits: "Business Units",
    salesOverview: "Sales Team Overview",
    marketingOverview: "Marketing Overview",
    courseManagement: "Course Management",
    materialsLibrary: "Marketing Materials Library",
    approvalWorkflows: "Approval Workflows",
    aiBots: "AI Bot Management",
    webTemplates: "Web Page Approval",
    webText: "Web Text",
    appsTools: "Apps/Tool",
    socialMediaMetrics: "Social Media Metrics",
    team: "My Team",
    plans: "Team Business Plans",
    training: "Training Center",
    onlineTraining: "Online Training",
    taskTracker: "Task Tracker",
    profile: "My Profile",
    plan: "My Business Plan",
    materials: "Marketing Materials",
    aiChat: "Jay Miller's Clone",
    webPage: "My Web Page",
    businessCards: "Tools/ Apps",
    assets: "Marketing Assets",
    approvals: "Approval Queue",
    socialMetrics: "Social Metrics"
  };

  const selectedUser = draftUsers.find((u) => u.id === selectedUserId);
  
  // Get all roles for the user (including primary role and additional roles)
  const userRoles = selectedUser ? [selectedUser.role, ...(selectedUser.roles || [])] : [];
  const uniqueRoles = [...new Set(userRoles)];
  
  // Get toggles grouped by role
  const togglesByRole = uniqueRoles.map(role => ({
    role,
    keys: featureToggleKeysByRole[role]
  }));

  const roleLabels: Record<UserRole, string> = {
    admin: "Admin Panel",
    manager: "Manager Panel",
    sales: "Sales Panel",
    marketing: "Marketing Panel"
  };

  const sortUsers = (users: UserProfile[]) => {
    const sorted = [...users];
    switch (sortBy) {
      case "nameAsc":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "nameDesc":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case "newest":
        return sorted.sort((a, b) => b.id.localeCompare(a.id));
      case "oldest":
        return sorted.sort((a, b) => a.id.localeCompare(b.id));
      case "lastModified":
        return sorted;
      default:
        return sorted;
    }
  };

  useEffect(() => {
    const current = draftUsers.find((u) => u.id === selectedUserId);
    setManagerDraftId(current?.managerId ?? "");
  }, [selectedUserId, draftUsers]);

  // Load assigned sales users when manager is selected
  useEffect(() => {
    if (selectedUser?.role === "manager") {
      const salesUsersUnderManager = draftUsers.filter(u => u.managerId === selectedUser.id && u.role === "sales");
      setAssignedSalesUsers(salesUsersUnderManager);
    } else {
      setAssignedSalesUsers([]);
    }
  }, [selectedUser, draftUsers]);

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

  async function checkEmailAvailability(email: string, currentUserId: string) {
    if (!email || email === currentUserId) {
      setEmailError("");
      return;
    }
    try {
      const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists) {
          setEmailError("This email is already in use");
        } else {
          setEmailError("");
        }
      }
    } catch (error) {
      console.error("Failed to check email:", error);
    }
  }

  function createUser() {
    const allToggles: FeatureToggles = {
      dashboard: true,
      userManagement: true,
      roleHierarchy: true,
      businessUnits: true,
      salesOverview: true,
      marketingOverview: true,
      courseManagement: true,
      materialsLibrary: true,
      approvalWorkflows: true,
      aiBots: true,
      webTemplates: true,
      webText: true,
      appsTools: true,
      socialMediaMetrics: true,
      team: true,
      plans: true,
      training: true,
      onlineTraining: true,
      taskTracker: true,
      profile: true,
      plan: true,
      materials: true,
      aiChat: true,
      webPage: true,
      businessCards: true,
      assets: true,
      approvals: true,
      socialMetrics: true,
      featureToggles: true,
      systemSettings: true,
      teamBusinessPlans: true,
      teamFunnelMetrics: true,
      teamTraining: true,
      aiAssistant: true,
      businessPlan: true,
      trainingCenter: true,
      marketingMaterials: true,
      repWebPage: true,
      assetLibrary: true,
      contentApprovals: true
    };
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
      publicProfile: { showHeadshot: true, showEmail: true, showPhone: true, showStrengths: true, showWeaknesses: true, showTerritory: true },
      featureToggles: allToggles
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

      // Check for duplicate emails
      const emailChecks = await Promise.all(
        users.map(async (user) => {
          try {
            const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(user.email)}`);
            if (res.ok) {
              const data = await res.json();
              return { email: user.email, exists: data.exists };
            }
            return { email: user.email, exists: false };
          } catch {
            return { email: user.email, exists: false };
          }
        })
      );

      const duplicateEmails = emailChecks.filter(check => check.exists).map(check => check.email);
      
      if (duplicateEmails.length > 0) {
        alert(`The following emails already exist:\n${duplicateEmails.join("\n")}\n\nPlease remove them from the CSV and try again.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setPendingImportUsers(users);
      setShowImportConfirm(true);
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to parse CSV file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExportCSV() {
    const headers = ["id", "name", "email", "role", "phone", "territory", "strengths", "weaknesses"];
    const toggleKeys = Object.keys(draftUsers[0]?.featureToggles || {});
    const allHeaders = [...headers, ...toggleKeys.map(k => `featureToggles.${k}`)];
    
    const rows = draftUsers.map(user => {
      const baseData = [
        user.id,
        user.name,
        user.email,
        user.role,
        user.phone || "",
        user.territory || "",
        user.strengths || "",
        user.weaknesses || ""
      ];
      const toggleData = toggleKeys.map(k => (user.featureToggles as any)[k] ? "TRUE" : "FALSE");
      return [...baseData, ...toggleData];
    });
    
    const csv = [allHeaders.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="panel-header" style={{ marginBottom: 16 }}>
        <div className="panel-header-row">
          <span>User Management</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-secondary btn-small" onClick={handleExportCSV}>
              Export CSV
            </button>
            <button type="button" className="btn-secondary btn-small" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? "Importing..." : "Import CSV"}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImportCSV} />
            <button type="button" className="btn-primary btn-success" onClick={createUser}>+ Add User</button>
          </div>
        </div>
      </div>
      <div className="admin-user-management-content">
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
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, color: "#6b7280" }}>Sort:</span>
              <button
                type="button"
                className="btn-secondary btn-small"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {sortBy === "nameAsc" && "Name (A-Z)"}
                {sortBy === "nameDesc" && "Name (Z-A)"}
                {sortBy === "newest" && "Newest"}
                {sortBy === "oldest" && "Oldest"}
                {sortBy === "lastModified" && "Last Modified"}
              </button>
              {showSortDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 4,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  minWidth: 180
                }}>
                  {[
                    { value: "nameAsc", label: "✓ Name (A-Z)" },
                    { value: "nameDesc", label: "Name (Z-A)" },
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "lastModified", label: "Last Modified" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(option.value as any);
                        setShowSortDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        textAlign: "left",
                        border: "none",
                        background: sortBy === option.value ? "#f3f4f6" : "transparent",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: sortBy === option.value ? 600 : 400
                      }}
                    >
                      {sortBy === option.value ? option.label : option.label.replace("✓ ", "")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div className="panel-section">
            <div className="panel-section-title" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setShowActiveUsers(!showActiveUsers)}>
              <span>{showActiveUsers ? "▾" : "▸"}</span>
              <span>Active Users</span>
            </div>
            {showActiveUsers && (
              <div className="list">
                {sortUsers(draftUsers.filter(u => !u.suspended)).map((user) => {
                  const isActive = user.id === selectedUserId;
                  return (
                    <button key={user.id} className={isActive ? "list-item active" : "list-item"} onClick={() => setSelectedUserId(user.id)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div>
                          <div className="list-item-title">{user.name}</div>
                          <div className="list-item-subtitle">
                            {(user.roles || [user.role]).map(r => r.toUpperCase()).join(", ")} • {user.email}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {draftUsers.filter(u => u.suspended).length > 0 && (
            <div className="panel-section">
              <div className="panel-section-title" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setShowSuspendedUsers(!showSuspendedUsers)}>
                <span>{showSuspendedUsers ? "▾" : "▸"}</span>
                <span>Suspended Users</span>
              </div>
              {showSuspendedUsers && (
                <div className="list">
                  {sortUsers(draftUsers.filter(u => u.suspended)).map((user) => {
                    const isActive = user.id === selectedUserId;
                    return (
                      <button key={user.id} className={isActive ? "list-item active" : "list-item"} onClick={() => setSelectedUserId(user.id)}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div>
                            <div className="list-item-title">{user.name}</div>
                            <div className="list-item-subtitle">
                              {(user.roles || [user.role]).map(r => r.toUpperCase()).join(", ")} • {user.email}
                              <span style={{ color: "#dc2626", marginLeft: 8 }}>• SUSPENDED</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
                <span>User Details{selectedUser.suspended && <span style={{ color: "#dc2626", marginLeft: 8 }}>• SUSPENDED</span>}</span>
                <div className="panel-header-actions">
                  <button type="button" className="btn-primary btn-small" disabled={!isDirty || !!emailError} onClick={() => {
                    if (emailError) {
                      emailInputRef.current?.focus();
                      emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      return;
                    }
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
                  {selectedUser.role === "manager" && (
                    <button type="button" className="btn-primary btn-success btn-small" onClick={() => setShowAssignedSalesUsers(true)}>
                      Assigned Sales Users ({assignedSalesUsers.length})
                    </button>
                  )}
                  <button type="button" className="btn-secondary btn-warning btn-small" onClick={() => {
                    const action = selectedUser.suspended ? "Unsuspend" : "Suspend";
                    if (window.confirm(`${action} ${selectedUser.name}?`)) {
                      updateUser({ ...selectedUser, suspended: !selectedUser.suspended });
                    }
                  }}>{selectedUser.suspended ? "Unsuspend User" : "Suspend User"}</button>
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
                <input
                  ref={emailInputRef}
                  className="field-input" 
                  value={selectedUser.email} 
                  onChange={(e) => {
                    updateUser({ ...selectedUser, email: e.target.value });
                    setEmailError("");
                  }}
                  onBlur={(e) => checkEmailAvailability(e.target.value, selectedUser.id)}
                  style={emailError ? { borderColor: "#dc2626", animation: "shake 0.3s" } : {}}
                />
                {emailError && (
                  <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4, animation: "fadeIn 0.3s" }}>
                    {emailError}
                  </div>
                )}
              </label>
              <label className="field">
                <span className="field-label">Reset Password</span>
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
            {showWebPreview && selectedUser && (
              <div className="panel-section">
                <div className="panel-section-title">Rep Web Page Preview</div>
                <SalesWebPagePreview profile={selectedUser} onProfileChange={updateUser} />
              </div>
            )}
            <div style={{ marginTop: 40 }}></div>
            <div className="panel-section">
              <div className="panel-section-title">Feature Toggles</div>
              {togglesByRole.map(({ role, keys }) => (
                <div key={role} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#666" }}>
                    {roleLabels[role]}
                  </div>
                  <div className="toggle-grid">
                    {keys.map((key) => {
                      const enabled = selectedUser.featureToggles[key];
                      const label = featureToggleLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).replace(/ai/gi, "AI").trim();
                      return (
                        <label key={key} className="toggle-item">
                          <input type="checkbox" checked={enabled} onChange={(e) => updateFeatureToggles(selectedUser, { [key]: e.target.checked } as Partial<FeatureToggles>)} />
                          <span className="toggle-label">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="panel-empty">Select a user to manage details.</div>
        )}
      </div>

      {/* Assigned Sales Users Modal */}
      {showAssignedSalesUsers && selectedUser?.role === "manager" && (
        <div className="overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999 
        }}>
          <div className="dialog" style={{ 
            maxWidth: 600, 
            backgroundColor: 'white', 
            borderRadius: 8, 
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="dialog-title" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Sales Users - {selectedUser.name}
            </div>
            
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Total assigned: <strong>{assignedSalesUsers.length}</strong>
              </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, minHeight: 200, maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
              {assignedSalesUsers.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
                  <div>No sales users assigned to this manager</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {assignedSalesUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setShowAssignedSalesUsers(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: 6,
                        gap: 12,
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#eff6ff';
                        (e.currentTarget as HTMLElement).style.borderColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                        (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{user.email}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', backgroundColor: '#e5e7eb', padding: '4px 8px', borderRadius: 4 }}>
                        Sales
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAssignedSalesUsers(false)}
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
