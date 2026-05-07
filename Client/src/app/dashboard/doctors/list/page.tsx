"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, PlusCircle, Mail, Phone, Loader2, AlertCircle, Trash2, User, Edit2, X, Save } from "lucide-react";
import { getMedecins, deleteMedecin, updateMedecin, type Medecin, type MedecinRequestDto } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DoctorsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [doctors, setDoctors]   = useState<Medecin[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const PAGE_SIZE = 10;

  // ── Edit state ──────────────────────────────────────────────────────────
  const [editDoc, setEditDoc] = useState<Medecin | null>(null);
  const [editForm, setEditForm] = useState<Partial<MedecinRequestDto>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getMedecins(page, PAGE_SIZE, search)
      .then((r) => { setDoctors(r.content); setTotal(r.totalElements); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(t);
  }, [search]);

  function openEdit(doc: Medecin) {
    setEditDoc(doc);
    setEditForm({ nom: doc.nom, prenom: doc.prenom, specialite: doc.specialite, telephone: doc.telephone });
    setEditError("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDoc) return;
    setEditSaving(true);
    setEditError("");
    try {
      await updateMedecin(editDoc.id, editForm);
      setEditDoc(null);
      load();
    } catch (err: any) {
      setEditError(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: number, nom: string) {
    if (!confirm(`Supprimer le Dr. ${nom} ? Cette action est irréversible.`)) return;
    setDeleting(id);
    try {
      await deleteMedecin(id);
      load();
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
            Annuaire des Médecins
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            {total} médecin{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => router.push("/dashboard/doctors/create")}
            style={{ padding: "12px 24px", borderRadius: 12, border: "none",
              background: "var(--primary, #2fb5fc)", color: "white", fontWeight: 700,
              fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <PlusCircle size={18} /> Ajouter un médecin
          </button>
        )}
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 360, marginBottom: 24 }}>
          <Search size={15} color="#94a3b8" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom, spécialité…"
            style={{ width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10,
              border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px",
            background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "#94a3b8" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <User size={48} style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              Aucun médecin trouvé
            </h3>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              {search ? `Aucun résultat pour « ${search} ».` : "Aucun médecin enregistré pour l'instant."}
            </p>
            {isAdmin && (
              <button onClick={() => router.push("/dashboard/doctors/create")}
                style={{ padding: "10px 22px", borderRadius: 10, border: "none",
                  background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Ajouter le premier médecin
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {doctors.map((doc) => (
              <div key={doc.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 22px", border: "1px solid #f1f5f9", borderRadius: 14, background: "#fafafa",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: "var(--primary, #2fb5fc)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 800, fontSize: 19, boxShadow: "0 4px 10px rgba(47,181,252,0.25)", flexShrink: 0 }}>
                    {doc.prenom?.charAt(0)}{doc.nom?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, marginBottom: 4 }}>
                      Dr. {doc.prenom} {doc.nom}
                    </div>
                    <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600,
                      background: "#eff6ff", padding: "2px 10px", borderRadius: 6 }}>
                      {doc.specialite}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#64748b", fontSize: 13 }}>
                    <Mail size={15} /> {doc.email || "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#64748b", fontSize: 13 }}>
                    <Phone size={15} /> {doc.telephone || "—"}
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEdit(doc)}
                      style={{ background: "white", border: "1px solid #dbeafe", padding: "8px 14px",
                        borderRadius: 10, cursor: "pointer", color: "#2563eb",
                        display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                      <Edit2 size={15} /> Modifier
                    </button>
                    <button
                      disabled={deleting === doc.id}
                      onClick={() => handleDelete(doc.id, `${doc.prenom} ${doc.nom}`)}
                      style={{ background: "white", border: "1px solid #fee2e2", padding: "8px 14px",
                        borderRadius: 10, cursor: deleting === doc.id ? "not-allowed" : "pointer",
                        color: "#ef4444", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                      {deleting === doc.id
                        ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                        : <Trash2 size={15} />}
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: page === 0 ? "#f8fafc" : "white", color: page === 0 ? "#cbd5e1" : "#475569",
                cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
              ← Précédent
            </button>
            <span style={{ padding: "8px 16px", fontSize: 14, color: "#64748b" }}>
              Page {page + 1} / {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
              style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: page >= totalPages - 1 ? "#f8fafc" : "white",
                color: page >= totalPages - 1 ? "#cbd5e1" : "#475569",
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>
              Suivant →
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Edit Doctor Modal ─────────────────────────────────────────── */}
      {editDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: 36, width: "100%", maxWidth: 540, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
                  Modifier le médecin
                </h3>
                <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
                  Dr. {editDoc.prenom} {editDoc.nom}
                </p>
              </div>
              <button onClick={() => setEditDoc(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Prénom *</label>
                  <input required type="text" value={editForm.prenom ?? ""}
                    onChange={e => setEditForm(p => ({ ...p, prenom: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Nom *</label>
                  <input required type="text" value={editForm.nom ?? ""}
                    onChange={e => setEditForm(p => ({ ...p, nom: e.target.value }))}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Spécialité *</label>
                <input required type="text" value={editForm.specialite ?? ""}
                  onChange={e => setEditForm(p => ({ ...p, specialite: e.target.value }))}
                  placeholder="Ex : Cardiologie, Pédiatrie…"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Téléphone</label>
                <input type="tel" value={editForm.telephone ?? ""}
                  onChange={e => setEditForm(p => ({ ...p, telephone: e.target.value }))}
                  placeholder="+212 6xx xxx xxx"
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }} />
              </div>

              {editError && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>
                  {editError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setEditDoc(null)}
                  style={{ padding: "11px 22px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Annuler
                </button>
                <button type="submit" disabled={editSaving}
                  style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: editSaving ? "#cbd5e1" : "var(--primary, #2fb5fc)", color: "white", fontWeight: 700, fontSize: 14, cursor: editSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {editSaving ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Enregistrement…</> : <><Save size={16} /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
