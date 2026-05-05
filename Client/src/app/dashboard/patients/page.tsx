"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight,
  User, Phone, MapPin, Droplet, AlertCircle, X, Check, Loader2,
  Calendar, ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getPatients, createPatient, updatePatient, deletePatient,
  Patient, PatientRequestDto, ApiError,
} from "@/lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function calcAge(dob?: string) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob + "T00:00:00").getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const BLOOD_COLORS: Record<string, { bg: string; color: string }> = {
  "A+": { bg: "#fef2f2", color: "#dc2626" },
  "A-": { bg: "#fef2f2", color: "#dc2626" },
  "B+": { bg: "#eff6ff", color: "#2563eb" },
  "B-": { bg: "#eff6ff", color: "#2563eb" },
  "AB+": { bg: "#fdf4ff", color: "#9333ea" },
  "AB-": { bg: "#fdf4ff", color: "#9333ea" },
  "O+": { bg: "#fff7ed", color: "#ea580c" },
  "O-": { bg: "#fff7ed", color: "#ea580c" },
};

function BloodBadge({ type }: { type?: string }) {
  if (!type) return null;
  const s = BLOOD_COLORS[type] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6,
      background: s.bg, color: s.color, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 3 }}>
      <Droplet size={9} />{type}
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

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── Patient form ─────────────────────────────────────────────────────────────

