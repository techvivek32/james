import type { NextPage } from "next";
import { useEffect, useState, useRef, useCallback } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { CourseManagement } from "../../src/portals/admin/CourseManagement";
import { Course } from "../../src/types";

const CourseManagementPage: NextPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCoursesRef = useRef<Course[]>([]);

  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      try {
        const res = await fetch(`/api/courses?t=${Date.now()}`);
        if (res.ok && mounted) {
          const data = await res.json();
          // Sort courses by order field
          const sortedData = data.sort((a: Course, b: Course) => {
            const orderA = a.order ?? 999999;
            const orderB = b.order ?? 999999;
            return orderA - orderB;
          });
          setCourses(sortedData);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  async function handleCoursesChange(next: Course[]) {
    setCourses(next);
    latestCoursesRef.current = next;

    // Debounce — wait 800ms after last change before saving
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const toSave = latestCoursesRef.current;
      
      // Clean and normalize the data
      const cleanedCourses = toSave.map(course => {
        const { _id, __v, createdAt, updatedAt, ...cleanCourse } = course as any;
        const cleanedPages = Array.isArray(cleanCourse.pages) ? cleanCourse.pages.map((page: any) => ({
          id: page.id,
          title: page.title,
          status: page.status,
          body: page.body || "",
          folderId: page.folderId,
          videoUrl: page.videoUrl || "",
          transcript: page.transcript || "",
          pinnedCommunityPostUrl: page.pinnedCommunityPostUrl || "",
          resourceLinks: Array.isArray(page.resourceLinks) ? page.resourceLinks : [],
          fileUrls: Array.isArray(page.fileUrls) ? page.fileUrls : [],
          isQuiz: Boolean(page.isQuiz),
          quizQuestions: Array.isArray(page.quizQuestions) ? page.quizQuestions.map((q: any) => ({
            id: q.id,
            prompt: q.prompt,
            options: Array.isArray(q.options) ? q.options : [],
            correctIndex: q.correctIndex
          })) : []
        })) : [];

        return {
          ...cleanCourse,
          pages: cleanedPages,
          folders: Array.isArray(cleanCourse.folders) ? cleanCourse.folders : [],
          links: Array.isArray(cleanCourse.links) ? cleanCourse.links : [],
          quizQuestions: Array.isArray(cleanCourse.quizQuestions) ? cleanCourse.quizQuestions : [],
          lessonNames: Array.isArray(cleanCourse.lessonNames) ? cleanCourse.lessonNames : [],
          assetFiles: Array.isArray(cleanCourse.assetFiles) ? cleanCourse.assetFiles : [],
          marketingDocs: Array.isArray(cleanCourse.marketingDocs) ? cleanCourse.marketingDocs : []
        };
      });

      try {
        const res = await fetch("/api/courses/bulk", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedCourses)
        });
        if (!res.ok) console.error("Failed to save courses:", await res.text());
      } catch (err) {
        console.error("Failed to save courses:", err);
      }
    }, 800);
  }

  if (isLoading) {
    return (
      <AdminPageWrapper currentView="courseManagement">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <div style={{ color: '#6b7280' }}>Loading courses...</div>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper currentView="courseManagement">
      <CourseManagement courses={courses} onCoursesChange={handleCoursesChange} />
    </AdminPageWrapper>
  );
};

export default CourseManagementPage;
