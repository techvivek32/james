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

export function AdminDashboard(props: { users: UserProfile[]; courses: Course[] }) {
  const [showSocialDetails, setShowSocialDetails] = useState(true);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>([]);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [botStats, setBotStats] = useState<any>({ totalBots: 0, totalSessions: 0, totalMessages: 0 });
  const users = props.users;
  const courses = props.courses;

  useEffect(() => {
    loadSocialMetrics();
    loadCourseProgress();
    loadBotStats();
  }, []);

  async function loadSocialMetrics() {
    try {
      console.log("Dashboard: Loading social metrics...");
      const res = await fetch("/api/social-media-metrics");
      if (res.ok) {
        const data = await res.json();
        console.log("Dashboard: Loaded social metrics:", data);
        setSocialMetrics(data);
      } else {
        console.error("Dashboard: Failed to load social metrics:", await res.text());
      }
    } catch (error) {
      console.error("Dashboard: Failed to load social metrics:", error);
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

  // Real business plan data from users
  const businessPlans = users
    .filter((user) => !!user.businessPlan)
    .map((user) => user.businessPlan!);

  const totalRevenue = businessPlans.reduce(
    (sum, plan) => sum + (plan.revenueGoal || 0),
    0
  );
  
  // Calculate average days from business plans
  const plansWithDays = businessPlans.filter(plan => plan.daysPerWeek);
  const avgDays = plansWithDays.length > 0 
    ? Math.round(plansWithDays.reduce((sum, plan) => sum + (plan.daysPerWeek || 0), 0) / plansWithDays.length)
    : 0;

  const publishedCourses = courses.filter((course) => course.status !== "draft");

  // Calculate real course completion from user progress data
  function getCourseCompletion(courseId: string) {
    const progressForCourse = courseProgress.filter(p => p.courseId === courseId);
    if (progressForCourse.length === 0) return 0;
    const totalCompletion = progressForCourse.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
    return Math.round(totalCompletion / progressForCourse.length);
  }

  // Calculate overall completion from all user progress
  const allCompletionValues = courseProgress.map(p => p.completionPercentage || 0);
  const totalCourseCompletionPercentage =
    allCompletionValues.length > 0
      ? Math.round(allCompletionValues.reduce((sum, value) => sum + value, 0) / allCompletionValues.length)
      : 0;

  // Real bot stats - count from actual chat sessions in database
  const totalBots = botStats.totalBots || 0;
  const totalChatSessions = botStats.totalSessions || 0;
  const totalBotUpdates = botStats.totalMessages || 0;

  // Use real data from database
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

  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Sales Reps & Managers</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-4">
            <DashboardCard title="Total Sales Reps" value={totalSalesReps.toString()} />
            <DashboardCard title="Total Managers" value={totalManagers.toString()} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Business Plan Roll-up</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-4">
            <DashboardCard title="Total Business Plans" value={businessPlans.length.toString()} />
            <DashboardCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} />
            <DashboardCard title="Avg Days to Close" value={avgDays.toString()} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Course Completion by Module</span>
          </div>
        </div>
        <div className="panel-body">
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
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Bot Dashboard</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-4">
            <DashboardCard title="Total Bots" value={totalBots.toString()} />
            <DashboardCard title="Total Chat Sessions" value={totalChatSessions.toLocaleString()} />
            <DashboardCard title="Total Bot Updates" value={totalBotUpdates.toString()} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-header-row">
            <span>Social Media Dashboard</span>
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
          </div>
        </div>
        <div className="panel-body">
          {socialPlatforms.length === 0 ? (
            <div className="panel-empty">
              No social media metrics configured yet.{" "}
              <a href="/admin/social-media-metrics" style={{ color: "#2563eb", textDecoration: "underline" }}>
                Add metrics
              </a>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Left Side - Data Table */}
                <div>
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
                          gridTemplateColumns: "minmax(0, 180px) repeat(3, minmax(0, 120px))",
                          columnGap: 12,
                          rowGap: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 8,
                          padding: "4px 0",
                          borderBottom: "1px solid #e5e7eb",
                          color: "#6b7280"
                        }}
                      >
                        <div>Platform</div>
                        <div style={{ textAlign: "right" }}>Followers</div>
                        <div style={{ textAlign: "right" }}>Posts</div>
                        <div style={{ textAlign: "right" }}>Views</div>
                      </div>
                      {socialPlatforms.map((platform, index) => (
                        <div
                          key={platform.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 180px) repeat(3, minmax(0, 120px))",
                            columnGap: 12,
                            rowGap: 8,
                            alignItems: "center",
                            padding: "8px 0",
                            borderTop: index === 0 ? "1px solid #e5e7eb" : "1px solid #f1f5f9",
                            backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                            fontSize: 13
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
                          <div style={{ textAlign: "right" }}>{platform.followers.toLocaleString()}</div>
                          <div style={{ textAlign: "right" }}>{platform.posts30d.toLocaleString()}</div>
                          <div style={{ textAlign: "right" }}>{platform.views30d.toLocaleString()}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Right Side - Charts */}
                <div>
                  <SocialMediaCharts platforms={socialPlatforms} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
