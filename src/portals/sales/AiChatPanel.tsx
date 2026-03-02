import { useState, ChangeEvent } from "react";

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

  function pushMessage(role: AiMessage["role"], text: string) {
    setMessages((prev) => [...prev, { id: nextId, role, text }]);
    setNextId((id) => id + 1);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) {
      return;
    }
    pushMessage("user", text);
    setInput("");
    const summaryPieces = [
      `Model: ${model}`,
      profileOption !== "None" ? `Profile: ${profileOption}` : null,
      offerOption !== "None" ? `Offer: ${offerOption}` : null,
      `Mode: ${modeOption}`
    ].filter(Boolean);
    const summary =
      summaryPieces.length > 0 ? ` (${summaryPieces.join(" • ")})` : "";
    pushMessage(
      "ai",
      `Placeholder response for now. Backend wiring can plug in a real AI later.${summary}`
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="ai-clone-page">
      <div className="ai-clone-shell">
        <div className="ai-clone-icon">💬</div>
        <div className="ai-clone-title">How can I help you today?</div>
        <div className="ai-clone-subtitle">
          Your intelligent co-pilot for strategy, content, and growth. Ask
          anything or use a tool to get started.
        </div>
        <div className="ai-clone-card">
          <div className="ai-clone-messages chat-messages">
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
          <textarea
            className="ai-clone-input"
            placeholder="Message AI... (Shift+Enter for new line)"
            value={input}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
          />
          <div className="ai-clone-toolbar">
            <div className="ai-clone-toolbar-left">
              <select
                className="ai-clone-select"
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                <option>Gemini 3 Flash</option>
                <option>Claude 4.5 Sonnet</option>
                <option>GPT-5.2</option>
              </select>
              <select
                className="ai-clone-select"
                value={profileOption}
                onChange={(event) => setProfileOption(event.target.value)}
              >
                <option value="None">Profile</option>
                <option value="Create profile">Create profile</option>
              </select>
              <select
                className="ai-clone-select"
                value={offerOption}
                onChange={(event) => setOfferOption(event.target.value)}
              >
                <option value="None">Offer</option>
                <option value="Solar">Solar</option>
                <option value="Roofing">Roofing</option>
                <option value="HVAC">HVAC</option>
              </select>
              <select
                className="ai-clone-select"
                value={modeOption}
                onChange={(event) => setModeOption(event.target.value)}
              >
                <option>Just Chat</option>
                <option>Prospecting</option>
                <option>Objection Handling</option>
                <option>Sales Scripting</option>
              </select>
            </div>
            <div className="ai-clone-toolbar-right">
              <button
                type="button"
                className="ai-clone-icon-button"
                title="Attach"
              >
                📎
              </button>
              <button
                type="button"
                className="ai-clone-send-button"
                onClick={handleSend}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
