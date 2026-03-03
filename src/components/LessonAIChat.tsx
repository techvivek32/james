import { useState } from "react";

export function LessonAIChat(props: { lessonTitle: string; lessonContent?: string; videoUrl?: string; courseTitle?: string; allPages?: any[] }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    if (!message.trim() || isLoading) return;
    
    const userMessage = message.trim();
    setMessage("");
    setMessages([...messages, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
          lessonTitle: props.lessonTitle,
          lessonContent: props.lessonContent,
          videoUrl: props.videoUrl,
          courseTitle: props.courseTitle,
          allPages: props.allPages
        })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      width: 320,
      minWidth: 320,
      maxWidth: 320,
      height: "calc(100vh - 150px)",
      minHeight: 500,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#fff",
      borderLeft: "1px solid #e5e7eb"
    }}>
      <div style={{
        padding: "16px",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0
      }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Lesson AI Chat</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>Ask questions about {props.lessonTitle}.</div>
      </div>
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        minHeight: 0
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: msg.role === "user" ? "#f3f4f6" : "#eff6ff",
            fontSize: 13
          }}>
            {msg.content}
          </div>
        ))}
      </div>
      <div style={{
        padding: "16px",
        borderTop: "1px solid #e5e7eb",
        flexShrink: 0
      }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask the coach a question..."
          style={{
            width: "100%",
            minHeight: 60,
            maxHeight: 120,
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            fontSize: 13,
            resize: "none",
            marginBottom: 8,
            boxSizing: "border-box"
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          style={{
            width: "100%",
            padding: "8px 16px",
            backgroundColor: isLoading || !message.trim() ? "#9ca3af" : "#dc2626",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: isLoading || !message.trim() ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}
