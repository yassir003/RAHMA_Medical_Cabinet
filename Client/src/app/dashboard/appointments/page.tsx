"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar, Plus, Clock, User, ChevronLeft, ChevronRight,
  X, Check, AlertCircle, Loader2, Trash2, Edit2, Stethoscope,
} from "lucide-react";
import {
  getRendezVousAll, getMyRdvsAsMedecin, createRendezVous, updateRendezVousFull,
  updateRendezVousStatut, deleteRendezVous, getPatients, getMedecins,
  RendezVous, RendezVousRequestDto, Patient, Medecin, ApiError,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── helpers ────────────────────────────────────────────────────────────────

function toLocalIso(dateStr: string, timeStr: string) {
  return `${dateStr}T${timeStr}:00`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function isoToDate(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function isoToTime(iso: string) {
  return iso.slice(11, 16); // "HH:MM"
}

const STATUT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PLANIFIE:  { bg: "#eff6ff", color: "#2563eb", label: "Planifié" },
  CONFIRME:  { bg: "#f0fdf4", color: "#16a34a", label: "Confirmé" },
  ANNULE:    { bg: "#fef2f2", color: "#dc2626", label: "Annulé" },
  TERMINE:   { bg: "#f8fafc", color: "#64748b", label: "Terminé" },
};

const MONTH_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

const DAY_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

// ─── sub-components ─────────────────────────────────────────────────────────

function Badge({ statut }: { statut: string }) {
  const s = STATUT_STYLE[statut] ?? STATUT_STYLE.PLANIFIE;
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20,
      background: s.bg, color: s.color, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function Spinner() {
  return <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />;
}

// ─── RDV form ────────────────────────────────────────────────────────────────

interface RdvFormState {
  patientId: number | null;
  medecinId: number | null;
  date: string;
  time: string;
  motif: string;
  notes: string;
}

function RdvModal({
  initial, medecins, title,
  onSave, onClose, saving, error,
}: {
  initial: Partial<RdvFormState>;
  medecins: Medecin[];
  title: string;
  onSave: (f: RdvFormState) => void;
  onClose: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState<RdvFormState>({
    patientId: initial.patientId ?? null,
    medecinId: initial.medecinId ?? null,
    date: initial.date ?? new Date().toISOString().slice(0, 10),
    time: initial.time ?? "09:00",
    motif: initial.motif ?? "",
    notes: initial.notes ?? "",
  });

  // patient autocomplete
  const [patientQuery, setPatientQuery] = useState(initial.patientId ? String(initial.patientId) : "");
  const [patientLabel, setPatientLabel] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (patientQuery.length < 2) { setPatientSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await getPatients(0, 8, patientQuery);
        setPatientSuggestions(res.content);
      } catch { /* ignore */ } finally { setSearchingPatients(false); }
    }, 280);
  }, [patientQuery]);

  function selectPatient(p: Patient) {
    setForm((f) => ({ ...f, patientId: p.id }));
    setPatientLabel(`${p.prenom} ${p.nom}`);
    setPatientQuery(`${p.prenom} ${p.nom}`);
    setPatientSuggestions([]);
  }

  const set = (k: keyof RdvFormState, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const inp: React.CSSProperties = {
    padding: "11px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
    fontSize: 14, outline: "none", width: "100%", color: "#0f172a",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%",
        maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Patient autocomplete */}
          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
              Patient <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input value={patientQuery}
                onChange={(e) => { setPatientQuery(e.target.value); setForm((f) => ({ ...f, patientId: null })); setPatientLabel(""); }}
                placeholder="Rechercher par nom, prénom…" style={inp} />
              {searchingPatients && (
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <Spinner />
                </div>
              )}
            </div>
            {patientSuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white",
                border: "1px solid #e2e8f0", borderRadius: 8, zIndex: 100,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 2 }}>
                {patientSuggestions.map((p) => (
                  <button key={p.id} onClick={() => selectPatient(p)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                      border: "none", background: "none", cursor: "pointer", fontSize: 13,
                      borderBottom: "1px solid #f1f5f9", color: "#0f172a" }}>
                    <strong>{p.prenom} {p.nom}</strong>
                    <span style={{ color: "#94a3b8", marginLeft: 8, fontSize: 11 }}>CIN: {p.cin}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Médecin */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
              Médecin <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select value={form.medecinId ?? ""} onChange={(e) => set("medecinId", Number(e.target.value))}
              style={{ ...inp, background: "white" }}>
              <option value="">Sélectionner un médecin…</option>
              {medecins.map((m) => (
                <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom} — {m.specialite}</option>
              ))}
            </select>
          </div>

          {/* Date + Heure */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Heure <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} style={inp} />
            </div>
          </div>

          {/* Motif */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
              Motif <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input value={form.motif} onChange={(e) => set("motif", e.target.value)}
              placeholder="Raison de la consultation…" style={inp} />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              rows={3} placeholder="Informations supplémentaires…"
              style={{ ...inp, resize: "vertical" }} />
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px",
              background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8,
            border: "1px solid #e2e8f0", background: "white", color: "#475569",
            fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={() => onSave(form)} disabled={saving}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none",
              background: saving ? "#cbd5e1" : "#2fb5fc", color: "white",
              fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8 }}>
            {saving ? <><Spinner /> Enregistrement…</> : <><Check size={15} /> Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const today = new Date();
  const { user } = useAuth();
  const isMedecin = user?.role === "MEDECIN";

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  const [rdvList, setRdvList] = useState<RendezVous[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDay, setSelectedDay] = useState<string | null>(
    today.toISOString().slice(0, 10)
  );

  // Modal state
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<RendezVous | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RendezVous | null>(null);

  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────

  const loadRdvs = useCallback(async () => {
    setLoading(true);
    try {
      if (isMedecin) {
        // MEDECIN only sees their own appointments — use the role-specific endpoint
        const rdvRes = await getMyRdvsAsMedecin(0, 500, "desc");
        setRdvList(rdvRes.content);
      } else {
        // ADMIN / SECRETAIRE see all appointments
        const [rdvRes, medRes] = await Promise.all([
          getRendezVousAll(0, 500),
          getMedecins(0, 100),
        ]);
        setRdvList(rdvRes.content);
        setMedecins(medRes.content);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [isMedecin]);

  useEffect(() => { loadRdvs(); }, [loadRdvs]);

  // ── Calendar grid ──────────────────────────────────────────────────────────

  // first weekday of month (0=Mon … 6=Sun in our grid)
  const firstDay = new Date(year, month, 1).getDay(); // JS: 0=Sun
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1); // shift to Mon-start
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function dateString(day: number) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  function rdvsForDay(ds: string) {
    return rdvList.filter((r) => isoToDate(r.dateHeure) === ds);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  async function handleCreate(form: RdvFormState) {
    if (!form.patientId || !form.medecinId || !form.date || !form.time || !form.motif.trim()) {
      setModalError("Veuillez remplir tous les champs obligatoires."); return;
    }
    setSaving(true); setModalError("");
    try {
      const dto: RendezVousRequestDto = {
        patientId: form.patientId,
        medecinId: form.medecinId,
        dateHeure: toLocalIso(form.date, form.time),
        motif: form.motif.trim(),
        notes: form.notes.trim() || undefined,
      };
      const created = await createRendezVous(dto);
      setRdvList((prev) => [...prev, created]);
      setSelectedDay(form.date);
      setCreateModal(false);
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Erreur lors de la création.");
    } finally { setSaving(false); }
  }

  async function handleEdit(form: RdvFormState) {
    if (!editTarget) return;
    if (!form.patientId || !form.medecinId || !form.date || !form.time || !form.motif.trim()) {
      setModalError("Veuillez remplir tous les champs obligatoires."); return;
    }
    setSaving(true); setModalError("");
    try {
      const dto: RendezVousRequestDto = {
        patientId: form.patientId,
        medecinId: form.medecinId,
        dateHeure: toLocalIso(form.date, form.time),
        motif: form.motif.trim(),
        notes: form.notes.trim() || undefined,
      };
      const updated = await updateRendezVousFull(editTarget.id, dto);
      setRdvList((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setEditTarget(null);
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Erreur lors de la modification.");
    } finally { setSaving(false); }
  }

  async function handleStatut(id: number, statut: string) {
    setUpdatingId(id);
    try {
      const updated = await updateRendezVousStatut(id, statut);
      setRdvList((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    } catch { /* ignore */ } finally { setUpdatingId(null); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRendezVous(deleteTarget.id);
      setRdvList((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  // ── Derived: selected day's RDVs sorted by time ───────────────────────────

  const dayRdvs = selectedDay
    ? rdvsForDay(selectedDay).sort((a, b) => a.dateHeure.localeCompare(b.dateHeure))
    : [];

  const todayStr = today.toISOString().slice(0, 10);
  const todayCount = rdvsForDay(todayStr).length;
  const confirmedCount = rdvList.filter((r) => r.statut === "CONFIRME").length;
  const pendingCount = rdvList.filter((r) => r.statut === "PLANIFIE").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            {isMedecin ? "Mes Rendez-vous" : "Gestion des Rendez-vous"}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {isMedecin ? "Vos consultations planifiées" : "Planning du cabinet"} — {loading ? "chargement…" : `${rdvList.length} rendez-vous`}
          </p>
        </div>
        {!isMedecin && (
          <button onClick={() => { setCreateModal(true); setModalError(""); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px",
              borderRadius: 10, border: "none", background: "#2fb5fc", color: "white",
              fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} /> Nouveau RDV
          </button>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Aujourd'hui", value: todayCount, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Confirmés", value: confirmedCount, color: "#16a34a", bg: "#f0fdf4" },
          { label: "En attente", value: pendingCount, color: "#f59e0b", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", borderRadius: 12, padding: "18px 22px",
            border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</span>
            </div>
            <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar + Day detail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

        {/* ── Calendar ── */}
        <div style={{ background: "white", borderRadius: 16, padding: 24,
          border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              {MONTH_FR[month]} {year}
            </h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDay(todayStr); }}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "white", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                Aujourd'hui
              </button>
              <button onClick={prevMonth} style={{ padding: "6px 10px", borderRadius: 8,
                border: "1px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b" }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} style={{ padding: "6px 10px", borderRadius: 8,
                border: "1px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b" }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAY_FR.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700,
                color: "#94a3b8", padding: "6px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {/* Offset cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`off-${i}`} style={{ minHeight: 72, borderRadius: 8, background: "#fafafa" }} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = dateString(day);
              const dayRdvCount = rdvsForDay(ds).length;
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDay;
              const isPast = new Date(ds) < new Date(todayStr);

              const statuts = rdvsForDay(ds).map((r) => r.statut);
              const hasConfirmed = statuts.includes("CONFIRME");
              const hasPlanifie = statuts.includes("PLANIFIE");
              const hasAnnule = statuts.every((s) => s === "ANNULE");

              let dotColor = "#3b82f6";
              if (hasConfirmed) dotColor = "#16a34a";
              if (hasAnnule && dayRdvCount > 0) dotColor = "#dc2626";

              return (
                <div key={day} onClick={() => setSelectedDay(ds)}
                  style={{
                    minHeight: 72, borderRadius: 8, padding: "8px 6px",
                    cursor: "pointer", transition: "all 0.1s",
                    background: isSelected ? "#eff6ff" : isToday ? "#f0fdf4" : "white",
                    border: isSelected ? "2px solid #3b82f6" : isToday ? "2px solid #16a34a" : "1px solid #f1f5f9",
                    opacity: isPast && !isToday && !isSelected ? 0.6 : 1,
                    position: "relative",
                  }}>
                  <div style={{ fontSize: 13, fontWeight: isToday ? 800 : 500,
                    color: isToday ? "#16a34a" : "#0f172a", textAlign: "right" }}>
                    {day}
                  </div>
                  {dayRdvCount > 0 && (
                    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: dotColor }}>
                          {dayRdvCount} RDV
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14,
            borderTop: "1px solid #f1f5f9", flexWrap: "wrap" }}>
            {Object.entries(STATUT_STYLE).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />
                {v.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Day panel ── */}
        <div style={{ background: "white", borderRadius: 16, padding: 22,
          border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              {selectedDay
                ? new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
                : "Sélectionnez un jour"}
            </h3>
            {selectedDay && !isMedecin && (
              <button onClick={() => { setCreateModal(true); setModalError(""); }}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#64748b" }}>
                <Plus size={15} />
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0", color: "#94a3b8" }}>
              <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : dayRdvs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: "#94a3b8" }}>
              <Calendar size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>Aucun rendez-vous ce jour</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dayRdvs.map((rv) => {
                const st = STATUT_STYLE[rv.statut] ?? STATUT_STYLE.PLANIFIE;
                return (
                  <div key={rv.id} style={{
                    borderRadius: 8, padding: "12px 14px", background: "#fafbfc",
                    borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "#f1f5f9",
                    borderRightWidth: 1, borderRightStyle: "solid", borderRightColor: "#f1f5f9",
                    borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#f1f5f9",
                    borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: st.color,
                  }}>

                    {/* Time + badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
                        <Clock size={12} /> {fmtTime(rv.dateHeure)}
                      </div>
                      <Badge statut={rv.statut} />
                    </div>

                    {/* Patient */}
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 2 }}>
                      {rv.patientPrenom} {rv.patientNom}
                    </div>

                    {/* Doctor */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      <Stethoscope size={11} />
                      Dr. {rv.medecinPrenom} {rv.medecinNom}
                      {rv.medecinSpecialite && <span style={{ color: "#cbd5e1" }}>• {rv.medecinSpecialite}</span>}
                    </div>

                    {/* Motif */}
                    {rv.motif && (
                      <div style={{ fontSize: 12, color: "#475569", fontStyle: "italic", marginBottom: 8 }}>
                        {rv.motif}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      {rv.statut === "PLANIFIE" && (
                        <button onClick={() => handleStatut(rv.id, "CONFIRME")} disabled={updatingId === rv.id}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                            background: "#f0fdf4", color: "#16a34a", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4 }}>
                          {updatingId === rv.id ? <Spinner /> : <Check size={11} />} Confirmer
                        </button>
                      )}
                      {(rv.statut === "PLANIFIE" || rv.statut === "CONFIRME") && (
                        <>
                          <button onClick={() => handleStatut(rv.id, "TERMINE")} disabled={updatingId === rv.id}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                              background: "#f8fafc", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>
                            Terminer
                          </button>
                          <button onClick={() => handleStatut(rv.id, "ANNULE")} disabled={updatingId === rv.id}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                              background: "#fef2f2", color: "#dc2626", fontWeight: 600, cursor: "pointer" }}>
                            Annuler
                          </button>
                        </>
                      )}
                      {!isMedecin && (
                        <>
                          <button onClick={() => {
                            setEditTarget(rv); setModalError("");
                          }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6,
                            border: "1px solid #e2e8f0", background: "white", color: "#475569",
                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Edit2 size={11} /> Modifier
                          </button>
                          <button onClick={() => setDeleteTarget(rv)}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6,
                              border: "none", background: "#fef2f2", color: "#dc2626",
                              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming list below calendar */}
      <div style={{ background: "white", borderRadius: 16, padding: 24,
        border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
          <Calendar size={16} color="#3b82f6" /> Prochains rendez-vous
        </h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
            <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {(isMedecin
                    ? ["Date & Heure","Patient","Motif","Statut","Actions"]
                    : ["Date & Heure","Patient","Médecin","Motif","Statut","Actions"]
                  ).map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12,
                      fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rdvList
                  .filter((r) => r.dateHeure >= todayStr && r.statut !== "ANNULE" && r.statut !== "TERMINE")
                  .sort((a, b) => a.dateHeure.localeCompare(b.dateHeure))
                  .slice(0, 12)
                  .map((rv) => (
                    <tr key={rv.id} style={{ borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                      <td style={{ padding: "10px 14px", color: "#0f172a", fontWeight: 600 }}>
                        <div>{fmtDate(rv.dateHeure)}</div>
                        <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Clock size={10} /> {fmtTime(rv.dateHeure)}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {rv.patientPrenom} {rv.patientNom}
                        </div>
                      </td>
                      {!isMedecin && (
                        <td style={{ padding: "10px 14px", color: "#475569" }}>
                          Dr. {rv.medecinPrenom} {rv.medecinNom}
                        </td>
                      )}
                      <td style={{ padding: "10px 14px", color: "#64748b", maxWidth: 180 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {rv.motif}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Badge statut={rv.statut} />
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {rv.statut === "PLANIFIE" && (
                            <button onClick={() => handleStatut(rv.id, "CONFIRME")} disabled={updatingId === rv.id}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                                background: "#f0fdf4", color: "#16a34a", fontWeight: 600, cursor: "pointer" }}>
                              {updatingId === rv.id ? <Spinner /> : "Confirmer"}
                            </button>
                          )}
                          {!isMedecin && (
                            <button onClick={() => {
                              setSelectedDay(isoToDate(rv.dateHeure));
                              setYear(new Date(rv.dateHeure).getFullYear());
                              setMonth(new Date(rv.dateHeure).getMonth());
                              setEditTarget(rv); setModalError("");
                            }} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6,
                              border: "1px solid #e2e8f0", background: "white", color: "#475569",
                              fontWeight: 600, cursor: "pointer" }}>
                              <Edit2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {rdvList.filter((r) => r.dateHeure >= todayStr && r.statut !== "ANNULE" && r.statut !== "TERMINE").length === 0 && (
              <div style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8", fontSize: 14 }}>
                Aucun rendez-vous à venir
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {createModal && (
        <RdvModal
          title="Nouveau rendez-vous"
          initial={{ date: selectedDay ?? todayStr }}
          medecins={medecins}
          onSave={handleCreate}
          onClose={() => setCreateModal(false)}
          saving={saving}
          error={modalError}
        />
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <RdvModal
          title="Modifier le rendez-vous"
          initial={{
            patientId: editTarget.patientId,
            medecinId: editTarget.medecinId,
            date: isoToDate(editTarget.dateHeure),
            time: isoToTime(editTarget.dateHeure),
            motif: editTarget.motif,
            notes: editTarget.notes ?? "",
          }}
          medecins={medecins}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
          saving={saving}
          error={modalError}
        />
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
              Supprimer ce rendez-vous ?
            </h3>
            <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
              RDV de <strong>{deleteTarget.patientPrenom} {deleteTarget.patientNom}</strong> le{" "}
              {fmtDate(deleteTarget.dateHeure)} à {fmtTime(deleteTarget.dateHeure)}.
              <br />Cette action est irréversible.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "10px 24px", borderRadius: 8, border: "none",
                  background: deleting ? "#fca5a5" : "#dc2626", color: "white",
                  fontWeight: 700, fontSize: 14, cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8 }}>
                {deleting ? <><Spinner /> Suppression…</> : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
