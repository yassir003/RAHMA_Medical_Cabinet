"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldAlert, Search, X, Wifi, WifiOff, Loader2,
  LogIn, Plus, Edit2, Trash2, RefreshCw, Radio,
} from "lucide-react";
import { getAuditLogs, AuditLog } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type LiveLog = AuditLog & { _flash?: boolean };

type Category = "ALL" | "AUTH" | "CREATE" | "UPDATE" | "DELETE" | "OTHER";
type ConnStatus = "connecting" | "live" | "reconnecting" | "disconnected";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "rahma_auth_user";

function getToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s).token ?? "" : "";
  } catch { return ""; }
}

function categorize(action: string): Category {
  const a = action.toUpperCase();
  if (a.includes("LOGIN") || a.includes("REGISTER") || a.includes("LOGOUT") || a.includes("PASSWORD")) return "AUTH";
  if (a.includes("CREATE") || a.includes("ADD")) return "CREATE";
  if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("MODIFY")) return "UPDATE";
  if (a.includes("DELETE") || a.includes("REMOVE")) return "DELETE";
  return "OTHER";
}

const ACTION_STYLE: Record<Category, { bg: string; color: string; icon: React.ReactNode }> = {
  ALL:    { bg: "#f1f5f9", color: "#475569", icon: <Radio size={11} /> },
  AUTH:   { bg: "#ede9fe", color: "#7c3aed", icon: <LogIn size={11} /> },
  CREATE: { bg: "#dcfce7", color: "#16a34a", icon: <Plus size={11} /> },
  UPDATE: { bg: "#dbeafe", color: "#2563eb", icon: <Edit2 size={11} /> },
  DELETE: { bg: "#fee2e2", color: "#dc2626", icon: <Trash2 size={11} /> },
  OTHER:  { bg: "#f1f5f9", color: "#64748b", icon: <Radio size={11} /> },
};

function ActionBadge({ action }: { action: string }) {
  const cat = categorize(action);
  const s = ACTION_STYLE[cat];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon} {action}
    </span>
  );
}

function fmtTs(iso: string) {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  } catch { return { date: "—", time: "—" }; }
}

