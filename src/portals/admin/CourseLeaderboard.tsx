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

  // Load courses on mount
  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.ok ? r.json() : [])
      .then((data: any[]) => {
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

      // Sort descending by pct
      built.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));
      setRows(built);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const enrolled = rows.filter((r) => r.done > 0).length;

  return (
    <div>
      {/* Mini dashboard */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 1, background: "#e5e7eb",
        border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 24,
      }}>
        {[
          { label: "Total Courses", value: courses.length, color: "#7c3aed", icon: "📚" },
          { label: "Total Users Enrolled", value: enrolled, color: "#2563eb", icon: "👥" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard card */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
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
                {/* Search */}
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
                {/* Course list */}
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
                {rows.map((row, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <tr key={row.id} style={{
                      background: isTop3 ? (rank === 1 ? "#fffbeb" : rank === 2 ? "#f9fafb" : "#fafafa") : idx % 2 === 0 ? "#fff" : "#fafafa",
                    }}>
                      {/* Rank */}
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
                      {/* User */}
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{row.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{row.email}</div>
                      </td>
                      {/* Role */}
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
                      {/* Lessons */}
                      <td style={{ padding: "11px 16px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", color: "#374151" }}>
                        {row.done} / {row.total}
                      </td>
                      {/* Progress bar */}
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
      </div>
    </div>
  );
}
