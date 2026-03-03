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
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  function pushMessage(role: AiMessage["role"], text: string) {
    setMessages((prev) => [...prev, { id: nextId, role, text }]);
    setNextId((id) => id + 1);
  }

  function handleAttachment() {
    setShowAttachMenu(!showAttachMenu);
  }

  function handleImageSelect() {
    imageInputRef.current?.click();
    setShowAttachMenu(false);
  }

  function handleVideoSelect() {
    videoInputRef.current?.click();
    setShowAttachMenu(false);
  }

  function handleDocumentSelect() {
    documentInputRef.current?.click();
    setShowAttachMenu(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, type: string) {
    const file = event.target.files?.[0];
    if (file) {
      setInput(prev => prev + `[${type}: ${file.name}] `);
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
            <div style={{position: 'relative'}}>
              <button
                type="button"
                className="ai-clone-icon-button"
                onClick={handleAttachment}
                style={{marginBottom: '8px'}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              {showAttachMenu && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '0',
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  minWidth: '120px'
                }}>
                  <button onClick={handleImageSelect} style={{display: 'block', width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer'}}>
                    🖼️ Image
                  </button>
                  <button onClick={handleVideoSelect} style={{display: 'block', width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer'}}>
                    🎥 Video
                  </button>
                  <button onClick={handleDocumentSelect} style={{display: 'block', width: '100%', padding: '8px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer'}}>
                    📄 Document
                  </button>
                </div>
              )}
            </div>
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
              ref={imageInputRef}
              type="file"
              style={{display: 'none'}}
              onChange={(e) => handleFileChange(e, 'Image')}
              accept=".jpg,.jpeg,.png,.gif,.webp"
            />
            <input
              ref={videoInputRef}
              type="file"
              style={{display: 'none'}}
              onChange={(e) => handleFileChange(e, 'Video')}
              accept=".mp4,.avi,.mov,.wmv,.flv"
            />
            <input
              ref={documentInputRef}
              type="file"
              style={{display: 'none'}}
              onChange={(e) => handleFileChange(e, 'Document')}
              accept=".pdf,.doc,.docx,.txt,.rtf"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
