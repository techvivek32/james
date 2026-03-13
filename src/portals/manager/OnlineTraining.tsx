import { useState, useEffect } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { AuthenticatedUser, Course } from "../../types";
import { LessonAIChat } from "../../components/LessonAIChat";
import { ShareModal } from "../../components/ShareModal";

type Playlist = {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  selectedModules: string[]; // page IDs
  createdAt: string;
};

export function ManagerOnlineTrainingPage(props: {
  currentUser: AuthenticatedUser;
  courses: Course[];
  isLoading?: boolean;
}) {
  const publishedCourses = props.courses;
  const isLoading = props.isLoading || false;
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [completedPages, setCompletedPages] = useState<Set<string>>(new Set());
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);
  const [savedQuizResults, setSavedQuizResults] = useState<any[]>([]);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'playlists'>('courses');
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isEditPlaylistOpen, setIsEditPlaylistOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningPlaylist, setAssigningPlaylist] = useState<Playlist | null>(null);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [selectedSalesUser, setSelectedSalesUser] = useState<string[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<Set<string>>(new Set());
  const [assignModalTab, setAssignModalTab] = useState<'assign' | 'unassign'>('assign');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(280);
  const [isFirstPageVisit, setIsFirstPageVisit] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle lessonId from query parameter (shared lesson)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const lessonId = params.get('lessonId');
      if (lessonId) {
        // Find the course that contains this lesson
        const courseWithLesson = publishedCourses.find(course =>
          course.pages?.some(page => page.id === lessonId)
        );
        if (courseWithLesson) {
          setSelectedCourse(courseWithLesson);
          setActivePageId(lessonId);
        }
      }
    }
  }, [publishedCourses]);

  // Load playlists from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('manager-playlists');
    if (saved) {
      setPlaylists(JSON.parse(saved));
    }
  }, []);

  // Load sales users under this manager
  useEffect(() => {
    if (props.currentUser?.id) {
      console.log('Loading sales users for manager:', props.currentUser.id);
      fetch(`/api/users?role=sales&managerId=${props.currentUser.id}`)
        .then(res => res.json())
        .then(data => {
          console.log('Sales users loaded:', data);
          setSalesUsers(data);
        })
        .catch(err => console.error('Failed to load sales users:', err));
    }
  }, [props.currentUser?.id]);

  // Load already assigned users when modal opens
  useEffect(() => {
    if (isAssignModalOpen && assigningPlaylist) {
      fetch(`/api/playlist-assignments?playlistId=${assigningPlaylist.id}`)
        .then(res => res.json())
        .then(data => {
          const assignedUserIds = new Set<string>(data.map((a: any) => a.assignedToUserId));
          setAssignedUsers(assignedUserIds);
          setSelectedSalesUser(Array.from(assignedUserIds));
        })
        .catch(err => console.error('Failed to load assigned users:', err));
    }
  }, [isAssignModalOpen, assigningPlaylist]);

  useEffect(() => {
    if (selectedCourse && props.currentUser) {
      fetch(`/api/progress?userId=${props.currentUser.id}&courseId=${selectedCourse.id}`)
        .then(res => res.json())
        .then(data => {
          setCompletedPages(new Set(data.completedPages || []));
          setSavedQuizResults(data.quizResults || []);
          setCourseCompleted(data.courseCompleted || false);
        })
        .catch(err => console.error("Failed to load progress:", err));
    }
  }, [selectedCourse, props.currentUser]);

  useEffect(() => {
    if (!activePageId || !selectedCourse) return;
    const pages = (selectedCourse.pages ?? []).filter(p => p.status === 'published');
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

    // Enable autoplay after first page
    if (isFirstPageVisit) {
      setIsFirstPageVisit(false);
    } else {
      // Add autoplay to videos on subsequent pages
      setTimeout(() => {
        const iframes = document.querySelectorAll('.course-page-editor-body iframe');
        iframes.forEach((iframe: any) => {
          const src = iframe.src;
          if (src && (src.includes('youtube.com') || src.includes('vimeo.com'))) {
            const separator = src.includes('?') ? '&' : '?';
            if (!src.includes('autoplay=1')) {
              iframe.src = `${src}${separator}autoplay=1`;
            }
          }
        });
      }, 100);
    }
  }, [activePageId, savedQuizResults, selectedCourse, isFirstPageVisit]);

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

  const [courseProgress, setCourseProgress] = useState<Record<string, { completed: number; total: number; isCompleted: boolean }>>({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      if (publishedCourses.length === 0 || isLoadingProgress) return;
      
      setIsLoadingProgress(true);
      try {
        // Batch load all progress in one API call
        const courseIds = publishedCourses.map(c => c.id).join(',');
        const res = await fetch(`/api/course-progress?userId=${props.currentUser.id}&courseIds=${courseIds}`);
        
        if (res.ok) {
          const data = await res.json();
          const progressMap: Record<string, { completed: number; total: number; isCompleted: boolean }> = {};
          
          publishedCourses.forEach(course => {
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
      } finally {
        setIsLoadingProgress(false);
      }
    };
    
    // Load progress in background without blocking UI
    if (publishedCourses.length > 0) {
      setTimeout(() => loadProgress(), 0);
    }
  }, [publishedCourses, props.currentUser]);

  // Render modals at top level so they work everywhere
  const renderModals = () => (
    <>
      {/* Playlist Creation Modal */}
      {isCreatePlaylistOpen && selectedCourse && (
        <div className="overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999 
        }}>
          <div className="dialog" style={{ 
            maxWidth: 700, 
            backgroundColor: 'white', 
            borderRadius: 8, 
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="dialog-title" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Create Playlist</div>
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
                <span className="field-label">Select Lessons & Quizzes</span>
                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                  {/* Pages without folders */}
                  {((selectedCourse.pages ?? []).filter(p => p.status === 'published' && !p.folderId)).map((page) => (
                    <label key={page.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', cursor: 'pointer', marginLeft: 0 }}>
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
                      <span>{page.title}</span>
                    </label>
                  ))}
                  
                  {/* Folders with their pages */}
                  {(selectedCourse.folders ?? []).map((folder) => {
                    const folderPages = (selectedCourse.pages ?? []).filter(p => p.status === 'published' && p.folderId === folder.id);
                    if (folderPages.length === 0) return null;
                    
                    const allFolderPagesSelected = folderPages.every(p => selectedModules.has(p.id));
                    const someFolderPagesSelected = folderPages.some(p => selectedModules.has(p.id));
                    
                    return (
                      <div key={folder.id} style={{ marginTop: 12 }}>
                        <label style={{ display: 'flex', alignItems: 'center', padding: '8px 0', cursor: 'pointer', fontWeight: 600, backgroundColor: '#f3f4f6', paddingLeft: 8, borderRadius: 4 }}>
                          <input
                            type="checkbox"
                            checked={allFolderPagesSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someFolderPagesSelected && !allFolderPagesSelected;
                            }}
                            onChange={(e) => {
                              const newSet = new Set(selectedModules);
                              if (e.target.checked) {
                                // Select all pages in this folder
                                folderPages.forEach(p => newSet.add(p.id));
                              } else {
                                // Deselect all pages in this folder
                                folderPages.forEach(p => newSet.delete(p.id));
                              }
                              setSelectedModules(newSet);
                            }}
                            style={{ marginRight: 8 }}
                          />
                          <span>📁 {folder.title}</span>
                        </label>
                        <div style={{ marginLeft: 24 }}>
                          {folderPages.map((page) => (
                            <label key={page.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', cursor: 'pointer' }}>
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
                              <span style={{ fontSize: 14 }}>{page.isQuiz ? '📝' : '📄'} {page.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
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
                    localStorage.setItem('manager-playlists', JSON.stringify(updatedPlaylists));
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

      {/* Edit Playlist Modal */}
      {isEditPlaylistOpen && editingPlaylist && selectedCourse && (
        <div className="overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999 
        }}>
          <div className="dialog" style={{ 
            maxWidth: 600, 
            backgroundColor: 'white', 
            borderRadius: 8, 
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="dialog-title" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Edit Playlist</div>
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
                  {((selectedCourse.pages ?? []).filter(p => p.status === 'published')).map((page) => {
                    const folder = page.folderId ? (selectedCourse.folders ?? []).find(f => f.id === page.folderId) : null;
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
                  setIsEditPlaylistOpen(false);
                  setEditingPlaylist(null);
                  setPlaylistName('');
                  setSelectedModules(new Set());
                  setSelectedCourse(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-success"
                onClick={() => {
                  if (playlistName.trim() && selectedModules.size > 0) {
                    const updatedPlaylist: Playlist = {
                      ...editingPlaylist,
                      name: playlistName,
                      selectedModules: Array.from(selectedModules)
                    };
                    const updatedPlaylists = playlists.map(p => 
                      p.id === editingPlaylist.id ? updatedPlaylist : p
                    );
                    setPlaylists(updatedPlaylists);
                    localStorage.setItem('manager-playlists', JSON.stringify(updatedPlaylists));
                    setIsEditPlaylistOpen(false);
                    setEditingPlaylist(null);
                    setPlaylistName('');
                    setSelectedModules(new Set());
                    setSelectedCourse(null);
                    alert('Playlist updated successfully!');
                  }
                }}
                disabled={!playlistName.trim() || selectedModules.size === 0}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Playlist Modal */}
      {isAssignModalOpen && assigningPlaylist && (
        <div className="overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999 
        }}>
          <div className="dialog" style={{ 
            maxWidth: 700, 
            backgroundColor: 'white', 
            borderRadius: 8, 
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="dialog-title" style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
              Manage Playlist Assignments
            </div>
            
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
              <strong>Playlist:</strong> {assigningPlaylist.name}
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Course: {assigningPlaylist.courseName}
              </div>
            </div>

            {/* Tab Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
              <button
                type="button"
                onClick={() => setAssignModalTab('assign')}
                style={{
                  padding: '12px 24px',
                  background: 'none',
                  border: 'none',
                  borderBottom: assignModalTab === 'assign' ? '2px solid #2563eb' : '2px solid transparent',
                  color: assignModalTab === 'assign' ? '#2563eb' : '#6b7280',
                  fontWeight: assignModalTab === 'assign' ? 600 : 400,
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  fontSize: 16
                }}
              >
                Assign Users
              </button>
              <button
                type="button"
                onClick={() => setAssignModalTab('unassign')}
                style={{
                  padding: '12px 24px',
                  background: 'none',
                  border: 'none',
                  borderBottom: assignModalTab === 'unassign' ? '2px solid #2563eb' : '2px solid transparent',
                  color: assignModalTab === 'unassign' ? '#2563eb' : '#6b7280',
                  fontWeight: assignModalTab === 'unassign' ? 600 : 400,
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  fontSize: 16
                }}
              >
                Unassign Users
              </button>
            </div>

            {/* Assign Tab */}
            {assignModalTab === 'assign' && (
              <div style={{ padding: '16px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
                  Available Users
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, minHeight: 300, maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
                  {salesUsers.filter(u => !assignedUsers.has(u.id)).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
                      All users already assigned
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {salesUsers.filter(u => !assignedUsers.has(u.id)).map(user => (
                        <label key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', cursor: 'pointer', backgroundColor: '#f9fafb', borderRadius: 6, gap: 12, border: '1px solid #e5e7eb', transition: 'all 0.2s' }}>
                          <input
                            type="checkbox"
                            checked={selectedSalesUser.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSalesUser([...selectedSalesUser, user.id]);
                              } else {
                                setSelectedSalesUser(selectedSalesUser.filter(id => id !== user.id));
                              }
                            }}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{user.email}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {selectedSalesUser.filter(id => !assignedUsers.has(id)).length > 0 && (
                  <button
                    type="button"
                    className="btn-primary btn-success"
                    onClick={async () => {
                      const usersToAssign = selectedSalesUser.filter(id => !assignedUsers.has(id));
                      if (usersToAssign.length === 0) return;
                      
                      try {
                        for (const userId of usersToAssign) {
                          const selectedUser = salesUsers.find(u => u.id === userId);
                          if (!selectedUser) continue;

                          await fetch('/api/playlist-assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              playlistId: assigningPlaylist.id,
                              playlistName: assigningPlaylist.name,
                              courseId: assigningPlaylist.courseId,
                              courseName: assigningPlaylist.courseName,
                              selectedModules: assigningPlaylist.selectedModules,
                              managerId: props.currentUser.id,
                              managerName: props.currentUser.name,
                              assignedToUserId: selectedUser.id,
                              assignedToUserName: selectedUser.name
                            })
                          });
                        }
                        
                        // Reload assigned users
                        const res = await fetch(`/api/playlist-assignments?playlistId=${assigningPlaylist.id}`);
                        const data = await res.json();
                        const assignedUserIds = new Set<string>(data.map((a: any) => a.assignedToUserId));
                        setAssignedUsers(assignedUserIds);
                        setSelectedSalesUser(Array.from(assignedUserIds));
                        
                        alert(`Assigned to ${usersToAssign.length} user${usersToAssign.length !== 1 ? 's' : ''}!`);
                      } catch (error) {
                        console.error('Error assigning playlist:', error);
                        alert('Failed to assign playlist');
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    Assign ({selectedSalesUser.filter(id => !assignedUsers.has(id)).length})
                  </button>
                )}
              </div>
            )}

            {/* Unassign Tab */}
            {assignModalTab === 'unassign' && (
              <div style={{ padding: '16px 0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
                  Assigned Users
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, minHeight: 300, maxHeight: 400, overflowY: 'auto' }}>
                  {Array.from(assignedUsers).length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
                      No users assigned yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {salesUsers.filter(u => assignedUsers.has(u.id)).map(user => (
                        <div key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#d1fae5', borderRadius: 6, gap: 12, border: '1px solid #86efac', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#065f46' }}>{user.name}</div>
                            <div style={{ fontSize: 12, color: '#047857' }}>{user.email}</div>
                          </div>
                          <button
                            type="button"
                            className="btn-ghost btn-danger btn-small"
                            onClick={async () => {
                              try {
                                // Find and delete the assignment
                                const res = await fetch(`/api/playlist-assignments?playlistId=${assigningPlaylist.id}`);
                                const assignments = await res.json();
                                const assignment = assignments.find((a: any) => a.assignedToUserId === user.id);
                                
                                if (assignment) {
                                  await fetch(`/api/playlist-assignments?id=${assignment._id}`, {
                                    method: 'DELETE'
                                  });
                                  
                                  // Reload assigned users
                                  const updatedRes = await fetch(`/api/playlist-assignments?playlistId=${assigningPlaylist.id}`);
                                  const updatedData = await updatedRes.json();
                                  const assignedUserIds = new Set<string>(updatedData.map((a: any) => a.assignedToUserId));
                                  setAssignedUsers(assignedUserIds);
                                  setSelectedSalesUser(Array.from(assignedUserIds));
                                  
                                  alert(`Unassigned from ${user.name}!`);
                                }
                              } catch (error) {
                                console.error('Error unassigning playlist:', error);
                                alert('Failed to unassign playlist');
                              }
                            }}
                          >
                            Unassign
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="dialog-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssigningPlaylist(null);
                  setSelectedSalesUser([]);
                  setAssignModalTab('assign');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={selectedCourse?.pages?.find(p => p.id === activePageId)?.title || 'Lesson'}
        shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/lesson/${activePageId || ''}`}
        lessonId={activePageId || ''}
      />
    </>
  );

  return (
    <>
      {renderModals()}
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
              setActiveTab('playlists');
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
              borderBottom: activeTab === 'playlists' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'playlists' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'playlists' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              fontSize: 18
            }}
          >
            Playlists
          </button>
        </div>

        {selectedCourse ? (
          <CourseView />
        ) : (
          <TabContent />
        )}
      </div>
    </>
  );

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
      // All pages are unlocked for managers - they can access any page
      return true;
    };

    const handleNextPage = () => {
      if (!activePage || !props.currentUser || !selectedCourse) return;
      const currentIndex = pages.findIndex(p => p.id === activePage.id);
      const newCompleted = new Set([...completedPages, activePage.id]);
      setCompletedPages(newCompleted);
      
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: props.currentUser.id, courseId: selectedCourse.id, completedPages: Array.from(newCompleted) })
      }).catch(err => console.error("Failed to save progress:", err));
      
      if (currentIndex < pages.length - 1) {
        setActivePageId(pages[currentIndex + 1].id);
      }
    };

    const handleSubmitQuiz = () => {
      if (!activePage?.quizQuestions || !props.currentUser || !selectedCourse) return;
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
        body: JSON.stringify({ userId: props.currentUser.id, courseId: selectedCourse.id, quizResults: updatedResults })
      }).catch(err => console.error("Failed to save quiz:", err));
    };

    const handleCompleteCourse = () => {
      if (!props.currentUser || !selectedCourse) return;
      setCourseCompleted(true);
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: props.currentUser.id, courseId: selectedCourse.id, courseCompleted: true })
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
        <div className="panel-header">
          <div className="panel-header-row">
            <span>{selectedCourse.title}</span>
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
                  setActiveTab('playlists');
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
        </div>

        <div className="course-pages-layout">
          {/* Mobile Overlay */}
          {isMobileSidebarOpen && (
            <div 
              className="course-modules-mobile-overlay active"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}
          
          <div className={`course-pages-left ${isMobileSidebarOpen ? 'mobile-open' : ''}`} style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}>
            {/* Mobile Header */}
            <div className="course-modules-mobile-header">
              <h3>Course Modules</h3>
            </div>
            
            {/* Expand/Collapse All Buttons */}
            {folders.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => setCollapsedFolders(new Set())}
                  style={{ flex: 1, fontSize: '12px', padding: '4px 8px' }}
                >
                  Expand All
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => setCollapsedFolders(new Set(folders.map(f => f.id)))}
                  style={{ flex: 1, fontSize: '12px', padding: '4px 8px' }}
                >
                  Collapse All
                </button>
              </div>
            )}
            <div className="course-pages-sidebar">
              {pages.filter((page) => !page.folderId).map((page) => {
                const unlocked = isPageUnlocked(page.id);
                return (
                  <div
                    key={page.id}
                    className={activePage?.id === page.id ? "course-pages-item active" : "course-pages-item"}
                    onClick={() => {
                      if (unlocked) {
                        setActivePageId(page.id);
                        setIsMobileSidebarOpen(false); // Close sidebar on mobile
                      }
                    }}
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
                          onClick={() => {
                            if (unlocked) {
                              setActivePageId(page.id);
                              setIsMobileSidebarOpen(false); // Close sidebar on mobile
                            }
                          }}
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
          
          {/* Mobile Toggle Button */}
          <button
            className="course-modules-mobile-toggle"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label={isMobileSidebarOpen ? "Close course modules" : "Open course modules"}
          >
            {isMobileSidebarOpen ? '×' : '☰'}
          </button>
          
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
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', marginTop: '-8px' }}>
                  <button
                    type="button"
                    className="btn-primary btn-small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Share button clicked! Current state:', isShareModalOpen);
                      setIsShareModalOpen(true);
                      console.log('After setState - should be true');
                    }}
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
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        width: "100%",
                        maxWidth: "100%",
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
          {/* Temporarily hidden - Coming Soon */}
          {/* {activePage && !activePage.isQuiz && <LessonAIChat lessonTitle={activePage.title || selectedCourse.title} lessonContent={activePage.body} videoUrl={activePage.videoUrl} courseTitle={selectedCourse.title} allPages={pages} />} */}
        </div>
      </>
    );
  }

  return (
    <>
      {renderModals()}
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
              setActiveTab('playlists');
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
              borderBottom: activeTab === 'playlists' ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === 'playlists' ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === 'playlists' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              fontSize: 18
            }}
          >
            Playlists
          </button>
        </div>

        {selectedCourse ? (
          <CourseView />
        ) : (
          <TabContent />
        )}
      </div>
    </>
  );

  function TabContent() {
    if (activeTab === 'courses') {
      return (
        <>
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
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <div style={{ color: '#6b7280' }}>Loading courses...</div>
              </div>
            </div>
          ) : publishedCourses.length === 0 ? (
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
                          <span className="training-card-chip">
                            {course.tagline}
                          </span>
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
          )}
        </>
      );
    }

    if (activeTab === 'playlists') {
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
              <div style={{ display: 'grid', gap: 16 }} className="playlist-grid">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="card playlist-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }} className="playlist-card-content">
                      <div style={{ flex: 1 }} className="playlist-card-info">
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#111827' }} className="playlist-card-title">
                          {playlist.name}
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                          Course: {playlist.courseName}
                        </div>
                        <div style={{ fontSize: 14, color: '#6b7280' }}>
                          {playlist.selectedModules.length} module{playlist.selectedModules.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }} className="playlist-card-actions">
                        <button
                          type="button"
                          className="btn-primary playlist-action-btn"
                          onClick={() => {
                            const course = publishedCourses.find(c => c.id === playlist.courseId);
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
                          className="btn-secondary playlist-action-btn"
                          onClick={() => {
                            const course = publishedCourses.find(c => c.id === playlist.courseId);
                            if (course) {
                              setEditingPlaylist(playlist);
                              setPlaylistName(playlist.name);
                              setSelectedModules(new Set(playlist.selectedModules));
                              setSelectedCourse(course);
                              setIsEditPlaylistOpen(true);
                            }
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary playlist-action-btn"
                          onClick={() => {
                            setAssigningPlaylist(playlist);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-danger playlist-action-btn"
                          onClick={() => {
                            if (confirm('Delete this playlist?')) {
                              const updated = playlists.filter(p => p.id !== playlist.id);
                              setPlaylists(updated);
                              localStorage.setItem('manager-playlists', JSON.stringify(updated));
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

    return null;
  }
}
