"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    cin: "",
    dateNaissance: "",
    telephone: "",
    adresse: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nom || !form.prenom || !form.cin || !form.email || !form.password) {
      setError("Nom, prénom, CIN, email et mot de passe sont obligatoires");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      await register({
        nom: form.nom,
        prenom: form.prenom,
        cin: form.cin,
        dateNaissance: form.dateNaissance || undefined,
        telephone: form.telephone || undefined,
        adresse: form.adresse || undefined,
        email: form.email,
        password: form.password,
      });
      // Redirect handled inside AuthContext.register()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof TypeError) {
        setError("Impossible de joindre le serveur");
      } else {
        setError("Une erreur inattendue est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    opacity: loading ? 0.6 : 1,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155",
    marginBottom: "8px",
  };

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", width: "100%" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: "8px", marginTop: 0 }}>
        Créer un compte
      </h1>
      <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "32px" }}>
        Inscrivez-vous pour prendre des rendez-vous en ligne.
      </p>

      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: "20px", borderRadius: "8px",
          backgroundColor: "#fef2f2", border: "1px solid #fecaca",
          color: "#dc2626", fontSize: "14px", fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Row: Nom + Prénom */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={labelStyle}>Nom <span style={{ color: "#ef4444" }}>*</span></label>
            <input placeholder="Alaoui" value={form.nom} onChange={set("nom")} disabled={loading} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Prénom <span style={{ color: "#ef4444" }}>*</span></label>
            <input placeholder="Sara" value={form.prenom} onChange={set("prenom")} disabled={loading} style={inputStyle} />
          </div>
        </div>

        {/* Row: CIN + Date naissance */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <label style={labelStyle}>CIN <span style={{ color: "#ef4444" }}>*</span></label>
            <input placeholder="AB123456" value={form.cin} onChange={set("cin")} disabled={loading} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date de naissance</label>
            <input type="date" value={form.dateNaissance} onChange={set("dateNaissance")} disabled={loading} style={inputStyle} />
          </div>
        </div>

        {/* Téléphone */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Téléphone</label>
          <input placeholder="06XXXXXXXX" value={form.telephone} onChange={set("telephone")} disabled={loading} style={inputStyle} />
        </div>

        {/* Adresse */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Adresse</label>
          <input placeholder="123 Rue Hassan II, Casablanca" value={form.adresse} onChange={set("adresse")} disabled={loading} style={inputStyle} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Email <span style={{ color: "#ef4444" }}>*</span></label>
          <input type="email" placeholder="vous@example.com" value={form.email} onChange={set("email")} disabled={loading} style={inputStyle} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "28px" }}>
          <label style={labelStyle}>Mot de passe <span style={{ color: "#ef4444" }}>*</span></label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="8 caractères minimum"
              value={form.password}
              onChange={set("password")}
              disabled={loading}
              style={{ ...inputStyle, paddingRight: "44px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#94a3b8" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
          {form.password.length > 0 && (
            <p style={{ marginTop: "6px", fontSize: "12px", color: form.password.length >= 8 ? "#16a34a" : "#f59e0b", fontWeight: 500 }}>
              {form.password.length < 8
                ? `${8 - form.password.length} caractère(s) manquant(s)`
                : "Mot de passe valide ✓"}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "16px", fontSize: "16px", fontWeight: 600,
            borderRadius: "8px", backgroundColor: loading ? "#7dd3fc" : "#2fb5fc",
            color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          {loading && <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
          {loading ? "Inscription…" : "Créer mon compte"}
        </button>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
          Vous avez déjà un compte ?{" "}
          <Link href="/login" style={{ color: "#2fb5fc", fontWeight: 600, textDecoration: "none" }}>
            Se connecter
          </Link>
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}
