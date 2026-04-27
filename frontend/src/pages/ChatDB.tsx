import { useState, useRef, useEffect } from "react";
import { Send, Database, Bot, User, Code, Table, AlertCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sql?: string | null;
  results?: Record<string, unknown>[] | null;
  error?: boolean;
}

export default function ChatDB() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you query the Copilot usage database using natural language. Try asking things like:\n\n" +
        '- "List all employees"\n' +
        '- "Show top 5 employees by acceptance rate"\n' +
        '- "What languages are most used?"\n' +
        '- "How many suggestions were accepted last week?"\n' +
        '- "Which department has the highest Copilot usage?"',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.answer,
        sql: data.sql,
        results: data.results,
        error: data.error,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to send message"}`,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="page chat-page">
      <div className="page-header">
        <h1 className="page-title">
          <Database size={28} style={{ verticalAlign: "middle", marginRight: 8 }} />
          Chat with Database
        </h1>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              <div className="chat-msg-icon">
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="chat-msg-body">
                <div className={`chat-msg-content ${msg.error ? "error" : ""}`}>
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>

                {msg.sql && (
                  <div className="chat-sql">
                    <div className="chat-sql-header">
                      <Code size={14} /> SQL Query
                    </div>
                    <pre>{msg.sql}</pre>
                  </div>
                )}

                {msg.results && msg.results.length > 0 && (
                  <div className="chat-results">
                    <div className="chat-results-header">
                      <Table size={14} /> Results ({msg.results.length} rows)
                    </div>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(msg.results[0]).map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.results.map((row, ri) => (
                            <tr key={ri}>
                              {Object.values(row).map((val, ci) => (
                                <td key={ci}>{String(val ?? "")}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg assistant">
              <div className="chat-msg-icon">
                <Bot size={20} />
              </div>
              <div className="chat-msg-body">
                <div className="chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a question about your Copilot data..."
            disabled={loading}
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
