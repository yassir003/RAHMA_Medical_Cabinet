"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/api";
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  RDV_PLANIFIE:    { label: "RDV planifié",  color: "#2563eb", bg: "#eff6ff" },
  RDV_CONFIRME:    { label: "RDV confirmé",  color: "#16a34a", bg: "#f0fdf4" },
  RDV_ANNULE:      { label: "RDV annulé",    color: "#dc2626", bg: "#fef2f2" },
  ALERTE_MEDICALE: { label: "Alerte",        color: "#d97706", bg: "#fffbeb" },
  RAPPEL:          { label: "Rappel",        color: "#7c3aed", bg: "#f5f3ff" },
  SYSTEME:         { label: "Système",       color: "#64748b", bg: "#f1f5f9" },
};

function fmtDateTime(dt: string) {
  const d = new Date(dt);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const PAGE_SIZE = 15;

// ---------------------------------------------------------------------------
// Notification row
// ---------------------------------------------------------------------------

function NotifRow({ n, onMarkRead }: { n: Notification; onMarkRead: (id: number) => void }) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEME;

  return (
    <div
      onClick={() => { if (!n.lu) onMarkRead(n.id); }}
      style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 24px", borderBottom: "1px solid #f1f5f9", cursor: n.lu ? "default" : "pointer", backgroundColor: n.lu ? "white" : "#fafbff", transition: "background .15s" }}
      onMouseEnter={e => { if (!n.lu) e.currentTarget.style.backgroundColor = "#f0f4ff"; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = n.lu ? "white" : "#fafbff"; }}
    >
      {/* Unread dot */}
      <div style={{ marginTop: 4, width: 10, height: 10, borderRadius: "50%", backgroundColor: n.lu ? "transparent" : cfg.color, border: n.lu ? "2px solid #e2e8f0" : "none", flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            <span style={{ fontSize: 14, fontWeight: n.lu ? 500 : 700, color: "#0f172a" }}>{n.titre}</span>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{fmtDateTime(n.dateCreation)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{n.message}</p>
      </div>

      {!n.lu && (
        <button
          onClick={e => { e.stopPropagation(); onMarkRead(n.id); }}
          title="Marquer comme lu"
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <Check size={15} color="#64748b" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type FilterMode = "all" | "unread";

export default function PatientNotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await getMyNotifications(p, PAGE_SIZE);
      setNotifs(r.content ?? []);
      setTotal(r.totalElements ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const handleMarkRead = useCallback(async (id: number) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? updated : n));
    } catch {
      // ignore
    }
  }, []);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const displayed = filter === "unread" ? notifs.filter(n => !n.lu) : notifs;
  const unreadCount = notifs.filter(n => !n.lu).length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ padding: "32px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#0f172a" }}>Notifications</h2>
          {unreadCount > 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={markingAll}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}>
            <CheckCheck size={16} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {([["all", "Toutes"], ["unread", "Non lues"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding: "8px 20px", borderRadius: 20, border: `2px solid ${filter === key ? "var(--primary)" : "#e2e8f0"}`, backgroundColor: filter === key ? "#eff6ff" : "white", color: filter === key ? "var(--primary)" : "#64748b", fontWeight: filter === key ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
            {label}
            {key === "unread" && unreadCount > 0 && (
              <span style={{ marginLeft: 6, backgroundColor: "#ef4444", color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, border: "4px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
            <Bell size={48} style={{ marginBottom: 14, opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 15 }}>
              {filter === "unread" ? "Toutes vos notifications sont lues." : "Aucune notification pour l'instant."}
            </p>
          </div>
        ) : (
          displayed.map(n => <NotifRow key={n.id} n={n} onMarkRead={handleMarkRead} />)
        )}

        {/* Pagination */}
        {totalPages > 1 && filter === "all" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>{total} notifications au total</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ padding: "0 12px", lineHeight: "34px", fontSize: 13, color: "#0f172a" }}>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
