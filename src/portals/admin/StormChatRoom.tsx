import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";

type ChatMessage = {
  _id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  createdAt: Date;
};

type ChatGroup = {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  members: string[];
  admins: string[];
  onlyAdminCanChat: boolean;
};

type Props = {
  group: ChatGroup;
  onBack: () => void;
};

export function StormChatRoom({ group, onBack }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSendMessage = group.onlyAdminCanChat 
    ? (user?.role === 'admin' || group.admins.includes(user?.id || ''))
    : group.members.includes(user?.id || '');

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [group._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function fetchMessages() {
    try {
      const response = await fetch(`/api/storm-chat/messages/${group._id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/storm-chat/messages/${group._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          senderName: user?.name,
          senderRole: user?.role,
          message: newMessage,
          messageType: 'text'
        })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, message]);
        setNewMessage("");
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        alert('Failed to upload file');
        return;
      }

      const { url } = await uploadResponse.json();
      
      // Determine message type
      let messageType: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';

      // Send message with media
      const response = await fetch(`/api/storm-chat/messages/${group._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.id,
          senderName: user?.name,
          senderRole: user?.role,
          message: file.name,
          messageType,
          mediaUrl: url
        })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages([...messages, message]);
      } else {
        alert('Failed to send file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  function formatTime(date: Date) {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function formatDate(date: Date) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function renderMessage(msg: ChatMessage, index: number) {
    const isMyMessage = msg.senderId === user?.id;
    const showDate = index === 0 || 
      new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

    return (
      <div key={msg._id}>
        {showDate && (
          <div style={{ 
            textAlign: 'center', 
            margin: '16px 0',
            fontSize: 12,
            color: '#6b7280'
          }}>
            <span style={{ 
              backgroundColor: '#f3f4f6',
              padding: '4px 12px',
              borderRadius: 12
            }}>
              {formatDate(msg.createdAt)}
            </span>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
          marginBottom: 8
        }}>
          <div style={{ 
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMyMessage ? 'flex-end' : 'flex-start'
          }}>
            {!isMyMessage && (
              <div style={{ 
                fontSize: 11, 
                color: '#6b7280',
                marginBottom: 4,
                marginLeft: 8
              }}>
                {msg.senderName}
              </div>
            )}
            
            <div style={{ 
              backgroundColor: isMyMessage ? '#DC2626' : '#f3f4f6',
              color: isMyMessage ? '#fff' : '#111827',
              padding: '10px 14px',
              borderRadius: 16,
              borderTopRightRadius: isMyMessage ? 4 : 16,
              borderTopLeftRadius: isMyMessage ? 16 : 4,
              wordBreak: 'break-word'
            }}>
              {msg.messageType === 'text' && (
                <div style={{ fontSize: 14 }}>{msg.message}</div>
              )}
              
              {msg.messageType === 'image' && msg.mediaUrl && (
                <div>
                  <img 
                    src={msg.mediaUrl} 
                    alt={msg.message}
                    style={{ 
                      maxWidth: 300,
                      maxHeight: 300,
                      borderRadius: 8,
                      display: 'block'
                    }}
                  />
                  {msg.message && (
                    <div style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>
                      {msg.message}
                    </div>
                  )}
                </div>
              )}
              
              {msg.messageType === 'video' && msg.mediaUrl && (
                <div>
                  <video 
                    src={msg.mediaUrl}
                    controls
                    style={{ 
                      maxWidth: 300,
                      maxHeight: 300,
                      borderRadius: 8,
                      display: 'block'
                    }}
                  />
                  {msg.message && (
                    <div style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>
                      {msg.message}
                    </div>
                  )}
                </div>
              )}
              
              {msg.messageType === 'file' && msg.mediaUrl && (
                <a 
                  href={msg.mediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: isMyMessage ? '#fff' : '#DC2626',
                    textDecoration: 'underline',
                    fontSize: 14
                  }}
                >
                  📎 {msg.message}
                </a>
              )}
            </div>
            
            <div style={{ 
              fontSize: 10, 
              color: '#9ca3af',
              marginTop: 4,
              marginLeft: isMyMessage ? 0 : 8,
              marginRight: isMyMessage ? 8 : 0
            }}>
              {formatTime(msg.createdAt)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 200px)',
      backgroundColor: '#fff',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{ 
        padding: 16,
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f9fafb'
      }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            padding: 4
          }}
        >
          ←
        </button>
        
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 8,
          backgroundColor: '#000',
          backgroundImage: group.imageUrl ? `url(${group.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: '#fff'
        }}>
          {!group.imageUrl && '👥'}
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>
            {group.name}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {group.members.length} members
            {group.onlyAdminCanChat && ' • Admin-only chat'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        backgroundColor: '#fafafa'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div>No messages yet. Start the conversation!</div>
          </div>
        ) : (
          messages.map((msg, index) => renderMessage(msg, index))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ 
        padding: 16,
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#fff'
      }}>
        {!canSendMessage ? (
          <div style={{ 
            textAlign: 'center',
            padding: 12,
            backgroundColor: '#fef2f2',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 14
          }}>
            🔒 Only admins can send messages in this group
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '10px 12px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: 8,
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: 18
              }}
            >
              {uploading ? '⏳' : '📎'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={sending}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
                resize: 'none',
                minHeight: 44,
                maxHeight: 120,
                fontFamily: 'inherit'
              }}
              rows={1}
            />
            
            <button
              type="button"
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              style={{
                padding: '10px 16px',
                backgroundColor: newMessage.trim() ? '#DC2626' : '#e5e7eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                fontSize: 18,
                fontWeight: 600
              }}
            >
              {sending ? '⏳' : '➤'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
