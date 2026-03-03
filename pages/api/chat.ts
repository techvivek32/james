import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  const { messages, lessonTitle, lessonContent, videoUrl, courseTitle, allPages } = req.body;

  try {
    // Check if user message contains a video URL
    const userMessage = messages[messages.length - 1]?.content || "";
    const videoUrlPattern = /(https?:\/\/(?:www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[^\s]+)/gi;
    const foundVideoUrls = userMessage.match(videoUrlPattern);
    
    let videoAnalysis = "";
    if (foundVideoUrls && foundVideoUrls.length > 0) {
      try {
        const videoResponse = await fetch(`http://localhost:3000/api/analyze-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: foundVideoUrls[0] })
        });
        if (videoResponse.ok) {
          const videoData = await videoResponse.json();
          videoAnalysis = `

VIDEO ANALYSIS:
Title: ${videoData.title}
Platform: ${videoData.platform}
Duration: ${videoData.duration}
Description: ${videoData.description}
Detailed Analysis: ${videoData.analysis}`;
        }
      } catch (error) {
        console.error("Video analysis failed:", error);
      }
    }

    const videoInfo = videoUrl ? `

VIDEO CONTENT:
This lesson includes a video: ${videoUrl}
Users can ask questions about the video content, key points discussed, or request explanations of concepts covered in the video.` : '';
    
    const courseContext = allPages && allPages.length > 0 ? `

FULL COURSE CONTEXT (${courseTitle || 'Course'}):
${allPages.map((page, index) => `
Lesson ${index + 1}: ${page.title}
Content: ${page.body || 'No content'}
${page.videoUrl ? `Video: ${page.videoUrl}` : ''}`).join('\n')}` : '';

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful training coach assistant for the course "${courseTitle || 'Training Course'}". The user is currently on lesson "${lessonTitle}". 

CURRENT LESSON CONTENT:
${lessonContent || 'No content provided'}${videoInfo}${courseContext}${videoAnalysis}

IMPORTANT RULES:
- You can answer questions about ANY lesson in this course, not just the current one
- Use the full course context to provide comprehensive answers
- If a user asks about "lesson 1" or "lesson 3" etc., refer to the course context above
- When users share video links, provide comprehensive analysis including content, duration, key topics, and learning objectives
- If the user asks about topics unrelated to this course, politely decline and redirect them back to the course topics
- Keep your answers focused, clear, and educational
- Reference specific lessons when helpful (e.g., "As covered in Lesson 2...")

Your role is to help users understand the entire "${courseTitle || 'course'}" content and analyze any video content they share.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
}
