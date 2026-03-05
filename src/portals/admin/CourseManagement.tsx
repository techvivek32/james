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
  const [isCreatingNewCourse, setIsCreatingNewCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState<Course | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [openResourceMenuId, setOpenResourceMenuId] = useState<string | null>(null);
  const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
  const [editingResourceType, setEditingResourceType] = useState<'link' | 'file' | null>(null);
  const [isChangeModuleModalOpen, setIsChangeModuleModalOpen] = useState(false);
  const [changeModulePageId, setChangeModulePageId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(undefined);

  // Add drag and drop styles
  const dragStyles = `
    <style>
      .course-pages-sidebar.drag-active .course-folder-group {
        transition: all 0.2s ease;
      }
      .course-folder-group.drag-over {
        background-color: #e0f2fe !important;
        border: 2px dashed #0ea5e9 !important;
        border-radius: 8px;
      }
      .course-pages-item.dragging {
        opacity: 0.5;
        transform: rotate(2deg);
      }
    </style>
  `;

  // Inject styles
  if (typeof document !== 'undefined' && !document.getElementById('drag-drop-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'drag-drop-styles';
    styleElement.innerHTML = `
      .course-pages-sidebar.drag-active .course-folder-group {
        transition: all 0.2s ease;
      }
      .course-folder-group.drag-over {
        background-color: #e0f2fe !important;
        border: 2px dashed #0ea5e9 !important;
        border-radius: 8px;
      }
      .course-folder-group.dragging {
        opacity: 0.5;
        transform: rotate(1deg);
      }
      .course-folder-group.drag-over-above::before {
        content: '';
        position: absolute;
        top: -2px;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #0ea5e9;
        border-radius: 2px;
      }
      .course-folder-group.drag-over-below::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #0ea5e9;
        border-radius: 2px;
      }
      .course-pages-item.dragging {
        opacity: 0.5;
        transform: rotate(2deg);
      }
      .course-pages-item.drag-over-above::before {
        content: '';
        position: absolute;
        top: -2px;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #0ea5e9;
        border-radius: 2px;
      }
      .course-pages-item.drag-over-below::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 4px;
        background-color: #0ea5e9;
        border-radius: 2px;
      }
      .course-pages-item {
        position: relative;
      }
      .course-folder-group {
        position: relative;
      }
    `;
    document.head.appendChild(styleElement);
  }

  const visibleCourses = props.courses;

  const selectedCourse = isCreatingNewCourse ? newCourseData : props.courses.find((course) => course.id === selectedCourseId);

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
    if (isCreatingNewCourse) {
      setNewCourseData(updated);
    } else {
      const next = props.courses.map((course) => (course.id === updated.id ? updated : course));
      props.onCoursesChange(next);
    }
  }

  function saveCourse() {
    if (isCreatingNewCourse && newCourseData) {
      // Save new course
      const next = [...props.courses, newCourseData];
      props.onCoursesChange(next);
      setSelectedCourseId(newCourseData.id);
      setIsCreatingNewCourse(false);
      setNewCourseData(null);
      setOriginalCourse(JSON.parse(JSON.stringify(newCourseData)));
      setHasChanges(false);
    } else if (selectedCourse && hasChanges) {
      // Save existing course changes
      setOriginalCourse(JSON.parse(JSON.stringify(selectedCourse)));
      setHasChanges(false);
      console.log('Course saved:', selectedCourse.title);
    }
    setViewMode("grid");
  }

  function cancelChanges() {
    if (isCreatingNewCourse) {
      // Cancel new course creation
      setIsCreatingNewCourse(false);
      setNewCourseData(null);
      setHasChanges(false);
    } else if (originalCourse && hasChanges) {
      // Revert to original course
      const next = props.courses.map((course) => 
        course.id === originalCourse.id ? originalCourse : course
      );
      props.onCoursesChange(next);
      setHasChanges(false);
    }
    setViewMode("grid");
  }

  function getResourceIcon(url: string) {
    const lower = url.toLowerCase();
    if (lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.avi') || lower.includes('.webm') || lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) {
      return '🎥';
    }
    if (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.gif') || lower.includes('.svg') || lower.includes('.webp')) {
      return '🖼️';
    }
    if (lower.includes('.pdf')) {
      return '📄';
    }
    if (lower.includes('.doc') || lower.includes('.docx') || lower.includes('.txt')) {
      return '📝';
    }
    if (lower.includes('.xls') || lower.includes('.xlsx') || lower.includes('.csv')) {
      return '📊';
    }
    if (lower.includes('.zip') || lower.includes('.rar') || lower.includes('.7z')) {
      return '📦';
    }
    return '🔗';
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
          title: "New Lesson",
          status: "draft",
          body: "",
          videoUrl: "",
          resourceLinks: [],
          fileUrls: []
        }
      ]
    };

    setNewCourseData(newCourse);
    setIsCreatingNewCourse(true);
    setSelectedCourseId(newCourse.id);
    setViewMode("detail");
    setDetailSection("overview");
    setHasChanges(true);
  }

  function deleteCourse(id: string) {
    const next = props.courses.filter((course) => course.id !== id);
    props.onCoursesChange(next);
    if (!next.length) {
      setSelectedCourseId("");
      setViewMode("grid");
      return;
    }
    if (selectedCourseId === id) {
      setSelectedCourseId(next[0].id);
    }
    setViewMode("grid");
  }

  function addPageForCourse(course: Course, folderId?: string, isQuiz?: boolean) {
    const pages = course.pages ?? [];
    const newPage: CoursePage = {
      id: `page-${Date.now()}`,
      title: isQuiz ? "New quiz" : "New Lesson",
      status: "draft",
      body: "",
      folderId,
      videoUrl: "",
      resourceLinks: [],
      fileUrls: [],
      isQuiz: isQuiz || false,
      quizQuestions: isQuiz ? [{ id: `q-${Date.now()}`, prompt: "", options: ["", ""], correctIndex: 0 }] : []
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

  function movePageToFolder(pageId: string, targetFolderId?: string) {
    if (!selectedCourse) return;
    const pages = selectedCourse.pages ?? [];
    const nextPages = pages.map((page) => 
      page.id === pageId ? { ...page, folderId: targetFolderId } : page
    );
    updateCourse({ ...selectedCourse, pages: nextPages });
  }

  function reorderPages(draggedPageId: string, targetPageId: string, position: 'above' | 'below', targetFolderId?: string) {
    if (!selectedCourse) return;
    const pages = [...(selectedCourse.pages ?? [])];
    const draggedIndex = pages.findIndex(p => p.id === draggedPageId);
    const targetIndex = pages.findIndex(p => p.id === targetPageId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const draggedPage = { ...pages[draggedIndex], folderId: targetFolderId };
    pages.splice(draggedIndex, 1);
    
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = position === 'above' ? newTargetIndex : newTargetIndex + 1;
    
    pages.splice(insertIndex, 0, draggedPage);
    updateCourse({ ...selectedCourse, pages });
  }

  function reorderFolders(draggedFolderId: string, targetFolderId: string, position: 'above' | 'below') {
    if (!selectedCourse) return;
    const folders = [...(selectedCourse.folders ?? [])];
    const draggedIndex = folders.findIndex(f => f.id === draggedFolderId);
    const targetIndex = folders.findIndex(f => f.id === targetFolderId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const draggedFolder = folders[draggedIndex];
    folders.splice(draggedIndex, 1);
    
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    const insertIndex = position === 'above' ? newTargetIndex : newTargetIndex + 1;
    
    folders.splice(insertIndex, 0, draggedFolder);
    updateCourse({ ...selectedCourse, folders });
  }

  function insertFolderAtPagePosition(draggedFolderId: string, targetPageId: string, position: 'above' | 'below') {
    if (!selectedCourse) return;
    const folders = [...(selectedCourse.folders ?? [])];
    const draggedFolderIndex = folders.findIndex(f => f.id === draggedFolderId);
    if (draggedFolderIndex === -1) return;
    
    const draggedFolder = folders[draggedFolderIndex];
    folders.splice(draggedFolderIndex, 1);
    
    // For simplicity, just move folder to end or beginning based on position
    if (position === 'above') {
      folders.unshift(draggedFolder);
    } else {
      folders.push(draggedFolder);
    }
    
    updateCourse({ ...selectedCourse, folders });
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
              <button type="button" className="admin-course-card-new" style={{ width: "200px", height: "200px" }} onClick={() => { createCourse(); }}>
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
                      {course.description && (
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {course.description.length > 50 ? course.description.substring(0, 50) + "..." : course.description}
                        </div>
                      )}
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
      {isDeleteConfirmOpen && selectedCourse && (
        <div className="overlay">
          <div className="dialog">
            <div className="dialog-title">Delete Course</div>
            <p style={{ margin: "12px 0", fontSize: "14px", color: "#6b7280" }}>
              Are you sure you want to delete "{selectedCourse.title}"? This action cannot be undone.
            </p>
            <div className="dialog-footer">
              <div />
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn-secondary btn-cancel"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-danger-solid"
                  onClick={() => {
                    deleteCourse(selectedCourse.id);
                    setIsDeleteConfirmOpen(false);
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isFolderModalOpen && selectedCourse && (
        <div className="overlay">
          <div className="dialog">
            <div className="dialog-title">{editingFolderId ? "Edit Module  " : "Add Module  "}</div>
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
      {isChangeModuleModalOpen && selectedCourse && (
        <div className="overlay">
          <div className="dialog">
            <div className="dialog-title">Change Module</div>
            <label className="field">
              <span className="field-label">Select Module</span>
              <select 
                className="field-input" 
                value={selectedModuleId || "none"} 
                onChange={(e) => setSelectedModuleId(e.target.value === "none" ? undefined : e.target.value)}
              >
                <option value="none">No Module (Course Root)</option>
                {(selectedCourse.folders || []).map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="dialog-footer">
              <div />
              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn-secondary btn-cancel"
                  onClick={() => {
                    setIsChangeModuleModalOpen(false);
                    setChangeModulePageId(null);
                    setSelectedModuleId(undefined);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary btn-success" 
                  onClick={() => {
                    if (changeModulePageId) {
                      const pages = selectedCourse.pages || [];
                      const nextPages = pages.map((page) => 
                        page.id === changeModulePageId 
                          ? { ...page, folderId: selectedModuleId } 
                          : page
                      );
                      updateCourse({ ...selectedCourse, pages: nextPages });
                      setIsChangeModuleModalOpen(false);
                      setChangeModulePageId(null);
                      setSelectedModuleId(undefined);
                    }
                  }}
                >
                  Save
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
          
          // Check if we're editing an existing resource
          if (editingResourceIndex !== null && editingResourceType === 'link') {
            // Update existing resource
            const links = [...(pageForLink.resourceLinks || [])];
            links[editingResourceIndex] = { label, href };
            const nextPages = pages.map((page) => 
              page.id === pageForLink.id 
                ? { ...page, resourceLinks: links } 
                : page
            );
            updateCourse({ ...(course as Course), pages: nextPages });
            setEditingResourceIndex(null);
            setEditingResourceType(null);
          } else {
            // Add new resource to resourceLinks array only
            const existingLinks = pageForLink.resourceLinks || [];
            const nextPages = pages.map((page) => 
              page.id === pageForLink.id 
                ? { ...page, resourceLinks: [...existingLinks, { label, href }] } 
                : page
            );
            updateCourse({ ...(course as Course), pages: nextPages });
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
          
          // Check if we're editing an existing resource file
          if (editingResourceIndex !== null && editingResourceType === 'file') {
            // Update existing file
            const files = [...(pageForFile.fileUrls || [])];
            files[editingResourceIndex] = { label, href };
            const nextPages = pages.map((page) => 
              page.id === pageForFile.id 
                ? { ...page, fileUrls: files } 
                : page
            );
            updateCourse({ ...(course as Course), pages: nextPages });
            setEditingResourceIndex(null);
            setEditingResourceType(null);
          } else {
            // Add to fileUrls array only
            const existingFiles = pageForFile.fileUrls || [];
            const nextPages = pages.map((page) => 
              page.id === pageForFile.id 
                ? { ...page, fileUrls: [...existingFiles, { label, href }] } 
                : page
            );
            updateCourse({ ...(course as Course), pages: nextPages });
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
                  <button type="button" className="btn-ghost btn-danger" onClick={() => setIsDeleteConfirmOpen(true)}>
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
                      <div className="panel-empty">No Lessons yet.</div>
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
                                            Add Module  
                                          </button>
                                          <button type="button" className="course-page-menu-item" onClick={() => addPageForCourse(selectedCourse)}>
                                            Add Lesson
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
                                <div 
                                  className={`course-pages-sidebar ${draggedPageId ? 'drag-active' : ''}`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverFolderId(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (draggedPageId) {
                                      movePageToFolder(draggedPageId, undefined);
                                    }
                                    setDraggedPageId(null);
                                    setDraggedFolderId(null);
                                    setDragOverFolderId(null);
                                    setDragOverPageId(null);
                                    setDragOverPosition(null);
                                  }}
                                >
                                {pages.filter((page) => !page.folderId).map((page) => (
                                  <div
                                    key={page.id}
                                    className={`${activePage && page.id === activePage.id ? "course-pages-item active" : "course-pages-item"} ${draggedPageId === page.id ? 'dragging' : ''} ${dragOverPageId === page.id && dragOverPosition === 'above' ? 'drag-over-above' : ''} ${dragOverPageId === page.id && dragOverPosition === 'below' ? 'drag-over-below' : ''}`}
                                    draggable
                                    onDragStart={() => setDraggedPageId(page.id)}
                                    onDragEnd={() => {
                                      setDraggedPageId(null);
                                      setDraggedFolderId(null);
                                      setDragOverFolderId(null);
                                      setDragOverPageId(null);
                                      setDragOverPosition(null);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (draggedPageId && draggedPageId !== page.id) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const midY = rect.top + rect.height / 2;
                                        const position = e.clientY < midY ? 'above' : 'below';
                                        setDragOverPageId(page.id);
                                        setDragOverPosition(position);
                                        setDragOverFolderId(null);
                                      } else if (draggedFolderId) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const midY = rect.top + rect.height / 2;
                                        const position = e.clientY < midY ? 'above' : 'below';
                                        setDragOverPageId(page.id);
                                        setDragOverPosition(position);
                                        setDragOverFolderId(null);
                                      }
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (draggedPageId && draggedPageId !== page.id && dragOverPosition) {
                                        reorderPages(draggedPageId, page.id, dragOverPosition, undefined);
                                      } else if (draggedFolderId && dragOverPosition) {
                                        insertFolderAtPagePosition(draggedFolderId, page.id, dragOverPosition);
                                      }
                                      setDraggedPageId(null);
                                      setDraggedFolderId(null);
                                      setDragOverPageId(null);
                                      setDragOverPosition(null);
                                      setDragOverFolderId(null);
                                    }}
                                    onClick={() => {
                                      setActivePageId(page.id);
                                      setOpenPageMenuId(null);
                                      setIsCourseMenuOpen(false);
                                      setEditingLessonId(null);
                                    }}
                                  >
                                    <span style={{ cursor: "grab", marginRight: "8px" }}>⋮⋮</span>
                                    <span className="course-pages-item-title">
                                      {page.title}
                                      {page.status === "draft" && <span style={{ color: "#9ca3af", fontSize: "12px", marginLeft: "6px" }}>(Draft)</span>}
                                      {page.status === "published" && <span style={{ color: "#10b981", fontSize: "12px", marginLeft: "6px" }}>(Published)</span>}
                                    </span>
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
                                          Edit Lesson
                                        </button>
                                        <button type="button" className="course-page-menu-item" onClick={() => { 
                                          setChangeModulePageId(page.id);
                                          setSelectedModuleId(page.folderId);
                                          setIsChangeModuleModalOpen(true);
                                          setOpenPageMenuId(null); 
                                        }}>
                                          Change Module  
                                        </button>
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
                                    <div 
                                      key={folder.id} 
                                      className={`course-folder-group ${dragOverFolderId === folder.id ? 'drag-over' : ''} ${draggedFolderId === folder.id ? 'dragging' : ''} ${dragOverFolderId === folder.id && dragOverPosition === 'above' ? 'drag-over-above' : ''} ${dragOverFolderId === folder.id && dragOverPosition === 'below' ? 'drag-over-below' : ''}`}
                                      draggable
                                      onDragStart={(e) => {
                                        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('course-folder-toggle') || (e.target as HTMLElement).classList.contains('course-folder-title')) {
                                          setDraggedFolderId(folder.id);
                                        } else {
                                          e.preventDefault();
                                        }
                                      }}
                                      onDragEnd={() => {
                                        setDraggedFolderId(null);
                                        setDragOverFolderId(null);
                                        setDragOverPageId(null);
                                        setDragOverPosition(null);
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (draggedPageId) {
                                          setDragOverFolderId(folder.id);
                                        } else if (draggedFolderId && draggedFolderId !== folder.id) {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          const midY = rect.top + rect.height / 2;
                                          const position = e.clientY < midY ? 'above' : 'below';
                                          setDragOverFolderId(folder.id);
                                          setDragOverPosition(position);
                                        }
                                      }}
                                      onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!draggedFolderId) {
                                          setDragOverFolderId(null);
                                        }
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (draggedPageId) {
                                          movePageToFolder(draggedPageId, folder.id);
                                        } else if (draggedFolderId && draggedFolderId !== folder.id && dragOverPosition) {
                                          reorderFolders(draggedFolderId, folder.id, dragOverPosition);
                                        }
                                        setDraggedPageId(null);
                                        setDraggedFolderId(null);
                                        setDragOverFolderId(null);
                                        setDragOverPageId(null);
                                        setDragOverPosition(null);
                                      }}
                                    >
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
                                              Edit Module  
                                            </button>
                                            <button
                                              type="button"
                                              className="course-page-menu-item"
                                              onClick={() => {
                                                addPageForCourse(selectedCourse, folder.id);
                                                setOpenFolderMenuId(null);
                                              }}
                                            >
                                              Add Lesson in Module  
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
                                              Duplicate Module  
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
                                              Delete Module  
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      {!isCollapsed && folderPages.map((page) => (
                                        <div
                                          key={page.id}
                                          className={`${activePage && page.id === activePage.id ? "course-pages-item course-pages-item-child active" : "course-pages-item course-pages-item-child"} ${draggedPageId === page.id ? 'dragging' : ''} ${dragOverPageId === page.id && dragOverPosition === 'above' ? 'drag-over-above' : ''} ${dragOverPageId === page.id && dragOverPosition === 'below' ? 'drag-over-below' : ''}`}
                                          draggable
                                          onDragStart={() => setDraggedPageId(page.id)}
                                          onDragEnd={() => {
                                            setDraggedPageId(null);
                                            setDraggedFolderId(null);
                                            setDragOverFolderId(null);
                                            setDragOverPageId(null);
                                            setDragOverPosition(null);
                                          }}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (draggedPageId && draggedPageId !== page.id) {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              const midY = rect.top + rect.height / 2;
                                              const position = e.clientY < midY ? 'above' : 'below';
                                              setDragOverPageId(page.id);
                                              setDragOverPosition(position);
                                              setDragOverFolderId(null);
                                            }
                                          }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (draggedPageId && draggedPageId !== page.id && dragOverPosition) {
                                              reorderPages(draggedPageId, page.id, dragOverPosition, folder.id);
                                            }
                                            setDraggedPageId(null);
                                            setDraggedFolderId(null);
                                            setDragOverPageId(null);
                                            setDragOverPosition(null);
                                            setDragOverFolderId(null);
                                          }}
                                          onClick={() => {
                                            setActivePageId(page.id);
                                            setOpenPageMenuId(null);
                                            setIsCourseMenuOpen(false);
                                            setEditingLessonId(null);
                                          }}
                                        >
                                          <span style={{ cursor: "grab", marginRight: "8px" }}>⋮⋮</span>
                                          <span className="course-pages-item-title">
                                            {page.title}
                                            {page.status === "draft" && <span style={{ color: "#9ca3af", fontSize: "12px", marginLeft: "6px" }}>(Draft)</span>}
                                            {page.status === "published" && <span style={{ color: "#10b981", fontSize: "12px", marginLeft: "6px" }}>(Published)</span>}
                                          </span>
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
                                                Edit Lesson
                                              </button>
                                              <button type="button" className="course-page-menu-item" onClick={() => { 
                                                setChangeModulePageId(page.id);
                                                setSelectedModuleId(page.folderId);
                                                setIsChangeModuleModalOpen(true);
                                                setOpenPageMenuId(null); 
                                              }}>
                                                Change Module  
                                              </button>
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
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
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
                                                    {q.options.length > 2 && (
                                                      <button
                                                        type="button"
                                                        className="btn-ghost btn-danger btn-small"
                                                        style={{ padding: "4px 8px", fontSize: "12px" }}
                                                        onClick={() => {
                                                          const nextQuestions = [...(activePage.quizQuestions || [])];
                                                          const nextOptions = q.options.filter((_, i) => i !== optIdx);
                                                          // Adjust correctIndex if needed
                                                          let newCorrectIndex = q.correctIndex;
                                                          if (q.correctIndex === optIdx) {
                                                            newCorrectIndex = 0; // Reset to first option if deleted option was correct
                                                          } else if (q.correctIndex > optIdx) {
                                                            newCorrectIndex = q.correctIndex - 1; // Shift down if after deleted option
                                                          }
                                                          nextQuestions[qIdx] = { ...q, options: nextOptions, correctIndex: newCorrectIndex };
                                                          const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, quizQuestions: nextQuestions } : page));
                                                          updateCourse({ ...selectedCourse, pages: nextPages });
                                                        }}
                                                      >
                                                        Remove
                                                      </button>
                                                    )}
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
                                              <button
                                                type="button"
                                                className="btn-secondary btn-small"
                                                style={{ marginTop: 12 }}
                                                onClick={() => {
                                                  const nextQuestions = [...(activePage.quizQuestions || [])];
                                                  const nextOptions = [...q.options, ""];
                                                  nextQuestions[qIdx] = { ...q, options: nextOptions };
                                                  const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, quizQuestions: nextQuestions } : page));
                                                  updateCourse({ ...selectedCourse, pages: nextPages });
                                                }}
                                              >
                                                + Add Option
                                              </button>
                                            </div>
                                          ))}
                                          <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => {
                                              const newQuestion = { id: `q-${Date.now()}`, prompt: "", options: ["", ""], correctIndex: 0 };
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
                                          <button type="button" className="course-page-footer-button course-page-footer-save" onClick={() => {
                                            // Just save, don't redirect - stay on quiz page
                                            console.log('Quiz saved:', activePage.title);
                                          }}>
                                            SAVE
                                          </button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                    <div className="course-page-main-header">
                                      {editingLessonId === activePage.id && (
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
                                      )}
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                                        {editingLessonId === activePage.id ? (
                                          <input
                                            className="course-page-title-input"
                                            value={activePage.title}
                                            onChange={(event) => {
                                              const nextPages = pages.map((page) => (page.id === activePage.id ? { ...page, title: event.target.value } : page));
                                              updateCourse({ ...selectedCourse, pages: nextPages });
                                            }}
                                          />
                                        ) : (
                                          <>
                                            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{activePage.title}</h2>
                                            <button
                                              type="button"
                                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4 }}
                                              onClick={() => setEditingLessonId(activePage.id)}
                                              title="Edit lesson"
                                            >
                                              ✏️
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="course-page-editor-body">
                                      <div
                                        ref={bodyInputRef}
                                        className="course-page-body-input"
                                        contentEditable={editingLessonId === activePage.id}
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
                                    
                                    {(activePage.resourceLinks && activePage.resourceLinks.length > 0) || (activePage.fileUrls && activePage.fileUrls.length > 0) ? (
                                      <div style={{ marginTop: 24 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Resources</h3>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                          {activePage.resourceLinks?.map((link, idx) => (
                                            <div
                                              key={idx}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "8px 12px",
                                                backgroundColor: "#f9fafb",
                                                borderRadius: 6,
                                                position: "relative"
                                              }}
                                            >
                                              <div style={{ width: 24, height: 24, backgroundColor: "#ef4444", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16 }}>{getResourceIcon(link.href)}</div>
                                              <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: "none", color: "#111827", fontSize: 14 }}>{link.label}</a>
                                              {editingLessonId === activePage.id && (
                                                <button
                                                  type="button"
                                                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 16 }}
                                                  onClick={() => setOpenResourceMenuId(openResourceMenuId === `link-${idx}` ? null : `link-${idx}`)}
                                                >
                                                  ⋯
                                                </button>
                                              )}
                                              {openResourceMenuId === `link-${idx}` && (
                                                <div className="course-page-menu" style={{ right: 0, top: "100%", marginTop: 4 }}>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item"
                                                    onClick={() => {
                                                      setEditingResourceIndex(idx);
                                                      setEditingResourceType('link');
                                                      setLinkLabelDraft(link.label);
                                                      setLinkUrlDraft(link.href);
                                                      setIsLinkModalOpen(true);
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Edit
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item"
                                                    disabled={idx === 0}
                                                    onClick={() => {
                                                      if (idx > 0) {
                                                        const links = [...(activePage.resourceLinks || [])];
                                                        [links[idx - 1], links[idx]] = [links[idx], links[idx - 1]];
                                                        const nextPages = pages.map((page) => page.id === activePage.id ? { ...page, resourceLinks: links } : page);
                                                        updateCourse({ ...selectedCourse, pages: nextPages });
                                                      }
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Move up
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item"
                                                    disabled={idx === (activePage.resourceLinks?.length || 0) - 1}
                                                    onClick={() => {
                                                      const links = [...(activePage.resourceLinks || [])];
                                                      if (idx < links.length - 1) {
                                                        [links[idx], links[idx + 1]] = [links[idx + 1], links[idx]];
                                                        const nextPages = pages.map((page) => page.id === activePage.id ? { ...page, resourceLinks: links } : page);
                                                        updateCourse({ ...selectedCourse, pages: nextPages });
                                                      }
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Move down
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item course-page-menu-item-danger"
                                                    onClick={() => {
                                                      const links = (activePage.resourceLinks || []).filter((_, i) => i !== idx);
                                                      const nextPages = pages.map((page) => page.id === activePage.id ? { ...page, resourceLinks: links } : page);
                                                      updateCourse({ ...selectedCourse, pages: nextPages });
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {activePage.fileUrls?.map((fileUrl, idx) => {
                                            const fileData = typeof fileUrl === 'string' ? { label: fileUrl.split('/').pop() || '', href: fileUrl } : fileUrl;
                                            return (
                                            <div
                                              key={idx}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "8px 12px",
                                                backgroundColor: "#f9fafb",
                                                borderRadius: 6,
                                                position: "relative"
                                              }}
                                            >
                                              <div style={{ width: 24, height: 24, backgroundColor: "#ef4444", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 16 }}>{getResourceIcon(fileData.href)}</div>
                                              <a href={fileData.href} target="_blank" rel="noopener noreferrer" download style={{ flex: 1, textDecoration: "none", color: "#111827", fontSize: 14 }}>{fileData.label}</a>
                                              {editingLessonId === activePage.id && (
                                                <button
                                                  type="button"
                                                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 16 }}
                                                  onClick={() => setOpenResourceMenuId(openResourceMenuId === `file-${idx}` ? null : `file-${idx}`)}
                                                >
                                                  ⋯
                                                </button>
                                              )}
                                              {openResourceMenuId === `file-${idx}` && (
                                                <div className="course-page-menu" style={{ right: 0, top: "100%", marginTop: 4 }}>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item"
                                                    onClick={() => {
                                                      setEditingResourceIndex(idx);
                                                      setEditingResourceType('file');
                                                      setResourceFileLabelDraft(fileData.label);
                                                      setResourceFileUrlDraft(fileData.href);
                                                      setIsResourceFileModalOpen(true);
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Edit
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item"
                                                    disabled={idx === 0}
                                                    onClick={() => {
                                                      if (idx > 0) {
                                                        const files = [...(activePage.fileUrls || [])];
                                                        [files[idx - 1], files[idx]] = [files[idx], files[idx - 1]];
                                                        const nextPages = pages.map((page) => page.id === activePage.id ? { ...page, fileUrls: files } : page);
                                                        updateCourse({ ...selectedCourse, pages: nextPages });
                                                      }
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Move up
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item"
                                                    disabled={idx === (activePage.fileUrls?.length || 0) - 1}
                                                    onClick={() => {
                                                      const files = [...(activePage.fileUrls || [])];
                                                      if (idx < files.length - 1) {
                                                        [files[idx], files[idx + 1]] = [files[idx + 1], files[idx]];
                                                        const nextPages = pages.map((page) => page.id === activePage.id ? { ...page, fileUrls: files } : page);
                                                        updateCourse({ ...selectedCourse, pages: nextPages });
                                                      }
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Move down
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="course-page-menu-item course-page-menu-item-danger"
                                                    onClick={() => {
                                                      const files = (activePage.fileUrls || []).filter((_, i) => i !== idx);
                                                      const nextPages = pages.map((page) => page.id === activePage.id ? { ...page, fileUrls: files } : page);
                                                      updateCourse({ ...selectedCourse, pages: nextPages });
                                                      setOpenResourceMenuId(null);
                                                    }}
                                                  >
                                                    Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : null}
                                    
                                    {editingLessonId === activePage.id && (
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
                                      <button type="button" className="course-page-footer-button course-page-footer-cancel" onClick={() => setEditingLessonId(null)}>
                                        CANCEL
                                      </button>
                                      <button type="button" className="course-page-footer-button course-page-footer-save" onClick={() => setEditingLessonId(null)}>
                                        SAVE
                                      </button>
                                    </div>
                                    )}
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
