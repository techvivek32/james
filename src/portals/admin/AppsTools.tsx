import { useRef, useState, useEffect } from "react";

type AppToolItem = {
  _id: string;
  title: string;
  imageUrl: string;
  description: string;
  link: string;
  category: 'apps' | 'tools' | 'other';
};

export function AppsToolManagement() {
  const [apps, setApps] = useState<AppToolItem[]>([]);
  const [tools, setTools] = useState<AppToolItem[]>([]);
  const [other, setOther] = useState<AppToolItem[]>([]);
  const [isCreating, setIsCreating] = useState<"apps" | "tools" | "other" | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLink, setNewLink] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAppTools();
  }, []);

  async function fetchAppTools() {
    try {
      const response = await fetch('/api/apps-tools');
      if (response.ok) {
        const data = await response.json();
        setApps(data.filter((item: AppToolItem) => item.category === 'apps'));
        setTools(data.filter((item: AppToolItem) => item.category === 'tools'));
        setOther(data.filter((item: AppToolItem) => item.category === 'other'));
      }
    } catch (error) {
      console.error('Error fetching apps/tools:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createItem(type: "apps" | "tools" | "other") {
    if (!newTitle.trim()) return;
    
    try {
      const response = await fetch('/api/apps-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          imageUrl: newImageUrl,
          description: newDescription,
          link: newLink,
          category: type
        })
      });

      if (response.ok) {
        const newItem = await response.json();
        if (type === "apps") setApps([...apps, newItem]);
        if (type === "tools") setTools([...tools, newItem]);
        if (type === "other") setOther([...other, newItem]);
        setIsCreating(null);
        setNewTitle("");
        setNewImageUrl("");
        setNewDescription("");
        setNewLink("");
      }
    } catch (error) {
      console.error('Error creating app/tool:', error);
      alert('Failed to create app/tool');
    }
  }

  async function deleteItem(type: "apps" | "tools" | "other", id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/apps-tools/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (type === "apps") setApps(apps.filter(item => item._id !== id));
        if (type === "tools") setTools(tools.filter(item => item._id !== id));
        if (type === "other") setOther(other.filter(item => item._id !== id));
      }
    } catch (error) {
      console.error('Error deleting app/tool:', error);
      alert('Failed to delete app/tool');
    }
  }

  function renderSection(title: string, items: AppToolItem[], type: "apps" | "tools" | "other") {
    return (
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>{title}</span>
            <button type="button" className="btn-primary btn-success btn-small" onClick={() => setIsCreating(type)}>
              + Create {title.slice(0, -1)}
            </button>
          </div>
        </div>
        <div className="panel-body">
          {isCreating === type && (
            <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 16, paddingBottom: 16 }}>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Title</span>
                  <input className="field-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter title" />
                </label>
                <label className="field">
                  <span className="field-label">Image (400 x 300 px recommended)</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="field-input" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="Image URL" style={{ flex: 1 }} />
                    <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Upload</button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setNewImageUrl(URL.createObjectURL(file));
                    }} />
                  </div>
                </label>
              </div>
              <label className="field" style={{ marginTop: 16 }}>
                <span className="field-label">Description</span>
                <textarea className="field-input" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Enter description" />
              </label>
              <label className="field" style={{ marginTop: 16 }}>
                <span className="field-label">Link</span>
                <input className="field-input" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://" />
              </label>
              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button type="button" className="btn-primary btn-success" onClick={() => createItem(type)}>Create</button>
                <button type="button" className="btn-secondary" style={{ color: "#dc2626" }} onClick={() => {
                  setIsCreating(null);
                  setNewTitle("");
                  setNewImageUrl("");
                  setNewDescription("");
                  setNewLink("");
                }}>Cancel</button>
              </div>
            </div>
          )}
          {items.length === 0 ? (
            <div className="panel-empty">No {title.toLowerCase()} yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {items.map((item) => (
                <div key={item._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {item.imageUrl && (
                    <div style={{ width: "100%", height: 180, backgroundImage: `url(${item.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  )}
                  <div style={{ padding: 16 }}>
                    <div className="card-title" style={{ marginBottom: 8 }}>{item.title}</div>
                    <div className="card-description" style={{ marginBottom: 12, fontSize: 13 }}>{item.description}</div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563eb", wordBreak: "break-all" }}>
                        {item.link}
                      </a>
                    )}
                    <div style={{ marginTop: 12 }}>
                      <button type="button" className="btn-ghost btn-danger btn-small" onClick={() => deleteItem(type, item._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      {renderSection("Apps", apps, "apps")}
      {renderSection("Tools", tools, "tools")}
      {renderSection("Other", other, "other")}
    </div>
  );
}
