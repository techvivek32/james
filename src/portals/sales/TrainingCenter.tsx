import { useState, useMemo, useEffect } from "react";
import { Course } from "../../types";
import { LessonAIChat } from "../../components/LessonAIChat";
import { useAuth } from "../../contexts/AuthContext";

export function TrainingCenter(props: { courses: Course[]; isLoading?: boolean }) {
  const { user } = useAuth();
  const courses = props.courses;
  const isLoading = props.isLoading || false;
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [completedPages, setCompletedPages] = useState<Set<string>>(new Set());
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);
  const [savedQuizResults, setSavedQuizResults] = useState<any[]>([]);
  const [courseCompleted, setCourseCompleted] = useState(false);

  useEffect(() => {
    if (selectedCourse && user) {
      fetch(`/api/progress?userId=${user.id}&courseId=${selectedCourse.id}`)
        .then(res => res.json())
        .then(data => {
          setCompletedPages(new Set(data.completedPages || []));
          setSavedQuizResults(data.quizResults || []);
          setCourseCompleted(data.courseCompleted || false);
        })
        .catch(err => console.error("Failed to load progress:", err));
    }
  }, [selectedCourse, user]);

  useEffect(() => {
    if (!activePageId || !selectedCourse) return;
    const pages = selectedCourse.pages ?? [];
    const page = pages.find(p => p.id === activePageId);
    if (!page) return;
    
    const savedResult = savedQuizResults.find(r => r.pageId === page.id);
    if (savedResult) {
      setSelectedAnswers(savedResult.answers);
      setQuizScore(savedResult.score);
      setQuizSubmitted(true);
    } else {
      setQuizSubmitted(false);
      setQuizScore(null);
      setSelectedAnswers({});
    }
  }, [activePageId, savedQuizResults, selectedCourse]);

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

  const [courseProgress, setCourseProgress] = useState<Record<string, { completed: number; total: number; isCompleted: boolean }>>({});

  useEffect(() => {
    if (!user || courses.length === 0) return;
    
    const loadProgress = async () => {
      try {
        // Batch load all progress in one API call
        const courseIds = courses.map(c => c.id).join(',');
        const res = await fetch(`/api/course-progress?userId=${user.id}&courseIds=${courseIds}`);
        
        if (res.ok) {
          const data = await res.json();
          const progressMap: Record<string, { completed: number; total: number; isCompleted: boolean }> = {};
          
          courses.forEach(course => {
            const courseData = data[course.id] || {};
            const totalPages = course.pages?.length || 0;
            const completedPages = courseData.completedPages?.length || 0;
            progressMap[course.id] = { 
              completed: completedPages, 
              total: totalPages,
              isCompleted: courseData.courseCompleted || false
            };
          });
          
          setCourseProgress(progressMap);
        }
      } catch (err) {
        console.error('Failed to load progress:', err);
      }
    };
    
    loadProgress();
  }, [courses, user]);

  if (selectedCourse) {
    const pages = (selectedCourse.pages ?? []).filter(p => p.status === 'published');
    const folders = selectedCourse.folders ?? [];
    const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];

    const isPageUnlocked = (pageId: string) => {
      // All pages are unlocked for sales users - they can access any page
      return true;
    };

    const handleNextPage = () => {
      if (!activePage || !user || !selectedCourse) return;
      const currentIndex = pages.findIndex(p => p.id === activePage.id);
      const newCompleted = new Set([...completedPages, activePage.id]);
      setCompletedPages(newCompleted);
      
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: selectedCourse.id, completedPages: Array.from(newCompleted) })
      }).catch(err => console.error("Failed to save progress:", err));
      
      if (currentIndex < pages.length - 1) {
        setActivePageId(pages[currentIndex + 1].id);
      }
    };

    const handleSubmitQuiz = () => {
      if (!activePage?.quizQuestions || !user || !selectedCourse) return;
      let correct = 0;
      activePage.quizQuestions.forEach(q => {
        if (selectedAnswers[q.id] === q.correctIndex) correct++;
      });
      const score = { correct, total: activePage.quizQuestions.length };
      setQuizScore(score);
      setQuizSubmitted(true);
      
      const newResult = {
        pageId: activePage.id,
        answers: selectedAnswers,
        score,
        submittedAt: new Date()
      };
      const updatedResults = [...savedQuizResults.filter(r => r.pageId !== activePage.id), newResult];
      setSavedQuizResults(updatedResults);
      
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: selectedCourse.id, quizResults: updatedResults })
      }).catch(err => console.error("Failed to save quiz:", err));
    };

    const handleCompleteCourse = () => {
      if (!user || !selectedCourse) return;
      setCourseCompleted(true);
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: selectedCourse.id, courseCompleted: true })
      }).catch(err => console.error("Failed to complete course:", err));
    };

    return (
      <div className="training-center">
        <style>{`
          .training-center [data-video-share],
          .training-center [data-video-delete],
          .training-center [data-image-delete] {
            display: none !important;
          }
        `}</style>
        <div className="training-center-header">
          <div className="panel-header">{selectedCourse.title}</div>
          <button type="button" className="btn-secondary btn-small" onClick={() => { setSelectedCourse(null); setActivePageId(null); }}>
            Back to Courses
          </button>
        </div>
        <div className="course-pages-layout">
          <div className="course-pages-left">
            <div className="course-pages-sidebar">
              {pages.filter((page) => !page.folderId).map((page) => {
                const unlocked = isPageUnlocked(page.id);
                return (
                  <div
                    key={page.id}
                    className={activePage?.id === page.id ? "course-pages-item active" : "course-pages-item"}
                    onClick={() => unlocked && setActivePageId(page.id)}
                    style={{ cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.5 }}
                  >
                    <span className="course-pages-item-title">
                      {!unlocked && "🔒 "}{page.title}
                    </span>
                  </div>
                );
              })}
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
                    {!isCollapsed && folderPages.map((page) => {
                      const unlocked = isPageUnlocked(page.id);
                      return (
                        <div
                          key={page.id}
                          className={activePage?.id === page.id ? "course-pages-item course-pages-item-child active" : "course-pages-item course-pages-item-child"}
                          onClick={() => unlocked && setActivePageId(page.id)}
                          style={{ cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.5 }}
                        >
                          <span className="course-pages-item-title">
                            {!unlocked && "🔒 "}{page.title}
                          </span>
                        </div>
                      );
                    })}
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
                    {quizSubmitted && quizScore && (
                      <div style={{ padding: "16px", marginBottom: "16px", backgroundColor: quizScore.correct === quizScore.total ? "#d1fae5" : "#fef3c7", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                          Score: {quizScore.correct}/{quizScore.total}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {quizScore.correct === quizScore.total ? "Perfect! 🎉" : `You got ${Math.round((quizScore.correct / quizScore.total) * 100)}%`}
                        </div>
                      </div>
                    )}
                    <div style={{ padding: "12px" }}>
                      {activePage.quizQuestions.map((q, qIdx) => (
                        <div key={q.id} style={{ marginBottom: 32 }}>
                          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: 16 }}>Question {qIdx + 1}: {q.prompt}</div>
                          {q.options.map((option, optIdx) => {
                            const isSelected = selectedAnswers[q.id] === optIdx;
                            const isCorrect = q.correctIndex === optIdx;
                            const showResult = quizSubmitted;
                            return (
                              <div
                                key={optIdx}
                                onClick={() => !quizSubmitted && setSelectedAnswers({ ...selectedAnswers, [q.id]: optIdx })}
                                style={{
                                  padding: "12px 16px",
                                  marginBottom: 12,
                                  border: "2px solid",
                                  borderColor: showResult ? (isCorrect ? "#10b981" : isSelected ? "#ef4444" : "#e5e7eb") : (isSelected ? "#3b82f6" : "#e5e7eb"),
                                  borderRadius: 8,
                                  cursor: quizSubmitted ? "default" : "pointer",
                                  backgroundColor: showResult ? (isCorrect ? "#d1fae5" : isSelected ? "#fee2e2" : "#fff") : (isSelected ? "#eff6ff" : "#fff")
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      border: "2px solid",
                                      borderColor: showResult ? (isCorrect ? "#10b981" : isSelected ? "#ef4444" : "#d1d5db") : (isSelected ? "#3b82f6" : "#d1d5db"),
                                      backgroundColor: isSelected ? (showResult ? (isCorrect ? "#10b981" : "#ef4444") : "#3b82f6") : "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#fff" }} />}
                                  </div>
                                  <span style={{ fontSize: 14 }}>{option}</span>
                                  {showResult && isCorrect && <span style={{ marginLeft: "auto", color: "#10b981" }}>✓</span>}
                                </div>
                              </div>
                            );
                          })}
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
                        minHeight: "auto",
                        maxHeight: "none",
                        overflow: "visible"
                      }}
                    />
                    
                    {((activePage.resourceLinks && activePage.resourceLinks.length > 0) || (activePage.fileUrls && activePage.fileUrls.length > 0)) && (
                      <div style={{ marginTop: 24, padding: "16px", backgroundColor: "#f9fafb", borderRadius: 8 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Resources</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {activePage.resourceLinks?.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                backgroundColor: "#fff",
                                borderRadius: 6,
                                textDecoration: "none",
                                color: "#111827",
                                fontSize: 14,
                                border: "1px solid #e5e7eb"
                              }}
                            >
                              <span style={{ fontSize: 18 }}>🔗</span>
                              <span>{link.label}</span>
                            </a>
                          ))}
                          {activePage.fileUrls?.map((fileUrl, idx) => {
                            const file = fileUrl;
                            return (
                              <a
                                key={idx}
                                href={file.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  backgroundColor: "#fff",
                                  borderRadius: 6,
                                  textDecoration: "none",
                                  color: "#111827",
                                  fontSize: 14,
                                  border: "1px solid #e5e7eb"
                                }}
                              >
                                <span style={{ fontSize: 18 }}>📎</span>
                                <span>{file.label}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {courseCompleted && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 600 }}>
                      <span>✓</span>
                      <span>Course Completed!</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
                    {activePage.isQuiz && !quizSubmitted && (
                      <button 
                        type="button" 
                        className="btn-primary" 
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(selectedAnswers).length !== (activePage.quizQuestions?.length || 0)}
                      >
                        Submit Quiz
                      </button>
                    )}
                    {pages.findIndex(p => p.id === activePage.id) === pages.length - 1 && (!activePage.isQuiz || quizSubmitted) && !courseCompleted && (
                      <button type="button" className="btn-primary" onClick={handleCompleteCourse} style={{ backgroundColor: "#10b981" }}>
                        ✓ Complete Course
                      </button>
                    )}
                    {(!activePage.isQuiz || quizSubmitted) && pages.findIndex(p => p.id === activePage.id) < pages.length - 1 && (
                      <button type="button" className="btn-primary" onClick={handleNextPage}>
                        Next Page →
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {activePage && !activePage.isQuiz && <LessonAIChat lessonTitle={activePage.title || selectedCourse.title} lessonContent={activePage.body} videoUrl={activePage.videoUrl} courseTitle={selectedCourse.title} allPages={pages} />}
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
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <div style={{ color: '#6b7280' }}>Loading courses...</div>
          </div>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="training-card-grid">
          {filteredCourses.map((course: Course) => {
            const progress = courseProgress[course.id] || { completed: 0, total: 0, isCompleted: false };
            const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
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
                      <span className="training-card-chip">{course.tagline}</span>
                    )}
                  </div>
                </div>
                <div className="training-card-body">
                  <div className="training-card-title">{course.title}</div>
                  {progress.isCompleted && (
                    <div style={{ color: "#10b981", fontSize: "14px", fontWeight: 600, marginTop: "8px" }}>
                      ✓ Completed
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="panel-empty">No trainings match your search yet.</div>
      )}
    </div>
  );
}
