import type { NextApiRequest, NextApiResponse } from "next";

// Direct web progress API - returns exact percentages that web shows
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    const { userId, courseIds } = req.query;
    
    console.log('🌐 Web Progress API - Direct fetch for:', userId);
    
    if (!userId || !courseIds) {
      res.status(400).json({ error: 'userId and courseIds required' });
      return;
    }

    try {
      // Call web's existing course-progress API to get exact data
      const webApiUrl = `https://millerstorm.tech/api/course-progress?userId=${userId}&courseIds=${courseIds}`;
      const webResponse = await fetch(webApiUrl);
      
      if (!webResponse.ok) {
        throw new Error(`Web API failed: ${webResponse.status}`);
      }
      
      const webProgressData = await webResponse.json();
      console.log('✅ Got web progress data:', Object.keys(webProgressData).length, 'courses');
      
      // Get course details to calculate percentages exactly like web does
      const coursesResponse = await fetch(`https://millerstorm.tech/api/courses`);
      const coursesData = await coursesResponse.json();
      
      const result: Record<string, number> = {};
      
      Object.keys(webProgressData).forEach(courseId => {
        const progressData = webProgressData[courseId];
        const course = coursesData.find((c: any) => c.id === courseId);
        
        const completedPages = progressData.completedPages?.length || 0;
        const totalPages = course?.pages?.length || 0;
        const percentage = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
        
        result[courseId] = percentage;
        console.log(`🌐 ${course?.title || courseId}: ${percentage}% (${completedPages}/${totalPages})`);
      });
      
      res.status(200).json(result);
      return;
      
    } catch (error) {
      console.error('❌ Web progress fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch web progress' });
      return;
    }
  }

  res.setHeader("Allow", "GET");
  res.status(405).end();
}