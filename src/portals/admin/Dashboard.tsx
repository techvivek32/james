import { useState, useEffect } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { SocialMediaCharts } from "../../components/SocialMediaCharts";
import { Course, UserProfile } from "../../types";

type SocialMetric = {
  id: string;
  platform: string;
  platformName: string;
  followers: number;
  posts30d: number;
  views30d: number;
};

type DashboardSection = {
  id: string;
  title: string;
  component: JSX.Element;
};

export function AdminDashboard(props: { users: UserProfile[]; courses: Course[] }) {
  const [showSocialDetails, setShowSocialDetails] = useState(true);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [botStats, setBotStats] = useState<any>({ totalBots: 0, totalSessions: 0, totalMessages: 0 });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const users = props.users;
  const courses = props.courses;

  useEffect(() => {
    loadSocialMetrics();
    loadCourseProgress();
    loadBotStats();
  }, []);

  useEffect(() => {
    initializeSections();
  }, [socialMetrics, courseProgress, botStats, users, courses, showSocialDetails]);

  useEffect(() => {
    // Save section order to localStorage whenever sections change
    if (sections.length > 0) {
      const sectionOrder = sections.map(s => s.id);
      localStorage.setItem('dashboardSectionOrder', JSON.stringify(sectionOrder));
    }
  }, [sections]);

  async function loadSocialMetrics() {
    try {
      const res = await fetch("/api/social-media-metrics");
      if (res.ok) {
        const data = await res.json();
        setSocialMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load social metrics:", error);
    }
  }

  async function loadCourseProgress() {
    try {
      const res = await fetch("/api/course-progress");
      if (res.ok) {
        const data = await res.json();
        setCourseProgress(data);
      }
    } catch (error) {
      console.error("Failed to load course progress:", error);
    }
  }

  async function loadBotStats() {
    try {
      const res = await fetch("/api/bot-stats");
      if (res.ok) {
        const data = await res.json();
        setBotStats(data);
      }
    } catch (error) {
      console.error("Failed to load bot stats:", error);
    }
  }

  const totalSalesReps = users.filter((user) => user.role === "sales").length;
  const totalManagers = users.filter((user) => user.role === "manager").length;

  const businessPlans = users
    .filter((user) => !!user.businessPlan)
    .map((user) => user.businessPlan!);

  const totalRevenue = businessPlans.reduce(
    (sum, plan) => sum + (plan.revenueGoal || 0),
    0
  );
  
  const plansWithDays = businessPlans.filter(plan => plan.daysPerWeek);
  const avgDays = plansWithDays.length > 0 
    ? Math.round(plansWithDays.reduce((sum, plan) => sum + (plan.daysPerWeek || 0), 0) / plansWithDays.length)
    : 0;

  const publishedCourses = courses.filter((course) => course.status !== "draft");

  function getCourseCompletion(courseId: string) {
    const progressForCourse = courseProgress.filter(p => p.courseId === courseId);
    if (progressForCourse.length === 0) return 0;
    const totalCompletion = progressForCourse.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
    return Math.round(totalCompletion / progressForCourse.length);
  }

  const allCompletionValues = courseProgress.map(p => p.completionPercentage || 0);
  const totalCourseCompletionPercentage =
    allCompletionValues.length > 0
      ? Math.round(allCompletionValues.reduce((sum, value) => sum + value, 0) / allCompletionValues.length)
      : 0;

  const totalBots = botStats.totalBots || 0;
  const totalChatSessions = botStats.totalSessions || 0;
  const totalBotUpdates = botStats.totalMessages || 0;

  const socialPlatforms = socialMetrics.map(metric => ({
    id: metric.platform,
    name: metric.platformName,
    followers: metric.followers,
    posts30d: metric.posts30d,
    views30d: metric.views30d
  }));

  const totalFollowers = socialPlatforms.reduce((sum, platform) => sum + platform.followers, 0);
  const totalPosts30d = socialPlatforms.reduce((sum, platform) => sum + platform.posts30d, 0);
  const totalViews30d = socialPlatforms.reduce((sum, platform) => sum + platform.views30d, 0);

  function initializeSections() {
    const defaultSections: DashboardSection[] = [
      {
        id: "sales-managers",
        title: "Sales Reps & Managers",
        component: (
          <div className="grid grid-4">
            <DashboardCard title="Total Sales Reps" value={totalSalesReps.toString()} />
            <DashboardCard title="Total Managers" value={totalManagers.toString()} />
          </div>
        )
      },
      {
        id: "business-plan",
        title: "Business Plan Roll-up",
        component: (
          <div className="grid grid-4">
            <DashboardCard title="Total Business Plans" value={businessPlans.length.toString()} />
            <DashboardCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} />
            <DashboardCard title="Avg Days to Close" value={avgDays.toString()} />
          </div>
        )
      },
      {
        id: "course-completion",
        title: "Course Completion by Module",
        component: (
          <div className="grid grid-4">
            <DashboardCard
              title="Total Course Completion"
              value={`${totalCourseCompletionPercentage}%`}
              description="Across all trainings"
            />
            {publishedCourses.map((course) => {
              const avgCompletion = getCourseCompletion(course.id);
              return (
                <DashboardCard
                  key={course.id}
                  title={course.title}
                  value={`${avgCompletion}%`}
                  description="Module completion"
                />
              );
            })}
          </div>
        )
      },
      {
        id: "bot-dashboard",
        title: "Bot Dashboard",
        component: (
          <div className="grid grid-4">
            <DashboardCard title="Total Bots" value={totalBots.toString()} />
            <DashboardCard title="Total Chat Sessions" value={totalChatSessions.toLocaleString()} />
            <DashboardCard title="Total Bot Updates" value={totalBotUpdates.toString()} />
          </div>
        )
      },
      {
        id: "social-media",
        title: "Social Media Dashboard",
        component: (
          <>
            {socialPlatforms.length === 0 ? (
              <div className="panel-empty">
                No social media metrics configured yet.{" "}
                <a href="/admin/social-media-metrics" style={{ color: "#2563eb", textDecoration: "underline" }}>
                  Add metrics
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-3" style={{ marginBottom: 16 }}>
                  <DashboardCard title="Total Followers" value={totalFollowers.toLocaleString()} />
                  <DashboardCard title="Posts (Last 30 Days)" value={totalPosts30d.toLocaleString()} />
                  <DashboardCard title="Views (Last 30 Days)" value={totalViews30d.toLocaleString()} />
                </div>
                {showSocialDetails && (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 8,
                        padding: "12px 16px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#6b7280",
                        backgroundColor: "#f9fafb"
                      }}
                    >
                      <div>Platform</div>
                      <div style={{ textAlign: "center" }}>Followers</div>
                      <div style={{ textAlign: "center" }}>Posts</div>
                      <div style={{ textAlign: "center" }}>Views</div>
                    </div>
                    {socialPlatforms.map((platform, index) => (
                      <div
                        key={platform.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr 1fr",
                          gap: 12,
                          alignItems: "center",
                          padding: "12px 16px",
                          borderBottom: "1px solid #f1f5f9",
                          backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                          fontSize: 14
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>
                            {platform.id === "instagram" && "📷"}
                            {platform.id === "facebook" && "👥"}
                            {platform.id === "tiktok" && "🎵"}
                            {platform.id === "youtube" && "▶️"}
                          </span>
                          <span style={{ fontWeight: 500 }}>{platform.name}</span>
                        </div>
                        <div style={{ textAlign: "center", fontWeight: 500 }}>{platform.followers.toLocaleString()}</div>
                        <div style={{ textAlign: "center", fontWeight: 500 }}>{platform.posts30d.toLocaleString()}</div>
                        <div style={{ textAlign: "center", fontWeight: 500 }}>{platform.views30d.toLocaleString()}</div>
                      </div>
                    ))}
                  </>
                )}
                
                <div style={{ marginTop: 24 }}>
                  <SocialMediaCharts platforms={socialPlatforms} />
                </div>
              </>
            )}
          </>
        )
      }
    ];

    // Try to restore saved order from localStorage
    try {
      const savedOrder = localStorage.getItem('dashboardSectionOrder');
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        const orderedSections = orderIds
          .map((id: string) => defaultSections.find(s => s.id === id))
          .filter(Boolean);
        
        // Add any new sections that weren't in saved order
        const existingIds = orderIds;
        const newSections = defaultSections.filter(s => !existingIds.includes(s.id));
        
        setSections([...orderedSections, ...newSections]);
        return;
      }
    } catch (error) {
      console.error('Failed to restore section order:', error);
    }

    // Use default order if no saved order exists
    setSections(defaultSections);
  }

  function handleDragStart(e: React.DragEvent, sectionId: string) {
    setDraggedItem(sectionId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = sections.findIndex(s => s.id === draggedItem);
    const targetIndex = sections.findIndex(s => s.id === targetId);

    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    setSections(newSections);
    setDraggedItem(null);
  }

  return (
    <div>
      {sections.map((section) => (
        <div
          key={section.id}
          className="panel"
          style={{ 
            marginBottom: 16,
            opacity: draggedItem === section.id ? 0.5 : 1,
            transition: "opacity 0.2s ease"
          }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, section.id)}
        >
          <div className="panel-header">
            <div className="panel-header-row">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "2px solid #6b7280",
                    backgroundColor: "#f9fafb",
                    cursor: "move",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#6b7280",
                    transition: "all 0.2s ease"
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, section.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e5e7eb";
                    e.currentTarget.style.borderColor = "#374151";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.borderColor = "#6b7280";
                  }}
                >
                  ⋮⋮
                </button>
                <span>{section.title}</span>
              </div>
              {section.id === "social-media" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="btn-secondary btn-small"
                    onClick={() => window.location.href = "/admin/social-media-metrics"}
                  >
                    Manage Metrics
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-small"
                    onClick={() => setShowSocialDetails(!showSocialDetails)}
                  >
                    {showSocialDetails ? "Hide Details" : "Show Details"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="panel-body">
            {section.component}
          </div>
        </div>
      ))}
    </div>
  );
}