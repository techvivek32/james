import { useState, ChangeEvent, useRef } from "react";

type AiMessage = {
  id: number;
  role: "user" | "ai";
  text: string;
};

export function AiChatPanel() {
  const [model, setModel] = useState("Gemini 3 Flash");
  const [profileOption, setProfileOption] = useState("None");
  const [offerOption, setOfferOption] = useState("None");
  const [modeOption, setModeOption] = useState("Just Chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [nextId, setNextId] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function pushMessage(role: AiMessage["role"], text: string) {
    setMessages((prev) => [...prev, { id: nextId, role, text }]);
    setNextId((id) => id + 1);
  }

  function handleAttachment() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      pushMessage("user", `📎 Uploaded: ${file.name}`);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const textarea = event.target;
    setInput(textarea.value);
    
    // Auto-resize textarea
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 140; // 7 lines * 20px line-height
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) {
      return;
    }
    pushMessage("user", text);
    setInput("");
    
    try {
      const response = await fetch("/api/sales-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          model,
          profile: profileOption,
          offer: offerOption,
          mode: modeOption
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        pushMessage("ai", data.message);
      } else {
        console.error("API Error:", data);
        pushMessage("ai", data.error || "Sorry, I'm having trouble responding right now. Please try again.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      pushMessage("ai", "Sorry, I'm having trouble responding right now. Please try again.");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="ai-clone-page" style={{height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
      <div className="ai-clone-shell" style={{flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '800px', width: '100%'}}>
        <div className="ai-clone-icon">💬</div>
        <div className="ai-clone-title">How can I help you today?</div>
        <div className="ai-clone-subtitle">
          Your intelligent co-pilot for strategy, content, and growth. Ask
          anything or use a tool to get started.
        </div>
        <div className="ai-clone-card" style={{display: 'flex', flexDirection: 'column', margin: '0', padding: '20px'}}>
          <div className="ai-clone-messages chat-messages" style={{flex: 1, overflowY: 'auto', minHeight: '400px'}}>
            {messages.length === 0 ? (
              <div className="ai-clone-empty">
                Start typing below to chat with your assistant.
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "chat-message chat-message-user"
                      : "chat-message chat-message-ai"
                  }
                >
                  <div className="chat-message-label">
                    {message.role === "user" ? "You" : "AI"}
                  </div>
                  <div className="chat-message-text">{message.text}</div>
                </div>
              ))
            )}
          </div>
          <div className="ai-clone-input-container" style={{position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '8px'}}>
            <button
              type="button"
              className="ai-clone-icon-button"
              onClick={handleAttachment}
              style={{marginBottom: '8px'}}
            >
              📎
            </button>
            <textarea
              className="ai-clone-input"
              placeholder="Message AI... (Shift+Enter for new line)"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1, 
                paddingRight: '50px',
                minHeight: '40px',
                maxHeight: '140px',
                height: 'auto',
                resize: 'none',
                overflowY: input.split('\n').length > 7 ? 'auto' : 'hidden',
                lineHeight: '20px'
              }}
              rows={1}
            />
            <button
              type="button"
              className="ai-clone-send-button"
              onClick={handleSend}
              style={{position: 'absolute', right: '8px', bottom: '8px', zIndex: 1}}
            >
              ➤
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{display: 'none'}}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.jpg,.png,.gif"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
