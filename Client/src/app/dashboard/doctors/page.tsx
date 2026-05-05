"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle, Search, User, PenTool, CalendarDays,
  CheckCircle, Clock, ChevronRight, Loader2, X,
  AlertCircle, Stethoscope, FileText, Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getMedecinMe, getConsultationsByMedecin, getRendezVous,
  getPatients, createConsultation, updateRendezVousStatut,
  type Medecin, type Consultation, type RendezVous, type Patient,
  ApiError,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type Tab = "consultations" | "patients" | "rendezVous" | "planification";

const STATUT_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PLANIFIE:  { label: "Planifié",  bg: "#eff6ff", color: "#2563eb" },
  CONFIRME:  { label: "Confirmé",  bg: "#ecfdf5", color: "#16a34a" },
  ANNULE:    { label: "Annulé",    bg: "#fef2f2", color: "#dc2626" },
  TERMINE:   { label: "Terminé",   bg: "#f8fafc", color: "#475569" },
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateShort(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ElementType; label: string; value: number | string;
  color: string; bg: string;
}) {
  return (
    <div style={{
      background: "white", borderRadius: "16px", padding: "24px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex",
      alignItems: "center", gap: "20px", border: "1px solid #f1f5f9",
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={26} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DoctorWorkspacePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect ADMIN to list page
  useEffect(() => {
    if (user?.role === "ADMIN") router.replace("/dashboard/doctors/list");
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<Tab>("consultations");
  const [medecin, setMedecin] = useState<Medecin | null>(null);
  const [medecinLoading, setMedecinLoading] = useState(true);

  // ── Consultations state ──────────────────────────────────────────────────
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consLoading, setConsLoading] = useState(false);
  const [consSearch, setConsSearch] = useState("");

  // ── RDVs state ───────────────────────────────────────────────────────────
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [rdvLoading, setRdvLoading] = useState(false);

  // ── Create consultation modal ────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patSearch, setPatSearch] = useState("");
  const [patDropOpen, setPatDropOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newCons, setNewCons] = useState({
    dateVisite: "", motif: "", notes: "", diagnostic: "", actesRealises: "", montantTotal: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const patRef = useRef<HTMLDivElement>(null);

  // ── RDV status update ────────────────────────────────────────────────────
  const [updatingRdv, setUpdatingRdv] = useState<number | null>(null);

  // ── Load médecin profile ─────────────────────────────────────────────────
  useEffect(() => {
    if (user?.role !== "MEDECIN") return;
    getMedecinMe()
      .then(setMedecin)
      .finally(() => setMedecinLoading(false));
  }, [user]);

  // ── Load consultations (when médecin is known) ───────────────────────────
  const loadConsultations = useCallback(() => {
    if (!medecin) return;
    setConsLoading(true);
    getConsultationsByMedecin(medecin.id, 0, 50)
      .then((r) => setConsultations(r.content))
      .finally(() => setConsLoading(false));
  }, [medecin]);

  // ── Load RDVs ─────────────────────────────────────────────────────────────
  const loadRdvs = useCallback(() => {
    if (!medecin) return;
    setRdvLoading(true);
    getRendezVous(0, 100)
      .then((r) => setRdvs(r.content.filter((rv) => rv.medecinId === medecin.id)))
      .finally(() => setRdvLoading(false));
  }, [medecin]);

  useEffect(() => {
    if (!medecin) return;
    loadConsultations();
    loadRdvs();
  }, [medecin, loadConsultations, loadRdvs]);

  // ── Patient search (for create modal) ────────────────────────────────────
  useEffect(() => {
    if (!patSearch.trim()) { setPatients([]); return; }
    const t = setTimeout(() => {
      getPatients(0, 8, patSearch).then((r) => setPatients(r.content));
    }, 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  // Close patient dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patRef.current && !patRef.current.contains(e.target as Node)) {
        setPatDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Filtered consultations ────────────────────────────────────────────────
  const filteredCons = consultations.filter((c) => {
    const q = consSearch.toLowerCase();
    return (
      `${c.patientNom} ${c.patientPrenom}`.toLowerCase().includes(q) ||
      (c.motif || "").toLowerCase().includes(q) ||
      (c.diagnostic || "").toLowerCase().includes(q)
    );
  });

  // ── Unique patients from consultations ────────────────────────────────────
  const myPatients = Array.from(
    new Map(consultations.map((c) => [c.patientId, { id: c.patientId, nom: c.patientNom, prenom: c.patientPrenom }])).values()
  );

  // ── Planification: upcoming RDVs ──────────────────────────────────────────
  const upcoming = [...rdvs]
    .filter((r) => r.statut === "PLANIFIE" || r.statut === "CONFIRME")
    .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
    .slice(0, 10);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const enRedaction = consultations.filter((c) => !c.diagnostic).length;
  const rdvAujourdhui = rdvs.filter((r) => {
    const d = new Date(r.dateHeure);
    const t = new Date();
    return d.toDateString() === t.toDateString() && r.statut !== "ANNULE";
  }).length;

  // ── Create consultation handler ───────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!medecin || !selectedPatient) return;
    setCreating(true);
    setCreateError("");
    try {
      await createConsultation({
        patientId: selectedPatient.id,
        medecinId: medecin.id,
        dateVisite: newCons.dateVisite,
        motif: newCons.motif || undefined,
        notes: newCons.notes || undefined,
        diagnostic: newCons.diagnostic || undefined,
        actesRealises: newCons.actesRealises || undefined,
        montantTotal: newCons.montantTotal ? parseFloat(newCons.montantTotal) : undefined,
      });
      setModalOpen(false);
      setNewCons({ dateVisite: "", motif: "", notes: "", diagnostic: "", actesRealises: "", montantTotal: "" });
      setSelectedPatient(null);
      setPatSearch("");
      loadConsultations();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  }

  // ── Update RDV status ─────────────────────────────────────────────────────
  async function handleRdvStatus(rdvId: number, statut: string) {
    setUpdatingRdv(rdvId);
    try {
      const updated = await updateRendezVousStatut(rdvId, statut);
      setRdvs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } finally {
      setUpdatingRdv(null);
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (medecinLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#64748b" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span>Chargement de votre espace médecin…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Tab style helper ──────────────────────────────────────────────────────
  const tabStyle = (t: Tab) => ({
    padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
    fontWeight: activeTab === t ? 700 : 500, fontSize: 14,
    background: activeTab === t ? "var(--primary, #2fb5fc)" : "transparent",
    color: activeTab === t ? "white" : "#64748b",
    transition: "all 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
            Espace Médecin
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {medecin
              ? `Dr. ${medecin.prenom} ${medecin.nom} — ${medecin.specialite}`
              : "Gérez vos consultations, diagnostics et planification des soins."}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: "12px 24px", borderRadius: 12, border: "none",
            background: "var(--primary, #2fb5fc)", color: "white", fontWeight: 700,
            fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <PlusCircle size={18} /> Nouvelle Consultation
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        <StatCard icon={FileText}     label="Mes consultations"  value={consultations.length} color="#3b82f6" bg="#eff6ff" />
        <StatCard icon={PenTool}      label="En rédaction"       value={enRedaction}           color="#8b5cf6" bg="#f5f3ff" />
        <StatCard icon={User}         label="Mes patients"       value={myPatients.length}     color="#10b981" bg="#ecfdf5" />
        <StatCard icon={CalendarDays} label="RDV aujourd'hui"    value={rdvAujourdhui}         color="#f59e0b" bg="#fffbeb" />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 4, padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <button style={tabStyle("consultations")} onClick={() => setActiveTab("consultations")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FileText size={15} /> Consultations</span>
          </button>
          <button style={tabStyle("patients")} onClick={() => setActiveTab("patients")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={15} /> Mes patients ({myPatients.length})</span>
          </button>
          <button style={tabStyle("rendezVous")} onClick={() => setActiveTab("rendezVous")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><CalendarDays size={15} /> Rendez-vous ({rdvs.length})</span>
          </button>
          <button style={tabStyle("planification")} onClick={() => setActiveTab("planification")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={15} /> Planification ({upcoming.length})</span>
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* ═════════════════ TAB: Consultations ═══════════════════ */}
          {activeTab === "consultations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ position: "relative", maxWidth: 340 }}>
                <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={consSearch} onChange={(e) => setConsSearch(e.target.value)}
                  placeholder="Rechercher patient, motif, diagnostic…"
                  style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
                />
              </div>

              {consLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "#94a3b8" }}>
                  <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : filteredCons.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                  <FileText size={40} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 15 }}>Aucune consultation trouvée.</p>
                </div>
              ) : (
                filteredCons.map((c) => {
                  const validated = !!c.diagnostic;
                  return (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px", border: "1px solid #f1f5f9", borderRadius: 12,
                      background: "#fafafa", cursor: "pointer", transition: "box-shadow 0.2s",
                    }}
                      onClick={() => router.push(`/dashboard/doctors/consultations/${c.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User size={20} color="#64748b" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                            {c.patientPrenom} {c.patientNom}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {c.motif || "Sans motif"} · <span style={{ color: "#94a3b8" }}>{fmtDate(c.dateVisite)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: validated ? "#dcfce7" : "#fef3c7",
                          color: validated ? "#16a34a" : "#d97706",
                        }}>
                          {validated ? "Validé" : "En rédaction"}
                        </span>
                        <ChevronRight size={16} color="#94a3b8" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═════════════════ TAB: Mes Patients ════════════════════ */}
          {activeTab === "patients" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myPatients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                  <User size={40} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 15 }}>Aucun patient trouvé dans vos consultations.</p>
                </div>
              ) : (
                myPatients.map((p) => {
                  const lastCons = consultations
                    .filter((c) => c.patientId === p.id)
                    .sort((a, b) => new Date(b.dateVisite).getTime() - new Date(a.dateVisite).getTime())[0];
                  return (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "16px 20px", border: "1px solid #f1f5f9", borderRadius: 12,
                      background: "#fafafa", cursor: "pointer", transition: "box-shadow 0.2s",
                    }}
                      onClick={() => router.push(`/dashboard/doctors/patients/${p.id}`)}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary, #2fb5fc)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontWeight: 800, fontSize: 16 }}>
                          {p.prenom?.charAt(0).toUpperCase()}{p.nom?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                            {p.prenom} {p.nom}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {consultations.filter((c) => c.patientId === p.id).length} consultation(s)
                            {lastCons && <> · Dernière: {fmtDateShort(lastCons.dateVisite)}</>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>Voir dossier</span>
                        <ChevronRight size={16} color="#94a3b8" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ═════════════════ TAB: Rendez-vous ═════════════════════ */}
          {activeTab === "rendezVous" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rdvLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40, color: "#94a3b8" }}>
                  <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                </div>
              ) : rdvs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                  <CalendarDays size={40} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 15 }}>Aucun rendez-vous trouvé.</p>
                </div>
              ) : (
                rdvs
                  .sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime())
                  .map((rv) => {
                    const s = STATUT_LABELS[rv.statut] ?? { label: rv.statut, bg: "#f1f5f9", color: "#475569" };
                    const isUpdating = updatingRdv === rv.id;
                    return (
                      <div key={rv.id} style={{
                        padding: "16px 20px", border: "1px solid #f1f5f9", borderRadius: 12, background: "#fafafa",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg,
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <CalendarDays size={20} color={s.color} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                                {rv.patientPrenom} {rv.patientNom}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                                {rv.motif || "Consultation"} · {fmtDate(rv.dateHeure)}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                            {rv.statut === "CONFIRME" && (
                              <button disabled={isUpdating} onClick={() => handleRdvStatus(rv.id, "TERMINE")}
                                style={{ padding: "6px 14px", borderRadius: 8, border: "none",
                                  background: "#ecfdf5", color: "#16a34a", fontWeight: 700,
                                  fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                {isUpdating ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
                                Terminer
                              </button>
                            )}
                            {rv.statut === "PLANIFIE" && (
                              <button disabled={isUpdating} onClick={() => handleRdvStatus(rv.id, "CONFIRME")}
                                style={{ padding: "6px 14px", borderRadius: 8, border: "none",
                                  background: "#eff6ff", color: "#2563eb", fontWeight: 700,
                                  fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                {isUpdating ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
                                Confirmer
                              </button>
                            )}
                          </div>
                        </div>
                        {rv.notes && (
                          <div style={{ marginTop: 10, padding: "8px 14px", background: "#f8fafc",
                            borderRadius: 8, fontSize: 13, color: "#475569", borderLeft: "3px solid #e2e8f0" }}>
                            {rv.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* ═════════════════ TAB: Planification ═══════════════════ */}
          {activeTab === "planification" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {upcoming.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                  <Clock size={40} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 15 }}>Aucun soin planifié à venir.</p>
                </div>
              ) : (
                upcoming.map((rv, i) => {
                  const s = STATUT_LABELS[rv.statut] ?? { label: rv.statut, bg: "#f1f5f9", color: "#475569" };
                  const d = new Date(rv.dateHeure);
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div key={rv.id} style={{ display: "flex", gap: 20, paddingBottom: i < upcoming.length - 1 ? 24 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 56, flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? "var(--primary, #2fb5fc)" : "#64748b", textAlign: "center", lineHeight: 1.2 }}>
                          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                          {isToday ? "Aujourd'hui" : fmtDateShort(rv.dateHeure)}
                        </div>
                        {i < upcoming.length - 1 && <div style={{ flex: 1, width: 2, background: "#e2e8f0", marginTop: 8, minHeight: 24 }} />}
                      </div>
                      <div style={{
                        flex: 1, background: "white", borderRadius: 12, padding: "14px 18px",
                        border: `1px solid ${isToday ? "var(--primary, #2fb5fc)" : "#e2e8f0"}`,
                        boxShadow: isToday ? "0 0 0 3px rgba(47,181,252,0.1)" : "none",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                              {rv.patientPrenom} {rv.patientNom}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>
                              {rv.motif || "Consultation"}
                            </div>
                          </div>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, flexShrink: 0 }}>
                            {s.label}
                          </span>
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                          <button onClick={() => handleRdvStatus(rv.id, "CONFIRME")}
                            disabled={rv.statut === "CONFIRME" || updatingRdv === rv.id}
                            style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #e2e8f0",
                              background: rv.statut === "CONFIRME" ? "#ecfdf5" : "white",
                              color: rv.statut === "CONFIRME" ? "#16a34a" : "#64748b",
                              fontSize: 12, fontWeight: 600, cursor: rv.statut === "CONFIRME" ? "default" : "pointer" }}>
                            {rv.statut === "CONFIRME" ? "✓ Confirmé" : "Confirmer"}
                          </button>
                          <button onClick={() => router.push(`/dashboard/doctors/consultations/new?rdvId=${rv.id}&patientId=${rv.patientId}&medecinId=${medecin?.id}`)}
                            style={{ padding: "5px 12px", borderRadius: 7, border: "none",
                              background: "var(--primary, #2fb5fc)", color: "white",
                              fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Créer consultation
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Create Consultation Modal ──────────────────────────────── */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "white", borderRadius: 20, padding: 36, width: "100%", maxWidth: 640,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                  Nouvelle Consultation
                </h3>
                <p style={{ fontSize: 14, color: "#64748b" }}>
                  Remplissez les détails pour créer une fiche de consultation.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Patient selector */}
              <div ref={patRef} style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Patient *
                </label>
                {selectedPatient ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", borderRadius: 10, border: "1px solid var(--primary, #2fb5fc)",
                    background: "#f0f9ff" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                      {selectedPatient.prenom} {selectedPatient.nom}
                    </span>
                    <button type="button" onClick={() => { setSelectedPatient(null); setPatSearch(""); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ position: "relative" }}>
                      <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        value={patSearch}
                        onChange={(e) => { setPatSearch(e.target.value); setPatDropOpen(true); }}
                        onFocus={() => setPatDropOpen(true)}
                        placeholder="Rechercher un patient…"
                        style={{ width: "100%", padding: "11px 14px 11px 34px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }}
                      />
                    </div>
                    {patDropOpen && patients.length > 0 && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                        background: "white", borderRadius: 10, border: "1px solid #e2e8f0",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)", marginTop: 4, maxHeight: 220, overflowY: "auto",
                      }}>
                        {patients.map((p) => (
                          <div key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatDropOpen(false); setPatSearch(""); }}
                            style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #f8fafc" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                          >
                            <span style={{ fontWeight: 600 }}>{p.prenom} {p.nom}</span>
                            <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 8 }}>{p.cin}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Date & Motif */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Date de visite *</label>
                  <input type="datetime-local" required value={newCons.dateVisite}
                    onChange={(e) => setNewCons((p) => ({ ...p, dateVisite: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Motif</label>
                  <input type="text" placeholder="Motif de consultation" value={newCons.motif}
                    onChange={(e) => setNewCons((p) => ({ ...p, motif: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Observations initiales</label>
                <textarea placeholder="Notes et observations…" rows={3} value={newCons.notes}
                  onChange={(e) => setNewCons((p) => ({ ...p, notes: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", resize: "vertical" }} />
              </div>

              {/* Diagnostic */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                  Diagnostic <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optionnel — peut être complété plus tard)</span>
                </label>
                <textarea placeholder="Diagnostic médical…" rows={2} value={newCons.diagnostic}
                  onChange={(e) => setNewCons((p) => ({ ...p, diagnostic: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", resize: "vertical" }} />
              </div>

              {/* Actes + Montant */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Actes réalisés</label>
                  <input type="text" placeholder="Ex: ECG, Prise de sang…" value={newCons.actesRealises}
                    onChange={(e) => setNewCons((p) => ({ ...p, actesRealises: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Montant (MAD)</label>
                  <input type="number" min={0} step="0.01" placeholder="0.00" value={newCons.montantTotal}
                    onChange={(e) => setNewCons((p) => ({ ...p, montantTotal: e.target.value }))}
                    style={{ width: 120, padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }} />
                </div>
              </div>

              {createError && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
                  <AlertCircle size={15} /> {createError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setModalOpen(false)}
                  style={{ padding: "11px 22px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Annuler
                </button>
                <button type="submit" disabled={creating || !selectedPatient || !newCons.dateVisite}
                  style={{ padding: "11px 28px", borderRadius: 10, border: "none",
                    background: creating ? "#cbd5e1" : "var(--primary, #2fb5fc)",
                    color: "white", fontWeight: 700, fontSize: 14, cursor: creating ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8 }}>
                  {creating ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Création…</> : "Créer la consultation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
