"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getMyProfile,
  getMyRendezVous,
  getMyNotifications,
  getUnreadCount,
  createRendezVous,
  type Patient,
  type RendezVous,
  type Notification,
} from "@/lib/api";
import {
  CalendarRange, FileText, Bell, User, Activity,
  ChevronRight, Clock, CheckCircle, XCircle, AlertCircle
} from "lucide-react";

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  PLANIFIE:  { color: "#2563eb", bg: "#eff6ff", label: "Planifié" },
  CONFIRME:  { color: "#16a34a", bg: "#f0fdf4", label: "Confirmé" },
  ANNULE:    { color: "#dc2626", bg: "#fef2f2", label: "Annulé" },
  TERMINE:   { color: "#64748b", bg: "#f1f5f9", label: "Terminé" },
};

const NOTIF_COLORS: Record<string, string> = {
  RDV_PLANIFIE:    "#2563eb",
  RDV_CONFIRME:    "#16a34a",
  RDV_ANNULE:      "#dc2626",
  ALERTE_MEDICALE: "#f59e0b",
  RAPPEL:          "#8b5cf6",
  SYSTEME:         "#64748b",
};

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PatientHomePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Patient | null>(null);
  const [rdvs, setRdvs] = useState<RendezVous[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [pRes, rRes, nRes, uRes] = await Promise.allSettled([
        getMyProfile(),
        getMyRendezVous(0, 5),
        getMyNotifications(0, 5),
        getUnreadCount(),
      ]);
      if (pRes.status === "fulfilled") setProfile(pRes.value);
      if (rRes.status === "fulfilled") setRdvs(rRes.value.content ?? []);
      if (nRes.status === "fulfilled") setNotifs(nRes.value.content ?? []);
      if (uRes.status === "fulfilled") setUnread(uRes.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const processPending = async () => {
      const pendingStr = localStorage.getItem("pending_rendezvous");
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          localStorage.removeItem("pending_rendezvous");
          const profileRes = await getMyProfile();
          await createRendezVous({
            patientId: profileRes.id,
            medecinId: pending.doctorId,
            dateHeure: pending.dateTime,
            motif: "Consultation"
          });
          alert("Votre rendez-vous a été réservé avec succès !");
        } catch (err) {
          console.error("Failed to book pending rendezvous", err);
          alert("Erreur lors de la réservation du rendez-vous.");
        }
      }
      load();
    };
    processPending();
  }, [load]);

  const upcoming = rdvs.filter(r => r.statut !== "ANNULE" && r.statut !== "TERMINE" && new Date(r.dateHeure) >= new Date());

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: 48, height: 48, border: "4px solid #e2e8f0", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0" }}>
      {/* Welcome banner */}
      <div style={{ background: "linear-gradient(135deg, var(--primary) 0%, #0369a1 100%)", borderRadius: 16, padding: "32px 40px", marginBottom: 32, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>Bienvenue,</p>
          <h2 style={{ margin: "4px 0 8px", fontSize: 28, fontWeight: 700 }}>
            {profile ? `${profile.prenom} ${profile.nom}` : (user?.email?.split("@")[0] ?? "Patient")}
          </h2>
          {profile?.groupeSanguin && (
            <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
              Groupe sanguin : {profile.groupeSanguin}
            </span>
          )}
        </div>
        <div style={{ opacity: 0.2 }}>
          <User size={80} />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { label: "Prochains rendez-vous", value: upcoming.length, icon: CalendarRange, color: "#2563eb", bg: "#eff6ff", href: "/dashboard/patient/appointments" },
          { label: "Notifications non lues", value: unread, icon: Bell, color: "#f59e0b", bg: "#fffbeb", href: "/dashboard/patient/notifications" },
          { label: "Consultations passées", value: rdvs.filter(r => r.statut === "TERMINE").length, icon: FileText, color: "#16a34a", bg: "#f0fdf4", href: "/dashboard/patient/medical" },
        ].map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 20, transition: "transform .15s", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={24} color={color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{label}</p>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#0f172a" }}>{value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Upcoming RDVs */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Prochains rendez-vous</h3>
            <Link href="/dashboard/patient/appointments" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          {rdvs.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Aucun rendez-vous</p>
          ) : (
            rdvs.slice(0, 4).map(rdv => {
              const st = STATUS_STYLE[rdv.statut] ?? STATUS_STYLE.PLANIFIE;
              return (
                <div key={rdv.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CalendarRange size={18} color="#2563eb" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                      Dr. {rdv.medecinPrenom} {rdv.medecinNom}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} /> {fmtDateTime(rdv.dateHeure)}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, backgroundColor: st.bg, color: st.color, whiteSpace: "nowrap" }}>
                    {st.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Recent notifications */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Notifications récentes</h3>
            <Link href="/dashboard/patient/notifications" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          {notifs.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Aucune notification</p>
          ) : (
            notifs.map(n => (
              <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: "1px solid #f1f5f9", opacity: n.lu ? 0.6 : 1 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: n.lu ? "#cbd5e1" : NOTIF_COLORS[n.type] ?? "#64748b", marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: n.lu ? 400 : 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.titre}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{fmtDate(n.dateCreation)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginTop: 24 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Actions rapides</h3>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Prendre un rendez-vous", href: "/dashboard/patient/appointments", icon: CalendarRange, color: "#2563eb", bg: "#eff6ff" },
            { label: "Mon suivi médical", href: "/dashboard/patient/medical", icon: Activity, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Mes notifications", href: "/dashboard/patient/notifications", icon: Bell, color: "#f59e0b", bg: "#fffbeb" },
          ].map(({ label, href, icon: Icon, color, bg }) => (
            <Link key={label} href={href} style={{ flex: 1, textDecoration: "none" }}>
              <div style={{ border: "2px solid #f1f5f9", borderRadius: 12, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, cursor: "pointer", transition: "border-color .15s, background .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#f1f5f9"; e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={28} color={color} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", textAlign: "center" }}>{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
