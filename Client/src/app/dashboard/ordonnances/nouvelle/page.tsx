"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react";
import {
  createOrdonnance,
  downloadOrdonnancePdf,
  getConsultationById,
  getConsultationsByMedecinMe,
  type Consultation,
  type OrdonnanceRequest,
} from "@/lib/api";

const emptyMedicament = {
  nomMedicament: "",
  dosage: "",
  frequence: "",
  duree: "",
  instructions: "",
};

export default function NouvelleOrdonnancePage() {
  const router = useRouter();

  const [consultationId, setConsultationId] = useState(0);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationSearch, setConsultationSearch] = useState("");
  const [dureeTraitement, setDureeTraitement] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medicaments, setMedicaments] = useState([{ ...emptyMedicament }]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("consultationId") || 0);
    loadConsultations(id);
    if (id) {
      setConsultationId(id);
      loadConsultation(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadConsultations(preselectedId = 0) {
    setLoadingConsultations(true);
    try {
      const data = await getConsultationsByMedecinMe(0, 100);
      const items = [...(data.content ?? [])].sort(
        (a, b) => new Date(b.dateVisite).getTime() - new Date(a.dateVisite).getTime()
      );
      setConsultations(items);
      if (!preselectedId && items.length === 1) {
        selectConsultation(items[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les consultations");
    } finally {
      setLoadingConsultations(false);
    }
  }

  async function loadConsultation(id = consultationId) {
    if (!id) return;
    setError("");
    try {
      const data = await getConsultationById(id);
      setConsultation(data);
      setConsultationId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Consultation introuvable");
    }
  }

  function selectConsultation(item: Consultation) {
    setConsultation(item);
    setConsultationId(item.id);
    setError("");
  }

  function updateMedicament(index: number, field: keyof typeof emptyMedicament, value: string) {
    setMedicaments((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function validate() {
    if (!consultationId) return "La consultation est obligatoire.";
    if (dureeTraitement.trim().length < 2) return "La duree du traitement est obligatoire.";
    if (medicaments.length === 0) return "Ajoutez au moins un medicament.";
    for (const med of medicaments) {
      if (med.nomMedicament.trim().length < 2) return "Le nom du medicament doit contenir au moins 2 caracteres.";
      if (!med.dosage.trim()) return "Le dosage est obligatoire.";
      if (!med.frequence.trim()) return "La frequence est obligatoire.";
      if (!med.duree.trim()) return "La duree du medicament est obligatoire.";
    }
    return "";
  }

  const filteredConsultations = consultations.filter((item) => {
    const search = consultationSearch.trim().toLowerCase();
    if (!search) return true;
    const haystack = [
      item.id,
      item.patientPrenom,
      item.patientNom,
      item.patientCin,
      item.motif,
      item.dateVisite ? new Date(item.dateVisite).toLocaleDateString("fr-FR") : "",
    ].join(" ").toLowerCase();
    return haystack.includes(search);
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload: OrdonnanceRequest = {
        consultationId,
        dureeTraitement,
        instructions: instructions || undefined,
        medicaments: medicaments.map((m) => ({
          nomMedicament: m.nomMedicament,
          dosage: m.dosage,
          frequence: m.frequence,
          duree: m.duree,
          instructions: m.instructions || undefined,
        })),
      };
      const created = await createOrdonnance(payload);
      await downloadOrdonnancePdf(created.id, created.patient.nom);
      alert("Ordonnance creee et telechargee.");
      router.push(`/dashboard/reports/${consultationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" onClick={() => router.back()} style={backButton}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Nouvelle ordonnance</h2>
          <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 14 }}>Creation reservee aux medecins.</p>
        </div>
      </div>

      {error && <div style={{ padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontWeight: 700 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 22 }}>
        <section style={card}>
          <h3 style={title}>Informations generales</h3>
          <label style={label}>Consultation liee</label>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            <input
              value={consultationSearch}
              onChange={(e) => setConsultationSearch(e.target.value)}
              placeholder="Rechercher par patient, CIN, motif ou date"
              style={input}
            />
            <div style={consultationList}>
              {loadingConsultations ? (
                <div style={emptyState}>Chargement des consultations...</div>
              ) : filteredConsultations.length === 0 ? (
                <div style={emptyState}>Aucune consultation trouvee.</div>
              ) : (
                filteredConsultations.map((item) => {
                  const selected = item.id === consultationId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectConsultation(item)}
                      style={{ ...consultationOption, ...(selected ? consultationOptionSelected : {}) }}
                    >
                      <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <strong style={{ color: "#0f172a" }}>{item.patientPrenom} {item.patientNom}</strong>
                        <span style={selected ? selectedBadge : consultationBadge}>#{item.id}</span>
                      </span>
                      <span style={{ color: "#64748b", fontSize: 13, marginTop: 5 }}>
                        {new Date(item.dateVisite).toLocaleString("fr-FR")} - {item.motif || "Consultation"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {consultation && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, marginBottom: 18, background: "#f8fafc" }}>
              <div style={{ fontWeight: 800, color: "#0f172a" }}>{consultation.patientPrenom} {consultation.patientNom}</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                {new Date(consultation.dateVisite).toLocaleString("fr-FR")} - {consultation.motif || "Consultation"}
              </div>
            </div>
          )}

          <label style={label}>Duree du traitement</label>
          <input value={dureeTraitement} onChange={(e) => setDureeTraitement(e.target.value)} placeholder="Ex: 7 jours, 1 mois" style={input} />

          <label style={label}>Instructions generales</label>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} placeholder="Instructions optionnelles" style={{ ...input, resize: "vertical", lineHeight: 1.6 }} />
        </section>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ ...title, margin: 0 }}>Medicaments</h3>
            <button type="button" onClick={() => setMedicaments((prev) => [...prev, { ...emptyMedicament }])} style={secondaryButton}>
              <Plus size={15} /> Ajouter
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {medicaments.map((med, index) => (
              <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <strong style={{ color: "#0f172a" }}>Medicament {index + 1}</strong>
                  {medicaments.length > 1 && (
                    <button type="button" onClick={() => setMedicaments((prev) => prev.filter((_, i) => i !== index))} style={trashButton}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Nom" value={med.nomMedicament} onChange={(v) => updateMedicament(index, "nomMedicament", v)} placeholder="Amoxicilline" />
                  <Field label="Dosage" value={med.dosage} onChange={(v) => updateMedicament(index, "dosage", v)} placeholder="500mg" />
                  <Field label="Frequence" value={med.frequence} onChange={(v) => updateMedicament(index, "frequence", v)} placeholder="3 fois par jour" />
                  <Field label="Duree" value={med.duree} onChange={(v) => updateMedicament(index, "duree", v)} placeholder="7 jours" />
                </div>
                <label style={label}>Instructions</label>
                <input value={med.instructions} onChange={(e) => updateMedicament(index, "instructions", e.target.value)} placeholder="Apres les repas" style={input} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={saving} style={primaryButton}>
          <Download size={17} /> {saving ? "Creation..." : "Creer l'ordonnance et telecharger le PDF"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={input} />
    </div>
  );
}

const card: React.CSSProperties = { background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
const title: React.CSSProperties = { margin: "0 0 18px", fontSize: 16, fontWeight: 800, color: "#0f172a" };
const label: React.CSSProperties = { display: "block", margin: "12px 0 7px", fontSize: 12, fontWeight: 800, color: "#475569" };
const labelStyle = label;
const input: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none", fontSize: 14, color: "#0f172a", background: "white" };
const consultationList: React.CSSProperties = { maxHeight: 292, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 12, background: "#f8fafc", padding: 8, display: "grid", gap: 8 };
const consultationOption: React.CSSProperties = { width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: "#e2e8f0", borderRadius: 10, background: "white", padding: 12, textAlign: "left", cursor: "pointer", display: "grid" };
const consultationOptionSelected: React.CSSProperties = { borderColor: "#2fb5fc", background: "#f0f9ff", boxShadow: "0 0 0 2px rgba(47,181,252,0.12)" };
const consultationBadge: React.CSSProperties = { flex: "0 0 auto", padding: "4px 7px", borderRadius: 999, background: "#e2e8f0", color: "#475569", fontSize: 12, fontWeight: 800 };
const selectedBadge: React.CSSProperties = { ...consultationBadge, background: "#2fb5fc", color: "white" };
const emptyState: React.CSSProperties = { padding: 14, color: "#64748b", fontSize: 14, textAlign: "center" };
const backButton: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, border: "1px solid #e2e8f0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const primaryButton: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 10, border: "none", background: "var(--primary,#2fb5fc)", color: "white", fontWeight: 800, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "10px 13px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", color: "#2563eb", fontWeight: 800, cursor: "pointer" };
const trashButton: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: "none", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
