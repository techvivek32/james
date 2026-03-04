import { useState, ChangeEvent, useRef, useEffect } from "react";

type AiMessage = {
  id: number;
  role: "user" | "ai";
  text: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'document';
    name: string;
    url: string;
  }>;
};

export function AiChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [nextId, setNextId] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    type: 'image' | 'video' | 'document';
    name: string;
    url: string;
  }>>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function pushMessage(role: AiMessage["role"], text: string, attachments?: AiMessage["attachments"]) {
    setMessages((prev) => [...prev, { id: nextId, role, text, attachments }]);
    setNextId((id) => id + 1);
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
  }

  function handleFileSelect(type: 'image' | 'video' | 'document') {
    if (type === 'image') {
      imageInputRef.current?.click();
    } else if (type === 'video') {
      videoInputRef.current?.click();
    } else {
      documentInputRef.current?.click();
    }
    setShowAttachMenu(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachments(prev => [...prev, {
        type,
        name: file.name,
        url: reader.result as string
      }]);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || isLoading) {
      return;
    }
    
    const messageText = text || "Sent attachments";
    pushMessage("user", messageText, attachments.length > 0 ? [...attachments] : undefined);
    setInput("");
    setAttachments([]);
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/sales-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageText,
          attachments: attachments
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
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      height: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      maxWidth: '100%',
      margin: '0 auto'
    }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '30px',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              fontSize: '48px'
            }}>
              🤖
            </div>
            <div style={{fontSize: '32px', fontWeight: 600, marginBottom: '16px', color: '#1f2937'}}>
              How can I help you today?
            </div>
            <div style={{fontSize: '16px', maxWidth: '600px', lineHeight: '1.6', color: '#6b7280'}}>
              Your intelligent co-pilot for strategy, content, and growth.<br />
              Ask anything or use a tool to get started.
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === "user" ? 'flex-end' : 'flex-start',
                  marginBottom: '16px'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    backgroundColor: message.role === "user" ? '#dc2626' : '#f3f4f6',
                    color: message.role === "user" ? '#ffffff' : '#1f2937',
                    wordWrap: 'break-word',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    fontSize: '15px',
                    lineHeight: '1.5'
                  }}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      {message.attachments.map((att, idx) => (
                        <div key={idx} style={{ marginBottom: '8px' }}>
                          {att.type === 'image' && (
                            <img 
                              src={att.url} 
                              alt={att.name}
                              style={{ 
                                maxWidth: '100%', 
                                borderRadius: '8px',
                                display: 'block'
                              }} 
                            />
                          )}
                          {att.type === 'video' && (
                            <video 
                              src={att.url} 
                              controls
                              style={{ 
                                maxWidth: '100%', 
                                borderRadius: '8px',
                                display: 'block'
                              }} 
                            />
                          )}
                          {att.type === 'document' && (
                            <div style={{
                              padding: '8px 12px',
                              backgroundColor: message.role === "user" ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>📄</span>
                              <span style={{ fontSize: '13px' }}>{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontSize: '15px'
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        padding: '16px 24px',
        backgroundColor: '#ffffff'
      }}>
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div style={{
            maxWidth: '900px',
            margin: '0 auto 12px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {attachments.map((att, idx) => (
              <div key={idx} style={{
                position: 'relative',
                padding: '8px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}>
                <span>
                  {att.type === 'image' && '🖼️'}
                  {att.type === 'video' && '🎥'}
                  {att.type === 'document' && '📄'}
                </span>
                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 4px',
                    fontSize: '16px',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '24px',
          padding: '8px 16px',
          border: '1px solid #e5e7eb'
        }}>
          {/* Attachment Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={isLoading}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#6b7280',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              📎
            </button>
            
            {showAttachMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                marginBottom: '8px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '160px'
              }}>
                <button 
                  onClick={() => handleFileSelect('image')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>🖼️</span>
                  <span>Image</span>
                </button>
                <button 
                  onClick={() => handleFileSelect('video')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>🎥</span>
                  <span>Video</span>
                </button>
                <button 
                  onClick={() => handleFileSelect('document')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>📄</span>
                  <span>Document</span>
                </button>
              </div>
            )}
          </div>

          <textarea
            placeholder="Message AI... (Shift+Enter for new line)"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '15px',
              lineHeight: '24px',
              padding: '8px 0',
              backgroundColor: 'transparent',
              minHeight: '24px',
              maxHeight: '120px',
              fontFamily: 'inherit'
            }}
            rows={1}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={((!input.trim() && attachments.length === 0) || isLoading)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: (input.trim() || attachments.length > 0) && !isLoading ? '#dc2626' : '#d1d5db',
              color: '#ffffff',
              cursor: (input.trim() || attachments.length > 0) && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            ➤
          </button>
        </div>
        
        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e, 'image')}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e, 'video')}
        />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf"
          style={{ display: 'none' }}
          onChange={(e) => handleFileChange(e, 'document')}
        />
      </div>
    </div>
  );
}
