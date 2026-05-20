"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  getMyRendezVous,
  getMyProfile,
  cancelMyRendezVous,
  getMedecins,
  getDisponibilites,
  createRendezVous,
  type RendezVous,
  type Medecin,
} from "@/lib/api";
import { CalendarRange, Clock, X, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  PLANIFIE:  { color: "#2563eb", bg: "#eff6ff", label: "Planifié" },
  CONFIRME:  { color: "#16a34a", bg: "#f0fdf4", label: "Confirmé" },
  ANNULE:    { color: "#dc2626", bg: "#fef2f2", label: "Annulé" },
  TERMINE:   { color: "#64748b", bg: "#f1f5f9", label: "Terminé" },
};

function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleDateString("fr-FR", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Cancel confirmation modal
// ---------------------------------------------------------------------------

function CancelModal({ rdv, onClose, onConfirm, loading }: {
  rdv: RendezVous; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={22} color="#dc2626" />
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Annuler le rendez-vous</h3>
        </div>
        <p style={{ margin: "0 0 24px", color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Voulez-vous annuler le rendez-vous du <strong>{fmtDateTime(rdv.dateHeure)}</strong> avec Dr.{" "}
          <strong>{rdv.medecinPrenom} {rdv.medecinNom}</strong> ? Cette action est irréversible.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#64748b" }}>
            Retour
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            {loading && <Loader2 size={15} style={{ animation: "spin .8s linear infinite" }} />}
            Confirmer l&apos;annulation
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking wizard
// ---------------------------------------------------------------------------

type BookStep = 1 | 2 | 3;

function BookingWizard({ patientId, onBooked }: { patientId: number; onBooked: () => void }) {
  const [step, setStep] = useState<BookStep>(1);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState<Medecin | null>(null);
  const [selectedDate, setSelectedDate] = useState(addDays(todayIso(), 1));
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getMedecins(0, 100).then(r => setMedecins(r.content ?? [])).catch(() => {});
  }, []);

  const fetchSlots = useCallback(async (medecinId: number, date: string) => {
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const s = await getDisponibilites(medecinId, date);
      setSlots(s);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (step === 2 && selectedMedecin) {
      fetchSlots(selectedMedecin.id, selectedDate);
    }
  }, [step, selectedMedecin, selectedDate, fetchSlots]);

  const handleBook = async () => {
    if (!selectedMedecin || !selectedSlot) return;
    setSubmitting(true);
    setError("");
    try {
      const [h, m] = selectedSlot.split(":").map(Number);
      const dt = new Date(selectedDate);
      dt.setHours(h, m, 0, 0);
      await createRendezVous({
        patientId,
        medecinId: selectedMedecin.id,
        dateHeure: dt.toISOString().slice(0, 16),
        motif: motif || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setSelectedMedecin(null);
        setSelectedDate(addDays(todayIso(), 1));
        setSlots([]);
        setSelectedSlot(null);
        setMotif("");
        onBooked();
      }, 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={32} color="#16a34a" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Rendez-vous confirmé !</h3>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Vous recevrez une notification de confirmation.</p>
      </div>
    );
  }

  // Step indicators
  const steps = ["Choisir un médecin", "Sélectionner un créneau", "Confirmer"];

  return (
    <div>
      {/* Step bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
        {steps.map((s, i) => {
          const n = (i + 1) as BookStep;
          const active = step === n;
          const done = step > n;
          return (
            <React.Fragment key={s}>
              {i > 0 && <div style={{ flex: 1, height: 2, backgroundColor: done ? "var(--primary)" : "#e2e8f0", margin: "auto 0", position: "relative", top: -12 }} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${active || done ? "var(--primary)" : "#e2e8f0"}`, backgroundColor: done ? "var(--primary)" : active ? "#eff6ff" : "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: done ? "white" : active ? "var(--primary)" : "#94a3b8" }}>
                  {done ? "✓" : n}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: active ? "var(--primary)" : "#94a3b8", whiteSpace: "nowrap" }}>{s}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: Choose medecin */}
      {step === 1 && (
        <div>
          <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Sélectionnez un médecin</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {medecins.map(m => (
              <button key={m.id} onClick={() => setSelectedMedecin(m)}
                style={{ padding: "16px", borderRadius: 12, border: `2px solid ${selectedMedecin?.id === m.id ? "var(--primary)" : "#e2e8f0"}`, background: selectedMedecin?.id === m.id ? "#eff6ff" : "white", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}
              >
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Dr. {m.prenom} {m.nom}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{m.specialite}</p>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setStep(2)} disabled={!selectedMedecin}
              style={{ padding: "11px 28px", borderRadius: 10, border: "none", backgroundColor: selectedMedecin ? "var(--primary)" : "#e2e8f0", color: selectedMedecin ? "white" : "#94a3b8", fontWeight: 600, fontSize: 14, cursor: selectedMedecin ? "pointer" : "not-allowed" }}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Date + slot */}
      {step === 2 && selectedMedecin && (
        <div>
          <button onClick={() => setStep(1)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 500, marginBottom: 20, padding: 0 }}>
            <ChevronLeft size={16} /> Retour
          </button>
          <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
            Dr. {selectedMedecin.prenom} {selectedMedecin.nom} — Choisissez une date
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} disabled={selectedDate <= addDays(todayIso(), 1)}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={16} />
            </button>
            <input type="date" value={selectedDate} min={addDays(todayIso(), 1)}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a", outline: "none" }} />
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Créneaux disponibles</h4>
          {loadingSlots ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 14 }}>
              <Loader2 size={16} style={{ animation: "spin .8s linear infinite" }} /> Chargement…
            </div>
          ) : slots.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Aucun créneau disponible ce jour.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {slots.map(slot => (
                <button key={slot} onClick={() => setSelectedSlot(slot)}
                  style={{ padding: "10px 18px", borderRadius: 10, border: `2px solid ${selectedSlot === slot ? "var(--primary)" : "#e2e8f0"}`, background: selectedSlot === slot ? "#eff6ff" : "white", color: selectedSlot === slot ? "var(--primary)" : "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "border-color .15s" }}>
                  <Clock size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />{slot}
                </button>
              ))}
            </div>
          )}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 14, color: "#64748b" }}>Retour</button>
            <button onClick={() => setStep(3)} disabled={!selectedSlot}
              style={{ padding: "11px 28px", borderRadius: 10, border: "none", backgroundColor: selectedSlot ? "var(--primary)" : "#e2e8f0", color: selectedSlot ? "white" : "#94a3b8", fontWeight: 600, fontSize: 14, cursor: selectedSlot ? "pointer" : "not-allowed" }}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selectedMedecin && selectedSlot && (
        <div>
          <button onClick={() => setStep(2)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, fontWeight: 500, marginBottom: 20, padding: 0 }}>
            <ChevronLeft size={16} /> Retour
          </button>
          <div style={{ background: "#f8fafc", borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Récapitulatif</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Médecin", value: `Dr. ${selectedMedecin.prenom} ${selectedMedecin.nom}` },
                { label: "Spécialité", value: selectedMedecin.specialite },
                { label: "Date", value: new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) },
                { label: "Heure", value: selectedSlot },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Motif de consultation (optionnel)</label>
            <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3} placeholder="Décrivez brièvement la raison de votre visite…"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setStep(2)} style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 14, color: "#64748b" }}>Retour</button>
            <button onClick={handleBook} disabled={submitting}
              style={{ padding: "11px 28px", borderRadius: 10, border: "none", backgroundColor: "var(--primary)", color: "white", fontWeight: 600, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {submitting && <Loader2 size={15} style={{ animation: "spin .8s linear infinite" }} />}
              Confirmer le rendez-vous
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PatientAppointmentsPage() {
  const [tab, setTab] = useState<"mine" | "book">("mine");
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<RendezVous | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [patientId, setPatientId] = useState<number>(0);
  const PAGE_SIZE = 10;

  const loadRdvs = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const [r, prof] = await Promise.all([getMyRendezVous(p, PAGE_SIZE), getMyProfile()]);
      setRdvs(r.content ?? []);
      setTotal(r.totalElements ?? 0);
      setPatientId(prof.id);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRdvs(page); }, [loadRdvs, page]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelMyRendezVous(cancelTarget.id);
      setCancelTarget(null);
      await loadRdvs(page);
    } catch {
      // ignore
    } finally {
      setCancelling(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ padding: "32px 0" }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 700, color: "#0f172a" }}>Mes rendez-vous</h2>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #f1f5f9", marginBottom: 32 }}>
        {([["mine", "Mes rendez-vous"], ["book", "Prendre un rendez-vous"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "12px 24px", border: "none", background: "none", fontSize: 14, fontWeight: tab === key ? 700 : 500, color: tab === key ? "var(--primary)" : "#64748b", borderBottom: `3px solid ${tab === key ? "var(--primary)" : "transparent"}`, marginBottom: -2, cursor: "pointer", transition: "color .15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Mine */}
      {tab === "mine" && (
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
              <div style={{ width: 40, height: 40, border: "4px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            </div>
          ) : rdvs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <CalendarRange size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 15 }}>Vous n&apos;avez aucun rendez-vous.</p>
              <button onClick={() => setTab("book")} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "var(--primary)", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Prendre un rendez-vous
              </button>
            </div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    {["Date & heure", "Médecin", "Spécialité", "Motif", "Statut", ""].map(h => (
                      <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rdvs.map(rdv => {
                    const st = STATUS_STYLE[rdv.statut] ?? STATUS_STYLE.PLANIFIE;
                    const cancellable = rdv.statut !== "ANNULE" && rdv.statut !== "TERMINE";
                    return (
                      <tr key={rdv.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px 20px", fontSize: 13, color: "#0f172a", fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Clock size={14} color="#94a3b8" />
                            {fmtDateTime(rdv.dateHeure)}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
                          Dr. {rdv.medecinPrenom} {rdv.medecinNom}
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>{rdv.medecinSpecialite ?? "—"}</td>
                        <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rdv.motif ?? "—"}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                        </td>
                        <td style={{ padding: "16px 20px" }}>
                          {cancellable && (
                            <button onClick={() => setCancelTarget(rdv)}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                              <X size={13} /> Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{total} rendez-vous au total</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>
                      <ChevronLeft size={14} />
                    </button>
                    <span style={{ padding: "8px 14px", fontSize: 13, color: "#0f172a" }}>{page + 1} / {totalPages}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Book */}
      {tab === "book" && (
        <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <BookingWizard patientId={patientId} onBooked={() => { setTab("mine"); loadRdvs(0); }} />
        </div>
      )}

      {cancelTarget && (
        <CancelModal rdv={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} loading={cancelling} />
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
