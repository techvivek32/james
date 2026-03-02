import { useState, useMemo } from "react";
import { Course } from "../../types";

export function TrainingCenter(props: { courses: Course[] }) {
  const courses = props.courses.filter((course) => course.status !== "draft");
  const [search, setSearch] = useState("");

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

  return (
    <div className="training-center">
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
      {filteredCourses.length > 0 ? (
        <div className="training-card-grid">
          {filteredCourses.map((course: Course) => (
            <div key={course.id} className="training-card">
              <div className="training-card-image">
                <div className="training-card-image-overlay">
                  {course.tagline && (
                    <span className="training-card-chip">{course.tagline}</span>
                  )}
                </div>
              </div>
              <div className="training-card-body">
                <div className="training-card-title">{course.title}</div>
                <div className="training-card-progress-row">
                  <div className="training-card-progress-label">0%</div>
                  <div className="training-card-progress-track">
                    <div className="training-card-progress-fill" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel-empty">No trainings match your search yet.</div>
      )}
    </div>
  );
}