// ─── Status indicator ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ConnStatus }) {
  const cfg: Record<ConnStatus, { color: string; label: string; pulse: boolean }> = {
    connecting:    { color: "#f59e0b", label: "Connexion…",   pulse: true },
    live:          { color: "#22c55e", label: "EN DIRECT",    pulse: true },
    reconnecting:  { color: "#f97316", label: "Reconnexion…", pulse: true },
    disconnected:  { color: "#ef4444", label: "Déconnecté",   pulse: false },
  };
  const c = cfg[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: c.color }}>
      <div style={{ position: "relative", width: 10, height: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
        {c.pulse && (
          <div style={{ position: "absolute", inset: -3, borderRadius: "50%",
            background: c.color, opacity: 0.3, animation: "pulse 1.5s infinite" }} />
        )}
      </div>
      {c.label}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: "ALL",    label: "Tous" },
  { key: "AUTH",   label: "Authentification" },
  { key: "CREATE", label: "Créations" },
  { key: "UPDATE", label: "Modifications" },
  { key: "DELETE", label: "Suppressions" },
  { key: "OTHER",  label: "Autres" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<LiveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("ALL");
  const [connStatus, setConnStatus] = useState<ConnStatus>("connecting");
  const [liveCount, setLiveCount] = useState(0);
  const [newBanner, setNewBanner] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(2000);
  const tableRef = useRef<HTMLDivElement>(null);

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    getAuditLogs(0, 200)
      .then((r) => setLogs(r.content.map((l) => ({ ...l, _flash: false }))))
      .catch(() => { /* show empty */ })
      .finally(() => setLoading(false));
  }, []);

  // ── SSE connection manager ──────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setConnStatus("connecting");

    const token = getToken();
    if (!token) { setConnStatus("disconnected"); return; }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const es = new EventSource(`${baseUrl}/api/v1/audit/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnStatus("live");
      retryDelay.current = 2000;
    });

    es.addEventListener("new_log", (e) => {
      try {
        const newLog: AuditLog = JSON.parse(e.data);
        setLogs((prev) => {
          if (prev.some((l) => l.id === newLog.id)) return prev;
          return [{ ...newLog, _flash: true }, ...prev.slice(0, 499)];
        });
        setLiveCount((n) => n + 1);
        setNewBanner(true);
        setTimeout(() => {
          setLogs((prev) => prev.map((l) => l.id === newLog.id ? { ...l, _flash: false } : l));
          setNewBanner(false);
        }, 3000);
      } catch { /* ignore malformed */ }
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setConnStatus("reconnecting");
      retryRef.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30_000);
        connect();
      }, retryDelay.current);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  // ── Filtered view ───────────────────────────────────────────────────────────

  const filtered = logs.filter((l) => {
    const matchCat = category === "ALL" || categorize(l.action) === category;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      l.action.toLowerCase().includes(q) ||
      l.utilisateur.toLowerCase().includes(q) ||
      l.entite.toLowerCase().includes(q) ||
      (l.details ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // ── Category counts ─────────────────────────────────────────────────────────

  const counts = logs.reduce<Record<Category, number>>((acc, l) => {
    const c = categorize(l.action);
    acc.ALL++;
    acc[c]++;
    return acc;
  }, { ALL: 0, AUTH: 0, CREATE: 0, UPDATE: 0, DELETE: 0, OTHER: 0 });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(2.2); opacity: 0; } }
        @keyframes flashRow { 0% { background: #fefce8; } 100% { background: transparent; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4,
            display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldAlert size={22} color="#7c3aed" /> Journal d'audit système
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Toutes les actions effectuées sont enregistrées et diffusées en temps réel.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <StatusDot status={connStatus} />
          {liveCount > 0 && (
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20,
              background: "#dcfce7", color: "#16a34a", fontWeight: 700 }}>
              +{liveCount} en direct
            </span>
          )}
          <button onClick={() => {
            setLoading(true);
            getAuditLogs(0, 200)
              .then((r) => setLogs(r.content))
              .finally(() => setLoading(false));
          }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 8, border: "1px solid #e2e8f0", background: "white",
            color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {(["AUTH","CREATE","UPDATE","DELETE","OTHER"] as Category[]).map((cat) => {
          const s = ACTION_STYLE[cat];
          return (
            <div key={cat} onClick={() => setCategory(cat === category ? "ALL" : cat)}
              style={{ background: "white", borderRadius: 12, padding: "14px 16px",
                border: `1px solid ${category === cat ? s.color + "44" : "#f1f5f9"}`,
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                transition: "border-color 0.15s",
                boxShadow: category === cat ? `0 0 0 2px ${s.color}22` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                {ACTION_STYLE[cat].icon}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{counts[cat]}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {CATEGORY_TABS.find((t) => t.key === cat)?.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New log banner */}
      {newBanner && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
          padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, animation: "slideDown 0.2s ease" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
            animation: "pulse 1s infinite" }} />
          Nouveau log reçu en temps réel
        </div>
      )}

      {/* Table card */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9",
          display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>

          {/* Category filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
            {CATEGORY_TABS.map((t) => (
              <button key={t.key} onClick={() => setCategory(t.key)}
                style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: "none", transition: "all 0.15s",
                  background: category === t.key ? "#0f172a" : "#f1f5f9",
                  color: category === t.key ? "white" : "#475569" }}>
                {t.label}
                {t.key !== "ALL" && (
                  <span style={{ marginLeft: 5, opacity: 0.7 }}>({counts[t.key]})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
            border: "1px solid #e2e8f0", borderRadius: 8, minWidth: 240 }}>
            <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Utilisateur, action, entité…"
              style={{ border: "none", outline: "none", fontSize: 13, color: "#0f172a", flex: 1 }} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Count */}
          <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
            {filtered.length} ligne{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div ref={tableRef} style={{ overflowY: "auto", maxHeight: "60vh" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
              padding: "60px 0", color: "#94a3b8" }}>
              <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>
              {search || category !== "ALL" ? "Aucun log correspond aux filtres." : "Aucun log enregistré."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
                  {["Date","Heure","Action","Entité","Utilisateur","Détails"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: 11,
                      fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #f1f5f9",
                      whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const { date, time } = fmtTs(log.timestamp);
                  return (
                    <tr key={log.id}
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        animation: log._flash ? "flashRow 3s ease forwards" : undefined,
                        background: log._flash ? "#fefce8" : undefined,
                      }}
                      onMouseEnter={(e) => { if (!log._flash) e.currentTarget.style.background = "#fafbff"; }}
                      onMouseLeave={(e) => { if (!log._flash) e.currentTarget.style.background = ""; }}>
                      <td style={{ padding: "11px 16px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {date}
                      </td>
                      <td style={{ padding: "11px 16px", color: "#94a3b8", fontFamily: "monospace",
                        fontSize: 12, whiteSpace: "nowrap" }}>
                        {time}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <ActionBadge action={log.action} />
                      </td>
                      <td style={{ padding: "11px 16px", color: "#0f172a", fontWeight: 600,
                        whiteSpace: "nowrap" }}>
                        {log.entite}
                        {log.entiteId != null && (
                          <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: 4 }}>
                            #{log.entiteId}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "11px 16px", color: "#7c3aed", fontWeight: 500,
                        whiteSpace: "nowrap" }}>
                        {log.utilisateur}
                      </td>
                      <td style={{ padding: "11px 16px", color: "#64748b", maxWidth: 300 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={log.details ?? ""}>
                          {log.details || "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "12px 22px", borderTop: "1px solid #f1f5f9",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Affichage de {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
              {liveCount > 0 && ` — dont ${liveCount} reçue${liveCount !== 1 ? "s" : ""} en direct`}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
              {connStatus === "live"
                ? <><Wifi size={13} color="#22c55e" /> Flux SSE actif</>
                : <><WifiOff size={13} color="#ef4444" /> Flux SSE inactif</>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
