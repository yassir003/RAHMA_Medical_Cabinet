"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getMyProfile, getMyConsultations, type Patient, type Consultation } from "@/lib/api";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Activity, Stethoscope, FileText, User, AlertTriangle } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function calcAge(dateNaissance: string) {
  const today = new Date();
  const born = new Date(dateNaissance);
  let age = today.getFullYear() - born.getFullYear();
  if (today < new Date(today.getFullYear(), born.getMonth(), born.getDate())) age--;
  return age;
}

// ---------------------------------------------------------------------------
// Consultation card with expand/collapse
// ---------------------------------------------------------------------------

function ConsultationCard({ c }: { c: Consultation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: "1px solid #f1f5f9", borderRadius: 14, overflow: "hidden", marginBottom: 12, transition: "box-shadow .15s" }}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "white", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Stethoscope size={20} color="#2563eb" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              Consultation du {fmtDate(c.dateVisite)}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
              Dr. {c.medecinPrenom} {c.medecinNom}
              {c.motif ? ` — ${c.motif}` : ""}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {c.montantTotal != null && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
              {c.montantTotal.toFixed(2)} MAD
            </span>
          )}
          {expanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "20px 24px", backgroundColor: "#fafbfc" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {c.diagnostic && (
              <Section title="Diagnostic" icon={<Activity size={14} color="#2563eb" />}>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{c.diagnostic}</p>
              </Section>
            )}
            {c.actesRealises && (
              <Section title="Actes réalisés / Prescriptions" icon={<FileText size={14} color="#8b5cf6" />}>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.actesRealises}</p>
              </Section>
            )}
            {c.notes && (
              <Section title="Notes" icon={<FileText size={14} color="#f59e0b" />}>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{c.notes}</p>
              </Section>
            )}
          </div>
          {!c.diagnostic && !c.actesRealises && !c.notes && (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Aucun détail supplémentaire enregistré.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PatientMedicalPage() {
  const [profile, setProfile] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 10;

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const [prof, cons] = await Promise.all([
        getMyProfile(),
        getMyConsultations(p, PAGE_SIZE),
      ]);
      setProfile(prof);
      setConsultations(cons.content ?? []);
      setTotal(cons.totalElements ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading && !profile) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0" }}>
      <h2 style={{ margin: "0 0 28px", fontSize: 24, fontWeight: 700, color: "#0f172a" }}>Mon suivi médical</h2>

      {/* Patient info card */}
      {profile && (
        <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 32, display: "flex", flexWrap: "wrap", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={32} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{profile.prenom} {profile.nom}</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                {profile.dateNaissance && `${calcAge(profile.dateNaissance)} ans`}
                {profile.telephone && ` · ${profile.telephone}`}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {profile.groupeSanguin && (
              <InfoBadge label="Groupe sanguin" value={profile.groupeSanguin} color="#ef4444" bg="#fef2f2" />
            )}
            {profile.allergies && (
              <InfoBadge label="Allergies" value={profile.allergies} color="#f59e0b" bg="#fffbeb" icon={<AlertTriangle size={13} />} />
            )}
            {profile.antecedents && (
              <InfoBadge label="Antécédents" value={profile.antecedents} color="#8b5cf6" bg="#f5f3ff" />
            )}
          </div>
        </div>
      )}

      {/* Consultations */}
      <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            Historique des consultations
          </h3>
          <span style={{ fontSize: 13, color: "#64748b" }}>{total} consultation{total > 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
            <div style={{ width: 32, height: 32, border: "4px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        ) : consultations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
            <Stethoscope size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Aucune consultation enregistrée.</p>
          </div>
        ) : (
          <>
            {consultations.map(c => <ConsultationCard key={c.id} c={c} />)}

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 13, color: "#0f172a" }}>Page {page + 1} sur {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function InfoBadge({ label, value, color, bg, icon }: { label: string; value: string; color: string; bg: string; icon?: React.ReactNode }) {
  return (
    <div style={{ padding: "12px 16px", borderRadius: 12, backgroundColor: bg, maxWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}
