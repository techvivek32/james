import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { AdminPageWrapper } from "../../src/portals/admin/AdminPageWrapper";
import { CourseManagement } from "../../src/portals/admin/CourseManagement";
import { Course } from "../../src/types";

const CourseManagementPage: NextPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) setCourses(await res.json());
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    }
    loadData();
  }, []);

  async function handleCoursesChange(next: Course[]) {
    console.log("handleCoursesChange called with:", next.map(c => ({ id: c.id, pagesCount: c.pages?.length || 0 })));
    setCourses(next);
    
    // Clean and normalize the data
    const cleanedCourses = next.map(course => {
      const { _id, __v, createdAt, updatedAt, ...cleanCourse } = course as any;
      // Clean pages to preserve quiz data
      const cleanedPages = Array.isArray(cleanCourse.pages) ? cleanCourse.pages.map((page: any) => {
        const cleanedPage = {
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
        };
        return cleanedPage;
      }) : [];
      
      const cleaned = {
        ...cleanCourse,
        pages: cleanedPages,
        folders: Array.isArray(cleanCourse.folders) ? cleanCourse.folders : [],
        links: Array.isArray(cleanCourse.links) ? cleanCourse.links : [],
        quizQuestions: Array.isArray(cleanCourse.quizQuestions) ? cleanCourse.quizQuestions : [],
        lessonNames: Array.isArray(cleanCourse.lessonNames) ? cleanCourse.lessonNames : [],
        assetFiles: Array.isArray(cleanCourse.assetFiles) ? cleanCourse.assetFiles : [],
        marketingDocs: Array.isArray(cleanCourse.marketingDocs) ? cleanCourse.marketingDocs : []
      };
      console.log(`Course ${course.id}: pages=${cleanCourse.pages?.length}, cleaned pages=${cleaned.pages.length}`);
      return cleaned;
    });
    
    console.log("Saving courses to API:");
    cleanedCourses.forEach(c => {
      console.log(`Course ${c.id}: ${c.pages?.length || 0} pages`);
      c.pages?.forEach(p => {
        if (p.isQuiz) {
          console.log(`  - Quiz: ${p.title}, questions: ${p.quizQuestions?.length || 0}`);
        }
      });
    });
    try {
      const res = await fetch("/api/courses/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedCourses)
      });
      if (!res.ok) {
        console.error("Failed to save courses:", await res.text());
      } else {
        const saved = await res.json();
        console.log("Courses saved successfully:", saved);
      }
    } catch (err) {
      console.error("Failed to save courses:", err);
    }
  }

  return (
    <AdminPageWrapper currentView="courseManagement">
      <CourseManagement courses={courses} onCoursesChange={handleCoursesChange} />
    </AdminPageWrapper>
  );
};

export default CourseManagementPage;
