import { useState, useEffect } from "react";
import Link from "next/link";

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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
            {items.map((item) => (
              <Link key={item._id} href={`/sales/apps-tools/${item._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ padding: 0, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s", height: "100%" }}>
                  <div style={{ 
                    width: "100%", 
                    height: 280, 
                    backgroundImage: item.imageUrl && !item.imageUrl.startsWith('blob:') ? `url(${item.imageUrl})` : 'none',
                    backgroundColor: '#f3f4f6',
                    backgroundSize: "cover", 
                    backgroundPosition: "center",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: 14
                  }}>
                    {(!item.imageUrl || item.imageUrl.startsWith('blob:')) && 'No Image'}
                  </div>
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <div className="card-title" style={{ marginBottom: 0, fontSize: 18, fontWeight: 600 }}>{item.title}</div>
                  </div>
                </div>
              </Link>
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
