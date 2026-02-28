import { useState } from "react";
import { DashboardCard } from "../../components/DashboardCard";
import { Course, UserProfile } from "../../types";

export function AdminDashboard(props: { users: UserProfile[]; courses: Course[] }) {
  const users = props.users;
  const courses = props.courses;

  const totalSalesReps = users.filter((user) => user.role === "sales").length;
  const totalManagers = users.filter((user) => user.role === "manager").length;

  const businessPlans = users
    .filter((user) => !!user.businessPlan)
    .map((user) => user.businessPlan!);

  const totalRevenue = businessPlans.reduce(
    (sum, plan) => sum + (plan.targetRevenue || 0),
    0
  );
  const totalDays = businessPlans.reduce(
    (sum, plan) => sum + (plan.daysToClose || 0),
    0
  );
  const avgDays = businessPlans.length > 0 ? Math.round(totalDays / businessPlans.length) : 0;

  const publishedCourses = courses.filter((course) => course.status !== "draft");

  function getUserCourseCompletion(user: UserProfile, course: Course) {
    const userCode = (user.id.charCodeAt(0) || 0) + (user.name.charCodeAt(0) || 0);
    const courseCode = course.id.charCodeAt(0) || 0;
    const raw = (userCode * 7 + courseCode * 11) % 101;
    return raw;
  }

  const completionValues: number[] = [];
  users.forEach((user) => {
    if (user.role !== "sales" && user.role !== "manager") return;
    publishedCourses.forEach((course) => {
      completionValues.push(getUserCourseCompletion(user, course));
    });
  });

  const totalCourseCompletionPercentage =
    completionValues.length > 0
      ? Math.round(completionValues.reduce((sum, value) => sum + value, 0) / completionValues.length)
      : 0;

  const totalBots = 3;
  const totalChatSessions = 1247;
  const totalBotUpdates = 18;

  const socialPlatforms = [
    { id: "instagram", name: "Instagram", followers: 18250, posts30d: 36, views30d: 245000 },
    { id: "tiktok", name: "TikTok", followers: 30420, posts30d: 28, views30d: 612000 },
    { id: "facebook", name: "Facebook", followers: 9450, posts30d: 18, views30d: 121000 },
    { id: "youtube", name: "YouTube", followers: 12780, posts30d: 12, views30d: 398000 }
  ];

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
              const courseCompletions = users
                .filter((u) => u.role === "sales" || u.role === "manager")
                .map((u) => getUserCourseCompletion(u, course));
              const avgCompletion =
                courseCompletions.length > 0
                  ? Math.round(courseCompletions.reduce((sum, val) => sum + val, 0) / courseCompletions.length)
                  : 0;
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
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-3" style={{ marginBottom: 16 }}>
            <DashboardCard title="Total Followers" value={totalFollowers.toLocaleString()} />
            <DashboardCard title="Posts (Last 30 Days)" value={totalPosts30d.toLocaleString()} />
            <DashboardCard title="Views (Last 30 Days)" value={totalViews30d.toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  );
}
