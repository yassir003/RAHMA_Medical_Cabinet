"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, User, Calendar, FileText, Activity,
  Loader2, AlertCircle, Heart, AlertTriangle, History, ChevronRight,
} from "lucide-react";
import {
  getPatientById, getPatientConsultations, getPatientRendezVous,
  type Patient, type Consultation, type RendezVous,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

const STATUT_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  PLANIFIE: { label: "Planifié",  bg: "#eff6ff", color: "#2563eb" },
  CONFIRME: { label: "Confirmé",  bg: "#ecfdf5", color: "#16a34a" },
  ANNULE:   { label: "Annulé",    bg: "#fef2f2", color: "#dc2626" },
  TERMINE:  { label: "Terminé",   bg: "#f8fafc", color: "#475569" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoBadge({ label, value, color = "#475569", bg = "#f8fafc" }: {
  label: string; value?: string | null; color?: string; bg?: string;
}) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color, background: bg, padding: "4px 10px", borderRadius: 8, display: "inline-block" }}>
        {value}
      </span>
    </div>
  );
}

type Tab = "historique" | "rdvs" | "infos";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PatientDossierPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient]           = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [rdvs, setRdvs]                 = useState<RendezVous[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [activeTab, setActiveTab]       = useState<Tab>("historique");

  useEffect(() => {
    if (!id) return;
    const pid = Number(id);
    Promise.all([
      getPatientById(pid),
      getPatientConsultations(pid, 0, 50),
      getPatientRendezVous(pid, 0, 50),
    ])
      .then(([p, cons, rv]) => {
        setPatient(p);
        setConsultations(cons.content.sort((a, b) => new Date(b.dateVisite).getTime() - new Date(a.dateVisite).getTime()));
        setRdvs(rv.content.sort((a, b) => new Date(b.dateHeure).getTime() - new Date(a.dateHeure).getTime()));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#64748b" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span>Chargement du dossier médical…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b" }}>
        <AlertCircle size={40} style={{ marginBottom: 12 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Patient introuvable</h3>
        <p style={{ marginBottom: 24, color: "#94a3b8" }}>{error}</p>
        <button onClick={() => router.back()}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 700, cursor: "pointer" }}>
          Retour
        </button>
      </div>
    );
  }

  const age = calcAge(patient.dateNaissance);
  const tabStyle = (t: Tab) => ({
    padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
    fontWeight: activeTab === t ? 700 : 500, fontSize: 14,
    background: activeTab === t ? "var(--primary, #2fb5fc)" : "transparent",
    color: activeTab === t ? "white" : "#64748b",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => router.back()} style={{
          background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ArrowLeft size={18} color="#64748b" />
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>
            Dossier Médical
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {patient.prenom} {patient.nom}
            {age !== null && <> · {age} ans</>}
          </p>
        </div>
      </div>

      {/* ── Patient hero card ─────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--primary, #2fb5fc)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 900, fontSize: 26, flexShrink: 0 }}>
            {patient.prenom?.charAt(0)?.toUpperCase()}{patient.nom?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
              {patient.prenom} {patient.nom}
            </h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {patient.cin && <span style={{ fontSize: 13, color: "#64748b" }}>CIN: <strong>{patient.cin}</strong></span>}
              {patient.dateNaissance && <span style={{ fontSize: 13, color: "#64748b" }}>Né(e) le: <strong>{fmtDate(patient.dateNaissance)}</strong>{age !== null && ` (${age} ans)`}</span>}
              {patient.telephone && <span style={{ fontSize: 13, color: "#64748b" }}>☎ {patient.telephone}</span>}
              {patient.email && <span style={{ fontSize: 13, color: "#64748b" }}>✉ {patient.email}</span>}
            </div>
          </div>
        </div>

        {/* Medical alerts */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {patient.groupeSanguin && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
              background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>
              <Heart size={15} color="#dc2626" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>Groupe: {patient.groupeSanguin}</span>
            </div>
          )}
          {patient.allergies && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
              background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", flex: 1, maxWidth: 400 }}>
              <AlertTriangle size={15} color="#d97706" />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>ALLERGIES</div>
                <div style={{ fontSize: 13, color: "#92400e" }}>{patient.allergies}</div>
              </div>
            </div>
          )}
          {patient.antecedents && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
              background: "#f5f3ff", borderRadius: 10, border: "1px solid #ddd6fe", flex: 1 }}>
              <History size={15} color="#7c3aed" />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>ANTÉCÉDENTS</div>
                <div style={{ fontSize: 13, color: "#5b21b6" }}>{patient.antecedents}</div>
              </div>
            </div>
          )}
          {!patient.groupeSanguin && !patient.allergies && !patient.antecedents && (
            <span style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>Aucune information médicale critique enregistrée.</span>
          )}
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 4, padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <button style={tabStyle("historique")} onClick={() => setActiveTab("historique")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={14} /> Historique des consultations ({consultations.length})
            </span>
          </button>
          <button style={tabStyle("rdvs")} onClick={() => setActiveTab("rdvs")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={14} /> Rendez-vous ({rdvs.length})
            </span>
          </button>
          <button style={tabStyle("infos")} onClick={() => setActiveTab("infos")}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <User size={14} /> Informations personnelles
            </span>
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* ══ Historique des consultations ══════════════════════ */}
          {activeTab === "historique" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {consultations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                  <FileText size={38} style={{ marginBottom: 12 }} />
                  <p>Aucune consultation enregistrée pour ce patient.</p>
                </div>
              ) : (
                consultations.map((c) => (
                  <div key={c.id} style={{
                    padding: "18px 22px", border: "1px solid #f1f5f9", borderRadius: 12,
                    background: "#fafafa", cursor: "pointer", transition: "box-shadow 0.2s",
                  }}
                    onClick={() => c.id && router.push(`/dashboard/doctors/consultations/${c.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                            {fmtDateTime(c.dateVisite)}
                          </span>
                          <span style={{
                            padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: c.diagnostic ? "#dcfce7" : "#fef3c7",
                            color: c.diagnostic ? "#16a34a" : "#d97706",
                          }}>
                            {c.diagnostic ? "Validé" : "En rédaction"}
                          </span>
                        </div>
                        {c.motif && <div style={{ fontSize: 13, color: "#475569", marginBottom: 4 }}>Motif: {c.motif}</div>}
                        {c.diagnostic && (
                          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, marginBottom: 4, lineHeight: 1.5 }}>
                            <span style={{ color: "#94a3b8" }}>Diagnostic: </span>{c.diagnostic}
                          </div>
                        )}
                        {c.actesRealises && (
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            Actes: {c.actesRealises}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, marginLeft: 16 }}>
                        {c.montantTotal != null && (
                          <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}>
                            {c.montantTotal.toLocaleString("fr-FR")} MAD
                          </span>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}>
                          Dr. {c.medecinPrenom} {c.medecinNom}
                        </div>
                        <ChevronRight size={16} color="#cbd5e1" />
                      </div>
                    </div>
                    {c.notes && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "#f1f5f9",
                        borderRadius: 8, fontSize: 12, color: "#64748b",
                        borderLeft: "3px solid #cbd5e1", lineHeight: 1.5 }}>
                        {c.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══ Rendez-vous ═══════════════════════════════════════ */}
          {activeTab === "rdvs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rdvs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#94a3b8" }}>
                  <Calendar size={38} style={{ marginBottom: 12 }} />
                  <p>Aucun rendez-vous enregistré.</p>
                </div>
              ) : (
                rdvs.map((rv) => {
                  const s = STATUT_LABELS[rv.statut] ?? { label: rv.statut, bg: "#f8fafc", color: "#475569" };
                  return (
                    <div key={rv.id} style={{ padding: "16px 20px", border: "1px solid #f1f5f9", borderRadius: 12, background: "#fafafa" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, marginBottom: 4 }}>
                            {fmtDateTime(rv.dateHeure)}
                          </div>
                          <div style={{ fontSize: 13, color: "#64748b" }}>
                            {rv.motif || "Consultation"} · Dr. {rv.medecinPrenom} {rv.medecinNom}
                            {rv.medecinSpecialite && <span style={{ color: "#94a3b8" }}> ({rv.medecinSpecialite})</span>}
                          </div>
                        </div>
                        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      {rv.notes && (
                        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f8fafc",
                          borderRadius: 8, fontSize: 12, color: "#64748b", borderLeft: "3px solid #e2e8f0" }}>
                          {rv.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ══ Informations personnelles ═════════════════════════ */}
          {activeTab === "infos" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: -4 }}>Identité</h4>
                <InfoBadge label="Nom complet" value={`${patient.prenom} ${patient.nom}`} />
                <InfoBadge label="CIN" value={patient.cin} />
                <InfoBadge label="Date de naissance" value={patient.dateNaissance ? `${fmtDate(patient.dateNaissance)}${age !== null ? ` (${age} ans)` : ""}` : null} />
                <InfoBadge label="Téléphone" value={patient.telephone} />
                <InfoBadge label="Email" value={patient.email} />
                <InfoBadge label="Adresse" value={patient.adresse} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: -4 }}>Informations médicales</h4>
                <InfoBadge label="Groupe sanguin" value={patient.groupeSanguin} color="#dc2626" bg="#fef2f2" />
                <InfoBadge label="Allergies connues" value={patient.allergies} color="#92400e" bg="#fffbeb" />
                <InfoBadge label="Antécédents médicaux" value={patient.antecedents} color="#5b21b6" bg="#f5f3ff" />
                {!patient.groupeSanguin && !patient.allergies && !patient.antecedents && (
                  <span style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>Aucune information médicale renseignée.</span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
