import { useEffect, useState, useRef } from "react";

type LeaderRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  done: number;
  total: number;
  pct: number;
};

type CourseOption = { id: string; title: string };
type LessonPage = { id: string; title: string };
type UserOption = { id: string; name: string; email: string };

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function CourseLeaderboard() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Hidden users state
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("hiddenLeaderboardUsers");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [showHiddenList, setShowHiddenList] = useState(false);

  // Swipe tracking
  const [swipeStart, setSwipeStart] = useState<{ x: number; userId: string } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<{ userId: string; offset: number } | null>(null);
  const [showHiddenSection, setShowHiddenSection] = useState(false);

  // Override modal state
  const [showOverride, setShowOverride] = useState(false);
  const [overrideUsers, setOverrideUsers] = useState<UserOption[]>([]);
  const [overrideSelectedUser, setOverrideSelectedUser] = useState<UserOption | null>(null);
  const [overrideLessons, setOverrideLessons] = useState<LessonPage[]>([]);
  const [overrideChecked, setOverrideChecked] = useState<Set<string>>(new Set());
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [allCoursesRaw, setAllCoursesRaw] = useState<any[]>([]);

  function hideUser(userId: string) {
    const newHidden = new Set(hiddenUsers);
    newHidden.add(userId);
    setHiddenUsers(newHidden);
    localStorage.setItem("hiddenLeaderboardUsers", JSON.stringify([...newHidden]));
  }

  function unhideUser(userId: string) {
    const newHidden = new Set(hiddenUsers);
    newHidden.delete(userId);
    setHiddenUsers(newHidden);
    localStorage.setItem("hiddenLeaderboardUsers", JSON.stringify([...newHidden]));
  }

  function handleTouchStart(e: React.TouchEvent, userId: string) {
    setSwipeStart({ x: e.touches[0].clientX, userId });
  }

  function handleTouchMove(e: React.TouchEvent, userId: string) {
    if (!swipeStart || swipeStart.userId !== userId) return;
    const deltaX = e.touches[0].clientX - swipeStart.x;
    if (deltaX > 0) {
      setSwipeOffset({ userId, offset: deltaX });
    }
  }

  function handleTouchEnd(e: React.TouchEvent, userId: string) {
    if (!swipeStart || swipeStart.userId !== userId) return;
    const deltaX = e.changedTouches[0].clientX - swipeStart.x;
    if (deltaX > 100) {
      hideUser(userId);
    }
    setSwipeStart(null);
    setSwipeOffset(null);
  }

  function handleMouseDown(e: React.MouseEvent, userId: string) {
    setSwipeStart({ x: e.clientX, userId });
  }

  function handleMouseMove(e: React.MouseEvent, userId: string) {
    if (!swipeStart || swipeStart.userId !== userId) return;
    const deltaX = e.clientX - swipeStart.x;
    if (deltaX > 0) {
      setSwipeOffset({ userId, offset: deltaX });
    }
  }

  function handleMouseUp(e: React.MouseEvent, userId: string) {
    if (!swipeStart || swipeStart.userId !== userId) return;
    const deltaX = e.clientX - swipeStart.x;
    if (deltaX > 100) {
      hideUser(userId);
    }
    setSwipeStart(null);
    setSwipeOffset(null);
  }

  // Load courses on mount
  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => {
        setAllCoursesRaw(data);
        const published = data
          .filter((c) => c.status === "published")
          .map((c) => ({ id: c.id, title: c.title }));
        setCourses(published);
        if (published.length) loadLeaderboard(published[0], data);
      })
      .catch(console.error);
  }, []);

  // Close picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function loadLeaderboard(course: CourseOption, allCoursesData?: any[]) {
    setIsLoading(true);
    setSelectedCourse(course);
    setIsPickerOpen(false);
    setSearch("");
    try {
      const [coursesRes, usersRes] = await Promise.all([
        allCoursesData ? Promise.resolve(allCoursesData) : fetch("/api/courses").then((r) => r.ok ? r.json() : []),
        fetch("/api/users").then((r) => r.ok ? r.json() : []),
      ]);

      const courseData = Array.isArray(coursesRes) ? coursesRes : [];
      const fullCourse = courseData.find((c: any) => c.id === course.id);
      const allUsers = Array.isArray(usersRes) ? usersRes : [];

      const targetUsers = allUsers.filter(
        (u: any) =>
          !u.deleted && !u.suspended &&
          (u.role === "manager" || u.role === "sales" ||
            (u.roles || []).some((r: string) => r === "manager" || r === "sales"))
      );

      setTotalUsers(targetUsers.length);

      if (!fullCourse) { setRows([]); return; }

      const lessonPages = (fullCourse.pages || []).filter(
        (p: any) => p.status === "published" && !p.isQuiz
      );
      const total = lessonPages.length;
      const lessonIds = new Set(lessonPages.map((p: any) => p.id));

      const allProgress: any[] = await Promise.all(
        targetUsers.map((u: any) =>
          fetch(`/api/course-progress?userId=${u.id}&courseIds=${course.id}`)
            .then((r) => (r.ok ? r.json() : {}))
            .catch(() => ({}))
        )
      );

      const built: LeaderRow[] = targetUsers.map((u: any, i: number) => {
        const rec = allProgress[i][course.id] || {};
        const done = (rec.completedPages || []).filter((id: string) => lessonIds.has(id)).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return {
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          role: u.role || (u.roles || [])[0] || "",
          done,
          total,
          pct,
        };
      });

      built.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
      setRows(built);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Open override modal
  async function openOverride() {
    if (!selectedCourse) return;
    setShowOverride(true);
    setOverrideSelectedUser(null);
    setOverrideChecked(new Set());
    setOverrideLoading(true);
    try {
      const usersRes = await fetch("/api/users").then((r) => r.ok ? r.json() : []);
      const eligible = (Array.isArray(usersRes) ? usersRes : [])
        .filter((u: any) => !u.deleted && !u.suspended &&
          (u.role === "manager" || u.role === "sales" ||
            (u.roles || []).some((r: string) => r === "manager" || r === "sales")))
        .map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email }));
      setOverrideUsers(eligible);

      // Build lesson list from raw course data
      const raw = allCoursesRaw.find((c: any) => c.id === selectedCourse.id);
      const lessons: LessonPage[] = raw
        ? (raw.pages || [])
            .filter((p: any) => p.status === "published" && !p.isQuiz)
            .map((p: any) => ({ id: p.id, title: p.title || `Lesson ${p.order ?? ""}` }))
        : [];
      setOverrideLessons(lessons);
    } catch (e) {
      console.error(e);
    } finally {
      setOverrideLoading(false);
    }
  }

  // When user is selected in override, load their existing progress
  async function selectOverrideUser(user: UserOption) {
    setOverrideSelectedUser(user);
    if (!selectedCourse) return;
    try {
      const res = await fetch(`/api/course-progress?userId=${user.id}&courseIds=${selectedCourse.id}`);
      const data = res.ok ? await res.json() : {};
      const completed: string[] = data[selectedCourse.id]?.completedPages || [];
      setOverrideChecked(new Set(completed));
    } catch {
      setOverrideChecked(new Set());
    }
  }

  function toggleLesson(id: string) {
    setOverrideChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setOverrideChecked(new Set(overrideLessons.map((l) => l.id)));
  }

  function selectNone() {
    setOverrideChecked(new Set());
  }

  async function saveOverride() {
    if (!overrideSelectedUser || !selectedCourse) return;
    setOverrideSaving(true);
    try {
      const completedPages = Array.from(overrideChecked);
      const allDone = completedPages.length === overrideLessons.length && overrideLessons.length > 0;
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: overrideSelectedUser.id,
          courseId: selectedCourse.id,
          completedPages,
          ...(allDone ? { courseCompleted: true } : {}),
        }),
      });
      setShowOverride(false);
      await loadLeaderboard(selectedCourse);
    } catch (e) {
      console.error(e);
    } finally {
      setOverrideSaving(false);
    }
  }

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const enrolled = rows.filter((r) => r.done > 0).length;

  return (
    <div>
      {/* Leaderboard card */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        position: "relative",
      }}>
        {/* Header row */}
        <div style={{
          padding: "16px 24px", background: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>🏆 Course Leaderboard</div>
            {selectedCourse && (
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{selectedCourse.title}</div>
            )}
          </div>

          {/* Header right side buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Override button — invisible, bottom-right of leaderboard, hover to reveal */}
          {/* Course filter button + picker */}
          <div style={{ position: "relative" }} ref={pickerRef}>
            <button
              onClick={() => setIsPickerOpen((p) => !p)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 8,
                border: "1px solid #d1d5db", background: "#fff",
                fontSize: 13, fontWeight: 600, color: "#374151",
                cursor: "pointer",
              }}
            >
              🎯 Filter Course <span style={{ color: "#9ca3af" }}>▼</span>
            </button>

            {isPickerOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                width: 320, background: "#fff",
                border: "1px solid #e5e7eb", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 100, overflow: "hidden",
              }}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search courses..."
                    style={{
                      width: "100%", padding: "7px 10px",
                      border: "1px solid #d1d5db", borderRadius: 6,
                      fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {filteredCourses.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      No courses found
                    </div>
                  ) : (
                    filteredCourses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => loadLeaderboard(c)}
                        style={{
                          width: "100%", textAlign: "left",
                          padding: "10px 16px", border: "none",
                          background: selectedCourse?.id === c.id ? "#eff6ff" : "#fff",
                          color: selectedCourse?.id === c.id ? "#2563eb" : "#111827",
                          fontWeight: selectedCourse?.id === c.id ? 600 : 400,
                          fontSize: 13, cursor: "pointer",
                          borderBottom: "1px solid #f9fafb",
                        }}
                      >
                        {selectedCourse?.id === c.id && "✓ "}{c.title}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
            <div style={{ textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }} />
              <div style={{ color: "#6b7280", fontSize: 13 }}>Loading leaderboard...</div>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
            No data available for this course.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Rank", "User", "Role", "Lessons Completed", "Progress"].map((h) => (
                    <th key={h} style={{
                      padding: "11px 16px", textAlign: "left",
                      fontWeight: 600, color: "#374151",
                      borderBottom: "1px solid #e5e7eb",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.filter(row => !hiddenUsers.has(row.id)).map((row, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const offset = swipeOffset?.userId === row.id ? swipeOffset.offset : 0;
                  
                  return (
                    <tr 
                      key={row.id} 
                      style={{
                        background: isTop3 ? (rank === 1 ? "#fffbeb" : rank === 2 ? "#f9fafb" : "#fafafa") : idx % 2 === 0 ? "#fff" : "#fafafa",
                        cursor: "grab",
                        userSelect: "none",
                        transform: `translateX(${offset}px)`,
                        opacity: offset > 50 ? 1 - (offset - 50) / 100 : 1,
                        transition: swipeStart?.userId === row.id ? "none" : "transform 0.3s, opacity 0.3s",
                      }}
                      onMouseDown={(e) => handleMouseDown(e, row.id)}
                      onMouseMove={(e) => handleMouseMove(e, row.id)}
                      onMouseUp={(e) => handleMouseUp(e, row.id)}
                      onMouseLeave={(e) => {
                        if (swipeStart?.userId === row.id) {
                          handleMouseUp(e, row.id);
                        }
                      }}
                      onTouchStart={(e) => handleTouchStart(e, row.id)}
                      onTouchMove={(e) => handleTouchMove(e, row.id)}
                      onTouchEnd={(e) => handleTouchEnd(e, row.id)}
                    >
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", width: 60 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {MEDAL[rank] ? (
                            <span style={{ fontSize: 18 }}>{MEDAL[rank]}</span>
                          ) : (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 24, height: 24, borderRadius: "50%",
                              background: "#f3f4f6", color: "#6b7280",
                              fontSize: 12, fontWeight: 700,
                            }}>{rank}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{row.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{row.email}</div>
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6" }}>
                        <span style={{
                          padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                          background: row.role === "manager" ? "#ede9fe" : "#dbeafe",
                          color: row.role === "manager" ? "#6d28d9" : "#1d4ed8",
                          textTransform: "capitalize",
                        }}>
                          {row.role}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", color: "#374151" }}>
                        {row.done} / {row.total}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", minWidth: 160 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
                            <div style={{
                              width: `${row.pct}%`, height: "100%",
                              background: row.pct === 100 ? "#10b981" : row.pct > 0 ? "#f59e0b" : "#e5e7eb",
                              transition: "width 0.3s",
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 36 }}>{row.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom buttons row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px 16px 24px" }}>
          {/* Hidden Users toggle button - Left side (invisible) */}
          {hiddenUsers.size > 0 ? (
            <button
              onClick={() => setShowHiddenSection(p => !p)}
              style={{
                padding: "6px 14px", borderRadius: 6,
                border: "1px solid #fff", background: "#fff",
                color: "#fff", fontSize: 12, fontWeight: 600,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {showHiddenSection ? "▼" : "▶"} Hidden Users ({hiddenUsers.size})
            </button>
          ) : (
            <div></div>
          )}

          {/* Override button - Right side (invisible) */}
          <button
            onClick={openOverride}
            style={{
              padding: "6px 14px", borderRadius: 6,
              border: "1px solid #fff", boxShadow: "none",
              background: "#fff", color: "#fff",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              userSelect: "none", outline: "none",
            }}
          >
            ⚙ Override
          </button>
        </div>

      </div>

      {/* Hidden Users Section */}
      {hiddenUsers.size > 0 && showHiddenSection && (
        <div style={{ marginTop: 24 }}>
          <div style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              {/* Header */}
              <div style={{
                padding: "16px 24px", background: "#fef3c7",
                borderBottom: "1px solid #e5e7eb",
                display: "flex", justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#92400e" }}>👁️ Hidden Users</div>
                  <div style={{ fontSize: 13, color: "#78350f", marginTop: 2 }}>
                    These users are hidden from the main leaderboard
                  </div>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Rank", "User", "Role", "Lessons Completed", "Progress", "Actions"].map((h) => (
                        <th key={h} style={{
                          padding: "11px 16px", textAlign: "left",
                          fontWeight: 600, color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                          whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.filter(row => hiddenUsers.has(row.id)).map((row, idx) => {
                      const originalRank = rows.findIndex(r => r.id === row.id) + 1;
                      return (
                        <tr key={row.id} style={{
                          background: idx % 2 === 0 ? "#fff" : "#fafafa",
                        }}>
                          <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", width: 60 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {MEDAL[originalRank] ? (
                                <span style={{ fontSize: 18 }}>{MEDAL[originalRank]}</span>
                              ) : (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  width: 24, height: 24, borderRadius: "50%",
                                  background: "#f3f4f6", color: "#6b7280",
                                  fontSize: 12, fontWeight: 700,
                                }}>{originalRank}</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6" }}>
                            <div style={{ fontWeight: 600, color: "#111827" }}>{row.name}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{row.email}</div>
                          </td>
                          <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6" }}>
                            <span style={{
                              padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                              background: row.role === "manager" ? "#ede9fe" : "#dbeafe",
                              color: row.role === "manager" ? "#6d28d9" : "#1d4ed8",
                              textTransform: "capitalize",
                            }}>
                              {row.role}
                            </span>
                          </td>
                          <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", color: "#374151" }}>
                            {row.done} / {row.total}
                          </td>
                          <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", minWidth: 160 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
                                <div style={{
                                  width: `${row.pct}%`, height: "100%",
                                  background: row.pct === 100 ? "#10b981" : row.pct > 0 ? "#f59e0b" : "#e5e7eb",
                                  transition: "width 0.3s",
                                }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 36 }}>{row.pct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6" }}>
                            <button
                              onClick={() => unhideUser(row.id)}
                              style={{
                                padding: "6px 14px", borderRadius: 6,
                                border: "1px solid #3b82f6",
                                background: "#eff6ff", color: "#2563eb",
                                cursor: "pointer", fontSize: 12, fontWeight: 600,
                              }}
                            >
                              Unhide
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverride && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 14,
            width: "100%", maxWidth: 560,
            maxHeight: "90vh", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid #e5e7eb",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#f8fafc",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Progress Override</div>
                {selectedCourse && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{selectedCourse.title}</div>
                )}
              </div>
              <button
                onClick={() => setShowOverride(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 20, color: "#9ca3af", lineHeight: 1, padding: 4,
                }}
              >×</button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {overrideLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#6b7280", fontSize: 13 }}>
                  Loading...
                </div>
              ) : (
                <>
                  {/* User picker */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Select User
                    </label>
                    <input
                      type="text"
                      placeholder="Search users..."
                      onChange={e => {
                        const val = e.target.value.toLowerCase();
                        const list = document.getElementById("override-user-list");
                        if (list) {
                          Array.from(list.children).forEach((child: any) => {
                            const text = child.getAttribute("data-search") || "";
                            child.style.display = text.includes(val) ? "flex" : "none";
                          });
                        }
                      }}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "8px 8px 0 0", fontSize: 13, outline: "none", boxSizing: "border-box", borderBottom: "none" }}
                    />
                    <div
                      id="override-user-list"
                      style={{ border: "1px solid #d1d5db", borderRadius: "0 0 8px 8px", maxHeight: 200, overflowY: "auto", background: "#fff" }}
                    >
                      {overrideUsers.map((u, idx) => {
                        const isSelected = overrideSelectedUser?.id === u.id;
                        return (
                          <div
                            key={u.id}
                            data-search={`${u.name} ${u.email}`.toLowerCase()}
                            onClick={() => selectOverrideUser(u)}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "9px 12px", cursor: "pointer",
                              background: isSelected ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#fafafa",
                              borderBottom: idx < overrideUsers.length - 1 ? "1px solid #f3f4f6" : "none",
                              borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent",
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f9fafb"; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"; }}
                          >
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#4f46e5", flexShrink: 0 }}>
                              {(u.name || u.email || "?")[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                            </div>
                            {isSelected && <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, flexShrink: 0 }}>✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lesson checklist */}
                  {overrideSelectedUser && (
                    <div>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: 10,
                      }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                          Lesson Completions ({overrideChecked.size} / {overrideLessons.length})
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={selectAll}
                            style={{
                              fontSize: 11, padding: "4px 10px", borderRadius: 6,
                              border: "1px solid #d1d5db", background: "#f9fafb",
                              color: "#374151", cursor: "pointer", fontWeight: 600,
                            }}
                          >All</button>
                          <button
                            onClick={selectNone}
                            style={{
                              fontSize: 11, padding: "4px 10px", borderRadius: 6,
                              border: "1px solid #d1d5db", background: "#f9fafb",
                              color: "#374151", cursor: "pointer", fontWeight: 600,
                            }}
                          >None</button>
                        </div>
                      </div>

                      {overrideLessons.length === 0 ? (
                        <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
                          No published lessons found for this course.
                        </div>
                      ) : (
                        <div style={{
                          border: "1px solid #e5e7eb", borderRadius: 8,
                          overflow: "hidden", maxHeight: 320, overflowY: "auto",
                        }}>
                          {overrideLessons.map((lesson, idx) => {
                            const checked = overrideChecked.has(lesson.id);
                            return (
                              <label
                                key={lesson.id}
                                style={{
                                  display: "flex", alignItems: "center", gap: 12,
                                  padding: "10px 14px", cursor: "pointer",
                                  background: checked ? "#f0fdf4" : idx % 2 === 0 ? "#fff" : "#fafafa",
                                  borderBottom: idx < overrideLessons.length - 1 ? "1px solid #f3f4f6" : "none",
                                  transition: "background 0.15s",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleLesson(lesson.id)}
                                  style={{ width: 15, height: 15, accentColor: "#10b981", cursor: "pointer" }}
                                />
                                <span style={{ fontSize: 13, color: "#111827", flex: 1 }}>{lesson.title}</span>
                                {checked && (
                                  <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>✓ Done</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div style={{
              padding: "14px 24px", borderTop: "1px solid #e5e7eb",
              display: "flex", justifyContent: "flex-end", gap: 10,
              background: "#f8fafc",
            }}>
              <button
                onClick={() => setShowOverride(false)}
                style={{
                  padding: "8px 18px", borderRadius: 8,
                  border: "1px solid #d1d5db", background: "#fff",
                  fontSize: 13, fontWeight: 600, color: "#374151",
                  cursor: "pointer",
                }}
              >Cancel</button>
              <button
                onClick={saveOverride}
                disabled={!overrideSelectedUser || overrideSaving}
                style={{
                  padding: "8px 20px", borderRadius: 8,
                  border: "none",
                  background: !overrideSelectedUser || overrideSaving ? "#d1d5db" : "#2563eb",
                  fontSize: 13, fontWeight: 600, color: "#fff",
                  cursor: !overrideSelectedUser || overrideSaving ? "not-allowed" : "pointer",
                }}
              >
                {overrideSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
