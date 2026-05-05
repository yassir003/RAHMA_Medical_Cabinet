"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, CheckCircle, User, Calendar,
  FileText, Activity, Loader2, AlertCircle, ClipboardList,
} from "lucide-react";
import { getConsultationById, updateConsultation, type Consultation } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <div style={{ fontSize: 15, color: "#0f172a", marginTop: 4, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const [form, setForm] = useState({
    diagnostic:    "",
    notes:         "",
    actesRealises: "",
    montantTotal:  "",
  });

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    getConsultationById(Number(id))
      .then((c) => {
        setConsultation(c);
        setForm({
          diagnostic:    c.diagnostic    ?? "",
          notes:         c.notes         ?? "",
          actesRealises: c.actesRealises ?? "",
          montantTotal:  c.montantTotal != null ? String(c.montantTotal) : "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Save / Validate ──────────────────────────────────────────────────────
  async function handleSave(validate = false) {
    if (!consultation) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateConsultation(consultation.id, {
        patientId:     consultation.patientId,
        medecinId:     consultation.medecinId,
        dateVisite:    consultation.dateVisite,
        motif:         consultation.motif,
        rendezVousId:  consultation.rendezVousId,
        diagnostic:    form.diagnostic    || undefined,
        notes:         form.notes         || undefined,
        actesRealises: form.actesRealises || undefined,
        montantTotal:  form.montantTotal ? parseFloat(form.montantTotal) : undefined,
      });
      setConsultation(updated);
      setSuccess(validate ? "Consultation validée avec succès ✓" : "Modifications enregistrées ✓");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError((e as Error).message ?? "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  const isValidated = !!consultation?.diagnostic;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#64748b" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span>Chargement de la consultation…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748b" }}>
        <AlertCircle size={40} style={{ marginBottom: 12 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Consultation introuvable</h3>
        <p style={{ marginBottom: 24, color: "#94a3b8" }}>{error}</p>
        <button onClick={() => router.back()}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 700, cursor: "pointer" }}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => router.back()} style={{
          background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}>
          <ArrowLeft size={18} color="#64748b" />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            Fiche de consultation #{consultation.id}
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {fmtDate(consultation.dateVisite)}
          </p>
        </div>
        <span style={{
          padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
          background: isValidated ? "#dcfce7" : "#fef3c7",
          color: isValidated ? "#16a34a" : "#d97706",
        }}>
          {isValidated ? "✓ Validé" : "En rédaction"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 24 }}>

        {/* ── Left: Info card ───────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Patient card */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <User size={17} color="#3b82f6" />
              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Patient</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--primary, #2fb5fc)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 800, fontSize: 18 }}>
                {consultation.patientPrenom?.charAt(0)}{consultation.patientNom?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>
                  {consultation.patientPrenom} {consultation.patientNom}
                </div>
                <button onClick={() => router.push(`/dashboard/doctors/patients/${consultation.patientId}`)}
                  style={{ marginTop: 4, background: "none", border: "none", cursor: "pointer",
                    color: "var(--primary, #2fb5fc)", fontSize: 13, fontWeight: 600, padding: 0,
                    display: "flex", alignItems: "center", gap: 4 }}>
                  Voir le dossier médical →
                </button>
              </div>
            </div>
          </div>

          {/* Consultation info card */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <ClipboardList size={17} color="#8b5cf6" />
              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Informations</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Médecin" value={`Dr. ${consultation.medecinPrenom} ${consultation.medecinNom}`} />
              <Field label="Date" value={fmtDate(consultation.dateVisite)} />
              <Field label="Motif" value={consultation.motif} />
              {consultation.rendezVousId && (
                <Field label="Rendez-vous lié" value={`#${consultation.rendezVousId}`} />
              )}
            </div>
          </div>

          {/* Montant */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Activity size={17} color="#10b981" />
              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Montant</span>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Montant total (MAD)
              </label>
              <input
                type="number" min={0} step="0.01" placeholder="0.00"
                value={form.montantTotal}
                onChange={(e) => setForm((p) => ({ ...p, montantTotal: e.target.value }))}
                style={{ display: "block", marginTop: 6, width: "100%", padding: "11px 14px",
                  borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, fontWeight: 700,
                  color: "#0f172a", outline: "none" }}
              />
            </div>
          </div>
        </div>

        {/* ── Right: Edit form ──────────────────────────────────── */}
        <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <FileText size={17} color="#3b82f6" />
            <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Rédaction médicale</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Diagnostic */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                Diagnostic médical
                {!form.diagnostic && <span style={{ marginLeft: 8, fontSize: 12, color: "#f59e0b", fontWeight: 500 }}>· Requis pour valider</span>}
              </label>
              <textarea
                rows={5} placeholder="Rédigez votre diagnostic ici…"
                value={form.diagnostic}
                onChange={(e) => setForm((p) => ({ ...p, diagnostic: e.target.value }))}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${form.diagnostic ? "#e2e8f0" : "#fed7aa"}`,
                  fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6,
                  background: form.diagnostic ? "white" : "#fffbeb" }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                Observations & Notes
              </label>
              <textarea
                rows={4} placeholder="Observations cliniques, notes supplémentaires…"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0",
                  fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            {/* Actes réalisés */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>
                Actes & Procédures médicales
              </label>
              <textarea
                rows={3} placeholder="ECG, prise de sang, radiographie, vaccin…"
                value={form.actesRealises}
                onChange={(e) => setForm((p) => ({ ...p, actesRealises: e.target.value }))}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0",
                  fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            {/* Feedback */}
            {error && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px",
                background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {success && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px",
                background: "#ecfdf5", borderRadius: 10, color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
                <CheckCircle size={15} /> {success}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
              <button onClick={() => handleSave(false)} disabled={saving}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0",
                  background: "white", color: "#475569", fontWeight: 700, fontSize: 14,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                Enregistrer
              </button>
              <button onClick={() => handleSave(true)} disabled={saving || !form.diagnostic}
                style={{ flex: 1.5, padding: "12px", borderRadius: 12, border: "none",
                  background: !form.diagnostic ? "#cbd5e1" : "var(--primary, #2fb5fc)",
                  color: "white", fontWeight: 700, fontSize: 14,
                  cursor: (!form.diagnostic || saving) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={16} />}
                Valider la consultation
              </button>
            </div>
            {!form.diagnostic && (
              <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: -8 }}>
                Remplissez le diagnostic pour pouvoir valider.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
