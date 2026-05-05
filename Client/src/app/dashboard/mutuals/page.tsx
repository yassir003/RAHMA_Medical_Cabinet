"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText, Shield, Plus, Edit2, Trash2, ChevronLeft, ChevronRight,
  X, Check, AlertCircle, Loader2, Send, CheckCircle, XCircle, Banknote,
} from "lucide-react";
import {
  getMutuelles, createMutuelle, updateMutuelle, deleteMutuelle,
  getDossiers, createDossier, updateDossierStatut,
  getMutuelleByPatient, getPatientConsultations,
  getPatients,
  Mutuelle, MutuelleRequestDto, TypeMutuelle,
  DossierRemboursement, DossierRemboursementRequestDto, StatutDossier,
  Patient, Consultation,
  ApiError,
} from "@/lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMoney(n?: number) {
  if (n == null) return "—";
  return `${n.toLocaleString("fr-FR")} MAD`;
}

const TYPE_LABEL: Record<TypeMutuelle, { label: string; bg: string; color: string }> = {
  CNSS:             { label: "CNSS",             bg: "#eff6ff", color: "#2563eb" },
  CNOPS:            { label: "CNOPS",            bg: "#fdf4ff", color: "#9333ea" },
  ASSURANCE_PRIVEE: { label: "Assurance Privée", bg: "#fff7ed", color: "#ea580c" },
  AUCUNE:           { label: "Aucune",           bg: "#f8fafc", color: "#64748b" },
};

const STATUT_DOSSIER: Record<StatutDossier, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "#fffbeb", color: "#d97706" },
  ENVOYE:     { label: "Envoyé",     bg: "#eff6ff", color: "#2563eb" },
  ACCEPTE:    { label: "Accepté",    bg: "#f0fdf4", color: "#16a34a" },
  REJETE:     { label: "Rejeté",     bg: "#fef2f2", color: "#dc2626" },
  REMBOURSE:  { label: "Remboursé", bg: "#f0fdf4", color: "#059669" },
};

