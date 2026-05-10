"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, CalendarClock, Building, MessageSquare,
  PlusCircle, ChevronRight, Loader2, AlertTriangle,
  FileText, Calendar, CheckCircle, XCircle, Bot, Send, User,
} from "lucide-react";
import {
  getRendezVousAll, getDossiers, getPatients,
  updateRendezVousStatut, chatAi,
  type RendezVous, type DossierRemboursement,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const RDV_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  PLANIFIE: { label: "Planifié",  bg: "#fef3c7", color: "#d97706" },
  CONFIRME: { label: "Confirmé",  bg: "#dcfce7", color: "#16a34a" },
  ANNULE:   { label: "Annulé",    bg: "#f1f5f9", color: "#94a3b8" },
  TERMINE:  { label: "Terminé",   bg: "#eff6ff", color: "#3b82f6" },
};

const DOSSIER_STATUT: Record<string, { label: string; color: string; alert: boolean }> = {
  EN_ATTENTE: { label: "En attente",      color: "#d97706", alert: false },
  ENVOYE:     { label: "Envoyé",          color: "#3b82f6", alert: false },
  ACCEPTE:    { label: "Accepté",         color: "#16a34a", alert: false },
  REJETE:     { label: "Rejeté",          color: "#dc2626", alert: true  },
  REMBOURSE:  { label: "Remboursé",       color: "#16a34a", alert: false },
};

