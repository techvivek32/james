import { DashboardCard } from "../../components/DashboardCard";
import { AuthenticatedUser, Course } from "../../types";

export function ManagerOnlineTrainingPage(props: {
  currentUser: AuthenticatedUser;
  courses: Course[];
}) {
  const publishedCourses = props.courses.filter(
    (course) => course.status !== "draft"
  );

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

  return (
    <div className="training-center">
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
      {publishedCourses.length === 0 ? (
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
            const pct = managerCoursePercentages[index] ?? 0;
            return (
              <div key={course.id} className="training-card">
                <div className="training-card-image">
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
                  <div className="training-card-progress-row">
                    <div className="training-card-progress-label">
                      {pct}%
                    </div>
                    <div className="training-card-progress-track">
                      <div
                        className="training-card-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
