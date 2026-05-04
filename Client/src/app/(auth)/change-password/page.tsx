"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();

  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ancien.trim() || !nouveau.trim()) {
      setError("Les deux champs sont obligatoires");
      return;
    }
    if (nouveau.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (ancien === nouveau) {
      setError("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }

    setLoading(true);
    try {
      await changePassword(ancien, nouveau);
      // Redirect handled inside AuthContext.changePassword()
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

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", width: "100%" }}>
      {/* Icon + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <ShieldCheck size={32} color="#2fb5fc" />
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          Changer le mot de passe
        </h1>
      </div>

      <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "36px" }}>
        Votre compte utilise un mot de passe temporaire.
        Veuillez le remplacer par un mot de passe personnel avant de continuer.
      </p>

      {error && (
        <div style={{
          padding: "12px 16px",
          marginBottom: "24px",
          borderRadius: "8px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Old password */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: "#334155", marginBottom: "10px" }}>
            Mot de passe actuel
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showAncien ? "text" : "password"}
              placeholder="Votre CIN ou mot de passe actuel"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "14px 44px 14px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#0f172a", outline: "none", boxSizing: "border-box", opacity: loading ? 0.6 : 1 }}
            />
            <span
              onClick={() => setShowAncien(!showAncien)}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#94a3b8" }}
            >
              {showAncien ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        {/* New password */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", fontSize: "15px", fontWeight: 600, color: "#334155", marginBottom: "10px" }}>
            Nouveau mot de passe
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showNouveau ? "text" : "password"}
              placeholder="Au moins 8 caractères"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "14px 44px 14px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#0f172a", outline: "none", boxSizing: "border-box", opacity: loading ? 0.6 : 1 }}
            />
            <span
              onClick={() => setShowNouveau(!showNouveau)}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#94a3b8" }}
            >
              {showNouveau ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
          {/* Strength hint */}
          {nouveau.length > 0 && (
            <p style={{ marginTop: "8px", fontSize: "12px", color: nouveau.length >= 8 ? "#16a34a" : "#f59e0b", fontWeight: 500 }}>
              {nouveau.length < 8 ? `${8 - nouveau.length} caractère(s) supplémentaire(s) requis` : "Mot de passe valide ✓"}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "16px",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: loading ? "#7dd3fc" : "#2fb5fc",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading && <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />}
          {loading ? "Enregistrement…" : "Confirmer le nouveau mot de passe"}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}
