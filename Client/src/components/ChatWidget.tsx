"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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

function shouldShowChatWidget(pathname: string | null) {
  if (!pathname) return false;

  const publicPages = ["/", "/doctors", "/services", "/about", "/contact"];
  return publicPages.includes(pathname) || pathname.startsWith("/dashboard/patient");
}

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderMessage(text: string): React.ReactNode[] {
  return text.split("\n").map((line, index) => {
    if (/^[-*]\s/.test(line)) {
      const content = line.replace(/^[-*]\s/, "");
      return (
        <div key={index} style={{ display: "flex", gap: 8, marginTop: 3 }}>
          <span style={{ color: "#2fb5fc", fontWeight: 800 }}>*</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      );
    }

    if (!line.trim()) {
      return <div key={index} style={{ height: 6 }} />;
    }

    return <div key={index} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
  });
}

export default function ChatWidget() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const welcomeMessage =
    user?.role === "PATIENT"
      ? "Bonjour ! Je suis **Rahma Assistant**.\n\nVous etes connecte comme patient. Je peux vous aider a trouver un medecin, verifier les disponibilites, prendre rendez-vous, ou consulter vos informations patient."
      : "Bonjour ! Je suis **Rahma Assistant**.\n\nJe peux vous aider a trouver un medecin, verifier les disponibilites, prendre rendez-vous, ou consulter vos informations patient.";

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: welcomeMessage,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!shouldShowChatWidget(pathname)) {
      setOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === "assistant"
        ? [{ role: "assistant", content: welcomeMessage }]
        : prev
    );
  }, [welcomeMessage]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  }, [input]);

  if (!shouldShowChatWidget(pathname)) {
    return null;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMessage: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const apiMessages = nextMessages
      .slice(1)
      .map((message) => ({ role: message.role, content: message.content }));

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
    <>
      {open && (
        <section
          aria-label="Rahma Assistant"
          style={{
            position: "fixed",
            right: 24,
            bottom: 96,
            width: "min(390px, calc(100vw - 32px))",
            height: "min(600px, calc(100vh - 128px))",
            zIndex: 1200,
            background: "white",
            border: "1px solid #dbeafe",
            borderRadius: 16,
            boxShadow: "0 24px 70px rgba(15, 23, 42, 0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 64,
              padding: "0 16px",
              background: "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={21} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Rahma Assistant</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Disponible maintenant</div>
            </div>
            <button
              type="button"
              aria-label="Fermer le chat"
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto",
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "none",
                background: "rgba(255,255,255,0.14)",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 13px",
                    borderRadius: message.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                    background: message.role === "user" ? "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)" : "white",
                    color: message.role === "user" ? "white" : "#0f172a",
                    border: message.role === "assistant" ? "1px solid #e2e8f0" : "none",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                    fontSize: 13,
                    lineHeight: 1.6,
                    overflowWrap: "break-word",
                  }}
                >
                  {message.role === "assistant" ? renderMessage(message.content) : message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13 }}>
                <Loader2 size={15} color="#2fb5fc" style={{ animation: "rahma-spin 1s linear infinite" }} />
                Rahma reflechit...
              </div>
            )}

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: 12,
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: 12, borderTop: "1px solid #e2e8f0", background: "white" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                border: "1.5px solid #dbeafe",
                borderRadius: 13,
                padding: "8px 8px 8px 12px",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                rows={1}
                disabled={loading}
                placeholder="Ecrivez votre message..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  resize: "none",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "inherit",
                  fontSize: 13,
                  lineHeight: 1.5,
                  maxHeight: 110,
                  color: "#0f172a",
                }}
              />
              <button
                type="button"
                aria-label="Envoyer"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "none",
                  background: !input.trim() || loading ? "#e2e8f0" : "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
                  color: "white",
                  cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label={open ? "Fermer Rahma Assistant" : "Ouvrir Rahma Assistant"}
        onClick={() => setOpen((value) => !value)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 1200,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #2fb5fc 0%, #0284c7 100%)",
          color: "white",
          boxShadow: "0 14px 34px rgba(2,132,199,0.38)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      <style>{`
        @keyframes rahma-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
