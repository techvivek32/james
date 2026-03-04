import { useState, useEffect } from "react";

type AppToolItem = {
  _id: string;
  title: string;
  imageUrl: string;
  description: string;
  link: string;
  category: 'apps' | 'tools' | 'other';
};

export function AppsToolsViewer() {
  const [apps, setApps] = useState<AppToolItem[]>([]);
  const [tools, setTools] = useState<AppToolItem[]>([]);
  const [other, setOther] = useState<AppToolItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  function renderSection(title: string, items: AppToolItem[]) {
    if (items.length === 0) return null;

    return (
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <span>{title}</span>
        </div>
        <div className="panel-body">
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
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="btn-primary btn-small" style={{ display: 'inline-block', textDecoration: 'none' }}>
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>;
  }

  if (apps.length === 0 && tools.length === 0 && other.length === 0) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="panel-empty">No apps or tools available yet.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderSection("Apps", apps)}
      {renderSection("Tools", tools)}
      {renderSection("Other", other)}
    </div>
  );
}
