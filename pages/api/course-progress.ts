import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongo } from "../../src/lib/mongodb";

// Mock progress data - same as progress.ts
const mockProgressData: Record<string, Record<string, any>> = {
  "ishitapatel3456@gmail.com": {
    // Live server course IDs
    "course-1772692234004": { // Million Dollar Playbook
      completedPages: ["page1", "page2"],
      totalPages: 33,
      isCompleted: false
    },
    "course-1773328848873": { // Adjuster Appointment
      completedPages: ["page1"],
      totalPages: 15,
      isCompleted: false
    },
    "course-1773283521827": { // Objections Masterclass
      completedPages: [],
      totalPages: 20,
      isCompleted: false
    },
    // Local course IDs (fallback)
    "million-dollar-playbook": {
      completedPages: ["page1", "page2"],
      totalPages: 33,
      isCompleted: false
    },
    "adjuster-appointment": {
      completedPages: ["page1"],
      totalPages: 15,
      isCompleted: false
    },
    "objections-masterclass": {
      completedPages: [],
      totalPages: 20,
      isCompleted: false
    }
  },
  "chris.lee@company.com": {
    // Live server course IDs
    "course-1772692234004": {
      completedPages: ["page1", "page2", "page3"],
      totalPages: 33,
      isCompleted: false
    },
    "course-1773328848873": {
      completedPages: ["page1", "page2"],
      totalPages: 15,
      isCompleted: false
    },
    "course-1773283521827": {
      completedPages: ["page1"],
      totalPages: 20,
      isCompleted: false
    },
    // Local course IDs (fallback)
    "million-dollar-playbook": {
      completedPages: ["page1", "page2", "page3"],
      totalPages: 33,
      isCompleted: false
    },
    "adjuster-appointment": {
      completedPages: ["page1", "page2"],
      totalPages: 15,
      isCompleted: false
    },
    "objections-masterclass": {
      completedPages: ["page1"],
      totalPages: 20,
      isCompleted: false
    }
  },
  "sales-1": {
    // Live server course IDs
    "course-1772692234004": {
      completedPages: ["page1", "page2", "page3"],
      totalPages: 33,
      isCompleted: false
    },
    "course-1773328848873": {
      completedPages: ["page1", "page2"],
      totalPages: 15,
      isCompleted: false
    },
    "course-1773283521827": {
      completedPages: ["page1"],
      totalPages: 20,
      isCompleted: false
    },
    // Local course IDs (fallback)
    "million-dollar-playbook": {
      completedPages: ["page1", "page2", "page3"],
      totalPages: 33,
      isCompleted: false
    },
    "adjuster-appointment": {
      completedPages: ["page1", "page2"],
      totalPages: 15,
      isCompleted: false
    },
    "objections-masterclass": {
      completedPages: ["page1"],
      totalPages: 20,
      isCompleted: false
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  await connectMongo();

  if (req.method === "GET") {
    const { userId, courseIds } = req.query;
    
    console.log('📊 Course Progress API called for userId:', userId, 'courseIds:', courseIds);
    
    if (!userId || !courseIds) {
      res.status(400).json({ error: 'userId and courseIds are required' });
      return;
    }

    try {
      const courseIdArray = (courseIds as string).split(',');
      const userProgress = mockProgressData[userId as string] || {};
      
      const result: Record<string, any> = {};
      
      courseIdArray.forEach(courseId => {
        const courseProgress = userProgress[courseId] || {
          completedPages: [],
          totalPages: 0,
          isCompleted: false
        };
        result[courseId] = courseProgress;
      });

      console.log('📊 Batch progress found:', result);
      res.status(200).json(result);
      return;
    } catch (error) {
      console.error('❌ Error fetching course progress:', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  }

  res.setHeader("Allow", "GET");
  res.status(405).end();
}