function PatientModal({
  initial, onSave, onClose, saving, error,
}: {
  initial: Partial<PatientRequestDto & { id?: number }>;
  onSave: (d: PatientRequestDto) => void;
  onClose: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState<PatientRequestDto>({
    nom: initial.nom ?? "",
    prenom: initial.prenom ?? "",
    cin: initial.cin ?? "",
    dateNaissance: initial.dateNaissance ?? "",
    telephone: initial.telephone ?? "",
    adresse: initial.adresse ?? "",
    email: initial.email ?? "",
    groupeSanguin: initial.groupeSanguin ?? "",
    allergies: initial.allergies ?? "",
    antecedents: initial.antecedents ?? "",
  });
  const isEdit = !!initial.id;

  const set = (k: keyof PatientRequestDto, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%",
        maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "92vh", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
            {isEdit ? "Modifier le patient" : "Nouveau patient"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Identity */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 12, letterSpacing: "0.05em" }}>
              IDENTITÉ
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>
                  Nom <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input value={form.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Ex: Alaoui" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>
                  Prénom <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input value={form.prenom} onChange={(e) => set("prenom", e.target.value)} placeholder="Ex: Youssef" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>
                  CIN <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input value={form.cin} onChange={(e) => set("cin", e.target.value)} placeholder="Ex: BE123456" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>
                  Date de naissance
                </label>
                <input type="date" value={form.dateNaissance} onChange={(e) => set("dateNaissance", e.target.value)} style={inp} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 12, letterSpacing: "0.05em" }}>
              COORDONNÉES
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Téléphone</label>
                  <input value={form.telephone} onChange={(e) => set("telephone", e.target.value)} placeholder="+212 6xx xxx xxx" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="patient@email.com" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Adresse</label>
                <input value={form.adresse} onChange={(e) => set("adresse", e.target.value)} placeholder="Rue, Ville, Code postal" style={inp} />
              </div>
            </div>
          </div>

          {/* Medical */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 12, letterSpacing: "0.05em" }}>
              INFORMATIONS MÉDICALES
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Groupe sanguin</label>
                <select value={form.groupeSanguin} onChange={(e) => set("groupeSanguin", e.target.value)}
                  style={{ ...inp, background: "white" }}>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g || "— Non renseigné —"}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Allergies</label>
                <textarea value={form.allergies} onChange={(e) => set("allergies", e.target.value)}
                  rows={2} placeholder="Pénicilline, Arachides…"
                  style={{ ...inp, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Antécédents médicaux</label>
                <textarea value={form.antecedents} onChange={(e) => set("antecedents", e.target.value)}
                  rows={2} placeholder="Diabète, Hypertension…"
                  style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px",
              background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
          <button onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
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

const PAGE_SIZE = 12;

export default function PatientsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [viewTarget, setViewTarget] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState("");

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await getPatients(p, PAGE_SIZE, q);
      setPatients(res.content);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setPage(0); load(0, search); }, 300);
  }, [search, load]);

  useEffect(() => { load(page, search); }, [page, load]);  // page changes reload immediately

  async function handleCreate(data: PatientRequestDto) {
    if (!data.nom.trim() || !data.prenom.trim() || !data.cin.trim()) {
      setModalError("Nom, prénom et CIN sont requis."); return;
    }
    setSaving(true); setModalError("");
    try {
      const created = await createPatient(data);
      setPatients((prev) => [created, ...prev]);
      setTotalElements((n) => n + 1);
      setShowCreate(false);
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Erreur lors de la création.");
    } finally { setSaving(false); }
  }

  async function handleEdit(data: PatientRequestDto) {
    if (!editTarget) return;
    if (!data.nom.trim() || !data.prenom.trim() || !data.cin.trim()) {
      setModalError("Nom, prénom et CIN sont requis."); return;
    }
    setSaving(true); setModalError("");
    try {
      const updated = await updatePatient(editTarget.id, data);
      setPatients((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      setEditTarget(null);
    } catch (e) {
      setModalError(e instanceof ApiError ? e.message : "Erreur lors de la modification.");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePatient(deleteTarget.id);
      setPatients((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setTotalElements((n) => n - 1);
      setDeleteTarget(null);
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
            Gestion des Patients
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {loading ? "Chargement…" : `${totalElements} patient${totalElements !== 1 ? "s" : ""} enregistré${totalElements !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={() => { setShowCreate(true); setModalError(""); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px",
            borderRadius: 10, border: "none", background: "#2fb5fc", color: "white",
            fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          <Plus size={16} /> Nouveau patient
        </button>
      </div>

      {/* Search bar */}
      <div style={{ background: "white", borderRadius: 12, padding: "12px 18px",
        border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
        <Search size={17} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, prénom ou CIN…"
          style={{ border: "none", outline: "none", fontSize: 14, color: "#0f172a", flex: 1 }} />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 2 }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
            padding: "60px 0", color: "#94a3b8" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <User size={40} color="#cbd5e1" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#94a3b8", fontSize: 14 }}>
              {search ? `Aucun résultat pour « ${search} »` : "Aucun patient enregistré."}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["#","Patient","CIN","Âge / Naissance","Téléphone","Groupe","Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12,
                    fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const age = calcAge(p.dateNaissance);
                return (
                  <tr key={p.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "13px 16px", color: "#94a3b8", fontSize: 12, fontFamily: "monospace" }}>
                      #{String(p.id).padStart(4, "0")}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{p.prenom} {p.nom}</div>
                      {p.email && (
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{p.email}</div>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#475569", fontFamily: "monospace", fontSize: 13 }}>
                      {p.cin}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#475569" }}>
                      {age != null ? (
                        <><strong style={{ color: "#0f172a" }}>{age} ans</strong><br />
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{fmtDate(p.dateNaissance)}</span></>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#475569" }}>
                      {p.telephone ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Phone size={12} color="#94a3b8" /> {p.telephone}
                        </div>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <BloodBadge type={p.groupeSanguin} />
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <button onClick={() => setViewTarget(p)} title="Voir le dossier"
                          style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e8f0",
                            background: "white", color: "#64748b", cursor: "pointer" }}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => router.push(`/dashboard/doctors/patients/${p.id}`)}
                          title="Dossier médical complet"
                          style={{ padding: "5px 8px", borderRadius: 6, border: "none",
                            background: "#eff6ff", color: "#2563eb", cursor: "pointer" }}>
                          <ExternalLink size={14} />
                        </button>
                        <button onClick={() => { setEditTarget(p); setModalError(""); }}
                          title="Modifier"
                          style={{ padding: "5px 8px", borderRadius: 6, border: "none",
                            background: "#f8fafc", color: "#475569", cursor: "pointer" }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} title="Supprimer"
                          style={{ padding: "5px 8px", borderRadius: 6, border: "none",
                            background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Page {page + 1} sur {totalPages} — {totalElements} patients
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 600,
                  background: page === 0 ? "#f8fafc" : "white",
                  color: page === 0 ? "#cbd5e1" : "#475569",
                  cursor: page === 0 ? "default" : "pointer" }}>
                <ChevronLeft size={15} /> Précédent
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 600,
                  background: page >= totalPages - 1 ? "#f8fafc" : "white",
                  color: page >= totalPages - 1 ? "#cbd5e1" : "#475569",
                  cursor: page >= totalPages - 1 ? "default" : "pointer" }}>
                Suivant <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick view modal ── */}
      {viewTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: "100%",
            maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={22} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                    {viewTarget.prenom} {viewTarget.nom}
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>CIN: {viewTarget.cin}</p>
                </div>
              </div>
              <button onClick={() => setViewTarget(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { icon: <Calendar size={14} />, label: "Date de naissance", value: fmtDate(viewTarget.dateNaissance) },
                { icon: <Droplet size={14} />, label: "Groupe sanguin", value: viewTarget.groupeSanguin || "—" },
                { icon: <Phone size={14} />, label: "Téléphone", value: viewTarget.telephone || "—" },
                { icon: <MapPin size={14} />, label: "Adresse", value: viewTarget.adresse || "—" },
              ].map((f) => (
                <div key={f.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5,
                    fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                    {f.icon} {f.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{f.value}</div>
                </div>
              ))}
            </div>

            {(viewTarget.allergies || viewTarget.antecedents) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10,
                padding: "14px 16px", background: "#f8fafc", borderRadius: 10, marginBottom: 20 }}>
                {viewTarget.allergies && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", marginBottom: 3, letterSpacing: "0.05em" }}>
                      ALLERGIES
                    </div>
                    <div style={{ fontSize: 13, color: "#0f172a" }}>{viewTarget.allergies}</div>
                  </div>
                )}
                {viewTarget.antecedents && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", marginBottom: 3, letterSpacing: "0.05em" }}>
                      ANTÉCÉDENTS
                    </div>
                    <div style={{ fontSize: 13, color: "#0f172a" }}>{viewTarget.antecedents}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setViewTarget(null)}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Fermer
              </button>
              <button onClick={() => { setViewTarget(null); router.push(`/dashboard/doctors/patients/${viewTarget.id}`); }}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none",
                  background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6 }}>
                <ExternalLink size={14} /> Dossier médical
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <PatientModal initial={{}} onSave={handleCreate} onClose={() => setShowCreate(false)}
          saving={saving} error={modalError} />
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <PatientModal initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)}
          saving={saving} error={modalError} />
      )}

      {/* ── Delete confirmation ── */}
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
                Supprimer ce patient ?
              </h3>
              <p style={{ color: "#64748b", fontSize: 14 }}>
                <strong>{deleteTarget.prenom} {deleteTarget.nom}</strong> (CIN: {deleteTarget.cin}).
                <br />Toutes ses données seront supprimées définitivement.
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
