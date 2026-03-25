import { useState, useEffect, useRef } from "react";

type Course = {
  id: string; title: string;
  folders: { id: string; title: string }[];
  pages: { id: string; title: string; folderId?: string; body?: string; transcript?: string }[];
};

type CourseBot = {
  id: string; name: string;
  selectedCourses: string[]; selectedFolders: string[]; selectedPages: string[];
  trainingText: string;
  model: string; creativity: number; systemPrompt: string;
  botTitle: string; welcomeMessage: string; placeholder: string;
  colorTheme: string; botAvatarUrl: string;
  totalMessages: number;
};

const card: React.CSSProperties = { background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px 24px" };
const btn: React.CSSProperties = { padding: "9px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 };
const btnPrimary: React.CSSProperties = { ...btn, background: "#1f2937", color: "#fff" };
const btnSecondary: React.CSSProperties = { ...btn, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box", marginBottom: "12px" };

export function CourseAiBotBuilder() {
  const [bots, setBots] = useState<CourseBot[]>([]);
  const [selected, setSelected] = useState<CourseBot | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"courses" | "tune">("courses");

  useEffect(() => { loadBots(); }, []);

  async function loadBots() {
    const res = await fetch("/api/course-ai-bots");
    if (res.ok) setBots(await res.json());
  }

  async function createBot() {
    if (!newName.trim()) return;
    const res = await fetch("/api/course-ai-bots", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() })
    });
    if (res.ok) {
      const bot = await res.json();
      setBots(prev => [bot, ...prev]);
      setSelected(bot); setShowCreate(false); setNewName("");
    }
  }

  async function saveBot(updates: Partial<CourseBot>) {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/course-ai-bots/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected(updated);
        setBots(prev => prev.map(b => b.id === updated.id ? updated : b));
      }
    } finally { setSaving(false); }
  }

  async function deleteBot(id: string) {
    if (!confirm("Delete this bot?")) return;
    await fetch(`/api/course-ai-bots/${id}`, { method: "DELETE" });
    setBots(prev => prev.filter(b => b.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (selected) {
    return (
      <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 240, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>← All Bots</button>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>{selected.botTitle || selected.name}</div>
          </div>
          <nav style={{ padding: "8px 0" }}>
            {([
              { id: "courses", label: "Add Courses", icon: "📚" },
              { id: "tune", label: "Tune AI", icon: "⚙️" },
            ] as { id: typeof activeTab; label: string; icon: string }[]).map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{ width: "100%", textAlign: "left", padding: "11px 20px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: activeTab === item.id ? 600 : 500, background: activeTab === item.id ? "#f3f4f6" : "transparent", color: activeTab === item.id ? "#1f2937" : "#4b5563", borderLeft: activeTab === item.id ? "3px solid #1f2937" : "3px solid transparent", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "12px", color: "#9ca3af" }}>{selected.totalMessages || 0} messages</div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", background: "#f9fafb" }}>
          {activeTab === "courses" && <AddCoursesPanel bot={selected} onSave={saveBot} saving={saving} />}
          {activeTab === "tune" && <TunePanel bot={selected} onSave={saveBot} saving={saving} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Course AI Bots</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "14px" }}>AI bots trained on your course content</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Create Bot</button>
      </div>

      {bots.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#9ca3af" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎓</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>No course bots yet</div>
          <div style={{ fontSize: "14px", marginBottom: "24px" }}>Create a bot and train it with your course content</div>
          <button onClick={() => setShowCreate(true)} style={btnPrimary}>Create Bot</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {bots.map(bot => (
            <div key={bot.id} onClick={() => { setSelected(bot); setActiveTab("courses"); }}
              style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: bot.colorTheme || "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "18px" }}>🎓</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px" }}>{bot.botTitle || bot.name}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{bot.selectedPages?.length || 0} lessons · {bot.totalMessages || 0} messages</div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteBot(bot.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "16px" }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", width: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>Create Course Bot</h3>
            <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: "14px" }}>Give your course AI bot a name</p>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createBot()} placeholder="e.g. Sales Training Bot" style={inputStyle} />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
              <button onClick={() => { setShowCreate(false); setNewName(""); }} style={btnSecondary}>Cancel</button>
              <button onClick={createBot} disabled={!newName.trim()} style={{ ...btnPrimary, opacity: newName.trim() ? 1 : 0.5 }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Courses Panel ────────────────────────────────────────────────────────

function AddCoursesPanel({ bot, onSave, saving }: { bot: CourseBot; onSave: (u: Partial<CourseBot>) => void; saving: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set(bot.selectedPages || []));
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set(bot.selectedFolders || []));
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set(bot.selectedCourses || []));

  useEffect(() => {
    fetch("/api/courses").then(r => r.ok ? r.json() : []).then(data => {
      setCourses(data); setLoading(false);
    });
  }, []);

  function toggleCourse(courseId: string, course: Course) {
    const allPageIds = (course.pages || []).map((p: any) => p.id);
    const allFolderIds = (course.folders || []).map((f: any) => f.id);
    const newCourses = new Set(selectedCourses);
    const newFolders = new Set(selectedFolders);
    const newPages = new Set(selectedPages);

    if (newCourses.has(courseId)) {
      newCourses.delete(courseId);
      allFolderIds.forEach(id => newFolders.delete(id));
      allPageIds.forEach(id => newPages.delete(id));
    } else {
      newCourses.add(courseId);
      allFolderIds.forEach(id => newFolders.add(id));
      allPageIds.forEach(id => newPages.add(id));
    }
    setSelectedCourses(newCourses); setSelectedFolders(newFolders); setSelectedPages(newPages);
  }

  function toggleFolder(folderId: string, course: Course) {
    const folderPages = (course.pages || []).filter((p: any) => p.folderId === folderId).map((p: any) => p.id);
    const newFolders = new Set(selectedFolders);
    const newPages = new Set(selectedPages);

    if (newFolders.has(folderId)) {
      newFolders.delete(folderId);
      folderPages.forEach(id => newPages.delete(id));
    } else {
      newFolders.add(folderId);
      folderPages.forEach(id => newPages.add(id));
    }
    setSelectedFolders(newFolders); setSelectedPages(newPages);
  }

  function togglePage(pageId: string) {
    const newPages = new Set(selectedPages);
    newPages.has(pageId) ? newPages.delete(pageId) : newPages.add(pageId);
    setSelectedPages(newPages);
  }

  function save() {
    onSave({
      selectedCourses: Array.from(selectedCourses),
      selectedFolders: Array.from(selectedFolders),
      selectedPages: Array.from(selectedPages),
    });
  }

  const totalSelected = selectedPages.size;

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>Add Courses</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Select courses, modules, and lessons to train this bot</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {totalSelected > 0 && <span style={{ fontSize: "13px", color: "#6b7280" }}>{totalSelected} lessons selected</span>}
          <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "Saving..." : "Save & Train"}</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "60px", color: "#9ca3af" }}>No courses found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {courses.map(course => {
            const isExpanded = expanded.has(course.id);
            const isCourseChecked = selectedCourses.has(course.id);
            const coursePageCount = (course.pages || []).length;
            const selectedInCourse = (course.pages || []).filter(p => selectedPages.has(p.id)).length;

            return (
              <div key={course.id} style={{ ...card, padding: 0, overflow: "hidden" }}>
                {/* Course header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", background: "#f8fafc", borderBottom: isExpanded ? "1px solid #e5e7eb" : "none" }}>
                  <input type="checkbox" checked={isCourseChecked} onChange={() => toggleCourse(course.id, course)}
                    style={{ width: 16, height: 16, accentColor: "#3b82f6", cursor: "pointer", flexShrink: 0 }} />
                  <button onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(course.id) ? n.delete(course.id) : n.add(course.id); return n; })}
                    style={{ background: "none", border: "none", cursor: "pointer", flex: 1, textAlign: "left", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px" }}>📚</span>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#1f2937" }}>{course.title}</span>
                    <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "auto" }}>{selectedInCourse}/{coursePageCount} lessons</span>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>{isExpanded ? "▲" : "▼"}</span>
                  </button>
                </div>

                {/* Folders + Pages */}
                {isExpanded && (
                  <div style={{ padding: "8px 0" }}>
                    {/* Pages without folder */}
                    {(course.pages || []).filter(p => !p.folderId).map(page => (
                      <label key={page.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 20px 8px 44px", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <input type="checkbox" checked={selectedPages.has(page.id)} onChange={() => togglePage(page.id)}
                          style={{ width: 14, height: 14, accentColor: "#3b82f6", cursor: "pointer" }} />
                        <span style={{ fontSize: "14px" }}>📄</span>
                        <span style={{ fontSize: "13px", color: "#374151" }}>{page.title}</span>
                        {page.transcript && <span style={{ fontSize: "11px", color: "#10b981", marginLeft: "auto" }}>✓ transcript</span>}
                      </label>
                    ))}

                    {/* Folders */}
                    {(course.folders || []).map(folder => {
                      const folderPages = (course.pages || []).filter(p => p.folderId === folder.id);
                      const isFolderChecked = selectedFolders.has(folder.id);
                      return (
                        <div key={folder.id}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 20px 8px 28px" }}>
                            <input type="checkbox" checked={isFolderChecked} onChange={() => toggleFolder(folder.id, course)}
                              style={{ width: 15, height: 15, accentColor: "#3b82f6", cursor: "pointer" }} />
                            <span style={{ fontSize: "15px" }}>📁</span>
                            <span style={{ fontWeight: 600, fontSize: "13px", color: "#374151" }}>{folder.title}</span>
                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>({folderPages.filter(p => selectedPages.has(p.id)).length}/{folderPages.length})</span>
                          </div>
                          {folderPages.map(page => (
                            <label key={page.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 20px 7px 60px", cursor: "pointer" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <input type="checkbox" checked={selectedPages.has(page.id)} onChange={() => togglePage(page.id)}
                                style={{ width: 14, height: 14, accentColor: "#3b82f6", cursor: "pointer" }} />
                              <span style={{ fontSize: "13px" }}>📄</span>
                              <span style={{ fontSize: "13px", color: "#374151" }}>{page.title}</span>
                              {page.transcript && <span style={{ fontSize: "11px", color: "#10b981", marginLeft: "auto" }}>✓ transcript</span>}
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tune Panel ───────────────────────────────────────────────────────────────

function TunePanel({ bot, onSave, saving }: { bot: CourseBot; onSave: (u: Partial<CourseBot>) => void; saving: boolean }) {
  const [model, setModel] = useState(bot.model || "gpt-4o-mini");
  const [creativity, setCreativity] = useState(bot.creativity || 0);
  const [systemPrompt, setSystemPrompt] = useState(bot.systemPrompt || "");

  return (
    <div style={{ padding: "32px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Tune AI</h2>

      <div style={{ ...card, marginBottom: "20px" }}>
        <div style={{ fontWeight: 600, marginBottom: "12px" }}>Model</div>
        <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle}>
          <option value="gpt-4o-mini">GPT-4o mini</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div style={{ ...card, marginBottom: "20px" }}>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>AI Creativity</div>
        <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>Lower = more focused, Higher = more creative</p>
        <input type="range" min={0} max={100} value={creativity} onChange={e => setCreativity(Number(e.target.value))} style={{ width: "100%", accentColor: "#1f2937" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
          <span>0%</span><span style={{ fontWeight: 600, color: "#1f2937" }}>{creativity}%</span><span>100%</span>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>AI Instruction Prompt</div>
        <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>Define how the bot should behave with course content</p>
        <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
          placeholder="e.g. You are a helpful course assistant. Only answer questions related to the course content provided."
          style={{ ...inputStyle, minHeight: "160px", resize: "vertical" } as any} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onSave({ model, creativity, systemPrompt })} disabled={saving} style={btnPrimary}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Appearance Panel ─────────────────────────────────────────────────────────

const COLOR_THEMES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#1f2937", "#0ea5e9"];

function AppearancePanel({ bot, onSave, saving }: { bot: CourseBot; onSave: (u: Partial<CourseBot>) => void; saving: boolean }) {
  const [botTitle, setBotTitle] = useState(bot.botTitle || bot.name || "");
  const [welcomeMessage, setWelcomeMessage] = useState(bot.welcomeMessage || "Hi! Ask me anything about this course.");
  const [placeholder, setPlaceholder] = useState(bot.placeholder || "Ask about the course...");
  const [colorTheme, setColorTheme] = useState(bot.colorTheme || "#3b82f6");

  return (
    <div style={{ padding: "32px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Appearance</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#e5e7eb", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
        <div style={{ background: "#fff", padding: "18px 20px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>Bot Title</div>
          <input value={botTitle} onChange={e => setBotTitle(e.target.value)} style={inputStyle} placeholder="Course AI Assistant" />
        </div>
        <div style={{ background: "#fff", padding: "18px 20px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>Welcome Message</div>
          <input value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} style={inputStyle} placeholder="Hi! Ask me anything about this course." />
        </div>
        <div style={{ background: "#fff", padding: "18px 20px" }}>
          <div style={{ fontWeight: 600, marginBottom: "8px" }}>Input Placeholder</div>
          <input value={placeholder} onChange={e => setPlaceholder(e.target.value)} style={inputStyle} placeholder="Ask about the course..." />
        </div>
        <div style={{ background: "#fff", padding: "18px 20px" }}>
          <div style={{ fontWeight: 600, marginBottom: "12px" }}>Color Theme</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {COLOR_THEMES.map(c => (
              <button key={c} onClick={() => setColorTheme(c)} style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: "none", cursor: "pointer", boxShadow: colorTheme === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => onSave({ botTitle, welcomeMessage, placeholder, colorTheme })} disabled={saving} style={btnPrimary}>{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}
