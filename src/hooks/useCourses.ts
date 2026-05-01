import { useEffect, useState, useRef } from "react";
import { Course } from "../types";

export function useCourses(userId?: string, userRole?: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastDataRef = useRef<string>("");

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    async function loadCourses(isInitial = false) {
      if (!userId) {
        if (mounted && isInitial) setIsLoading(false);
        return;
      }

      if (isInitial) setIsLoading(true);

      try {
        const res = await fetch(`/api/courses?userId=${userId}&userRole=${userRole}&t=${Date.now()}`);
        if (res.ok && mounted) {
          const data = await res.json();
          
          // Create a hash of the data to detect changes
          const dataHash = JSON.stringify(data.map((c: Course) => ({ id: c.id, status: c.status, order: c.order })));
          
          // Only update if data actually changed
          if (dataHash !== lastDataRef.current) {
            lastDataRef.current = dataHash;
            const sortedData = data.sort((a: Course, b: Course) => {
              const orderA = a.order ?? 999999;
              const orderB = b.order ?? 999999;
              return orderA - orderB;
            });
            setCourses(sortedData);
          }
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        if (mounted && isInitial) setIsLoading(false);
      }
    }

    if (userId) {
      loadCourses(true);
      // Poll every 5 seconds but only update if data changed
      intervalId = setInterval(() => loadCourses(false), 5000);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [userId, userRole]);

  return { courses, isLoading };
}
