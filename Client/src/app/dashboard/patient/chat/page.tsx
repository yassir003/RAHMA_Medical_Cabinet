"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bot, Send, User, Loader2, AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMarkdown(text: string): React.ReactNode[] {
  // Very lightweight renderer: bold, line-breaks, bullet lists
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const key = i;
    // Bullet list item
    if (/^[-•]\s/.test(line)) {
      const content = line.replace(/^[-•]\s/, "");
      return (
        <div key={key} style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ color: "#2fb5fc", fontWeight: 700, flexShrink: 0 }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      );
    }
    // Empty line → spacer
    if (line.trim() === "") return <div key={key} style={{ height: 6 }} />;
    // Normal line
    return (
      <div key={key} dangerouslySetInnerHTML={{ __html: boldify(line) }} />
    );
  });
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PatientChatPage() {
  const { user } = useAuth();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis **Rahma Assistant**, votre assistant médical IA. 👋\n\n" +
        "Je peux vous aider à :\n" +
        "- 📅 **Prendre un rendez-vous** avec l'un de nos médecins\n" +
        "- 📋 **Consulter vos rendez-vous** passés et à venir\n" +
        "- 🩺 **Accéder à votre suivi médical**\n" +
        "- 👨‍⚕️ **Obtenir des informations sur nos médecins**\n\n" +
        "Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Build the message history for the API (exclude the initial assistant greeting
    // since it was generated client-side, not by the model)
    const apiMessages = nextMessages
      .slice(1) // skip the static welcome message
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: apiMessages, token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      const reply = data?.reply ?? "Désolé, je n'ai pas pu traiter votre demande.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      // Remove the user message we optimistically added so they can retry
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 90px)", maxWidth: 820, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ padding: "24px 0 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(47,181,252,0.35)",
          }}>
            <Bot size={26} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>Rahma Assistant</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Votre assistant médical IA — disponible 24h/24</p>
          </div>
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 20, background: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>En ligne</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "8px 0",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: msg.role === "assistant"
                ? "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)"
                : "#e0f2fe",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {msg.role === "assistant"
                ? <Bot size={18} color="white" />
                : <User size={18} color="#0284c7" />
              }
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: msg.role === "assistant" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
              background: msg.role === "assistant" ? "white" : "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
              color: msg.role === "assistant" ? "#0f172a" : "white",
              fontSize: 14,
              lineHeight: 1.65,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
            }}>
              {msg.role === "assistant"
                ? formatMarkdown(msg.content)
                : msg.content
              }
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{
              padding: "14px 18px", borderRadius: "4px 16px 16px 16px",
              background: "white", border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Loader2 size={16} color="#2fb5fc" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#64748b" }}>Rahma réfléchit…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: 12,
            background: "#fef2f2", border: "1px solid #fecaca",
          }}>
            <AlertCircle size={18} color="#ef4444" />
            <span style={{ fontSize: 13, color: "#b91c1c" }}>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        flexShrink: 0, paddingTop: 12, paddingBottom: 8,
        borderTop: "1px solid #e2e8f0",
      }}>
        {!token && (
          <div style={{
            marginBottom: 10, padding: "10px 14px", borderRadius: 10,
            background: "#fef9c3", border: "1px solid #fde047",
            fontSize: 13, color: "#854d0e",
          }}>
            Vous devez être connecté pour utiliser l'assistant.
          </div>
        )}

        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: "white", borderRadius: 16, padding: "10px 10px 10px 16px",
          border: "1.5px solid #e2e8f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          transition: "border-color 0.2s",
        }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
            disabled={loading || !token}
            rows={1}
            style={{
              flex: 1, resize: "none", border: "none", outline: "none",
              fontSize: 14, color: "#0f172a", background: "transparent",
              lineHeight: 1.6, fontFamily: "inherit",
              maxHeight: 140, overflowY: "auto",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || !token}
            style={{
              width: 40, height: 40, borderRadius: 12, border: "none", cursor: "pointer",
              background: !input.trim() || loading || !token
                ? "#e2e8f0"
                : "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}
          >
            <Send size={17} color={!input.trim() || loading || !token ? "#94a3b8" : "white"} />
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
          Rahma Assistant peut se tromper. Vérifiez les informations importantes avec votre médecin.
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