type ChatMsg = { role: "user" | "assistant"; text: string };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SecretaryWorkspacePage() {
  const router = useRouter();

  // ── Data ─────────────────────────────────────────────────────────────────
  const [rdvs, setRdvs]           = useState<RendezVous[]>([]);
  const [dossiers, setDossiers]   = useState<DossierRemboursement[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [updatingRdv, setUpdatingRdv] = useState<number | null>(null);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [chatOpen, setChatOpen]   = useState(false);
  const [messages, setMessages]   = useState<ChatMsg[]>([
    { role: "assistant", text: "Bonjour ! Je suis votre assistant médical. Comment puis-je vous aider ?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Load data ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rdvRes, dossierRes, patRes] = await Promise.all([
        getRendezVousAll(0, 200),
        getDossiers(0, 50),
        getPatients(0, 1),
      ]);
      setRdvs(rdvRes.content);
      setDossiers(dossierRes.content);
      setTotalPatients(patRes.totalElements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const todayRdvs  = rdvs.filter((r) => isToday(r.dateHeure)).sort(
    (a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime()
  );
  const rdvConfirmed = todayRdvs.filter((r) => r.statut === "CONFIRME").length;
  const rdvPending   = todayRdvs.filter((r) => r.statut === "PLANIFIE").length;
  const alertDossiers = dossiers.filter((d) => d.statut === "EN_ATTENTE" || d.statut === "REJETE");
  const dossierEnAttente = dossiers.filter((d) => d.statut === "EN_ATTENTE").length;
  const dossierRejete    = dossiers.filter((d) => d.statut === "REJETE").length;

  // ── RDV status update ────────────────────────────────────────────────────
  async function handleStatut(id: number, statut: string) {
    setUpdatingRdv(id);
    try {
      const updated = await updateRendezVousStatut(id, statut);
      setRdvs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } finally {
      setUpdatingRdv(null);
    }
  }

  // ── Chat ─────────────────────────────────────────────────────────────────
  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setMessages((p) => [...p, { role: "user", text }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const reply = await chatAi(text);
      setMessages((p) => [...p, { role: "assistant", text: reply }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", text: "Désolé, le service IA est indisponible pour l'instant." }]);
    } finally {
      setChatLoading(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#64748b" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span>Chargement de l'espace secrétariat…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
            Espace Secrétariat
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Accueil, planification, facturation et gestion administrative du cabinet.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => router.push("/dashboard/appointments")}
            style={{ padding: "11px 20px", borderRadius: 12, border: "1px solid #e2e8f0",
              background: "white", color: "#0f172a", fontWeight: 600, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={17} /> Agenda
          </button>
          <button onClick={() => router.push("/dashboard/patients")}
            style={{ padding: "11px 20px", borderRadius: 12, border: "none",
              background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 700,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <PlusCircle size={17} /> Nouveau Patient
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        {[
          { icon: CalendarClock, label: "RDV aujourd'hui",    value: todayRdvs.length,
            sub: `${rdvConfirmed} confirmés, ${rdvPending} en attente`, color: "#3b82f6", bg: "#eff6ff" },
          { icon: Building,      label: "Dossiers mutuelles", value: dossierEnAttente,
            sub: `${dossierRejete} rejeté(s)`, color: "#8b5cf6", bg: "#f5f3ff" },
          { icon: Users,         label: "Total patients",     value: totalPatients,
            sub: "Dossiers actifs", color: "#10b981", bg: "#ecfdf5" },
          { icon: MessageSquare, label: "Assistant IA",       value: "Chat",
            sub: "Disponible", color: "#f59e0b", bg: "#fffbeb" },
        ].map(({ icon: Icon, label, value, sub, color, bg }, i) => (
          <button key={i} type="button" disabled={i !== 3}
            onClick={i === 3 ? () => setChatOpen(true) : undefined}
            style={{ background: "white", padding: 22, borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9",
              cursor: i === 3 ? "pointer" : "default",
              display: "flex", flexDirection: "column", gap: 14, textAlign: "left",
              outline: "none" }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: bg,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={24} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 26 }}>

        {/* ── Left: Planning du jour ─────────────────────────── */}
        <div style={{ background: "white", borderRadius: 16, padding: 28,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
              Planning du Jour
              <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </h3>
            <button onClick={() => router.push("/dashboard/appointments")}
              style={{ color: "#3b82f6", background: "transparent", border: "none",
                fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Gérer le calendrier →
            </button>
          </div>

          {todayRdvs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <CalendarClock size={36} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14 }}>Aucun rendez-vous aujourd'hui.</p>
              <button onClick={() => router.push("/dashboard/appointments")}
                style={{ marginTop: 12, padding: "8px 18px", borderRadius: 8, border: "none",
                  background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 600,
                  fontSize: 13, cursor: "pointer" }}>
                Planifier un RDV
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {todayRdvs.map((rdv) => {
                const s = RDV_STATUT[rdv.statut] ?? { label: rdv.statut, bg: "#f1f5f9", color: "#475569" };
                const isUpd = updatingRdv === rdv.id;
                return (
                  <div key={rdv.id} style={{ display: "flex", alignItems: "stretch",
                    background: "#f8fafc", borderRadius: 12, overflow: "hidden", border: "1px solid #f1f5f9" }}>
                    <div style={{ width: 72, background: "white", borderRight: "1px dashed #e2e8f0",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", padding: "14px 8px", flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                        {fmtTime(rdv.dateHeure).split(":")[0]}
                      </span>
                      <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                        {fmtTime(rdv.dateHeure).split(":")[1]}
                      </span>
                    </div>
                    <div style={{ flex: 1, padding: "14px 16px", display: "flex",
                      justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 3 }}>
                          {rdv.patientPrenom} {rdv.patientNom}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {rdv.motif || "Consultation"} · Dr. {rdv.medecinPrenom} {rdv.medecinNom}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11,
                          fontWeight: 700, background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {rdv.statut === "PLANIFIE" && (
                            <button disabled={isUpd} onClick={() => handleStatut(rdv.id, "CONFIRME")}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "none",
                                background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700,
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                              {isUpd ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={11} />}
                              Confirmer
                            </button>
                          )}
                          {(rdv.statut === "PLANIFIE" || rdv.statut === "CONFIRME") && (
                            <button disabled={isUpd} onClick={() => handleStatut(rdv.id, "ANNULE")}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "none",
                                background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 700,
                                cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                              <XCircle size={11} /> Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Mutuelles + dossiers ───────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Alertes dossiers */}
          <div style={{ background: "white", borderRadius: 16, padding: 26,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Alertes Mutuelles</h3>
              <button onClick={() => router.push("/dashboard/mutuals")}
                style={{ color: "#3b82f6", background: "transparent", border: "none",
                  fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Tous les dossiers →
              </button>
            </div>

            {alertDossiers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                <CheckCircle size={28} style={{ marginBottom: 8 }} />
                <p>Aucune alerte à traiter.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {alertDossiers.slice(0, 5).map((d) => {
                  const s = DOSSIER_STATUT[d.statut];
                  return (
                    <div key={d.id} style={{ paddingBottom: 12,
                      borderBottom: "1px solid #f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                          {d.patientPrenom} {d.patientNom}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                        <FileText size={12} />
                        {d.mutuelleOrganisme || "—"} · {fmtDateShort(d.dateCreation)}
                      </div>
                      <div style={{ marginTop: 5, fontSize: 12, fontWeight: 700, color: s.color,
                        display: "flex", alignItems: "center", gap: 5 }}>
                        {s.alert && <AlertTriangle size={12} />}
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prochain RDV à venir */}
          <div style={{ background: "white", borderRadius: 16, padding: 26,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Prochains RDV</h3>
              <button onClick={() => router.push("/dashboard/appointments")}
                style={{ color: "#3b82f6", background: "transparent", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Voir tout →
              </button>
            </div>
            {(() => {
              const upcoming = rdvs
                .filter((r) => new Date(r.dateHeure) > new Date() && r.statut !== "ANNULE")
                .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
                .slice(0, 4);
              return upcoming.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Aucun RDV à venir.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {upcoming.map((r) => {
                    const s = RDV_STATUT[r.statut] ?? { label: r.statut, bg: "#f1f5f9", color: "#475569" };
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 12px", borderRadius: 10, background: "#f8fafc" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {r.patientPrenom} {r.patientNom}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {fmtDateShort(r.dateHeure)} à {fmtTime(r.dateHeure)}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px",
                          borderRadius: 12, background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Floating AI Chat ──────────────────────────────────── */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)}
          style={{ position: "fixed", bottom: 28, right: 32, width: 56, height: 56,
            borderRadius: "50%", border: "none", background: "var(--primary,#2fb5fc)",
            color: "white", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 6px 20px rgba(47,181,252,0.4)",
            zIndex: 100 }}>
          <Bot size={26} />
        </button>
      )}

      {chatOpen && (
        <div style={{ position: "fixed", bottom: 28, right: 32, width: 360, borderRadius: 20,
          background: "white", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column", zIndex: 200, overflow: "hidden",
          border: "1px solid #e2e8f0" }}>
          {/* Chat header */}
          <div style={{ background: "var(--primary,#2fb5fc)", padding: "14px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bot size={20} color="white" />
              <div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 14 }}>Assistant Médical IA</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Toujours disponible</div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
                width: 28, height: 28, cursor: "pointer", color: "white", display: "flex",
                alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10, maxHeight: 320 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8,
                flexDirection: m.role === "user" ? "row-reverse" : "row",
                alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: m.role === "user" ? "#e0f2fe" : "var(--primary,#2fb5fc)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.role === "user" ? <User size={14} color="#0284c7" /> : <Bot size={14} color="white" />}
                </div>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 14,
                  background: m.role === "user" ? "#f0f9ff" : "#f8fafc",
                  fontSize: 13, color: "#0f172a", lineHeight: 1.5,
                  borderBottomRightRadius: m.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.role === "assistant" ? 4 : 14 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#94a3b8" }}>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12 }}>En train de répondre…</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #f1f5f9",
            display: "flex", gap: 8 }}>
            <input value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Posez votre question…"
              style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
                fontSize: 13, outline: "none" }}
            />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
              style={{ width: 38, height: 38, borderRadius: 10, border: "none",
                background: chatInput.trim() ? "var(--primary,#2fb5fc)" : "#e2e8f0",
                color: chatInput.trim() ? "white" : "#94a3b8",
                cursor: chatInput.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