function TypeBadge({ type }: { type: TypeMutuelle }) {
  const s = TYPE_LABEL[type];
  return (
    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function StatutBadge({ statut }: { statut: StatutDossier }) {
  const s = STATUT_DOSSIER[statut];
  return (
    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

function Spinner() {
  return <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />;
}

const inp: React.CSSProperties = {
  padding: "11px 14px", borderRadius: 8, border: "1px solid #e2e8f0",
  fontSize: 14, outline: "none", width: "100%", color: "#0f172a",
};

// ─── Patient autocomplete component ─────────────────────────────────────────

function PatientAutocomplete({
  value, label, onChange, onSelect,
}: {
  value: string;
  label: string;
  onChange: (v: string) => void;
  onSelect: (p: Patient) => void;
}) {
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value.length < 2) { setSuggestions([]); return; }
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await getPatients(0, 8, value);
        setSuggestions(r.content);
      } finally { setLoading(false); }
    }, 280);
  }, [value]);

  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
        {label} <span style={{ color: "#ef4444" }}>*</span>
      </label>
      <div style={{ position: "relative" }}>
        <input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher par nom, prénom…" style={inp} />
        {loading && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Spinner />
          </div>
        )}
      </div>
      {suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white",
          border: "1px solid #e2e8f0", borderRadius: 8, zIndex: 200,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 2 }}>
          {suggestions.map((p) => (
            <button key={p.id} onClick={() => { onSelect(p); setSuggestions([]); }}
              style={{ display: "block", width: "100%", textAlign: "left",
                padding: "10px 14px", border: "none", background: "none",
                cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9", color: "#0f172a" }}>
              <strong>{p.prenom} {p.nom}</strong>
              <span style={{ color: "#94a3b8", marginLeft: 8, fontSize: 11 }}>CIN: {p.cin}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Affiliations Mutuelles ─────────────────────────────────────────────

function MutuellesTab() {
  const [mutuelles, setMutuelles] = useState<Mutuelle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Mutuelle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mutuelle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // form state
  const emptyForm = { patientId: null as number | null, patientQuery: "", patientLabel: "",
    type: "CNSS" as TypeMutuelle, numeroAffiliation: "", organismeNom: "",
    dateDebut: "", dateFin: "", tauxRemboursement: "" };
  const [form, setForm] = useState({ ...emptyForm });

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getMutuelles(p, 15);
      setMutuelles(res.content);
      setTotalPages(res.totalPages || 1);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  function openCreate() {
    setEditTarget(null);
    setForm({ ...emptyForm });
    setModalError("");
    setShowModal(true);
  }

  function openEdit(m: Mutuelle) {
    setEditTarget(m);
    setForm({
      patientId: m.patientId,
      patientQuery: `${m.patientPrenom} ${m.patientNom}`,
      patientLabel: `${m.patientPrenom} ${m.patientNom}`,
      type: m.type,
      numeroAffiliation: m.numeroAffiliation ?? "",
      organismeNom: m.organismeNom ?? "",
      dateDebut: m.dateDebut ?? "",
      dateFin: m.dateFin ?? "",
      tauxRemboursement: m.tauxRemboursement != null ? String(m.tauxRemboursement) : "",
    });
    setModalError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.patientId || !form.type) {
      setModalError("Veuillez sélectionner un patient et un type."); return;
    }
    setSaving(true); setModalError("");
    try {
      const dto: MutuelleRequestDto = {
        patientId: form.patientId,
        type: form.type,
        numeroAffiliation: form.numeroAffiliation || undefined,
        organismeNom: form.organismeNom || undefined,
        dateDebut: form.dateDebut || undefined,
        dateFin: form.dateFin || undefined,
        tauxRemboursement: form.tauxRemboursement ? Number(form.tauxRemboursement) : undefined,
      };
      if (editTarget) {
        const updated = await updateMutuelle(editTarget.id, dto);
        setMutuelles((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      } else {
        const created = await createMutuelle(dto);
        setMutuelles((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Erreur lors de l'enregistrement.");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutuelle(deleteTarget.id);
      setMutuelles((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  // stats
  const countByType = mutuelles.reduce<Record<string, number>>((acc, m) => {
    acc[m.type] = (acc[m.type] ?? 0) + 1; return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {(["CNSS", "CNOPS", "ASSURANCE_PRIVEE", "AUCUNE"] as TypeMutuelle[]).map((t) => {
          const s = TYPE_LABEL[t];
          return (
            <div key={t} style={{ background: "white", borderRadius: 12, padding: "16px 20px",
              border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                  {loading ? "—" : (countByType[t] ?? 0)}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, padding: 24,
        border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            Affiliations mutuelles ({loading ? "…" : mutuelles.length} affichées)
          </h3>
          <button onClick={openCreate}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
              borderRadius: 8, border: "none", background: "#2fb5fc", color: "white",
              fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Plus size={14} /> Nouvelle affiliation
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : mutuelles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
            Aucune affiliation enregistrée.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["Patient","Type","Organisme","N° Affiliation","Taux","Validité","Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12,
                      fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mutuelles.map((m) => (
                  <tr key={m.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: "#0f172a" }}>
                      {m.patientPrenom} {m.patientNom}
                    </td>
                    <td style={{ padding: "11px 14px" }}><TypeBadge type={m.type} /></td>
                    <td style={{ padding: "11px 14px", color: "#475569" }}>{m.organismeNom ?? "—"}</td>
                    <td style={{ padding: "11px 14px", color: "#475569", fontFamily: "monospace", fontSize: 13 }}>
                      {m.numeroAffiliation ?? "—"}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#475569" }}>
                      {m.tauxRemboursement != null ? `${m.tauxRemboursement}%` : "—"}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 13 }}>
                      {m.dateDebut ? fmtDate(m.dateDebut) : "—"}
                      {m.dateFin ? ` → ${fmtDate(m.dateFin)}` : ""}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(m)}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
                            background: "white", color: "#475569", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                          <Edit2 size={12} /> Modifier
                        </button>
                        <button onClick={() => setDeleteTarget(m)}
                          style={{ padding: "5px 8px", borderRadius: 6, border: "none",
                            background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
            gap: 12, marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: page === 0 ? "#f8fafc" : "white", cursor: page === 0 ? "default" : "pointer",
                color: page === 0 ? "#cbd5e1" : "#475569" }}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 13, color: "#64748b" }}>Page {page + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: page >= totalPages - 1 ? "#f8fafc" : "white",
                cursor: page >= totalPages - 1 ? "default" : "pointer",
                color: page >= totalPages - 1 ? "#cbd5e1" : "#475569" }}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%",
            maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                {editTarget ? "Modifier l'affiliation" : "Nouvelle affiliation mutuelle"}
              </h3>
              <button onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!editTarget && (
                <PatientAutocomplete value={form.patientQuery} label="Patient"
                  onChange={(v) => setForm((f) => ({ ...f, patientQuery: v, patientId: null }))}
                  onSelect={(p) => setForm((f) => ({
                    ...f, patientId: p.id,
                    patientQuery: `${p.prenom} ${p.nom}`,
                    patientLabel: `${p.prenom} ${p.nom}`,
                  }))} />
              )}
              {editTarget && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Patient</label>
                  <input value={form.patientLabel} readOnly style={{ ...inp, background: "#f8fafc", color: "#64748b" }} />
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                  Type <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TypeMutuelle }))}
                  style={{ ...inp, background: "white" }}>
                  {(["CNSS","CNOPS","ASSURANCE_PRIVEE","AUCUNE"] as TypeMutuelle[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL[t].label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Organisme</label>
                  <input value={form.organismeNom}
                    onChange={(e) => setForm((f) => ({ ...f, organismeNom: e.target.value }))}
                    placeholder="Ex: CNSS Maroc" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>N° Affiliation</label>
                  <input value={form.numeroAffiliation}
                    onChange={(e) => setForm((f) => ({ ...f, numeroAffiliation: e.target.value }))}
                    placeholder="Ex: 12345678" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Date début</label>
                  <input type="date" value={form.dateDebut}
                    onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Date fin</label>
                  <input type="date" value={form.dateFin}
                    onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} style={inp} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                  Taux de remboursement (%)
                </label>
                <input type="number" min={0} max={100} value={form.tauxRemboursement}
                  onChange={(e) => setForm((f) => ({ ...f, tauxRemboursement: e.target.value }))}
                  placeholder="Ex: 70" style={inp} />
              </div>

              {modalError && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px",
                  background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
                  <AlertCircle size={14} /> {modalError}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "10px 24px", borderRadius: 8, border: "none",
                  background: saving ? "#cbd5e1" : "#2fb5fc", color: "white",
                  fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8 }}>
                {saving ? <><Spinner /> Enregistrement…</> : <><Check size={15} /> Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: 400,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Trash2 size={24} color="#dc2626" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                Supprimer cette affiliation ?
              </h3>
              <p style={{ color: "#64748b", fontSize: 14 }}>
                Affiliation <strong>{TYPE_LABEL[deleteTarget.type].label}</strong> de{" "}
                <strong>{deleteTarget.patientPrenom} {deleteTarget.patientNom}</strong>.
              </p>
            </div>
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

// ─── Tab: Dossiers de remboursement ──────────────────────────────────────────

function DossiersTab() {
  const [dossiers, setDossiers] = useState<DossierRemboursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatut, setFilterStatut] = useState<StatutDossier | "">("");

  const [showCreate, setShowCreate] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // create form
  const [cForm, setCForm] = useState({
    patientId: null as number | null,
    patientQuery: "",
    mutuelleId: null as number | null,
    mutuelleLabel: "",
    consultationId: null as number | null,
    consultationLabel: "",
  });
  const [patientMutuelle, setPatientMutuelle] = useState<import("@/lib/api").Mutuelle | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);
  const [loadingPatientData, setLoadingPatientData] = useState(false);

  const load = useCallback(async (p: number, s: StatutDossier | "") => {
    setLoading(true);
    try {
      const res = await getDossiers(p, 15, s || undefined);
      setDossiers(res.content);
      setTotalPages(res.totalPages || 1);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, filterStatut); }, [load, page, filterStatut]);

  async function onPatientSelected(p: import("@/lib/api").Patient) {
    setCForm((f) => ({ ...f, patientId: p.id, patientQuery: `${p.prenom} ${p.nom}`,
      mutuelleId: null, mutuelleLabel: "", consultationId: null, consultationLabel: "" }));
    setLoadingPatientData(true);
    try {
      const [mutRes, consRes] = await Promise.allSettled([
        getMutuelleByPatient(p.id),
        getPatientConsultations(p.id, 0, 50),
      ]);
      if (mutRes.status === "fulfilled") {
        setPatientMutuelle(mutRes.value);
        setCForm((f) => ({ ...f, mutuelleId: mutRes.value.id,
          mutuelleLabel: `${TYPE_LABEL[mutRes.value.type].label}${mutRes.value.organismeNom ? ` — ${mutRes.value.organismeNom}` : ""}` }));
      } else {
        setPatientMutuelle(null);
      }
      if (consRes.status === "fulfilled") {
        setPatientConsultations(consRes.value.content);
      } else {
        setPatientConsultations([]);
      }
    } finally { setLoadingPatientData(false); }
  }

  async function handleCreate() {
    if (!cForm.patientId || !cForm.mutuelleId || !cForm.consultationId) {
      setModalError("Veuillez sélectionner patient, mutuelle et consultation."); return;
    }
    setSaving(true); setModalError("");
    try {
      const dto: DossierRemboursementRequestDto = {
        patientId: cForm.patientId,
        mutuelleId: cForm.mutuelleId,
        consultationId: cForm.consultationId,
      };
      const created = await createDossier(dto);
      setDossiers((prev) => [created, ...prev]);
      setShowCreate(false);
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Erreur lors de la création.");
    } finally { setSaving(false); }
  }

  async function handleStatut(id: number, statut: StatutDossier) {
    setUpdatingId(id);
    try {
      const updated = await updateDossierStatut(id, statut);
      setDossiers((prev) => prev.map((d) => d.id === updated.id ? updated : d));
    } catch { /* ignore */ } finally { setUpdatingId(null); }
  }

  const statusCounts = dossiers.reduce<Record<string, number>>((acc, d) => {
    acc[d.statut] = (acc[d.statut] ?? 0) + 1; return acc;
  }, {});

  const statutOptions: { key: StatutDossier | ""; label: string }[] = [
    { key: "", label: "Tous" },
    { key: "EN_ATTENTE", label: "En attente" },
    { key: "ENVOYE", label: "Envoyés" },
    { key: "ACCEPTE", label: "Acceptés" },
    { key: "REJETE", label: "Rejetés" },
    { key: "REMBOURSE", label: "Remboursés" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {(["EN_ATTENTE","ENVOYE","ACCEPTE","REJETE","REMBOURSE"] as StatutDossier[]).map((s) => {
          const st = STATUT_DOSSIER[s];
          const icons: Record<StatutDossier, React.ReactNode> = {
            EN_ATTENTE: <Loader2 size={16} />,
            ENVOYE:     <Send size={16} />,
            ACCEPTE:    <CheckCircle size={16} />,
            REJETE:     <XCircle size={16} />,
            REMBOURSE:  <Banknote size={16} />,
          };
          return (
            <div key={s} style={{ background: "white", borderRadius: 12, padding: "14px 16px",
              border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: st.bg,
                display: "flex", alignItems: "center", justifyContent: "center", color: st.color }}>
                {icons[s]}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  {loading ? "—" : (statusCounts[s] ?? 0)}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{st.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, padding: 24,
        border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statutOptions.map((o) => (
              <button key={o.key} onClick={() => { setFilterStatut(o.key); setPage(0); }}
                style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", border: "none",
                  background: filterStatut === o.key ? "#0f172a" : "#f1f5f9",
                  color: filterStatut === o.key ? "white" : "#475569" }}>
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setShowCreate(true); setModalError("");
            setCForm({ patientId: null, patientQuery: "", mutuelleId: null,
              mutuelleLabel: "", consultationId: null, consultationLabel: "" });
            setPatientMutuelle(null); setPatientConsultations([]); }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
              borderRadius: 8, border: "none", background: "#2fb5fc", color: "white",
              fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            <Plus size={14} /> Nouveau dossier
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : dossiers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
            Aucun dossier trouvé.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["Patient","Mutuelle","Consultation","Date création","Montant","Statut","Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12,
                      fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dossiers.map((d) => (
                  <tr key={d.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: "#0f172a" }}>
                      {d.patientPrenom} {d.patientNom}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#475569" }}>
                      {d.mutuelleOrganisme ?? "—"}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 13 }}>
                      #CONS-{String(d.consultationId).padStart(4, "0")}
                    </td>
                    <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 13 }}>
                      {fmtDate(d.dateCreation)}
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 600 }}>
                      {fmtMoney(d.montantTotal)}
                      {d.montantRembourse != null && (
                        <div style={{ fontSize: 11, color: "#16a34a" }}>
                          ↩ {fmtMoney(d.montantRembourse)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <StatutBadge statut={d.statut} />
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {d.statut === "EN_ATTENTE" && (
                          <button onClick={() => handleStatut(d.id, "ENVOYE")} disabled={updatingId === d.id}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                              background: "#eff6ff", color: "#2563eb", fontWeight: 600, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4 }}>
                            {updatingId === d.id ? <Spinner /> : <Send size={11} />} Envoyer
                          </button>
                        )}
                        {d.statut === "ENVOYE" && (
                          <>
                            <button onClick={() => handleStatut(d.id, "ACCEPTE")} disabled={updatingId === d.id}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                                background: "#f0fdf4", color: "#16a34a", fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 4 }}>
                              {updatingId === d.id ? <Spinner /> : <CheckCircle size={11} />} Accepter
                            </button>
                            <button onClick={() => handleStatut(d.id, "REJETE")} disabled={updatingId === d.id}
                              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                                background: "#fef2f2", color: "#dc2626", fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 4 }}>
                              {updatingId === d.id ? <Spinner /> : <XCircle size={11} />} Rejeter
                            </button>
                          </>
                        )}
                        {d.statut === "ACCEPTE" && (
                          <button onClick={() => handleStatut(d.id, "REMBOURSE")} disabled={updatingId === d.id}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none",
                              background: "#f0fdf4", color: "#059669", fontWeight: 600, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4 }}>
                            {updatingId === d.id ? <Spinner /> : <Banknote size={11} />} Rembourser
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
            gap: 12, marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: page === 0 ? "#f8fafc" : "white", cursor: page === 0 ? "default" : "pointer",
                color: page === 0 ? "#cbd5e1" : "#475569" }}>
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: 13, color: "#64748b" }}>Page {page + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: page >= totalPages - 1 ? "#f8fafc" : "white",
                cursor: page >= totalPages - 1 ? "default" : "pointer",
                color: page >= totalPages - 1 ? "#cbd5e1" : "#475569" }}>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Create dossier modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%",
            maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>Nouveau dossier de remboursement</h3>
              <button onClick={() => setShowCreate(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <PatientAutocomplete value={cForm.patientQuery} label="Patient"
                onChange={(v) => setCForm((f) => ({ ...f, patientQuery: v, patientId: null,
                  mutuelleId: null, mutuelleLabel: "", consultationId: null, consultationLabel: "" }))}
                onSelect={onPatientSelected} />

              {loadingPatientData && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#64748b", fontSize: 13 }}>
                  <Spinner /> Chargement des données patient…
                </div>
              )}

              {/* Mutuelle */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                  Mutuelle <span style={{ color: "#ef4444" }}>*</span>
                </label>
                {cForm.patientId && !loadingPatientData ? (
                  patientMutuelle ? (
                    <input value={cForm.mutuelleLabel} readOnly
                      style={{ ...inp, background: "#f0fdf4", color: "#16a34a", fontWeight: 600 }} />
                  ) : (
                    <div style={{ padding: "11px 14px", borderRadius: 8, background: "#fffbeb",
                      color: "#d97706", fontSize: 13, border: "1px solid #fde68a" }}>
                      Ce patient n'a pas d'affiliation mutuelle enregistrée.
                    </div>
                  )
                ) : (
                  <input value="" readOnly placeholder="Sélectionnez d'abord un patient"
                    style={{ ...inp, background: "#f8fafc", color: "#94a3b8" }} />
                )}
              </div>

              {/* Consultation */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                  Consultation <span style={{ color: "#ef4444" }}>*</span>
                </label>
                {patientConsultations.length > 0 ? (
                  <select value={cForm.consultationId ?? ""}
                    onChange={(e) => setCForm((f) => ({ ...f, consultationId: Number(e.target.value) }))}
                    style={{ ...inp, background: "white" }}>
                    <option value="">Sélectionner une consultation…</option>
                    {patientConsultations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {new Date(c.dateVisite).toLocaleDateString("fr-FR")}
                        {c.motif ? ` — ${c.motif}` : ""}
                        {c.montantTotal != null ? ` (${c.montantTotal} MAD)` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value="" readOnly
                    placeholder={cForm.patientId ? "Aucune consultation trouvée" : "Sélectionnez d'abord un patient"}
                    style={{ ...inp, background: "#f8fafc", color: "#94a3b8" }} />
                )}
              </div>

              {modalError && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px",
                  background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
                  <AlertCircle size={14} /> {modalError}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowCreate(false)}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={handleCreate} disabled={saving || !cForm.patientId || !cForm.mutuelleId || !cForm.consultationId}
                style={{ padding: "10px 24px", borderRadius: 8, border: "none",
                  background: (saving || !cForm.patientId || !cForm.mutuelleId || !cForm.consultationId) ? "#cbd5e1" : "#2fb5fc",
                  color: "white", fontWeight: 700, fontSize: 14,
                  cursor: (saving || !cForm.patientId || !cForm.mutuelleId || !cForm.consultationId) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8 }}>
                {saving ? <><Spinner /> Création…</> : <><FileText size={14} /> Créer le dossier</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function MutualsPage() {
  const [tab, setTab] = useState<"mutuelles" | "dossiers">("mutuelles");

  const tabs = [
    { key: "mutuelles" as const, label: "Affiliations Mutuelles", icon: <Shield size={15} /> },
    { key: "dossiers"  as const, label: "Dossiers de Remboursement", icon: <FileText size={15} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
          Gestion des Mutuelles
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          Affiliations patients et suivi des dossiers de remboursement
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9",
        borderRadius: 12, padding: 4, width: "fit-content" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: "flex", alignItems: "center", gap: 7,
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: tab === t.key ? "white" : "transparent",
              color: tab === t.key ? "#0f172a" : "#64748b",
              fontWeight: tab === t.key ? 700 : 500, fontSize: 14, cursor: "pointer",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "mutuelles" ? <MutuellesTab /> : <DossiersTab />}
    </div>
  );
}
