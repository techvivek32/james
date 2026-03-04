import { useState, useEffect } from "react";

type Material = {
  _id: string;
  courseId: string;
  courseName: string;
  pageId: string;
  pageName: string;
  type: 'image' | 'video' | 'url';
  url: string;
  title?: string;
  description?: string;
};

type GroupedMaterials = {
  [courseId: string]: {
    courseName: string;
    pages: {
      [pageId: string]: {
        pageName: string;
        materials: Material[];
      };
    };
  };
};

export function MarketingMaterialsViewer() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    try {
      const response = await fetch('/api/marketing-materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Error fetching marketing materials:', error);
    } finally {
      setLoading(false);
    }
  }

  const groupedMaterials: GroupedMaterials = materials.reduce((acc, material) => {
    if (!acc[material.courseId]) {
      acc[material.courseId] = {
        courseName: material.courseName,
        pages: {}
      };
    }
    if (!acc[material.courseId].pages[material.pageId]) {
      acc[material.courseId].pages[material.pageId] = {
        pageName: material.pageName,
        materials: []
      };
    }
    acc[material.courseId].pages[material.pageId].materials.push(material);
    return acc;
  }, {} as GroupedMaterials);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>;
  }

  // Show course list
  if (!selectedCourseId) {
    const courses = Object.entries(groupedMaterials);
    
    if (courses.length === 0) {
      return (
        <div className="panel">
          <div className="panel-body">
            <div className="panel-empty">No marketing materials available yet.</div>
          </div>
        </div>
      );
    }

    return (
      <div className="panel">
        <div className="panel-header">
          <span>Courses</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {courses.map(([courseId, course]) => {
              const pageCount = Object.keys(course.pages).length;
              const materialCount = Object.values(course.pages).reduce((sum, page) => sum + page.materials.length, 0);
              
              return (
                <div key={courseId} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedCourseId(courseId)}>
                  <div className="card-title">{course.courseName}</div>
                  <div className="card-description" style={{ marginTop: 8, fontSize: 13 }}>
                    {pageCount} page{pageCount !== 1 ? 's' : ''} • {materialCount} material{materialCount !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show page list for selected course
  if (selectedCourseId && !selectedPageId) {
    const course = groupedMaterials[selectedCourseId];
    const pages = Object.entries(course.pages);

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <button type="button" className="btn-secondary" onClick={() => setSelectedCourseId(null)}>
            ← Back to Courses
          </button>
        </div>
        <div className="panel">
          <div className="panel-header">
            <span>{course.courseName} - Pages</span>
          </div>
          <div className="panel-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {pages.map(([pageId, page]) => (
                <div key={pageId} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedPageId(pageId)}>
                  <div className="card-title">{page.pageName}</div>
                  <div className="card-description" style={{ marginTop: 8, fontSize: 13 }}>
                    {page.materials.length} material{page.materials.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show materials for selected page
  if (selectedCourseId && selectedPageId) {
    const course = groupedMaterials[selectedCourseId];
    const page = course.pages[selectedPageId];

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <button type="button" className="btn-secondary" onClick={() => setSelectedPageId(null)}>
            ← Back to Pages
          </button>
        </div>
        <div className="panel">
          <div className="panel-header">
            <span>{course.courseName} - {page.pageName}</span>
          </div>
          <div className="panel-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {page.materials.map((material) => (
                <div key={material._id} className="card">
                  {material.type === 'image' && (
                    <div style={{ width: "100%", height: 180, backgroundImage: `url(${material.url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  )}
                  {material.type === 'video' && (
                    <div style={{ width: "100%", height: 180, backgroundColor: "#000" }}>
                      <video src={material.url} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, padding: '2px 8px', backgroundColor: '#e5e7eb', borderRadius: 4 }}>
                        {material.type.toUpperCase()}
                      </span>
                    </div>
                    {material.title && <div className="card-title" style={{ marginBottom: 8 }}>{material.title}</div>}
                    {material.description && <div className="card-description" style={{ marginBottom: 12, fontSize: 13 }}>{material.description}</div>}
                    <a href={material.url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-small" style={{ display: 'inline-block', textDecoration: 'none' }}>
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
