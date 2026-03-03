import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  const { message } = req.body;

  try {
    console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
    console.log("Message:", message);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    console.log("OpenAI Response Status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI Error:", errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log("OpenAI Success:", data.choices?.[0]?.message?.content);
    
    res.status(200).json({ message: data.choices[0].message.content });
  } catch (error) {
    console.error("Sales chat API error:", error);
    res.status(500).json({ error: "Failed to get response from AI: " + error.message });
  }
}