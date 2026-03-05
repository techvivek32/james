import { useRef, useState, useEffect } from "react";
import { Course, CoursePage, CourseFolder } from "../../types";

type CourseEditorProps = {
  courses: Course[];
  onCoursesChange: (courses: Course[]) => void;
};

export function CourseManagement(props: CourseEditorProps) {
  const [selectedCourseId, setSelectedCourseId] = useState(props.courses[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [detailSection, setDetailSection] = useState<"overview" | "pages">("overview");
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [openPageMenuId, setOpenPageMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPublished, setNewFolderPublished] = useState(true);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkLabelDraft, setLinkLabelDraft] = useState("");
  const [linkUrlDraft, setLinkUrlDraft] = useState("");
  const [isResourceFileModalOpen, setIsResourceFileModalOpen] = useState(false);
  const [resourceFileUrlDraft, setResourceFileUrlDraft] = useState("");
  const [resourceFileLabelDraft, setResourceFileLabelDraft] = useState("");
  const [isPinPostModalOpen, setIsPinPostModalOpen] = useState(false);
  const [pinPostUrlDraft, setPinPostUrlDraft] = useState("");
  const resourceFileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyInputRef = useRef<HTMLDivElement | null>(null);
  const [lastPageId, setLastPageId] = useState<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [originalCourse, setOriginalCourse] = useState<Course | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const visibleCourses = props.courses;

  const selectedCourse = props.courses.find((course) => course.id === selectedCourseId);

  // Track changes when course is selected
  useEffect(() => {
    if (selectedCourse && viewMode === "detail") {
      setOriginalCourse(JSON.parse(JSON.stringify(selectedCourse)));
      setHasChanges(false);
    }
  }, [selectedCourseId, viewMode]);

  // Check for changes
  useEffect(() => {
    if (originalCourse && selectedCourse) {
      const hasChanged = JSON.stringify(originalCourse) !== JSON.stringify(selectedCourse);
      setHasChanges(hasChanged);
    }
  }, [selectedCourse, originalCourse]);

  useEffect(() => {
    if (bodyInputRef.current && activePageId) {
      const course = props.courses.find((c) => c.id === selectedCourseId);
      const page = course?.pages?.find((p) => p.id === activePageId);
      if (page && bodyInputRef.current.innerHTML !== page.body) {
        console.log('[CourseManagement] Loading page body:', {
          pageId: page.id,
          pageTitle: page.title,
          bodyLength: page.body?.length || 0,
          bodyPreview: page.body?.substring(0, 200)
        });
        bodyInputRef.current.innerHTML = page.body || "";
      }
    }
  }, [activePageId, selectedCourseId, props.courses]);

  function updateCourse(updated: Course) {
    const next = props.courses.map((course) => (course.id === updated.id ? updated : course));
    props.onCoursesChange(next);
  }

  function saveCourse() {
    if (selectedCourse && hasChanges) {
      // Save logic here - course is already updated in props.courses
      setOriginalCourse(JSON.parse(JSON.stringify(selectedCourse)));
      setHasChanges(false);
      console.log('Course saved:', selectedCourse.title);
    }
    setViewMode("grid");
  }

  function cancelChanges() {
    if (originalCourse && hasChanges) {
      // Revert to original course
      const next = props.courses.map((course) => 
        course.id === originalCourse.id ? originalCourse : course
      );
      props.onCoursesChange(next);
      setHasChanges(false);
    }
    setViewMode("grid");
  }

  function createCourse() {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title: "New Course",
      tagline: "",
      description: "",
      lessonNames: [],
      assetFiles: [],
      marketingDocs: [],
      icon: "📘",
      difficultyLabel: "Medium",
      timeLabel: "Medium",
      difficultyScore: 50,
      timeScore: 50,
      riskScore: 0,
      capitalScore: 0,
      personalityScore: 50,
      quizQuestions: [],
      links: [],
      status: "draft",
      coverImageUrl: "",
      accessMode: "open",
      pages: [
        {
          id: `page-${Date.now()}`,
          title: "New page",
          status: "draft",
          body: "",
          videoUrl: "",
          resourceLinks: [],
          fileUrls: []
        }
      ]
    };

    const next = [...props.courses, newCourse];
    props.onCoursesChange(next);
    setSelectedCourseId(newCourse.id);
    setViewMode("detail");
    setDetailSection("overview");
  }

  function deleteCourse(id: string) {
    const next = props.courses.filter((course) => course.id !== id);
    props.onCoursesChange(next);
    if (!next.length) {
      setSelectedCourseId("");
      return;
    }
    if (selectedCourseId === id) {
      setSelectedCourseId(next[0].id);
    }
  }

  function addPageForCourse(course: Course, folderId?: string, isQuiz?: boolean) {
    const pages = course.pages ?? [];
    const newPage: CoursePage = {
      id: `page-${Date.now()}`,
      title: isQuiz ? "New quiz" : "New page",
      status: "draft",
      body: "",
      folderId,
      videoUrl: "",
      resourceLinks: [],
      fileUrls: [],
      isQuiz: isQuiz || false,
      quizQuestions: isQuiz ? [{ id: `q-${Date.now()}`, prompt: "", options: ["", "", "", ""], correctIndex: 0 }] : []
    };
    const nextCourse: Course = {
      ...course,
      pages: [...pages, newPage]
    };
    console.log("Adding page to course:", { courseId: course.id, newPage, totalPages: nextCourse.pages?.length || 0 });
    updateCourse(nextCourse);
    setDetailSection("pages");
    setActivePageId(newPage.id);
    setOpenPageMenuId(null);
    setIsCourseMenuOpen(false);
  }

  function addFolderForCourse(course: Course) {
    const folders: CourseFolder[] = course.folders ?? [];
    const status: CourseFolder["status"] = newFolderPublished ? "published" : "draft";

    if (editingFolderId) {
      const nextFolders = folders.map((folder) =>
        folder.id === editingFolderId
          ? { ...folder, title: newFolderName.trim() || "Untitled folder", status }
          : folder
      );
      const nextCourse: Course = { ...course, folders: nextFolders };
      updateCourse(nextCourse);
    } else {
      const newFolder: CourseFolder = { id: `folder-${Date.now()}`, title: newFolderName.trim() || "Untitled folder", status };
      const nextCourse: Course = { ...course, folders: [...folders, newFolder] };
      updateCourse(nextCourse);
    }

    setIsFolderModalOpen(false);
    setNewFolderName("");
    setNewFolderPublished(true);
    setEditingFolderId(null);
  }

  if (viewMode === "grid") {
    return (
      <div className="admin-course-grid-page">
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Courses</span>
          </div>
        </div>
        <div className="panel-body">
          {props.courses.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "40px" }}>
              <div className="panel-empty">No courses yet.</div>
              <button type="button" className="admin-course-card-new" onClick={() => { createCourse(); }}>
                <div className="admin-course-card-new-icon">+</div>
                <div>New course</div>
              </button>
            </div>
          ) : (
            <>
              <div className="training-card-grid">
                {visibleCourses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    className="training-card admin-course-card"
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setViewMode("detail");
                      setDetailSection("overview");
                    }}
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
                        {course.tagline && <span className="training-card-chip">{course.tagline}</span>}
                      </div>
                    </div>
                    <div className="training-card-body">
                      <div className="training-card-title">{course.title}{course.status === "draft" ? " (Draft)" : ""}</div>
                      <div className="training-card-progress-row">
                        <div className="training-card-progress-label">0%</div>
                        <div className="training-card-progress-track">
                          <div className="training-card-progress-fill" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                <button type="button" className="admin-course-card-new" onClick={() => { createCourse(); }}>
                  <div className="admin-course-card-new-icon">+</div>
                  <div>New course</div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-course-management">
      {isFolderModalOpen && selectedCourse && (
        <div className="overlay">
          <div className="dialog">
            <div className="dialog-title">{editingFolderId ? "Edit folder" : "Add folder"}</div>
            <label className="field">
              <span className="field-label">Name</span>
              <input className="field-input" value={newFolderName} maxLength={50} onChange={(event) => setNewFolderName(event.target.value)} />
              <div className="field-helper">{newFolderName.length} / 50</div>
            </label>
            <div className="dialog-footer">
              <button
                type="button"
                className={newFolderPublished ? "status-toggle status-toggle-on dialog-publish-toggle" : "status-toggle dialog-publish-toggle"}
                onClick={() => setNewFolderPublished(!newFolderPublished)}
              >
                <span className={newFolderPublished ? "status-toggle-label status-toggle-label-on" : "status-toggle-label"}>Published</span>
                <span className="status-toggle-track">
                  <span className="status-toggle-thumb" />
                </span>
              </button>
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn-secondary btn-cancel"
                  onClick={() => {
                    setIsFolderModalOpen(false);
                    setNewFolderName("");
                    setNewFolderPublished(true);
                    setEditingFolderId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="btn-primary btn-success" disabled={!newFolderName.trim()} onClick={() => addFolderForCourse(selectedCourse)}>
                  {editingFolderId ? "Save" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isImageModalOpen && selectedCourse && (() => {
        const course = selectedCourse as Course;
        const pages = course.pages ?? [];
        const activePage =
          (activePageId ? pages.find((page) => page.id === activePageId) : undefined) ??
          (pages.length > 0 ? pages[pages.length - 1] : undefined) ??
          undefined;
        if (!activePage) {
          return null;
        }
        const pageForImage = activePage as CoursePage;
        function handleAddImage() {
          const trimmed = imageUrlDraft.trim();
          if (!trimmed) {
            return;
          }
          
          const imageHtml = `<div contenteditable="false" style="margin: 16px 0;"><img src="${trimmed}" style="max-width: 100%; height: auto; border-radius: 8px;"></div>`;
          
          if (bodyInputRef.current && imageHtml) {
            bodyInputRef.current.focus();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = imageHtml + '<p><br></p>';
              const imageNode = tempDiv.firstChild!;
              const lineBreak = tempDiv.lastChild!;
              range.insertNode(lineBreak);
              range.insertNode(imageNode);
              
              const newRange = document.createRange();
              newRange.setStartAfter(lineBreak);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else {
              bodyInputRef.current.innerHTML += imageHtml + '<p><br></p>';
            }
            
            // Wait longer to ensure DOM is updated
            setTimeout(() => {
              if (bodyInputRef.current) {
                const nextBody = bodyInputRef.current.innerHTML;
                console.log('[Image] Saving body:', {
                  bodyLength: nextBody.length,
                  hasImage: nextBody.includes('<img'),
                  imageUrl: trimmed,
                  bodyPreview: nextBody.substring(0, 200)
                });
                // ALSO save to fileUrls array for marketing materials sync
                const existingFiles = pageForImage.fileUrls || [];
                const nextPages = pages.map((page) => 
                  page.id === pageForImage.id 
                    ? { ...page, body: nextBody, fileUrls: [...existingFiles, trimmed] } 
                    : page
                );
                updateCourse({ ...(course as Course), pages: nextPages });
              }
            }, 100); // Increased timeout
          }
          
          setIsImageModalOpen(false);
          setImageUrlDraft("");
        }
        return (
          <div className="overlay">
            <div className="dialog">
              <div className="dialog-title">Add an image</div>
              <label className="field">
                <span className="field-label">Image URL</span>
                <input className="field-input" value={imageUrlDraft} onChange={(event) => setImageUrlDraft(event.target.value)} placeholder="https://" />
              </label>
              <div className="video-dropzone" onClick={() => imageFileInputRef.current?.click()}>
                <div className="video-dropzone-icon">⬆</div>
                <div className="video-dropzone-text-main">Drag and drop image here</div>
                <div className="video-dropzone-text-sub">or select file</div>
              </div>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  
                  // Upload to server instead of base64
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  try {
                    const response = await fetch('/api/upload-image', {
                      method: 'POST',
                      body: formData
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      setImageUrlDraft(data.url); // This will be /uploads/filename.jpg
                    } else {
                      alert('Failed to upload image');
                    }
                  } catch (error) {
                    console.error('Upload error:', error);
                    alert('Failed to upload image');
                  }
                }}
              />
              <div className="dialog-footer">
                <div />
                <div className="dialog-actions">
                  <button type="button" className="btn-secondary btn-cancel" onClick={() => setIsImageModalOpen(false)}>
                    CANCEL
                  </button>
                  <button type="button" className="btn-primary btn-success" disabled={!imageUrlDraft.trim()} onClick={handleAddImage}>
                    ADD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {isLinkModalOpen && selectedCourse && (() => {
        const course = selectedCourse as Course;
        const pages = course.pages ?? [];
        const activePage =
          (activePageId ? pages.find((page) => page.id === activePageId) : undefined) ??
          (pages.length > 0 ? pages[pages.length - 1] : undefined) ??
          undefined;
        if (!activePage) {
          return null;
        }
        const pageForLink = activePage as CoursePage;
        function handleAddLink() {
          const label = linkLabelDraft.trim();
          const href = linkUrlDraft.trim();
          if (!label || !href) {
            return;
          }
          
          const linkHtml = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">${label}</a>`;
          
          if (bodyInputRef.current) {
            bodyInputRef.current.focus();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = linkHtml;
              const linkNode = tempDiv.firstChild!;
              range.insertNode(linkNode);
              
              const newRange = document.createRange();
              newRange.setStartAfter(linkNode);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else {
              bodyInputRef.current.innerHTML += linkHtml;
            }
            
            setTimeout(() => {
              if (bodyInputRef.current) {
                const nextBody = bodyInputRef.current.innerHTML;
                // ALSO save to resourceLinks array for marketing materials sync
                const existingLinks = pageForLink.resourceLinks || [];
                const nextPages = pages.map((page) => 
                  page.id === pageForLink.id 
                    ? { ...page, body: nextBody, resourceLinks: [...existingLinks, { label, href }] } 
                    : page
                );
                updateCourse({ ...(course as Course), pages: nextPages });
              }
            }, 0);
          }
          
          setIsLinkModalOpen(false);
          setLinkLabelDraft("");
          setLinkUrlDraft("");
        }
        return (
          <div className="overlay">
            <div className="dialog">
              <div className="dialog-title">Add link</div>
              <label className="field">
                <span className="field-label">Label</span>
                <input className="field-input" value={linkLabelDraft} maxLength={34} onChange={(event) => setLinkLabelDraft(event.target.value)} placeholder="Label" />
              </label>
              <label className="field" style={{ marginTop: 12 }}>
                <span className="field-label">URL</span>
                <input className="field-input" value={linkUrlDraft} onChange={(event) => setLinkUrlDraft(event.target.value)} placeholder="https://" />
              </label>
              <div className="dialog-footer">
                <div />
                <div className="dialog-actions">
                  <button type="button" className="btn-secondary btn-cancel" onClick={() => setIsLinkModalOpen(false)}>
                    CANCEL
                  </button>
                  <button type="button" className="btn-primary btn-success" disabled={!linkLabelDraft.trim() || !linkUrlDraft.trim()} onClick={handleAddLink}>
                    ADD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {isResourceFileModalOpen && selectedCourse && (() => {
        const course = selectedCourse as Course;
        const pages = course.pages ?? [];
        const activePage =
          (activePageId ? pages.find((page) => page.id === activePageId) : undefined) ??
          (pages.length > 0 ? pages[pages.length - 1] : undefined) ??
          undefined;
        if (!activePage) {
          return null;
        }
        const pageForFile = activePage as CoursePage;
        function handleAddResourceFile() {
          const label = resourceFileLabelDraft.trim();
          const href = resourceFileUrlDraft.trim();
          if (!label || !href) {
            return;
          }
          
          // Create a downloadable link in the page body
          const linkHtml = `<a href="${href}" download target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; color: #3b82f6; text-decoration: underline; cursor: pointer;">📎 ${label}</a>`;
          
          if (bodyInputRef.current) {
            bodyInputRef.current.focus();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = linkHtml;
              const linkNode = tempDiv.firstChild!;
              range.insertNode(linkNode);
              
              const newRange = document.createRange();
              newRange.setStartAfter(linkNode);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else {
              bodyInputRef.current.innerHTML += linkHtml;
            }
            
            setTimeout(() => {
              if (bodyInputRef.current) {
                const nextBody = bodyInputRef.current.innerHTML;
                // Save to fileUrls array
                const existingFiles = pageForFile.fileUrls || [];
                const nextPages = pages.map((page) => 
                  page.id === pageForFile.id 
                    ? { ...page, body: nextBody, fileUrls: [...existingFiles, href] } 
                    : page
                );
                updateCourse({ ...(course as Course), pages: nextPages });
              }
            }, 0);
          }
          
          setIsResourceFileModalOpen(false);
          setResourceFileUrlDraft("");
          setResourceFileLabelDraft("");
        }
        return (
          <div className="overlay">
            <div className="dialog">
              <div className="dialog-title">Add resource file</div>
              <label className="field">
                <span className="field-label">Label</span>
                <input className="field-input" value={resourceFileLabelDraft} maxLength={50} onChange={(event) => setResourceFileLabelDraft(event.target.value)} placeholder="e.g., Download PDF, View Document" />
              </label>
              <label className="field" style={{ marginTop: 12 }}>
                <span className="field-label">File URL</span>
                <input className="field-input" value={resourceFileUrlDraft} onChange={(event) => setResourceFileUrlDraft(event.target.value)} placeholder="https://" />
              </label>
              <div className="video-dropzone" onClick={() => resourceFileInputRef.current?.click()}>
                <div className="video-dropzone-icon">⬆</div>
                <div className="video-dropzone-text-main">Drag and drop file here</div>
                <div className="video-dropzone-text-sub">or select file</div>
              </div>
              <input
                ref={resourceFileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  
                  // Auto-fill label with filename if empty
                  if (!resourceFileLabelDraft.trim()) {
                    setResourceFileLabelDraft(file.name);
                  }
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  try {
                    const response = await fetch('/api/upload-image', {
                      method: 'POST',
                      body: formData
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      setResourceFileUrlDraft(data.url);
                    } else {
                      alert('Failed to upload file');
                    }
                  } catch (error) {
                    console.error('Upload error:', error);
                    alert('Failed to upload file');
                  }
                }}
              />
              <div className="dialog-footer">
                <div />
                <div className="dialog-actions">
                  <button type="button" className="btn-secondary btn-cancel" onClick={() => setIsResourceFileModalOpen(false)}>
                    CANCEL
                  </button>
                  <button type="button" className="btn-primary btn-success" disabled={!resourceFileLabelDraft.trim() || !resourceFileUrlDraft.trim()} onClick={handleAddResourceFile}>
                    ADD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {isPinPostModalOpen && selectedCourse && (() => {
        const course = selectedCourse as Course;
        const pages = course.pages ?? [];
        const activePage =
          (activePageId ? pages.find((page) => page.id === activePageId) : undefined) ??
          (pages.length > 0 ? pages[pages.length - 1] : undefined) ??
          undefined;
        if (!activePage) {
          return null;
        }
        const pageForPost = activePage as CoursePage;
        function handlePinPost() {
          const trimmed = pinPostUrlDraft.trim();
          if (!trimmed) {
            return;
          }
          
          const nextPages = pages.map((page) => 
            page.id === pageForPost.id 
              ? { ...page, pinnedCommunityPostUrl: trimmed } 
              : page
          );
          updateCourse({ ...(course as Course), pages: nextPages });
          
          setIsPinPostModalOpen(false);
          setPinPostUrlDraft("");
        }
        return (
          <div className="overlay">
            <div className="dialog">
              <div className="dialog-title">Pin community post</div>
              <label className="field">
                <span className="field-label">Community Post URL</span>
                <input className="field-input" value={pinPostUrlDraft} onChange={(event) => setPinPostUrlDraft(event.target.value)} placeholder="https://" />
              </label>
              <div className="dialog-footer">
                <div />
                <div className="dialog-actions">
                  <button type="button" className="btn-secondary btn-cancel" onClick={() => setIsPinPostModalOpen(false)}>
                    CANCEL
                  </button>
                  <button type="button" className="btn-primary btn-success" disabled={!pinPostUrlDraft.trim()} onClick={handlePinPost}>
                    PIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {isVideoModalOpen && selectedCourse && (() => {
        const course = selectedCourse as Course;
        const pages = course.pages ?? [];
        const activePage =
          (activePageId ? pages.find((page) => page.id === activePageId) : undefined) ??
          (pages.length > 0 ? pages[pages.length - 1] : undefined) ??
          undefined;
        if (!activePage) {
          return null;
        }
        const pageForVideo = activePage as CoursePage;
        function handleAddVideo() {
          const trimmed = videoUrlDraft.trim();
          if (!trimmed) {
            return;
          }
          
          const isYouTube = trimmed.includes("youtube.com") || trimmed.includes("youtu.be");
          const isUploadedFile = trimmed.startsWith("/uploads/");
          let videoHtml = "";
          
          if (isYouTube) {
            const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
            const videoId = match ? match[1] : "";
            if (videoId) {
              videoHtml = `<div contenteditable="false" style="margin: 16px 0; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden;"><iframe src="https://www.youtube.com/embed/${videoId}" style="width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            }
          } else if (isUploadedFile) {
            // Uploaded file from /uploads/ folder
            videoHtml = `<div contenteditable="false" style="margin: 16px 0; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden;"><video controls src="${trimmed}" style="width: 100%; height: 100%; object-fit: contain;"></video></div>`;
          } else {
            // External URL
            videoHtml = `<div contenteditable="false" style="margin: 16px 0; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden;"><video controls src="${trimmed}" style="width: 100%; height: 100%; object-fit: contain;"></video></div>`;
          }
          
          if (bodyInputRef.current && videoHtml) {
            bodyInputRef.current.focus();
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              const tempDiv = document.createElement("div");
              tempDiv.innerHTML = videoHtml + '<p><br></p>';
              const videoNode = tempDiv.firstChild!;
              const lineBreak = tempDiv.lastChild!;
              range.insertNode(lineBreak);
              range.insertNode(videoNode);
              
              const newRange = document.createRange();
              newRange.setStartAfter(lineBreak);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } else {
              bodyInputRef.current.innerHTML += videoHtml + '<p><br></p>';
            }
            
            // Wait longer to ensure DOM is updated
            setTimeout(() => {
              if (bodyInputRef.current) {
                const nextBody = bodyInputRef.current.innerHTML;
                console.log('[Video] Saving body:', {
                  bodyLength: nextBody.length,
                  hasVideo: nextBody.includes('<video') || nextBody.includes('<iframe'),
                  videoUrl: trimmed,
                  bodyPreview: nextBody.substring(0, 200)
                });
                // ALSO save to videoUrl field for marketing materials sync
                const nextPages = pages.map((page) => 
                  page.id === pageForVideo.id 
                    ? { ...page, body: nextBody, videoUrl: trimmed } 
                    : page
                );
                updateCourse({ ...(course as Course), pages: nextPages });
              }
            }, 100); // Increased timeout
          }
          
          setIsVideoModalOpen(false);
          setVideoUrlDraft("");
        }
        return (
          <div className="overlay">
            <div className="dialog">
              <div className="dialog-title">Add a video</div>
              <label className="field">
                <span className="field-label">YouTube, Loom, Vimeo, or Wistia link</span>
                <input className="field-input" value={videoUrlDraft} onChange={(event) => setVideoUrlDraft(event.target.value)} placeholder="https://" />
              </label>
              <div className="video-dropzone" onClick={() => videoFileInputRef.current?.click()}>
                <div className="video-dropzone-icon">⬆</div>
                <div className="video-dropzone-text-main">Drag and drop video here</div>
                <div className="video-dropzone-text-sub">or select file</div>
              </div>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  
                  // Upload to server instead of base64
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  try {
                    const response = await fetch('/api/upload-image', {
                      method: 'POST',
                      body: formData
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      setVideoUrlDraft(data.url); // This will be /uploads/filename.mp4
                    } else {
                      alert('Failed to upload video');
                    }
                  } catch (error) {
                    console.error('Upload error:', error);
                    alert('Failed to upload video');
                  }
                }}
              />
              <div className="dialog-footer">
                <div />
                <div className="dialog-actions">
                  <button type="button" className="btn-secondary btn-cancel" onClick={() => setIsVideoModalOpen(false)}>
                    CANCEL
                  </button>
                  <button type="button" className="btn-primary btn-success" disabled={!videoUrlDraft.trim()} onClick={handleAddVideo}>
                    ADD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <div className="panel panel-right">
        {selectedCourse ? (
          <div className="panel-scroll">
            <div className="panel-header">
              <div className="panel-header-row">
                <span>Course Details</span>
                <div className="panel-header-actions">
                  <button type="button" className="btn-ghost btn-small" onClick={() => setViewMode("grid")}>
                    Back to courses
                  </button>
                  <button type="button" className="btn-ghost btn-danger" onClick={() => deleteCourse(selectedCourse.id)}>
                    Delete Course
                  </button>
                </div>
              </div>
            </div>
            <div className="panel-body">
              {detailSection === "overview" ? (
                <>
                  <label className="field">
                    <span className="field-label">Course Title</span>
                    <input
                      className="field-input"
                      value={selectedCourse.title}
                      onChange={(e) => updateCourse({ ...selectedCourse, title: e.target.value })}
                    />
                  </label>
                  <div className="course-cover-editor">
                    <div
                      className="course-cover-preview"
                      style={selectedCourse.coverImageUrl ? { backgroundImage: `url(${selectedCourse.coverImageUrl})` } : undefined}
                    >
                      {!selectedCourse.coverImageUrl && (
                        <button type="button" className="course-cover-upload-button" onClick={() => fileInputRef.current?.click()}>
                          Upload
                        </button>
                      )}
                    </div>
                    <div className="course-cover-meta">
                      <div className="course-cover-meta-title">Cover</div>
                      <div className="course-cover-meta-subtitle">1460 x 752 px</div>
                      {selectedCourse.coverImageUrl && (
                        <button type="button" className="btn-secondary btn-small course-cover-change-button" onClick={() => fileInputRef.current?.click()}>
                          Change
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateCourse({ ...selectedCourse, coverImageUrl: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                  <label className="field course-description-field">
                    <span className="field-label">Description</span>
                    <textarea
                      className="field-input"
                      rows={6}
                      value={selectedCourse.description}
                      onChange={(e) => updateCourse({ ...selectedCourse, description: e.target.value })}
                    />
                  </label>
                  <div className="form-grid">
                    <label className="field field-course-status">
                      <span className="field-label">Course Status</span>
                      <button
                        type="button"
                        className={selectedCourse.status === "published" ? "status-toggle status-toggle-on" : "status-toggle"}
                        onClick={() =>
                          updateCourse({
                            ...selectedCourse,
                            status: (selectedCourse.status ?? "draft") === "published" ? "draft" : "published"
                          })
                        }
                      >
                        <span className={selectedCourse.status === "published" ? "status-toggle-label status-toggle-label-on" : "status-toggle-label"}>
                          {selectedCourse.status === "published" ? "Published" : "Draft"}
                        </span>
                        <span className="status-toggle-track">
                          <span className="status-toggle-thumb" />
                        </span>
                      </button>
                    </label>
                    <label className="field">
                      <span className="field-label">Access</span>
                      <select
                        className="field-input"
                        value={selectedCourse.accessMode ?? "open"}
                        onChange={(e) => updateCourse({ ...selectedCourse, accessMode: e.target.value as "open" | "assigned" })}
                      >
                        <option value="open">Open to all members</option>
                        <option value="assigned">Assigned only (manager controls access)</option>
                      </select>
                    </label>
                  </div>
                  <div className="course-actions">
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="btn-secondary btn-cancel" onClick={cancelChanges}>
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn-primary btn-success" 
                        onClick={saveCourse}
                        disabled={!hasChanges}
                        style={!hasChanges ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                      >
                        Save
                      </button>
                    </div>
                    <button type="button" className="btn-primary btn-success" onClick={() => setDetailSection("pages")}>
                      Add
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="course-pages-layout">
                    {(!selectedCourse.pages || selectedCourse.pages.length === 0) &&
                    (!selectedCourse.folders || selectedCourse.folders.length === 0) ? (
                      <div className="panel-empty">No pages yet.</div>
                    ) : (
                      <>
                        {(() => {
                          const pages = selectedCourse.pages ?? [];
                          const folders = selectedCourse.folders ?? [];
                          const activePage = pages.find((page) => page.id === activePageId) ?? pages[pages.length - 1] ?? pages[0];
                          function applyFormatting(kind: "h1" | "h2" | "h3" | "h4" | "bold" | "italic" | "underline" | "strike" | "code" | "ul" | "ol" | "quote") {
                            if (kind === "code") {
                              const selection = window.getSelection();
                              if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                const node = selection.anchorNode;
                                let parent = node?.parentElement;
                                let codeElement = null;
                                while (parent && parent !== bodyInputRef.current) {
                                  if (parent.tagName === "CODE") {
                                    codeElement = parent;
                                    break;
                                  }
                                  parent = parent.parentElement;
                                }
                                if (codeElement) {
                                  const text = codeElement.textContent || "";
                                  const textNode = document.createTextNode(text);
                                  codeElement.parentNode?.replaceChild(textNode, codeElement);
                                } else if (!selection.isCollapsed) {
                                  const selectedText = range.toString();
                                  const code = document.createElement("code");
                                  code.style.backgroundColor = "#f4f4f4";
                                  code.style.padding = "2px 4px";
                                  code.style.borderRadius = "3px";
                                  code.style.fontFamily = "monospace";
                                  code.textContent = selectedText;
                                  range.deleteContents();
                                  range.insertNode(code);
                                }
                              }
                            } else if (kind === "quote") {
                              const currentBlock = document.queryCommandValue("formatBlock");
                              if (currentBlock.toLowerCase() === "blockquote") {
                                document.execCommand("formatBlock", false, "p");
                              } else {
                                document.execCommand("formatBlock", false, "blockquote");
                              }
                            } else {
                              document.execCommand(kind === "h1" ? "formatBlock" : kind === "h2" ? "formatBlock" : kind === "h3" ? "formatBlock" : kind === "h4" ? "formatBlock" : kind === "bold" ? "bold" : kind === "italic" ? "italic" : kind === "underline" ? "underline" : kind === "strike" ? "strikeThrough" : kind === "ul" ? "insertUnorderedList" : kind === "ol" ? "insertOrderedList" : "", false, kind === "h1" ? "h1" : kind === "h2" ? "h2" : kind === "h3" ? "h3" : kind === "h4" ? "h4" : undefined);
                            }
                            const editor = bodyInputRef.current;
                            if (editor) {
                              const nextBody = editor.innerHTML;
                              const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, body: nextBody } : page));
                              updateCourse({ ...(selectedCourse as Course), pages: nextPages });
                            }
                            updateActiveFormats();
                          }
                          function updateActiveFormats() {
                            const formats = new Set<string>();
                            if (document.queryCommandState("bold")) formats.add("bold");
                            if (document.queryCommandState("italic")) formats.add("italic");
                            if (document.queryCommandState("underline")) formats.add("underline");
                            if (document.queryCommandState("strikeThrough")) formats.add("strike");
                            if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
                            if (document.queryCommandState("insertOrderedList")) formats.add("ol");
                            const value = document.queryCommandValue("formatBlock");
                            if (value) formats.add(value.toLowerCase());
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                              const node = selection.anchorNode;
                              let parent = node?.parentElement;
                              while (parent && parent !== bodyInputRef.current) {
                                if (parent.tagName === "CODE") formats.add("code");
                                if (parent.tagName === "BLOCKQUOTE") formats.add("quote");
                                parent = parent.parentElement;
                              }
                            }
                            setActiveFormats(formats);
                          }
                          return (
                            <>
                              <div className="course-pages-left">
                                <div className="course-pages-course-header">
                                  <div className="course-pages-course-header-row">
                                    <div className="course-pages-course-title">{selectedCourse.title}</div>
                                    <div className="course-pages-course-header-right">
                                      <button
                                        type="button"
                                        className="course-page-menu-trigger course-pages-course-menu-trigger"
                                        onClick={() => {
                                          setIsCourseMenuOpen(!isCourseMenuOpen);
                                          setOpenPageMenuId(null);
                                        }}
                                      >
                                        ⋯
                                      </button>
                                      {isCourseMenuOpen && (
                                        <div className="course-page-menu">
                                          <button type="button" className="course-page-menu-item" onClick={() => addPageForCourse(selectedCourse)}>
                                            Add page
                                          </button>
                                          <button
                                            type="button"
                                            className="course-page-menu-item"
                                            onClick={() => {
                                              setIsFolderModalOpen(true);
                                              setIsCourseMenuOpen(false);
                                              setNewFolderName("");
                                              setNewFolderPublished(true);
                                            }}
                                          >
                                            Add folder
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="course-pages-course-progress">
                                    <div className="course-pages-course-progress-label">0%</div>
                                    <div className="course-pages-course-progress-track">
                                      <div className="course-pages-course-progress-fill" />
                                    </div>
                                  </div>
                                </div>
                                <div className="course-pages-sidebar">
                                {pages.filter((page) => !page.folderId).map((page) => (
                                  <div
                                    key={page.id}
                                    className={activePage && page.id === activePage.id ? "course-pages-item active" : "course-pages-item"}
                                    onClick={() => {
                                      setActivePageId(page.id);
                                      setOpenPageMenuId(null);
                                      setIsCourseMenuOpen(false);
                                    }}
                                  >
                                    <span className="course-pages-item-title">{page.title}</span>
                                    <button
                                      type="button"
                                      className="course-page-menu-trigger"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenPageMenuId(openPageMenuId === page.id ? null : page.id);
                                        setIsCourseMenuOpen(false);
                                      }}
                                    >
                                      ⋯
                                    </button>
                                    {openPageMenuId === page.id && (
                                      <div className="course-page-menu">
                                        <button type="button" className="course-page-menu-item" onClick={() => { setActivePageId(page.id); setOpenPageMenuId(null); }}>
                                          Edit page
                                        </button>
                                        <button
                                          type="button"
                                          className="course-page-menu-item"
                                          onClick={() => {
                                            const nextPages = pages.map((p) => (p.id === page.id ? { ...p, status: "draft" as CoursePage["status"] } : p));
                                            updateCourse({ ...selectedCourse, pages: nextPages });
                                            setOpenPageMenuId(null);
                                          }}
                                        >
                                          Revert to draft
                                        </button>
                                        <button type="button" className="course-page-menu-item" onClick={() => { setOpenPageMenuId(null); }}>
                                          Change folder
                                        </button>
                                        <button
                                          type="button"
                                          className="course-page-menu-item"
                                          onClick={() => {
                                            const sourcePage = pages.find((p) => p.id === page.id);
                                            if (!sourcePage) return;
                                            const duplicatePage: CoursePage = { ...sourcePage, id: `page-${Date.now()}-copy`, title: `${sourcePage.title} copy` };
                                            const nextPages = [...pages, duplicatePage];
                                            updateCourse({ ...selectedCourse, pages: nextPages });
                                            setActivePageId(duplicatePage.id);
                                            setOpenPageMenuId(null);
                                          }}
                                        >
                                          Duplicate
                                        </button>
                                        <div className="course-page-menu-item course-page-menu-item-muted">Drip status: Off</div>
                                        <button
                                          type="button"
                                          className="course-page-menu-item course-page-menu-item-danger"
                                          onClick={() => {
                                            const nextPages = pages.filter((p) => p.id !== page.id);
                                            updateCourse({ ...selectedCourse, pages: nextPages });
                                            setOpenPageMenuId(null);
                                            if (activePageId === page.id) {
                                              const fallback = nextPages[nextPages.length - 1] ?? nextPages[0];
                                              setActivePageId(fallback ? fallback.id : null);
                                            }
                                          }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {folders.map((folder) => {
                                  const folderPages = pages.filter((page) => page.folderId === folder.id);
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
                                        <span className="course-folder-title">{folder.status === "draft" ? `(Draft) ${folder.title}` : folder.title}</span>
                                        <button
                                          type="button"
                                          className="course-page-menu-trigger"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setOpenFolderMenuId(openFolderMenuId === folder.id ? null : folder.id);
                                            setOpenPageMenuId(null);
                                            setIsCourseMenuOpen(false);
                                          }}
                                        >
                                          ⋯
                                        </button>
                                        {openFolderMenuId === folder.id && (
                                          <div className="course-page-menu">
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                setEditingFolderId(folder.id);
                                                setNewFolderName(folder.title);
                                                setNewFolderPublished(folder.status === "published");
                                                setIsFolderModalOpen(true);
                                                setOpenFolderMenuId(null);
                                              }}
                                            >
                                              Edit folder
                                            </button>
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                addPageForCourse(selectedCourse, folder.id);
                                                setOpenFolderMenuId(null);
                                              }}
                                            >
                                              Add page in folder
                                            </button>
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                addPageForCourse(selectedCourse, folder.id, true);
                                                setOpenFolderMenuId(null);
                                              }}
                                            >
                                              Add quiz
                                            </button>
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                const now = Date.now();
                                                const folderPagesInner = pages.filter((page) => page.folderId === folder.id);
                                                const duplicatedFolder: CourseFolder = { ...folder, id: `folder-${now}-copy`, title: `${folder.title} copy` };
                                                const duplicatedPages = folderPagesInner.map((page, index) => ({
                                                  ...page,
                                                  id: `page-${now}-copy-${index}`,
                                                  title: `${page.title} copy`,
                                                  folderId: duplicatedFolder.id
                                                }));
                                                const nextCourse: Course = { ...selectedCourse, folders: [...folders, duplicatedFolder], pages: [...pages, ...duplicatedPages] };
                                                updateCourse(nextCourse);
                                                setOpenFolderMenuId(null);
                                              }}
                                            >
                                              Duplicate folder
                                            </button>
                                            <button
                                              type="button"
                                              className="course-page-menu-item course-page-menu-item-danger"
                                              onClick={() => {
                                                const remainingFolders = folders.filter((item) => item.id !== folder.id);
                                                const remainingPages = pages.filter((page) => page.folderId !== folder.id);
                                                const nextCourse: Course = { ...selectedCourse, folders: remainingFolders, pages: remainingPages };
                                                updateCourse(nextCourse);
                                                setOpenFolderMenuId(null);
                                                if (activePageId && !remainingPages.some((page) => page.id === activePageId)) {
                                                  const fallback = remainingPages[remainingPages.length - 1] ?? remainingPages[0];
                                                  setActivePageId(fallback ? fallback.id : null);
                                                }
                                              }}
                                            >
                                              Delete folder
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      {!isCollapsed && folderPages.map((page) => (
                                        <div
                                          key={page.id}
                                          className={activePage && page.id === activePage.id ? "course-pages-item course-pages-item-child active" : "course-pages-item course-pages-item-child"}
                                          onClick={() => {
                                            setActivePageId(page.id);
                                            setOpenPageMenuId(null);
                                            setIsCourseMenuOpen(false);
                                          }}
                                        >
                                          <span className="course-pages-item-title">{page.title}</span>
                                          <button
                                            type="button"
                                            className="course-page-menu-trigger"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              setOpenPageMenuId(openPageMenuId === page.id ? null : page.id);
                                              setIsCourseMenuOpen(false);
                                            }}
                                          >
                                            ⋯
                                          </button>
                                          {openPageMenuId === page.id && (
                                            <div className="course-page-menu">
                                              <button type="button" className="course-page-menu-item" onClick={() => { setActivePageId(page.id); setOpenPageMenuId(null); }}>
                                                Edit page
                                              </button>
                                              <button
                                                type="button"
                                                className="course-page-menu-item"
                                                onClick={() => {
                                                  const nextPages = pages.map((p) => (p.id === page.id ? { ...p, status: "draft" as CoursePage["status"] } : p));
                                                  updateCourse({ ...selectedCourse, pages: nextPages });
                                                  setOpenPageMenuId(null);
                                                }}
                                              >
                                                Revert to draft
                                              </button>
                                              <button type="button" className="course-page-menu-item" onClick={() => { setOpenPageMenuId(null); }}>
                                                Change folder
                                              </button>
                                              <button
                                                type="button"
                                                className="course-page-menu-item"
                                                onClick={() => {
                                                  const sourcePage = pages.find((p) => p.id === page.id);
                                                  if (!sourcePage) return;
                                                  const duplicatePage: CoursePage = { ...sourcePage, id: `page-${Date.now()}-copy`, title: `${sourcePage.title} copy` };
                                                  const nextPages = [...pages, duplicatePage];
                                                  updateCourse({ ...selectedCourse, pages: nextPages });
                                                  setActivePageId(duplicatePage.id);
                                                  setOpenPageMenuId(null);
                                                }}
                                              >
                                                Duplicate
                                              </button>
                                              <div className="course-page-menu-item course-page-menu-item-muted">Drip status: Off</div>
                                              <button
                                                type="button"
                                                className="course-page-menu-item course-page-menu-item-danger"
                                                onClick={() => {
                                                  const nextPages = pages.filter((p) => p.id !== page.id);
                                                  updateCourse({ ...selectedCourse, pages: nextPages });
                                                  setOpenPageMenuId(null);
                                                  if (activePageId === page.id) {
                                                    const fallback = nextPages[nextPages.length - 1] ?? nextPages[0];
                                                    setActivePageId(fallback ? fallback.id : null);
                                                  }
                                                }}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          )}
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
                                    {activePage.isQuiz ? (
                                      <>
                                        <div className="course-page-main-header">
                                          <input
                                            className="course-page-title-input"
                                            value={activePage.title}
                                            onChange={(event) => {
                                              const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, title: event.target.value } : page));
                                              updateCourse({ ...selectedCourse, pages: nextPages });
                                            }}
                                          />
                                        </div>
                                        <div className="course-page-editor-body">
                                          {(activePage.quizQuestions || []).map((q, qIdx) => (
                                            <div key={q.id} style={{ marginBottom: 24, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                                <span style={{ fontWeight: 600 }}>Question {qIdx + 1}</span>
                                                <button
                                                  type="button"
                                                  className="btn-ghost btn-danger btn-small"
                                                  onClick={() => {
                                                    const nextQuestions = (activePage.quizQuestions || []).filter((_, i) => i !== qIdx);
                                                    const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, quizQuestions: nextQuestions } : page));
                                                    updateCourse({ ...selectedCourse, pages: nextPages });
                                                  }}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                              <label className="field">
                                                <span className="field-label">Question</span>
                                                <textarea
                                                  className="field-input"
                                                  rows={3}
                                                  value={q.prompt}
                                                  onChange={(e) => {
                                                    const nextQuestions = [...(activePage.quizQuestions || [])];
                                                    nextQuestions[qIdx] = { ...q, prompt: e.target.value };
                                                    const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, quizQuestions: nextQuestions } : page));
                                                    updateCourse({ ...selectedCourse, pages: nextPages });
                                                  }}
                                                />
                                              </label>
                                              {q.options.map((option, optIdx) => (
                                                <label key={optIdx} className="field" style={{ marginTop: 12 }}>
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <input
                                                      type="radio"
                                                      name={`correct-${q.id}`}
                                                      checked={q.correctIndex === optIdx}
                                                      onChange={() => {
                                                        const nextQuestions = [...(activePage.quizQuestions || [])];
                                                        nextQuestions[qIdx] = { ...q, correctIndex: optIdx };
                                                        const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, quizQuestions: nextQuestions } : page));
                                                        updateCourse({ ...selectedCourse, pages: nextPages });
                                                      }}
                                                    />
                                                    <span className="field-label" style={{ marginBottom: 0 }}>Option {optIdx + 1}</span>
                                                  </div>
                                                  <input
                                                    className="field-input"
                                                    value={option}
                                                    onChange={(e) => {
                                                      const nextQuestions = [...(activePage.quizQuestions || [])];
                                                      const nextOptions = [...q.options];
                                                      nextOptions[optIdx] = e.target.value;
                                                      nextQuestions[qIdx] = { ...q, options: nextOptions };
                                                      const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, quizQuestions: nextQuestions } : page));
                                                      updateCourse({ ...selectedCourse, pages: nextPages });
                                                    }}
                                                  />
                                                </label>
                                              ))}
                                            </div>
                                          ))}
                                          <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => {
                                              const newQuestion = { id: `q-${Date.now()}`, prompt: "", options: ["", "", "", ""], correctIndex: 0 };
                                              const nextQuestions = [...(activePage.quizQuestions || []), newQuestion];
                                              const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, quizQuestions: nextQuestions } : page));
                                              updateCourse({ ...selectedCourse, pages: nextPages });
                                            }}
                                          >
                                            + Add Question
                                          </button>
                                        </div>
                                        <div className="course-page-footer">
                                          <div />
                                          <button
                                            type="button"
                                            className={activePage.status === "published" ? "status-toggle status-toggle-on" : "status-toggle"}
                                            onClick={() => {
                                              const nextPages = pages.map((page) =>
                                                page.id === activePage.id
                                                  ? { ...page, status: (page.status === "published" ? "draft" : "published") as CoursePage["status"] }
                                                  : page
                                              );
                                              updateCourse({ ...selectedCourse, pages: nextPages });
                                            }}
                                          >
                                            <span className={activePage.status === "published" ? "status-toggle-label status-toggle-label-on" : "status-toggle-label"}>{activePage.status === "published" ? "Published" : "Draft"}</span>
                                            <span className="status-toggle-track">
                                              <span className="status-toggle-thumb" />
                                            </span>
                                          </button>
                                          <button type="button" className="course-page-footer-button course-page-footer-cancel" onClick={() => setDetailSection("overview")}>
                                            CANCEL
                                          </button>
                                          <button type="button" className="course-page-footer-button course-page-footer-save" onClick={() => setDetailSection("overview")}>
                                            SAVE
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                    <div className="course-page-main-header">
                                      <div className="course-page-toolbar">
                                        <button type="button" className={activeFormats.has("h1") ? "course-page-toolbar-button active" : "course-page-toolbar-button"} onClick={() => applyFormatting("h1")}>H1</button>
                                        <button type="button" className={activeFormats.has("h2") ? "course-page-toolbar-button active" : "course-page-toolbar-button"} onClick={() => applyFormatting("h2")}>H2</button>
                                        <button type="button" className={activeFormats.has("h3") ? "course-page-toolbar-button active" : "course-page-toolbar-button"} onClick={() => applyFormatting("h3")}>H3</button>
                                        <button type="button" className={activeFormats.has("h4") ? "course-page-toolbar-button active" : "course-page-toolbar-button"} onClick={() => applyFormatting("h4")}>H4</button>
                                        <span style={{ borderLeft: "1px solid #ddd", height: "20px", margin: "0 8px" }} />
                                        <button type="button" className={activeFormats.has("bold") ? "course-page-toolbar-button course-page-toolbar-button-bold active" : "course-page-toolbar-button course-page-toolbar-button-bold"} onClick={() => applyFormatting("bold")}>B</button>
                                        <button type="button" className={activeFormats.has("italic") ? "course-page-toolbar-button course-page-toolbar-button-italic active" : "course-page-toolbar-button course-page-toolbar-button-italic"} onClick={() => applyFormatting("italic")}>I</button>
                                        <button type="button" className={activeFormats.has("underline") ? "course-page-toolbar-button active" : "course-page-toolbar-button"} onClick={() => applyFormatting("underline")}>U</button>
                                        <button type="button" className={activeFormats.has("strike") ? "course-page-toolbar-button course-page-toolbar-button-strike active" : "course-page-toolbar-button course-page-toolbar-button-strike"} onClick={() => applyFormatting("strike")}>S</button>
                                        <button type="button" className={activeFormats.has("code") ? "course-page-toolbar-button course-page-toolbar-button-icon active" : "course-page-toolbar-button course-page-toolbar-button-icon"} onClick={() => applyFormatting("code")}>{"</>"}</button>
                                        <span style={{ borderLeft: "1px solid #ddd", height: "20px", margin: "0 8px" }} />
                                        <button type="button" className={activeFormats.has("ul") ? "course-page-toolbar-button course-page-toolbar-button-icon active" : "course-page-toolbar-button course-page-toolbar-button-icon"} onClick={() => applyFormatting("ul")}>•</button>
                                        <button type="button" className={activeFormats.has("ol") ? "course-page-toolbar-button course-page-toolbar-button-icon active" : "course-page-toolbar-button course-page-toolbar-button-icon"} onClick={() => applyFormatting("ol")}>1.</button>
                                        <button type="button" className={activeFormats.has("quote") ? "course-page-toolbar-button course-page-toolbar-button-icon active" : "course-page-toolbar-button course-page-toolbar-button-icon"} onClick={() => applyFormatting("quote")}>"</button>
                                        <span style={{ borderLeft: "1px solid #ddd", height: "20px", margin: "0 8px" }} />
                                        <button type="button" className="course-page-toolbar-button course-page-toolbar-button-icon" onClick={() => { setImageUrlDraft(""); setIsImageModalOpen(true); }}>🖼</button>
                                        <button type="button" className="course-page-toolbar-button course-page-toolbar-button-icon" onClick={() => { setLinkLabelDraft(""); setLinkUrlDraft(""); setIsLinkModalOpen(true); }}>🔗</button>
                                        <button
                                          type="button"
                                          className="course-page-toolbar-button course-page-toolbar-button-icon course-page-toolbar-button-video"
                                          onClick={() => {
                                            setVideoUrlDraft("");
                                            setIsVideoModalOpen(true);
                                          }}
                                        >
                                          ▶
                                        </button>
                                      </div>
                                      <input
                                        className="course-page-title-input"
                                        value={activePage.title}
                                        onChange={(event) => {
                                          const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, title: event.target.value } : page));
                                          updateCourse({ ...selectedCourse, pages: nextPages });
                                        }}
                                      />
                                    </div>
                                    <div className="course-page-editor-body">
                                      <div
                                        ref={bodyInputRef}
                                        className="course-page-body-input"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(event) => {
                                          const nextBody = event.currentTarget.innerHTML;
                                          const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, body: nextBody } : page));
                                          updateCourse({ ...selectedCourse, pages: nextPages });
                                        }}
                                        onMouseUp={updateActiveFormats}
                                        onKeyUp={updateActiveFormats}
                                        onKeyDown={(event) => {
                                          if (event.key === "Backspace") {
                                            const selection = window.getSelection();
                                            if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
                                              const range = selection.getRangeAt(0);
                                              const node = range.startContainer;
                                              const offset = range.startOffset;
                                              
                                              if (offset === 0 && node.previousSibling) {
                                                const prev = node.previousSibling;
                                                if (prev.nodeType === Node.ELEMENT_NODE && (prev as Element).getAttribute("contenteditable") === "false") {
                                                  event.preventDefault();
                                                  prev.remove();
                                                  const nextBody = bodyInputRef.current?.innerHTML || "";
                                                  const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, body: nextBody } : page));
                                                  updateCourse({ ...selectedCourse, pages: nextPages });
                                                }
                                              }
                                            }
                                          }
                                        }}
                                        onFocus={(event) => {
                                          if (activePageId !== lastPageId) {
                                            event.currentTarget.innerHTML = activePage.body || "";
                                            setLastPageId(activePageId);
                                          }
                                        }}
                                        style={{
                                          padding: "12px",
                                          border: "1px solid #ddd",
                                          borderRadius: "4px",
                                          outline: "none",
                                          whiteSpace: "pre-wrap",
                                          wordBreak: "break-word",
                                          overflowWrap: "anywhere",
                                          boxSizing: "border-box",
                                          width: "100%",
                                          maxWidth: "100%"
                                        }}
                                      />
                                    </div>
                                    
                                    {/* Display existing resources */}
                                    {(activePage.resourceLinks && activePage.resourceLinks.length > 0) || 
                                     (activePage.fileUrls && activePage.fileUrls.length > 0) || 
                                     activePage.pinnedCommunityPostUrl ? (
                                      <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f9fafb", borderRadius: 8 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#374151" }}>
                                          📎 Attached Resources
                                        </div>
                                        
                                        {/* Resource Links */}
                                        {activePage.resourceLinks && activePage.resourceLinks.length > 0 && (
                                          <div style={{ marginBottom: 16 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#6b7280" }}>
                                              Resource Links
                                            </div>
                                            {activePage.resourceLinks.map((link, idx) => (
                                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: 8, backgroundColor: "white", borderRadius: 4 }}>
                                                <span style={{ fontSize: 16 }}>🔗</span>
                                                <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: "#3b82f6", textDecoration: "none" }}>
                                                  {link.label}
                                                </a>
                                                <button
                                                  type="button"
                                                  className="btn-ghost btn-danger btn-small"
                                                  onClick={() => {
                                                    const nextLinks = activePage.resourceLinks?.filter((_, i) => i !== idx) || [];
                                                    const nextPages = pages.map((page) => 
                                                      page.id === activePage.id ? { ...page, resourceLinks: nextLinks } : page
                                                    );
                                                    updateCourse({ ...selectedCourse, pages: nextPages });
                                                  }}
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Resource Files */}
                                        {activePage.fileUrls && activePage.fileUrls.length > 0 && (
                                          <div style={{ marginBottom: 16 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#6b7280" }}>
                                              Resource Files
                                            </div>
                                            {activePage.fileUrls.map((fileUrl, idx) => (
                                              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: 8, backgroundColor: "white", borderRadius: 4 }}>
                                                <span style={{ fontSize: 16 }}>📎</span>
                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: "#3b82f6", textDecoration: "none" }}>
                                                  {fileUrl.split('/').pop() || fileUrl}
                                                </a>
                                                <a href={fileUrl} download className="btn-secondary btn-small" style={{ textDecoration: "none" }}>
                                                  Download
                                                </a>
                                                <button
                                                  type="button"
                                                  className="btn-ghost btn-danger btn-small"
                                                  onClick={() => {
                                                    const nextFiles = activePage.fileUrls?.filter((_, i) => i !== idx) || [];
                                                    const nextPages = pages.map((page) => 
                                                      page.id === activePage.id ? { ...page, fileUrls: nextFiles } : page
                                                    );
                                                    updateCourse({ ...selectedCourse, pages: nextPages });
                                                  }}
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Pinned Community Post */}
                                        {activePage.pinnedCommunityPostUrl && (
                                          <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#6b7280" }}>
                                              Pinned Community Post
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, backgroundColor: "white", borderRadius: 4 }}>
                                              <span style={{ fontSize: 16 }}>📌</span>
                                              <a href={activePage.pinnedCommunityPostUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, color: "#3b82f6", textDecoration: "none" }}>
                                                {activePage.pinnedCommunityPostUrl}
                                              </a>
                                              <button
                                                type="button"
                                                className="btn-ghost btn-danger btn-small"
                                                onClick={() => {
                                                  const nextPages = pages.map((page) => 
                                                    page.id === activePage.id ? { ...page, pinnedCommunityPostUrl: "" } : page
                                                  );
                                                  updateCourse({ ...selectedCourse, pages: nextPages });
                                                }}
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                    
                                    <div className="course-page-footer">
                                      <div className="course-page-add">
                                        <button type="button" className="course-page-add-button" onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}>
                                          <span>ADD</span>
                                          <span className="course-page-add-chevron">{isAddMenuOpen ? "˄" : "˅"}</span>
                                        </button>
                                        {isAddMenuOpen && (
                                          <div className="course-page-add-menu">
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                setLinkLabelDraft("");
                                                setLinkUrlDraft("");
                                                setIsLinkModalOpen(true);
                                                setIsAddMenuOpen(false);
                                              }}
                                            >
                                              Add resource link
                                            </button>
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                setResourceFileUrlDraft("");
                                                setResourceFileLabelDraft("");
                                                setIsResourceFileModalOpen(true);
                                                setIsAddMenuOpen(false);
                                              }}
                                            >
                                              Add resource file
                                            </button>
                                            
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                setPinPostUrlDraft("");
                                                setIsPinPostModalOpen(true);
                                                setIsAddMenuOpen(false);
                                              }}
                                            >
                                              Pin community post
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        className={activePage.status === "published" ? "status-toggle status-toggle-on" : "status-toggle"}
                                        onClick={() => {
                                          const nextPages = pages.map((page) =>
                                            page.id === activePage.id
                                              ? { ...page, status: (page.status === "published" ? "draft" : "published") as CoursePage["status"] }
                                              : page
                                          );
                                          updateCourse({ ...selectedCourse, pages: nextPages });
                                        }}
                                      >
                                        <span className={activePage.status === "published" ? "status-toggle-label status-toggle-label-on" : "status-toggle-label"}>{activePage.status === "published" ? "Published" : "Draft"}</span>
                                        <span className="status-toggle-track">
                                          <span className="status-toggle-thumb" />
                                        </span>
                                      </button>
                                      <button type="button" className="course-page-footer-button course-page-footer-cancel" onClick={() => setDetailSection("overview")}>
                                        CANCEL
                                      </button>
                                      <button type="button" className="course-page-footer-button course-page-footer-save" onClick={() => setDetailSection("overview")}>
                                        SAVE
                                      </button>
                                    </div>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="panel-empty">Select or create a course to edit details.</div>
        )}
      </div>
    </div>
  );
}
