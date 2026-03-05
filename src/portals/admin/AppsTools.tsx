import { useRef, useState, useEffect } from "react";

type AppToolItem = {
  _id: string;
  title: string;
  imageUrl: string;
  description: string;
  link: string;
  webLink?: string;
  appStoreLink?: string;
  playStoreLink?: string;
  category: 'apps' | 'tools' | 'other';
};

export function AppsToolManagement() {
  const [apps, setApps] = useState<AppToolItem[]>([]);
  const [tools, setTools] = useState<AppToolItem[]>([]);
  const [other, setOther] = useState<AppToolItem[]>([]);
  const [isCreating, setIsCreating] = useState<"apps" | "tools" | "other" | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<AppToolItem | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newWebLink, setNewWebLink] = useState("");
  const [newAppStoreLink, setNewAppStoreLink] = useState("");
  const [newPlayStoreLink, setNewPlayStoreLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleFileUpload(file: File, isEdit: boolean = false) {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (isEdit) {
          setEditingItem(prev => prev ? {...prev, imageUrl: data.url} : null);
        } else {
          setNewImageUrl(data.url);
        }
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
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
          webLink: newWebLink,
          appStoreLink: newAppStoreLink,
          playStoreLink: newPlayStoreLink,
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
        setNewWebLink("");
        setNewAppStoreLink("");
        setNewPlayStoreLink("");
      }
    } catch (error) {
      console.error('Error creating app/tool:', error);
      alert('Failed to create app/tool');
    }
  }

  async function updateItem(type: "apps" | "tools" | "other", id: string) {
    if (!editingItem || !editingItem.title.trim()) return;
    
    try {
      const response = await fetch(`/api/apps-tools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          imageUrl: editingItem.imageUrl,
          description: editingItem.description,
          link: editingItem.link,
          webLink: editingItem.webLink,
          appStoreLink: editingItem.appStoreLink,
          playStoreLink: editingItem.playStoreLink,
          category: editingItem.category
        })
      });

      if (response.ok) {
        const updatedItem = await response.json();
        if (type === "apps") setApps(apps.map(item => item._id === id ? updatedItem : item));
        if (type === "tools") setTools(tools.map(item => item._id === id ? updatedItem : item));
        if (type === "other") setOther(other.map(item => item._id === id ? updatedItem : item));
        setIsEditing(null);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating app/tool:', error);
      alert('Failed to update app/tool');
    }
  }

  function startEdit(item: AppToolItem) {
    setIsEditing(item._id);
    setEditingItem({ ...item });
  }

  function cancelEdit() {
    setIsEditing(null);
    setEditingItem(null);
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
                    <input className="field-input" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="Image" style={{ flex: 1 }} />
                    <button type="button" className="btn-secondary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }} />
                  </div>
                </label>
              </div>
              <label className="field" style={{ marginTop: 16 }}>
                <span className="field-label">Description</span>
                <textarea className="field-input" rows={3} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Enter description" />
              </label>
              {type !== "apps" && (
                <label className="field" style={{ marginTop: 16 }}>
                  <span className="field-label">Web Link</span>
                  <input className="field-input" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://" />
                </label>
              )}
              {type === "apps" && (
                <>
                  <label className="field" style={{ marginTop: 16 }}>
                    <span className="field-label">Web Link</span>
                    <input className="field-input" value={newWebLink} onChange={(e) => setNewWebLink(e.target.value)} placeholder="https://" />
                  </label>
                  <label className="field" style={{ marginTop: 16 }}>
                    <span className="field-label">App Store Link (iOS)</span>
                    <input className="field-input" value={newAppStoreLink} onChange={(e) => setNewAppStoreLink(e.target.value)} placeholder="https://apps.apple.com/..." />
                  </label>
                  <label className="field" style={{ marginTop: 16 }}>
                    <span className="field-label">Play Store Link (Android)</span>
                    <input className="field-input" value={newPlayStoreLink} onChange={(e) => setNewPlayStoreLink(e.target.value)} placeholder="https://play.google.com/..." />
                  </label>
                </>
              )}
              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button type="button" className="btn-primary btn-success" onClick={() => createItem(type)}>Create</button>
                <button type="button" className="btn-secondary" style={{ color: "#dc2626" }} onClick={() => {
                  setIsCreating(null);
                  setNewTitle("");
                  setNewImageUrl("");
                  setNewDescription("");
                  setNewLink("");
                  setNewWebLink("");
                  setNewAppStoreLink("");
                  setNewPlayStoreLink("");
                }}>Cancel</button>
              </div>
            </div>
          )}
          {isEditing && items.some(item => item._id === isEditing) && (
            <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 16, paddingBottom: 16 }}>
              <h4 style={{ marginBottom: 16, color: "#374151" }}>Edit {title.slice(0, -1)}</h4>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Title</span>
                  <input className="field-input" value={editingItem?.title || ''} onChange={(e) => setEditingItem(prev => prev ? {...prev, title: e.target.value} : null)} placeholder="Enter title" />
                </label>
                <label className="field">
                  <span className="field-label">Image (400 x 300 px recommended)</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="field-input" value={editingItem?.imageUrl || ''} onChange={(e) => setEditingItem(prev => prev ? {...prev, imageUrl: e.target.value} : null)} placeholder="Image" style={{ flex: 1 }} />
                    <button type="button" className="btn-secondary" disabled={uploading} onClick={() => editFileInputRef.current?.click()}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <input ref={editFileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, true);
                    }} />
                  </div>
                </label>
              </div>
              <label className="field" style={{ marginTop: 16 }}>
                <span className="field-label">Description</span>
                <textarea className="field-input" rows={3} value={editingItem?.description || ''} onChange={(e) => setEditingItem(prev => prev ? {...prev, description: e.target.value} : null)} placeholder="Enter description" />
              </label>
              {type !== "apps" && (
                <label className="field" style={{ marginTop: 16 }}>
                  <span className="field-label">Web Link</span>
                  <input className="field-input" value={editingItem?.link || ''} onChange={(e) => setEditingItem(prev => prev ? {...prev, link: e.target.value} : null)} placeholder="https://" />
                </label>
              )}
              {type === "apps" && (
                <>
                  <label className="field" style={{ marginTop: 16 }}>
                    <span className="field-label">Web Link</span>
                    <input className="field-input" value={editingItem?.webLink || ''} onChange={(e) => setEditingItem(prev => prev ? {...prev, webLink: e.target.value} : null)} placeholder="https://" />
                  </label>
                  <label className="field" style={{ marginTop: 16 }}>
                    <span className="field-label">App Store Link (iOS)</span>
                    <input className="field-input" value={editingItem?.appStoreLink || ''} onChange={(e) => setEditingItem(prev => prev ? {...prev, appStoreLink: e.target.value} : null)} placeholder="https://apps.apple.com/..." />
                  </label>
                  <label className="field" style={{ marginTop: 16 }}>
                    <span className="field-label">Play Store Link (Android)</span>
                    <input className="field-input" value={editingItem?.playStoreLink || ''} onChange={(e) => setEditingItem(prev => prev ? {...prev, playStoreLink: e.target.value} : null)} placeholder="https://play.google.com/..." />
                  </label>
                </>
              )}
              <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button type="button" className="btn-primary btn-success" onClick={() => {
                  const editingItemInThisSection = items.find(item => item._id === isEditing);
                  if (editingItemInThisSection) updateItem(type, editingItemInThisSection._id);
                }}>Save</button>
                <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
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
                    <div className="card-description" style={{ marginBottom: 12, fontSize: 13 }}>
                      {item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                      {type !== "apps" && item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", padding: "4px 8px", border: "1px solid #2563eb", borderRadius: "4px", display: "inline-block", width: "fit-content" }}>
                          Web Link
                        </a>
                      )}
                      {type === "apps" && item.webLink && (
                        <a href={item.webLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", padding: "4px 8px", border: "1px solid #2563eb", borderRadius: "4px", display: "inline-block", width: "fit-content" }}>
                          Web Link
                        </a>
                      )}
                      {type === "apps" && item.appStoreLink && (
                        <a href={item.appStoreLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", padding: "4px 8px", border: "1px solid #2563eb", borderRadius: "4px", display: "inline-block", width: "fit-content" }}>
                          App Store (iOS)
                        </a>
                      )}
                      {type === "apps" && item.playStoreLink && (
                        <a href={item.playStoreLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", padding: "4px 8px", border: "1px solid #2563eb", borderRadius: "4px", display: "inline-block", width: "fit-content" }}>
                          Play Store (Android)
                        </a>
                      )}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button type="button" className="btn-secondary btn-small" onClick={() => startEdit(item)}>Edit</button>
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
