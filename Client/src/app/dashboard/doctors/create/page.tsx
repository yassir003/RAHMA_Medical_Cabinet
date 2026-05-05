"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Stethoscope, Save, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { createMedecin, ApiError } from "@/lib/api";

const SPECIALITES = [
  "Généraliste", "Cardiologue", "Dermatologue", "Gynécologue",
  "Neurologue", "Ophtalmologue", "Pédiatre", "Psychiatre",
  "Radiologue", "Rhumatologue", "Urologue", "Dentiste",
  "Chirurgien", "Anesthésiste", "Endocrinologue", "Gastro-entérologue",
  "Hématologue", "Infectiologue", "Kinésithérapeute", "Néphrologue",
  "Oncologiste", "Orthopédiste", "Pneumologue", "Autre",
];

function Field({ label, required = false, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "13px 16px", borderRadius: 10, border: "1px solid #e2e8f0",
  fontSize: 14, outline: "none", color: "#0f172a", width: "100%",
};

export default function CreateDoctorPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nom: "", prenom: "", specialite: "Généraliste",
    telephone: "", email: "", password: "", passwordConfirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
    setServerError("");
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.nom.trim())       errs.nom       = "Le nom est requis.";
    if (!form.prenom.trim())    errs.prenom    = "Le prénom est requis.";
    if (!form.specialite)       errs.specialite = "La spécialité est requise.";
    if (!form.email.trim())     errs.email     = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalide.";
    if (!form.password)         errs.password  = "Le mot de passe est requis.";
    else if (form.password.length < 8) errs.password = "Minimum 8 caractères.";
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = "Les mots de passe ne correspondent pas.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      await createMedecin({
        nom:        form.nom.trim(),
        prenom:     form.prenom.trim(),
        specialite: form.specialite,
        telephone:  form.telephone.trim() || undefined,
        email:      form.email.trim(),
        password:   form.password,
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/doctors/list"), 1800);
    } catch (e: unknown) {
      setServerError(e instanceof ApiError ? e.message : "Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ecfdf5",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={36} color="#16a34a" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Médecin créé avec succès !</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>Redirection vers l'annuaire…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => router.back()} style={{
          background: "white", border: "1px solid #e2e8f0", borderRadius: 12,
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <ArrowLeft size={18} color="#64748b" />
        </button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>
            Ajouter un médecin
          </h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Remplissez les informations pour créer un profil médecin.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Professional info */}
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 22,
              display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
              <Stethoscope size={17} color="#3b82f6" /> Informations professionnelles
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Field label="Nom" required error={errors.nom}>
                <input value={form.nom} onChange={(e) => set("nom", e.target.value)}
                  placeholder="Ex: Benali" style={{ ...inputStyle, borderColor: errors.nom ? "#fca5a5" : "#e2e8f0" }} />
              </Field>
              <Field label="Prénom" required error={errors.prenom}>
                <input value={form.prenom} onChange={(e) => set("prenom", e.target.value)}
                  placeholder="Ex: Ahmed" style={{ ...inputStyle, borderColor: errors.prenom ? "#fca5a5" : "#e2e8f0" }} />
              </Field>
              <Field label="Spécialité" required error={errors.specialite}>
                <select value={form.specialite} onChange={(e) => set("specialite", e.target.value)}
                  style={{ ...inputStyle, background: "white", borderColor: errors.specialite ? "#fca5a5" : "#e2e8f0" }}>
                  {SPECIALITES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Téléphone">
                <input value={form.telephone} onChange={(e) => set("telephone", e.target.value)}
                  placeholder="+212 6xx xxx xxx" style={inputStyle} />
              </Field>
            </div>
          </div>

          {/* Account info */}
          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 22,
              borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
              Accès au système
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Field label="Email" required error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="dr.benali@cabinet.com"
                  style={{ ...inputStyle, borderColor: errors.email ? "#fca5a5" : "#e2e8f0" }} />
              </Field>
              <div />
              <Field label="Mot de passe" required error={errors.password}>
                <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
                  placeholder="Minimum 8 caractères"
                  style={{ ...inputStyle, borderColor: errors.password ? "#fca5a5" : "#e2e8f0" }} />
              </Field>
              <Field label="Confirmer le mot de passe" required error={errors.passwordConfirm}>
                <input type="password" value={form.passwordConfirm} onChange={(e) => set("passwordConfirm", e.target.value)}
                  placeholder="Répétez le mot de passe"
                  style={{ ...inputStyle, borderColor: errors.passwordConfirm ? "#fca5a5" : "#e2e8f0" }} />
              </Field>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
              Le médecin devra changer son mot de passe lors de sa première connexion.
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 16px",
              background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 14 }}>
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 14 }}>
            <button type="button" onClick={() => router.back()}
              style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid #e2e8f0",
                background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Annuler
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: "12px 32px", borderRadius: 10, border: "none",
                background: loading ? "#cbd5e1" : "var(--primary, #2fb5fc)",
                color: "white", fontWeight: 700, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8 }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Création…</>
                : <><Save size={16} /> Enregistrer le médecin</>}
            </button>
          </div>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
