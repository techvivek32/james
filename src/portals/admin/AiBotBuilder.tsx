import { useState, useEffect, useRef } from "react";

type TrainingLink = {
  id: string;
  url: string;
  type: string;
  status: string;
  chars: number;
};

type QAItem = {
  id: string;
  question: string;
  answer: string;
};

type AiBot = {
  id: string;
  name: string;
  assignedRoles: string[];
  trainingLinks: TrainingLink[];
  trainingText: string;
  qaItems: QAItem[];
  model: string;
  creativity: number;
  systemPrompt: string;
  totalChats: number;
  totalMessages: number;
};

type BotView = "overview" | "chat-history" | "links" | "text" | "qa" | "tune" | "test" | "deploy";

export function AiBotBuilder() {
  const [bots, setBots] = useState<AiBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<AiBot | null>(null);
  const [activeView, setActiveView] = useState<BotView>("links");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBots(); }, []);

  async function loadBots() {
    const res = await fetch("/api/ai-bots");
    if (res.ok) setBots(await res.json());
  }

  async function createBot() {
    if (!newBotName.trim()) return;
    const res = await fetch("/api/ai-bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBotName.trim() })
    });
    if (res.ok) {
      const bot = await res.json();
      setBots(prev => [bot, ...prev]);
      setSelectedBot(bot);
      setActiveView("links");
      setShowCreateModal(false);
      setNewBotName("");
    }
  }

  async function saveBot(updates: Partial<AiBot>) {
    if (!selectedBot) return;
    setSaving(true);
    const res = await fetch(`/api/ai-bots/${selectedBot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedBot(updated);
      setBots(prev => prev.map(b => b.id === updated.id ? updated : b));
    }
    setSaving(false);
  }

  async function deleteBot(botId: string) {
    if (!confirm("Delete this bot?")) return;
    await fetch(`/api/ai-bots/${botId}`, { method: "DELETE" });
    setBots(prev => prev.filter(b => b.id !== botId));
    if (selectedBot?.id === botId) setSelectedBot(null);
  }

  if (selectedBot) {
    return (
      <BotDetailView
        bot={selectedBot}
        activeView={activeView}
        setActiveView={setActiveView}
        onSave={saveBot}
        saving={saving}
        onBack={() => setSelectedBot(null)}
      />
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>My Bots</h2>
          <p style={{ color: "#6b7280", margin: "4px 0 0", fontSize: "14px" }}>Build and manage your AI chatbots</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>
          + Create New Bot
        </button>
      </div>

      {bots.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#9ca3af" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🤖</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>No bots yet</div>
          <div style={{ fontSize: "14px", marginBottom: "24px" }}>Create your first AI bot to get started</div>
          <button onClick={() => setShowCreateModal(true)} style={btnPrimary}>Create New Bot</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {bots.map(bot => (
            <div key={bot.id} style={botCard} onClick={() => { setSelectedBot(bot); setActiveView("links"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "18px" }}>🤖</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "15px" }}>{bot.name}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                      {bot.trainingLinks?.length || 0} sources · {bot.totalMessages || 0} messages
                    </div>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteBot(bot.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "16px", padding: "4px" }}
                >
                  🗑
                </button>
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(bot.assignedRoles || []).map(r => (
                  <span key={r} style={{ fontSize: "11px", padding: "2px 8px", background: "#f3f4f6", borderRadius: "12px", color: "#374151", textTransform: "capitalize" }}>{r}</span>
                ))}
              </div>
            </div>
          ))}
          <div style={{ ...botCard, border: "2px dashed #d1d5db", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: "120px" }}
            onClick={() => setShowCreateModal(true)}>
            <div style={{ textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: "28px" }}>+</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>Create New Bot</div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <Modal onClose={() => { setShowCreateModal(false); setNewBotName(""); }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700 }}>Create New Bot</h3>
          <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: "14px" }}>Give your chatbot a name to easily identify it</p>
          <input
            autoFocus
            value={newBotName}
            onChange={e => setNewBotName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && createBot()}
            placeholder="e.g. Jay's Bot"
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
            <button onClick={() => { setShowCreateModal(false); setNewBotName(""); }} style={btnSecondary}>Close</button>
            <button onClick={createBot} disabled={!newBotName.trim()} style={{ ...btnPrimary, opacity: newBotName.trim() ? 1 : 0.5 }}>Let's Go</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Bot Detail View ────────────────────────────────────────────────────────

function BotDetailView({ bot, activeView, setActiveView, onSave, saving, onBack }: {
  bot: AiBot;
  activeView: BotView;
  setActiveView: (v: BotView) => void;
  onSave: (updates: Partial<AiBot>) => void;
  saving: boolean;
  onBack: () => void;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems: { id: BotView; label: string; icon: string; section?: string }[] = [
    { id: "overview",      label: "Overview",      icon: "📊", section: "ACTIVITY" },
    { id: "chat-history",  label: "Chat History",  icon: "💬" },
    { id: "links",         label: "Links / Docs",  icon: "🔗", section: "TRAINING DATA" },
    { id: "text",          label: "Text",          icon: "📝" },
    { id: "qa",            label: "Q&A",           icon: "❓" },
    { id: "tune",          label: "Tune AI",       icon: "⚙️", section: "BEHAVIOUR" },
    { id: "test",          label: "Test Your Bot", icon: "🧪" },
    { id: "deploy",        label: "Deploy",        icon: "🚀", section: "DEPLOYMENT" },
  ];

  const activeItem = navItems.find(n => n.id === activeView);

  function handleNavSelect(id: BotView) {
    setActiveView(id);
    setMobileNavOpen(false);
  }

  const sidebarContent = (
    <>
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #e5e7eb" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", padding: 0, display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontWeight: 500 }}>
          ← All Bots
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "20px", flexShrink: 0 }}>🤖</div>
          <div style={{ fontWeight: 700, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1f2937" }}>{bot.name}</div>
        </div>
      </div>
      <nav style={{ padding: "10px 0", flex: 1, overflowY: "auto" }}>
        {navItems.map(item => (
          <div key={item.id}>
            {item.section && (
              <div style={{ padding: "14px 20px 6px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em" }}>{item.section}</div>
            )}
            <button
              onClick={() => handleNavSelect(item.id)}
              style={{
                width: "100%", textAlign: "left", padding: "11px 20px", border: "none", cursor: "pointer",
                fontSize: "14px", fontWeight: activeView === item.id ? 600 : 500,
                background: activeView === item.id ? "#f3f4f6" : "transparent",
                color: activeView === item.id ? "#1f2937" : "#4b5563",
                borderLeft: activeView === item.id ? "3px solid #1f2937" : "3px solid transparent",
                display: "flex", alignItems: "center", gap: "10px",
                transition: "background 0.15s"
              }}
            >
              <span style={{ fontSize: "17px", width: "22px", textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", position: "relative" }}>

      {/* ── Desktop Sidebar ── */}
      <div style={{ width: "260px", minWidth: "260px", background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column" }} className="bot-sidebar-desktop">
        {sidebarContent}
      </div>

      {/* ── Mobile overlay backdrop ── */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: "280px",
        background: "#fff", zIndex: 201, display: "flex", flexDirection: "column",
        transform: mobileNavOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease", boxShadow: "4px 0 24px rgba(0,0,0,0.15)"
      }} className="bot-sidebar-mobile">
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px" }}>
          <button onClick={() => setMobileNavOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "#6b7280" }}>✕</button>
        </div>
        {sidebarContent}
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, overflowY: "auto", background: "#f9fafb", display: "flex", flexDirection: "column" }}>

        {/* Mobile top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }} className="bot-mobile-topbar">
          <button
            onClick={() => setMobileNavOpen(true)}
            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", padding: "8px 10px", fontSize: "18px", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}
          >
            ☰ <span style={{ fontSize: "13px", fontWeight: 600 }}>{activeItem?.label}</span>
          </button>
          <div style={{ fontSize: "13px", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🤖 {bot.name}</div>
        </div>

        <div style={{ flex: 1 }}>
          {activeView === "overview"     && <OverviewPanel bot={bot} />}
          {activeView === "chat-history" && <ChatHistoryPanel bot={bot} />}
          {activeView === "links"        && <LinksPanel bot={bot} onSave={onSave} saving={saving} />}
          {activeView === "text"         && <TextPanel bot={bot} onSave={onSave} saving={saving} />}
          {activeView === "qa"           && <QAPanel bot={bot} onSave={onSave} saving={saving} />}
          {activeView === "tune"         && <TunePanel bot={bot} onSave={onSave} saving={saving} />}
          {activeView === "test"         && <TestPanel bot={bot} />}
          {activeView === "deploy"       && <DeployPanel bot={bot} onSave={onSave} saving={saving} />}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .bot-sidebar-desktop { display: none !important; }
          .bot-mobile-topbar { display: flex !important; }
          .bot-panel-padding { padding: 16px !important; }
          .bot-links-grid { grid-template-columns: 1fr !important; }
          .bot-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .bot-overview-grid { grid-template-columns: 1fr !important; }
          .bot-tune-model-grid { grid-template-columns: 1fr !important; }
          .bot-qa-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
        @media (min-width: 769px) {
          .bot-sidebar-desktop { display: flex !important; }
          .bot-mobile-topbar { display: none !important; }
          .bot-sidebar-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Overview Panel ──────────────────────────────────────────────────────────

function OverviewPanel({ bot }: { bot: AiBot }) {
  return (
    <div style={{ padding: "32px" }} className="bot-panel-padding">
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }} className="bot-overview-grid">
        {[
          { label: "Training Sources", value: bot.trainingLinks?.length || 0, icon: "🔗" },
          { label: "Total Messages", value: bot.totalMessages || 0, icon: "💬" },
          { label: "Q&A Pairs", value: bot.qaItems?.length || 0, icon: "❓" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#1f2937" }}>{stat.value}</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb" }}>
        <div style={{ fontWeight: 600, marginBottom: "12px" }}>Bot Details</div>
        <div style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
          <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", width: "120px" }}>Name:</span><span>{bot.name}</span></div>
          <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", width: "120px" }}>Model:</span><span>{bot.model || "gpt-4o-mini"}</span></div>
          <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", width: "120px" }}>Creativity:</span><span>{bot.creativity || 0}%</span></div>
          <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", width: "120px" }}>Assigned To:</span><span>{bot.assignedRoles?.join(", ") || "Not assigned"}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat History Panel ───────────────────────────────────────────────────────

function ChatHistoryPanel({ bot }: { bot: AiBot }) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => { loadChats(); }, [bot.id]);

  async function loadChats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-bots/admin-chats?botId=${bot.id}`);
      if (res.ok) setChats(await res.json());
    } finally { setLoading(false); }
  }

  const filtered = chats.filter(c => {
    const matchSearch = !search ||
      c.userName?.toLowerCase().includes(search.toLowerCase()) ||
      c.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      c.title?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || c.userRole === roleFilter;
    return matchSearch && matchRole;
  });

  if (selectedChat) {
    return (
      <div style={{ padding: "32px" }} className="bot-panel-padding">
        <button onClick={() => setSelectedChat(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
          ← Back
        </button>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontWeight: 700, fontSize: "16px" }}>{selectedChat.title}</div>
          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            {selectedChat.userName} · {selectedChat.userEmail} · <span style={{ textTransform: "capitalize" }}>{selectedChat.userRole}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
          {selectedChat.messages?.map((m: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "75%", padding: "10px 14px", borderRadius: "16px", fontSize: "14px", lineHeight: "1.6",
                background: m.role === "user" ? "#1f2937" : "#f3f4f6",
                color: m.role === "user" ? "#fff" : "#1f2937",
                whiteSpace: "pre-wrap"
              }}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px" }} className="bot-panel-padding">
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Chat History</h2>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>All conversations with this bot</p>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or title..."
          style={{ flex: 1, minWidth: "200px", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", outline: "none" }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", background: "#fff", cursor: "pointer" }}>
          <option value="all">All Roles</option>
          <option value="manager">Manager</option>
          <option value="sales">Sales</option>
          <option value="marketing">Marketing</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "60px 20px", border: "1px solid #e5e7eb", textAlign: "center", color: "#9ca3af" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>💬</div>
          <div style={{ fontSize: "16px", fontWeight: 500, color: "#374151" }}>No conversations yet</div>
          <div style={{ fontSize: "14px", marginTop: "8px" }}>Chats will appear here once users start talking to this bot</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(chat => (
            <div key={chat.chatId} onClick={() => setSelectedChat(chat)} style={{
              background: "#fff", borderRadius: "10px", padding: "16px 20px", border: "1px solid #e5e7eb",
              cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{chat.title}</div>
                <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", gap: "12px" }}>
                  <span>👤 {chat.userName}</span>
                  <span>✉️ {chat.userEmail}</span>
                  <span style={{ textTransform: "capitalize", background: "#f3f4f6", padding: "1px 8px", borderRadius: "10px" }}>{chat.userRole}</span>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "right" }}>
                <div>{chat.messages?.length || 0} messages</div>
                <div>{new Date(chat.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Links / Docs Panel ───────────────────────────────────────────────────────

function LinksPanel({ bot, onSave, saving }: { bot: AiBot; onSave: (u: Partial<AiBot>) => void; saving: boolean }) {
  const [url, setUrl] = useState("");
  const [urlType, setUrlType] = useState("webpage");
  const [links, setLinks] = useState<TrainingLink[]>(bot.trainingLinks || []);
  const [crawling, setCrawling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const totalChars = links.reduce((s, l) => s + (l.chars || 0), 0);
  const maxChars = 1_000_000;

  async function addLink() {
    if (!url.trim() || crawling) return;
    const trimmedUrl = url.trim();
    setUrl("");
    setCrawling(true);

    // Optimistically add as pending
    const tempId = `link-${Date.now()}`;
    const pendingLink: TrainingLink = { id: tempId, url: trimmedUrl, type: urlType, status: "pending", chars: 0 };
    setLinks(prev => [...prev, pendingLink]);

    try {
      const res = await fetch("/api/ai-bots/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, url: trimmedUrl, type: urlType })
      });
      const data = await res.json();
      // Replace pending with real result
      setLinks(prev => prev.map(l => l.id === tempId ? data.link : l));
    } catch {
      setLinks(prev => prev.map(l => l.id === tempId ? { ...l, status: "failed" } : l));
    } finally {
      setCrawling(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("botId", bot.id);

    try {
      const res = await fetch("/api/ai-bots/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setLinks(prev => [...prev, data.link]);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeLink(id: string) {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    onSave({ trainingLinks: updated });
  }

  const statusColor: Record<string, string> = { trained: "#10b981", pending: "#f59e0b", failed: "#ef4444", "no-space": "#6b7280" };

  return (
    <div style={{ padding: "32px" }} className="bot-panel-padding">
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Links</h2>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>Enter the link to a webpage and we will visit all the pages starting from it</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }} className="bot-links-grid">
        {/* Train from Link */}
        <div style={card}>
          <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>Train from Link</div>
          <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>Enter a URL to train your bot from a website or document</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {["full-website", "webpage", "pdf", "word-doc", "excel-csv", "youtube"].map(t => (
              <button key={t} onClick={() => setUrlType(t)} style={{
                padding: "4px 12px", borderRadius: "20px", border: "1px solid", fontSize: "12px", cursor: "pointer", fontWeight: 500,
                background: urlType === t ? "#1f2937" : "#fff",
                color: urlType === t ? "#fff" : "#374151",
                borderColor: urlType === t ? "#1f2937" : "#d1d5db"
              }}>
                {t === "full-website" ? "Full Website" : t === "webpage" ? "Webpage" : t === "pdf" ? "PDF" : t === "word-doc" ? "Word Doc" : t === "excel-csv" ? "Excel/CSV" : "YouTube"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addLink()}
              placeholder="Enter the target link"
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
              disabled={crawling}
            />
            <button onClick={addLink} disabled={crawling || !url.trim()} style={{ ...btnPrimary, opacity: crawling || !url.trim() ? 0.6 : 1, minWidth: "70px" }}>
              {crawling ? "..." : "Start"}
            </button>
          </div>
          {crawling && <div style={{ fontSize: "12px", color: "#f59e0b", marginTop: "8px" }}>⏳ Fetching and processing content...</div>}
        </div>

        {/* Upload Document */}
        <div style={card}>
          <div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "4px" }}>Upload Document</div>
          <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>Only txt, pdf, docx, doc, csv, xlsx files are allowed. Max 70MB.</p>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && fileRef.current) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileRef.current.files = dt.files;
                fileRef.current.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }}
            style={{ border: "2px dashed #d1d5db", borderRadius: "10px", padding: "40px 20px", textAlign: "center", cursor: uploading ? "wait" : "pointer", color: "#6b7280", background: uploading ? "#f9fafb" : "#fff" }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>{uploading ? "⏳" : "☁️"}</div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>{uploading ? "Processing file..." : "Choose a file or drag it here"}</div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>txt, pdf, docx, doc, csv, xlsx · Max 70MB</div>
          </div>
          {uploadError && <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "8px" }}>⚠️ {uploadError}</div>}
          <input ref={fileRef} type="file" accept=".txt,.pdf,.docx,.doc,.csv,.xlsx" style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", marginBottom: "20px" }} className="bot-stats-grid">
        {[
          { label: "Discovered Links", value: links.length, icon: "🔍" },
          { label: "Chars", value: `${totalChars.toLocaleString()} / ${(maxChars / 1000000).toFixed(0)}M`, icon: "📊" },
          { label: "Trained", value: links.filter(l => l.status === "trained").length, color: "#10b981" },
          { label: "Pending", value: links.filter(l => l.status === "pending").length, color: "#f59e0b" },
          { label: "Failed", value: links.filter(l => l.status === "failed").length, color: "#ef4444" },
          { label: "No Space", value: links.filter(l => l.status === "no-space").length, color: "#6b7280" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "8px", padding: "12px 16px", border: "1px solid #e5e7eb", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: (s as any).color || "#1f2937" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {links.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "40px", color: "#9ca3af" }}>
          <div style={{ fontSize: "14px" }}>No links found. Add a URL above to start training.</div>
        </div>
      ) : (
        <div style={card}>
          {links.map(link => (
            <div key={link.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{link.type} · {link.chars} chars</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: statusColor[link.status] || "#6b7280", textTransform: "capitalize" }}>● {link.status}</span>
                <button onClick={() => removeLink(link.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "14px" }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Text Panel ───────────────────────────────────────────────────────────────

function TextPanel({ bot, onSave, saving }: { bot: AiBot; onSave: (u: Partial<AiBot>) => void; saving: boolean }) {
  const [text, setText] = useState(bot.trainingText || "");

  return (
    <div style={{ padding: "32px" }} className="bot-panel-padding">
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>Text</h2>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>This is a quick and easy method to quickly train your chatbot on extra data. Simply add any text below.</p>
      <div style={card}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter your training content here..."
          style={{ width: "100%", minHeight: "400px", border: "none", outline: "none", fontSize: "14px", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>{text.length.toLocaleString()} characters</span>
          <button onClick={() => onSave({ trainingText: text })} disabled={saving} style={btnPrimary}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Q&A Panel ────────────────────────────────────────────────────────────────

function QAPanel({ bot, onSave, saving }: { bot: AiBot; onSave: (u: Partial<AiBot>) => void; saving: boolean }) {
  const [items, setItems] = useState<QAItem[]>(bot.qaItems || []);

  function addItem() {
    setItems(prev => [...prev, { id: `qa-${Date.now()}`, question: "", answer: "" }]);
  }

  function updateItem(id: string, field: "question" | "answer", value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function save() {
    onSave({ qaItems: items });
  }

  return (
    <div style={{ padding: "32px" }} className="bot-panel-padding">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }} className="bot-qa-header">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>Q&A</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Use this section to add frequently asked questions and the responses the chatbot should provide.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={addItem} style={btnPrimary}>+ Add</button>
          <button onClick={save} disabled={saving} style={btnSecondary}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <div style={{ fontSize: "14px" }}>No Q&A pairs yet. Click "+ Add" to create one.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {items.map(item => (
            <div key={item.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontWeight: 600, fontSize: "13px", color: "#374151" }}>Question</span>
                <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "14px" }}>🗑</button>
              </div>
              <input
                value={item.question}
                onChange={e => updateItem(item.id, "question", e.target.value)}
                placeholder="Enter Question"
                style={{ ...inputStyle, marginBottom: "10px" }}
              />
              <textarea
                value={item.answer}
                onChange={e => updateItem(item.id, "answer", e.target.value)}
                placeholder="Enter Answer"
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" } as any}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tune AI Panel ────────────────────────────────────────────────────────────

const DEFAULT_PROMPTS: Record<string, string> = {
  "General Customer Service": `Chatbot Role and Function\n\nYou are a customer service chatbot for [Company Name]. Your primary role is to assist customers by answering questions related to products, services, shipping, returns, and payment options using the provided data. When asked about product details, shipping times, or return policies, respond based on the available information. If the necessary details are not covered in the provided data, respond with:\n\n"Apologies, I do not have that information. Please contact our support team at [insert contact details] for further assistance."\n\nGuidelines and Restrictions\n\nData Reliance: Only use the provided data to answer questions. Do not explicitly mention users that you are relying on this data.\nStay Focused: If users try to divert the conversation to unrelated topics, politely redirect them to queries relevant to customer service and sales.`,
  "Sales Assistant": `You are a sales assistant. Your role is to help prospects understand our products and services, answer questions, and guide them toward making a purchase decision. Be helpful, professional, and persuasive without being pushy.`,
  "Marketing Assistant": `You are a marketing assistant. Help with campaign ideas, copywriting, content strategy, and brand messaging. Be creative, data-driven, and aligned with our brand voice.`,
};

function TunePanel({ bot, onSave, saving }: { bot: AiBot; onSave: (u: Partial<AiBot>) => void; saving: boolean }) {
  const [model, setModel] = useState(bot.model || "gpt-4o-mini");
  const [creativity, setCreativity] = useState(bot.creativity || 0);
  const [systemPrompt, setSystemPrompt] = useState(bot.systemPrompt || "");
  const [selectedPreset, setSelectedPreset] = useState("General Customer Service");

  function applyPreset(preset: string) {
    setSelectedPreset(preset);
    setSystemPrompt(DEFAULT_PROMPTS[preset] || "");
  }

  return (
    <div style={{ padding: "32px" }} className="bot-panel-padding">
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Tune AI</h2>

      {/* Model Selection */}
      <div style={{ ...card, marginBottom: "20px" }}>
        <div style={{ fontWeight: 600, marginBottom: "16px" }}>Model</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }} className="bot-tune-model-grid">
          <div>
            <label style={{ fontSize: "12px", color: "#6b7280", display: "block", marginBottom: "6px" }}>OpenAI Models</label>
            <select value={model} onChange={e => setModel(e.target.value)} style={inputStyle}>
              <option value="gpt-4o-mini">GPT-4o mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Creativity */}
      <div style={{ ...card, marginBottom: "20px" }}>
        <div style={{ fontWeight: 600, marginBottom: "4px" }}>AI Creativity</div>
        <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>Lower values make responses more focused and predictable. Higher values make them more creative and varied.</p>
        <input
          type="range" min={0} max={100} value={creativity}
          onChange={e => setCreativity(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#1f2937" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
          <span>0%</span><span style={{ fontWeight: 600, color: "#1f2937" }}>{creativity}%</span><span>100%</span>
        </div>
      </div>

      {/* AI Instruction Prompt */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>AI Instruction Prompt</div>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>Give instructions here to tune the behaviour of the bot. You can simply explain how you want the bot to behave.</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <select value={selectedPreset} onChange={e => applyPreset(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }}>
            {Object.keys(DEFAULT_PROMPTS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => applyPreset(selectedPreset)} style={btnSecondary}>Load Preset</button>
        </div>
        <textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          placeholder="Enter your AI instructions here..."
          style={{ ...inputStyle, minHeight: "200px", resize: "vertical" } as any}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <button onClick={() => onSave({ model, creativity, systemPrompt })} disabled={saving} style={btnPrimary}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Test Your Bot Panel ──────────────────────────────────────────────────────

function TestPanel({ bot }: { bot: AiBot }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-bots/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, messages: newMessages })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error || "Error" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to get response." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px", height: "100%", display: "flex", flexDirection: "column" }} className="bot-panel-padding">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>Test Your Bot</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Chat with your bot to test how it responds</p>
        </div>
        <button onClick={() => setMessages([])} style={btnSecondary}>Clear Chat</button>
      </div>
      <div style={{ flex: 1, background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "400px" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🤖</div>
              <div style={{ fontSize: "14px" }}>Start chatting to test your bot</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "70%", padding: "10px 14px", borderRadius: "16px", fontSize: "14px", lineHeight: "1.5",
                background: m.role === "user" ? "#1f2937" : "#f3f4f6",
                color: m.role === "user" ? "#fff" : "#1f2937"
              }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "10px 14px", borderRadius: "16px", background: "#f3f4f6", color: "#6b7280", fontSize: "14px" }}>Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px" }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type a message to test your bot..."
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{ ...btnPrimary, opacity: loading || !input.trim() ? 0.5 : 1 }}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── Deploy Panel ─────────────────────────────────────────────────────────────

function DeployPanel({ bot, onSave, saving }: { bot: AiBot; onSave: (u: Partial<AiBot>) => void; saving: boolean }) {
  const [assignedRoles, setAssignedRoles] = useState<string[]>(bot.assignedRoles || []);
  const roles = ["manager", "sales", "marketing"];

  function toggleRole(role: string) {
    setAssignedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  }

  return (
    <div style={{ padding: "32px" }} className="bot-panel-padding">
      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Deploy</h2>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>Assign this bot to user panels so they can chat with it</p>
      <div style={card}>
        <div style={{ fontWeight: 600, marginBottom: "16px" }}>Assign to Panels</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {roles.map(role => (
            <label key={role} style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "12px", borderRadius: "8px", border: `1px solid ${assignedRoles.includes(role) ? "#1f2937" : "#e5e7eb"}`, background: assignedRoles.includes(role) ? "#f9fafb" : "#fff" }}>
              <input type="checkbox" checked={assignedRoles.includes(role)} onChange={() => toggleRole(role)} style={{ width: "16px", height: "16px", accentColor: "#1f2937" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", textTransform: "capitalize" }}>{role} Panel</div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Show this bot in the {role} portal</div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => onSave({ assignedRoles })} disabled={saving} style={btnPrimary}>
            {saving ? "Saving..." : "Save Deployment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "440px", maxWidth: "90vw", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>✕</button>
        {children}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1f2937", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { padding: "10px 20px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer" };
const botCard: React.CSSProperties = { background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e5e7eb", cursor: "pointer", transition: "box-shadow 0.2s" };
