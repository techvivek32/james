import { useState, useMemo } from "react";
import { Course } from "../../types";
import { LessonAIChat } from "../../components/LessonAIChat";

export function TrainingCenter(props: { courses: Course[] }) {
  const courses = props.courses;
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const filteredCourses = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) {
      return courses;
    }
    return courses.filter((course: Course) => {
      const inTitle = course.title.toLowerCase().includes(term);
      const inLessons = course.lessonNames.some((name) =>
        name.toLowerCase().includes(term)
      );
      const inAssets = course.assetFiles.some((file) =>
        file.toLowerCase().includes(term)
      );
      return inTitle || inLessons || inAssets;
    });
  }, [courses, search]);

  if (selectedCourse) {
    const pages = selectedCourse.pages ?? [];
    const folders = selectedCourse.folders ?? [];
    const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];

    return (
      <div className="training-center">
        <div className="training-center-header">
          <div className="panel-header">{selectedCourse.title}</div>
          <button type="button" className="btn-secondary btn-small" onClick={() => { setSelectedCourse(null); setActivePageId(null); }}>
            Back to Courses
          </button>
        </div>
        <div className="course-pages-layout">
          <div className="course-pages-left">
            <div className="course-pages-sidebar">
              {pages.filter((page) => !page.folderId).map((page) => (
                <div
                  key={page.id}
                  className={activePage?.id === page.id ? "course-pages-item active" : "course-pages-item"}
                  onClick={() => setActivePageId(page.id)}
                >
                  <span className="course-pages-item-title">{page.title}</span>
                </div>
              ))}
              {folders.map((folder) => {
                const folderPages = pages.filter((p) => p.folderId === folder.id);
                const isCollapsed = collapsedFolders.has(folder.id);
                return (
                  <div key={folder.id} className="course-folder-group">
                    <div className="course-folder-item">
                      <button 
                        type="button" 
                        className="course-folder-toggle"
                        onClick={() => {
                          const next = new Set(collapsedFolders);
                          if (isCollapsed) {
                            next.delete(folder.id);
                          } else {
                            next.add(folder.id);
                          }
                          setCollapsedFolders(next);
                        }}
                      >
                        {isCollapsed ? "▸" : "▾"}
                      </button>
                      <span className="course-folder-title">{folder.title}</span>
                    </div>
                    {!isCollapsed && folderPages.map((page) => (
                      <div
                        key={page.id}
                        className={activePage?.id === page.id ? "course-pages-item course-pages-item-child active" : "course-pages-item course-pages-item-child"}
                        onClick={() => setActivePageId(page.id)}
                      >
                        <span className="course-pages-item-title">{page.title}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="course-page-main">
            {activePage && (
              <>
                <div className="course-page-main-header">
                  <h2 className="course-page-title-input" style={{ border: "none", background: "none", padding: 0 }}>{activePage.title}</h2>
                </div>
                <div className="course-page-editor-body">
                  <div
                    className="course-page-body-input"
                    dangerouslySetInnerHTML={{ __html: activePage.body || "" }}
                    style={{
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      whiteSpace: "pre-wrap",
                      minHeight: "auto",
                      maxHeight: "none",
                      overflow: "visible"
                    }}
                  />
                </div>
              </>
            )}
          </div>
          <LessonAIChat lessonTitle={activePage?.title || selectedCourse.title} />
        </div>
      </div>
    );
  }

  return (
    <div className="training-center">
      <div className="training-center-header">
        <div className="panel-header">Training Center</div>
        <div className="training-center-search">
          <input
            className="field-input"
            placeholder="Search trainings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {filteredCourses.length > 0 ? (
        <div className="training-card-grid">
          {filteredCourses.map((course: Course) => (
            <button
              key={course.id}
              type="button"
              className="training-card"
              onClick={() => setSelectedCourse(course)}
              style={{ cursor: "pointer", border: "none", background: "none", padding: 0, textAlign: "left" }}
            >
              <div 
                className="training-card-image"
                style={
                  course.coverImageUrl
                    ? { backgroundImage: `url(${course.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : undefined
                }
              >
                <div className="training-card-image-overlay">
                  {course.tagline && (
                    <span className="training-card-chip">{course.tagline}</span>
                  )}
                </div>
              </div>
              <div className="training-card-body">
                <div className="training-card-title">{course.title}</div>
                <div className="training-card-progress-row">
                  <div className="training-card-progress-label">0%</div>
                  <div className="training-card-progress-track">
                    <div className="training-card-progress-fill" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="panel-empty">No trainings match your search yet.</div>
      )}
    </div>
  );
}
