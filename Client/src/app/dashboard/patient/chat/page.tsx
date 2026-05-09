"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Bot, Loader2, Send, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AUTH_STORAGE_KEY = "rahma_auth_user";

function getStoredToken(): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return undefined;

    const parsed = JSON.parse(stored);
    return typeof parsed?.token === "string" ? parsed.token : undefined;
  } catch {
    return undefined;
  }
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function formatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (/^[-*]\s/.test(line)) {
      const content = line.replace(/^[-*]\s/, "");
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ color: "#2fb5fc", fontWeight: 700, flexShrink: 0 }}>*</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      );
    }

    if (line.trim() === "") {
      return <div key={i} style={{ height: 6 }} />;
    }

    return <div key={i} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
  });
}

export default function PatientChatPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis **Rahma Assistant**, votre assistant medical IA.\n\n" +
        "Je peux vous aider a :\n" +
        "- **Prendre un rendez-vous** avec l'un de nos medecins\n" +
        "- **Consulter vos rendez-vous** passes et a venir\n" +
        "- **Acceder a votre suivi medical**\n" +
        "- **Obtenir des informations sur nos medecins**\n\n" +
        "Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

    const apiMessages = nextMessages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const token = user?.token ?? getStoredToken();
      const backend = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const chatUrl = new URL(`${backend}/api/v1/chat`);
      if (token) {
        chatUrl.searchParams.set("token", token);
      }

      const res = await fetch(chatUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? data?.error ?? `Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      const reply =
        typeof data?.data === "string"
          ? data.data
          : typeof data?.reply === "string"
            ? data.reply
            : "Desole, je n'ai pas pu traiter votre demande.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
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
      <div style={{ padding: "24px 0 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(47,181,252,0.35)",
            }}
          >
            <Bot size={26} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>Rahma Assistant</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Votre assistant medical IA, disponible 24h/24</p>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>En ligne</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0", display: "flex", flexDirection: "column", gap: 16 }}>
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
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: msg.role === "assistant" ? "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)" : "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {msg.role === "assistant" ? <Bot size={18} color="white" /> : <User size={18} color="#0284c7" />}
            </div>

            <div
              style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: msg.role === "assistant" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                background: msg.role === "assistant" ? "white" : "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
                color: msg.role === "assistant" ? "#0f172a" : "white",
                fontSize: 14,
                lineHeight: 1.65,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
              }}
            >
              {msg.role === "assistant" ? formatMarkdown(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={18} color="white" />
            </div>
            <div
              style={{
                padding: "14px 18px",
                borderRadius: "4px 16px 16px 16px",
                background: "white",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Loader2 size={16} color="#2fb5fc" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#64748b" }}>Rahma reflechit...</span>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
            <span style={{ fontSize: 13, color: "#b91c1c" }}>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, paddingTop: 12, paddingBottom: 8, borderTop: "1px solid #e2e8f0" }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
            background: "white",
            borderRadius: 16,
            padding: "10px 10px 10px 16px",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            transition: "border-color 0.2s",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question... (Entree pour envoyer, Maj+Entree pour saut de ligne)"
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#0f172a",
              background: "transparent",
              lineHeight: 1.6,
              fontFamily: "inherit",
              maxHeight: 140,
              overflowY: "auto",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: !input.trim() || loading ? "#e2e8f0" : "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <Send size={17} color={!input.trim() || loading ? "#94a3b8" : "white"} />
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
          Rahma Assistant peut se tromper. Verifiez les informations importantes avec votre medecin.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
