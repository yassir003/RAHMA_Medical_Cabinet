"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Pill, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  annulerOrdonnance,
  downloadOrdonnancePdf,
  getOrdonnanceById,
  type OrdonnanceResponse,
  type StatutOrdonnance,
} from "@/lib/api";

function fmtDate(value: string) {
  return value ? new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "-";
}

function statusStyle(statut: StatutOrdonnance) {
  const styles = {
    ACTIVE: { label: "Active", color: "#15803d", bg: "#dcfce7" },
    EXPIREE: { label: "Expiree", color: "#b45309", bg: "#fef3c7" },
    ANNULEE: { label: "Annulee", color: "#b91c1c", bg: "#fee2e2" },
  };
  return styles[statut] ?? styles.ACTIVE;
}

export default function OrdonnanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [ordonnance, setOrdonnance] = useState<OrdonnanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const numericId = Number(id);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setOrdonnance(await getOrdonnanceById(numericId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (numericId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericId]);

  async function cancel() {
    if (!ordonnance || !confirm("Annuler cette ordonnance ?")) return;
    await annulerOrdonnance(ordonnance.id);
    await load();
  }

  if (loading) return <div style={{ padding: 50, textAlign: "center", color: "#64748b" }}>Chargement...</div>;

  if (error || !ordonnance) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#dc2626" }}>
        {error || "Ordonnance introuvable"}
      </div>
    );
  }

  const s = statusStyle(ordonnance.statut);
  const canCancel = user?.role === "MEDECIN" && ordonnance.statut !== "ANNULEE";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => router.back()} style={backButton}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Ordonnance N ORD-{ordonnance.id}</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 13 }}>Creee le {fmtDate(ordonnance.dateCreation)}</p>
        </div>
        <span style={{ padding: "6px 13px", borderRadius: 999, background: s.bg, color: s.color, fontSize: 12, fontWeight: 800 }}>{s.label}</span>
        <button onClick={() => downloadOrdonnancePdf(ordonnance.id, ordonnance.patient.nom)} style={primaryButton}>
          <Download size={16} /> Telecharger PDF
        </button>
        {canCancel && (
          <button onClick={cancel} style={dangerButton}>
            <XCircle size={16} /> Annuler
          </button>
        )}
      </div>

      <section style={card}>
        <h3 style={sectionTitle}><FileText size={18} /> Informations generales</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
          <Info label="Medecin prescripteur" value={`Dr. ${ordonnance.medecin.prenom} ${ordonnance.medecin.nom} - ${ordonnance.medecin.specialite}`} />
          <Info label="Patient" value={`${ordonnance.patient.prenom} ${ordonnance.patient.nom} - CIN ${ordonnance.patient.cin}`} />
          <Info label="Date de creation" value={fmtDate(ordonnance.dateCreation)} />
          <Info label="Duree du traitement" value={ordonnance.dureeTraitement} />
          <div>
            <span style={labelStyle}>Consultation liee</span>
            <Link href={`/dashboard/reports/${ordonnance.consultation.id}`} style={{ display: "block", marginTop: 5, color: "#2563eb", fontWeight: 700, textDecoration: "none" }}>
              {fmtDate(ordonnance.consultation.dateVisite)} - {ordonnance.consultation.motif || "Consultation"}
            </Link>
          </div>
        </div>
      </section>

      <section style={card}>
        <h3 style={sectionTitle}><Pill size={18} /> Medicaments</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {ordonnance.medicaments.map((med) => (
            <div key={med.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>{med.nomMedicament}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Badge label={med.dosage} />
                <Badge label={med.frequence} />
                <Badge label={med.duree} />
              </div>
              {med.instructions && <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: 13, fontStyle: "italic" }}>{med.instructions}</p>}
            </div>
          ))}
        </div>
      </section>

      {ordonnance.instructions && (
        <section style={{ ...card, background: "#f8fafc" }}>
          <h3 style={sectionTitle}>Instructions generales</h3>
          <p style={{ margin: 0, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ordonnance.instructions}</p>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div style={{ marginTop: 5, color: "#0f172a", fontWeight: 600, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span style={{ padding: "5px 10px", borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 800 }}>{label}</span>;
}

const card: React.CSSProperties = { background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
const sectionTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: "#0f172a" };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 };
const backButton: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, border: "1px solid #e2e8f0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const primaryButton: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "10px 15px", borderRadius: 10, border: "none", background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 800, cursor: "pointer" };
const dangerButton: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "10px 15px", borderRadius: 10, border: "none", background: "#fee2e2", color: "#b91c1c", fontWeight: 800, cursor: "pointer" };
