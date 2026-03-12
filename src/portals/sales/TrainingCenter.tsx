import { useState, useMemo, useEffect } from "react";
import { Course } from "../../types";
import { LessonAIChat } from "../../components/LessonAIChat";
import { useAuth } from "../../contexts/AuthContext";
import { ShareModal } from "../../components/ShareModal";

type Playlist = {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  selectedModules: string[];
  createdAt: string;
};

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
  const [activeTab, setActiveTab] = useState<'courses' | 'myPlaylists' | 'assignedPlaylists'>('courses');
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);
  const [assignedPlaylists, setAssignedPlaylists] = useState<any[]>([]);
  const [unreadAssignedCount, setUnreadAssignedCount] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(280);

  // Handle lessonId from query parameter (shared lesson)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lessonId = params.get('lessonId');
      if (lessonId) {
        // Find the course that contains this lesson
        const courseWithLesson = courses.find(course =>
          course.pages?.some(page => page.id === lessonId)
        );
        if (courseWithLesson) {
          setSelectedCourse(courseWithLesson);
          setActivePageId(lessonId);
        }
      }
    }
  }, [courses]);
  // Load playlists from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sales-playlists');
    if (saved) {
      setPlaylists(JSON.parse(saved));
    }
  }, []);

  // Load assigned playlists from API
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/playlist-assignments?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setAssignedPlaylists(data);
          // Set unread count from localStorage
          const viewed = localStorage.getItem(`assigned-playlists-viewed-${user.id}`);
          if (!viewed) {
            setUnreadAssignedCount(data.length);
          }
        })
        .catch(err => console.error('Failed to load assigned playlists:', err));
    }
  }, [user?.id]);

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

  // Resizer functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startX;
      const newWidth = startWidth + delta;
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, startX, startWidth]);

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
  return (
    <div className="training-center">
      {/* Always show tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid #e5e7eb' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('courses');
            if (selectedCourse) {
              setSelectedCourse(null);
              setActivePageId(null);
              setViewingPlaylist(null);
            }
          }}
          style={{
            padding: '16px 32px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'courses' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'courses' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'courses' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px',
            fontSize: 18
          }}
        >
          Courses
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('myPlaylists');
            if (selectedCourse) {
              setSelectedCourse(null);
              setActivePageId(null);
              setViewingPlaylist(null);
            }
          }}
          style={{
            padding: '16px 32px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'myPlaylists' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'myPlaylists' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'myPlaylists' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px',
            fontSize: 18
          }}
        >
          My Playlists
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('assignedPlaylists');
            if (selectedCourse) {
              setSelectedCourse(null);
              setActivePageId(null);
              setViewingPlaylist(null);
            }
            // Mark as viewed
            if (user?.id) {
              localStorage.setItem(`assigned-playlists-viewed-${user.id}`, 'true');
              setUnreadAssignedCount(0);
            }
          }}
          style={{
            padding: '16px 32px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'assignedPlaylists' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'assignedPlaylists' ? '#2563eb' : '#6b7280',
            fontWeight: activeTab === 'assignedPlaylists' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px',
            fontSize: 18,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          Assigned Playlists
          {unreadAssignedCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600
            }}>
              {unreadAssignedCount}
            </span>
          )}
        </button>
      </div>
      {selectedCourse ? (
        <CourseView />
      ) : (
        <TabContent />
      )}
    </div>
  );

  function TabContent() {
    if (activeTab === 'courses') {
      return (
        <>
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
        </>
      );
    }
    if (activeTab === 'myPlaylists') {
      return (
        <div className="panel">
          <div className="panel-header">
            <span>My Playlists</span>
          </div>
          <div className="panel-body">
            {playlists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  No Playlists Yet
                </h3>
                <p>Create a playlist by clicking "Make Playlist" when viewing a course</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
                          {playlist.name}
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                          Course: {playlist.courseName}
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>
                          {playlist.selectedModules.length} module{playlist.selectedModules.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '14px 28px', fontSize: 17, fontWeight: 600 }}
                          onClick={() => {
                            const course = courses.find(c => c.id === playlist.courseId);
                            if (course) {
                              setViewingPlaylist(playlist);
                              setSelectedCourse(course);
                            }
                          }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-danger"
                          style={{ padding: '14px 28px', fontSize: 17, fontWeight: 600 }}
                          onClick={() => {
                            if (confirm('Delete this playlist?')) {
                              const updated = playlists.filter(p => p.id !== playlist.id);
                              setPlaylists(updated);
                              localStorage.setItem('sales-playlists', JSON.stringify(updated));
                            }
                          }}
                        >
                          Delete
                        </button>
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
    if (activeTab === 'assignedPlaylists') {
      return (
        <div className="panel">
          <div className="panel-header">
            <span>Assigned Playlists</span>
          </div>
          <div className="panel-body">
            {assignedPlaylists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  No Assigned Playlists
                </h3>
                <p>Your manager hasn't assigned any playlists yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {assignedPlaylists.map((assignment) => (
                  <div key={assignment._id} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }}>
                          {assignment.playlistName}
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                          Course: {assignment.courseName}
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                          {assignment.selectedModules.length} module{assignment.selectedModules.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                          Assigned by: {assignment.managerName}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '14px 28px', fontSize: 17, fontWeight: 600 }}
                          onClick={() => {
                            const course = courses.find(c => c.id === assignment.courseId);
                            if (course) {
                              const playlist = {
                                id: assignment.playlistId,
                                name: assignment.playlistName,
                                courseId: assignment.courseId,
                                courseName: assignment.courseName,
                                selectedModules: assignment.selectedModules,
                                createdAt: assignment.createdAt
                              };
                              setViewingPlaylist(playlist);
                              setSelectedCourse(course);
                            }
                          }}
                        >
                          View
                        </button>
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

    return null;
  }
  function CourseView() {
    if (!selectedCourse) return null;
    
    let pages = (selectedCourse.pages ?? []).filter(p => p.status === 'published');
    
    // If viewing a playlist, filter to show only selected modules
    if (viewingPlaylist) {
      pages = pages.filter(p => viewingPlaylist.selectedModules.includes(p.id));
    }
    
    let folders = selectedCourse.folders ?? [];
    
    // If viewing a playlist, filter folders to show only those with selected pages
    if (viewingPlaylist) {
      const selectedPageIds = new Set(viewingPlaylist.selectedModules);
      folders = folders.filter(folder => 
        pages.some(page => page.folderId === folder.id && selectedPageIds.has(page.id))
      );
    }
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
      <>
        <style>{`
          .training-center [data-video-share],
          .training-center [data-video-delete],
          .training-center [data-image-delete] {
            display: none !important;
          }
        `}</style>
        <div className="training-center-header">
          <div className="panel-header">{selectedCourse.title}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!viewingPlaylist && (
              <button type="button" className="btn-primary btn-small" onClick={() => setIsCreatePlaylistOpen(true)}>
                Make Playlist
              </button>
            )}
            <button 
              type="button" 
              className="btn-secondary btn-small" 
              onClick={() => { 
                setSelectedCourse(null); 
                setActivePageId(null);
                setViewingPlaylist(null);
                setActiveTab('myPlaylists');
              }}
            >
              View Playlists
            </button>
            <button type="button" className="btn-secondary btn-small" onClick={() => { 
              setSelectedCourse(null); 
              setActivePageId(null);
              setViewingPlaylist(null);
            }}>
              Back to Courses
            </button>
          </div>
        </div>

        {/* Playlist Creation Modal */}
        {isCreatePlaylistOpen && (
          <div className="overlay">
            <div className="dialog" style={{ maxWidth: 600 }}>
              <div className="dialog-title">Create Playlist</div>
              <div style={{ padding: '16px 0' }}>
                <label className="field" style={{ marginBottom: 16 }}>
                  <span className="field-label">Playlist Name</span>
                  <input
                    className="field-input"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Enter playlist name"
                  />
                </label>
                <div className="field">
                  <span className="field-label">Select Modules</span>
                  <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                    {pages.map((page) => {
                      const folder = page.folderId ? folders.find(f => f.id === page.folderId) : null;
                      const folderName = folder?.title || '';
                      const displayName = folderName ? `${page.title} (${folderName})` : page.title;
                      return (
                        <label key={page.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedModules.has(page.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedModules);
                              if (e.target.checked) {
                                newSet.add(page.id);
                              } else {
                                newSet.delete(page.id);
                              }
                              setSelectedModules(newSet);
                            }}
                            style={{ marginRight: 8 }}
                          />
                          <span>{displayName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsCreatePlaylistOpen(false);
                    setPlaylistName('');
                    setSelectedModules(new Set());
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary btn-success"
                  onClick={() => {
                    if (playlistName.trim() && selectedModules.size > 0) {
                      const newPlaylist: Playlist = {
                        id: Date.now().toString(),
                        name: playlistName,
                        courseId: selectedCourse.id,
                        courseName: selectedCourse.title,
                        selectedModules: Array.from(selectedModules),
                        createdAt: new Date().toISOString()
                      };
                      const updatedPlaylists = [...playlists, newPlaylist];
                      setPlaylists(updatedPlaylists);
                      localStorage.setItem('sales-playlists', JSON.stringify(updatedPlaylists));
                      setIsCreatePlaylistOpen(false);
                      setPlaylistName('');
                      setSelectedModules(new Set());
                      alert('Playlist created successfully!');
                    }
                  }}
                  disabled={!playlistName.trim() || selectedModules.size === 0}
                >
                  Create Playlist
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Share Modal */}
        {activePage && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            title={activePage.title}
            shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/lesson/${activePage.id}`}
          />
        )}

        <div className="course-pages-layout">
          <div className="course-pages-left" style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}>
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
          {/* Resizer */}
          <div 
            className="course-pages-resizer"
            onMouseDown={(e) => {
              setStartX(e.clientX);
              setStartWidth(sidebarWidth);
              setIsResizing(true);
            }}
            style={{
              width: '4px',
              cursor: 'ew-resize',
              backgroundColor: isResizing ? '#3b82f6' : '#e5e7eb',
              transition: isResizing ? 'none' : 'background-color 0.2s',
              flexShrink: 0,
              position: 'relative',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              if (!isResizing) e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
          />
          <div className="course-page-main">
            {activePage && (
              <>
                <div className="course-page-main-header">
                  <h2 className="course-page-title-input" style={{ border: "none", background: "none", padding: 0 }}>{activePage.title}</h2>
                  <button
                    type="button"
                    className="btn-primary btn-small"
                    onClick={() => setIsShareModalOpen(true)}
                    style={{ marginLeft: 'auto' }}
                  >
                    Share
                  </button>
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
        </div>
      </>
    );
  }
}