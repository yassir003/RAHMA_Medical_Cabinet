"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, FileText, Plus, Search, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  annulerOrdonnance,
  downloadOrdonnancePdf,
  getOrdonnances,
  type OrdonnanceResponse,
  type StatutOrdonnance,
} from "@/lib/api";

function fmtDate(value: string) {
  return value ? new Date(value).toLocaleDateString("fr-FR") : "-";
}

function statusStyle(statut: StatutOrdonnance) {
  const styles = {
    ACTIVE: { label: "Active", color: "#15803d", bg: "#dcfce7" },
    EXPIREE: { label: "Expiree", color: "#b45309", bg: "#fef3c7" },
    ANNULEE: { label: "Annulee", color: "#b91c1c", bg: "#fee2e2" },
  };
  return styles[statut] ?? styles.ACTIVE;
}

export default function OrdonnancesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<OrdonnanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<StatutOrdonnance | "">("");

  const canCreate = user?.role === "MEDECIN";
  const canCancel = user?.role === "MEDECIN";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getOrdonnances(0, 100, statut, search);
      setItems(res.content ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) =>
      `ord-${o.id}`.toLowerCase().includes(q) ||
      `${o.patient?.prenom} ${o.patient?.nom}`.toLowerCase().includes(q)
    );
  }, [items, search]);

  async function cancel(id: number) {
    if (!confirm("Annuler cette ordonnance ?")) return;
    await annulerOrdonnance(id);
    await load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Ordonnances</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Consultation, telechargement PDF et suivi des prescriptions.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push("/dashboard/ordonnances/nouvelle")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 10, border: "none", background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 700, cursor: "pointer" }}
          >
            <Plus size={16} /> Nouvelle ordonnance
          </button>
        )}
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 300 }}>
            <Search size={16} color="#94a3b8" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              placeholder="Rechercher patient ou numero"
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none", fontSize: 13 }}
            />
          </div>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as StatutOrdonnance | "")}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 13 }}
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIREE">Expiree</option>
            <option value="ANNULEE">Annulee</option>
          </select>
          <button onClick={load} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontWeight: 700 }}>
            Filtrer
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 50, color: "#64748b" }}>Chargement...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 40, color: "#dc2626" }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 56, color: "#94a3b8" }}>
            <FileText size={44} style={{ marginBottom: 10 }} />
            <p>Aucune ordonnance trouvee.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#94a3b8", fontSize: 12, borderBottom: "1px solid #f1f5f9" }}>
                <th style={{ textAlign: "left", paddingBottom: 14 }}>N Ordonnance</th>
                <th style={{ textAlign: "left", paddingBottom: 14 }}>Patient</th>
                <th style={{ textAlign: "left", paddingBottom: 14 }}>Medecin</th>
                <th style={{ textAlign: "left", paddingBottom: 14 }}>Date</th>
                <th style={{ textAlign: "left", paddingBottom: 14 }}>Medicaments</th>
                <th style={{ textAlign: "left", paddingBottom: 14 }}>Duree</th>
                <th style={{ textAlign: "left", paddingBottom: 14 }}>Statut</th>
                <th style={{ textAlign: "right", paddingBottom: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const s = statusStyle(o.statut);
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "15px 0", fontWeight: 800, color: "#2563eb" }}>ORD-{o.id}</td>
                    <td style={{ padding: "15px 0", color: "#0f172a", fontWeight: 700 }}>{o.patient?.prenom} {o.patient?.nom}</td>
                    <td style={{ padding: "15px 0", color: "#475569" }}>Dr. {o.medecin?.prenom} {o.medecin?.nom}</td>
                    <td style={{ padding: "15px 0", color: "#64748b" }}>{fmtDate(o.dateCreation)}</td>
                    <td style={{ padding: "15px 0", color: "#64748b" }}>{o.medicaments?.length ?? 0}</td>
                    <td style={{ padding: "15px 0", color: "#64748b" }}>{o.dureeTraitement}</td>
                    <td style={{ padding: "15px 0" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 999, background: s.bg, color: s.color, fontSize: 12, fontWeight: 800 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: "15px 0", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button title="Voir" onClick={() => router.push(`/dashboard/ordonnances/${o.id}`)} style={iconBtn("#eff6ff", "#2563eb")}><Eye size={15} /></button>
                        <button title="PDF" onClick={() => downloadOrdonnancePdf(o.id, o.patient?.nom)} style={iconBtn("#ecfdf5", "#16a34a")}><Download size={15} /></button>
                        {canCancel && o.statut !== "ANNULEE" && (
                          <button title="Annuler" onClick={() => cancel(o.id)} style={iconBtn("#fef2f2", "#dc2626")}><XCircle size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function iconBtn(bg: string, color: string): React.CSSProperties {
  return { width: 34, height: 34, borderRadius: 8, border: "none", background: bg, color, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
}
