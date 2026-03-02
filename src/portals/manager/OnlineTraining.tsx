import { useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { AuthenticatedUser, Course } from "../../types";
import { LessonAIChat } from "../../components/LessonAIChat";

export function ManagerOnlineTrainingPage(props: {
  currentUser: AuthenticatedUser;
  courses: Course[];
}) {
  const publishedCourses = props.courses;
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  function getManagerCourseCompletion(course: Course) {
    const userCode =
      (props.currentUser.id.charCodeAt(0) || 0) +
      (props.currentUser.name.charCodeAt(0) || 0);
    const courseCode = course.id.charCodeAt(0) || 0;
    const raw = (userCode * 5 + courseCode * 11) % 101;
    return raw;
  }

  const managerCoursePercentages = publishedCourses.map((course) =>
    getManagerCourseCompletion(course)
  );

  const managerAverageCompletion =
    managerCoursePercentages.length > 0
      ? Math.round(
          managerCoursePercentages.reduce((sum, value) => sum + value, 0) /
            managerCoursePercentages.length
        )
      : 0;

  if (selectedCourse) {
    const pages = selectedCourse.pages ?? [];
    const folders = selectedCourse.folders ?? [];
    const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];

    return (
      <div className="training-center">
        <div className="panel-header">
          <div className="panel-header-row">
            <span>{selectedCourse.title}</span>
            <button type="button" className="btn-secondary btn-small" onClick={() => { setSelectedCourse(null); setActivePageId(null); }}>
              Back to Courses
            </button>
          </div>
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
                {activePage.isQuiz && activePage.quizQuestions && activePage.quizQuestions.length > 0 ? (
                  <div className="course-page-editor-body">
                    <div style={{ padding: "12px" }}>
                      {activePage.quizQuestions.map((q, qIdx) => (
                        <div key={q.id} style={{ marginBottom: 32 }}>
                          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: 16 }}>Question {qIdx + 1}: {q.prompt}</div>
                          {q.options.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: optIdx })}
                              style={{
                                padding: "12px 16px",
                                marginBottom: 12,
                                border: "2px solid",
                                borderColor: selectedAnswers[q.id] === optIdx ? "#3b82f6" : "#e5e7eb",
                                borderRadius: 8,
                                cursor: "pointer",
                                backgroundColor: selectedAnswers[q.id] === optIdx ? "#eff6ff" : "#fff"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    border: "2px solid",
                                    borderColor: selectedAnswers[q.id] === optIdx ? "#3b82f6" : "#d1d5db",
                                    backgroundColor: selectedAnswers[q.id] === optIdx ? "#3b82f6" : "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}
                                >
                                  {selectedAnswers[q.id] === optIdx && <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#fff" }} />}
                                </div>
                                <span style={{ fontSize: 14 }}>{option}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="course-page-editor-body">
                    <div
                      className="course-page-body-input"
                      dangerouslySetInnerHTML={{ __html: activePage.body || "" }}
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        width: "100%",
                        maxWidth: "100%",
                        minHeight: "auto",
                        maxHeight: "none",
                        overflow: "visible"
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {activePage && !activePage.isQuiz && <LessonAIChat lessonTitle={activePage.title || selectedCourse.title} />}
        </div>
      </div>
    );
  }

  return (
    <div className="training-center">
      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <DashboardCard
          title="Your Online Course Completion"
          value={`${managerAverageCompletion}%`}
          description="Across all published courses"
        />
        <DashboardCard
          title="Available Courses"
          value={publishedCourses.length.toString()}
          description="Published online trainings"
        />
      </div>
      {publishedCourses.length === 0 ? (
        <div className="panel" style={{ marginTop: 0 }}>
          <div className="panel-body">
            <div className="panel-empty">
              No published trainings yet. Publish courses to track progress.
            </div>
          </div>
        </div>
      ) : (
        <div className="training-card-grid">
          {publishedCourses.map((course, index) => {
            const pct = managerCoursePercentages[index] ?? 0;
            return (
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
                      <span className="training-card-chip">
                        {course.tagline}
                      </span>
                    )}
                  </div>
                </div>
                <div className="training-card-body">
                  <div className="training-card-title">{course.title}</div>
                  <div className="training-card-progress-row">
                    <div className="training-card-progress-label">
                      {pct}%
                    </div>
                    <div className="training-card-progress-track">
                      <div
                        className="training-card-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
