"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Printer, User, Stethoscope, Calendar, FileText,
  ClipboardList, DollarSign, AlertCircle, CheckCircle, Activity
} from 'lucide-react';
import { downloadOrdonnancePdf, getConsultationReport, Consultation } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ color: '#3b82f6' }}>{icon}</span>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value?: string | number | null; wide?: boolean }) {
  return (
    <div style={{ display: wide ? 'block' : 'flex', flexDirection: wide ? 'column' : undefined, gap: wide ? '6px' : undefined, alignItems: wide ? undefined : 'flex-start', marginBottom: '16px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '140px' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1', fontWeight: value ? 500 : 400, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value != null && value !== '' ? String(value) : '—'}
      </span>
    </div>
  );
}

// ─── role badge colors ────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  MEDECIN: 'Médecin',
  SECRETAIRE: 'Secrétaire',
  PATIENT: 'Patient',
};

// ─── main component ───────────────────────────────────────────────────────────

export default function ConsultationReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = Number(params.id);
  const validId = !isNaN(id) && id > 0;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !validId) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setIsLoading(true);
      getConsultationReport(id)
        .then(data => {
          if (!cancelled) {
            setConsultation(data);
            setError(null);
          }
        })
        .catch(err => { if (!cancelled) setError(err.message || 'Impossible de charger la consultation.'); })
        .finally(() => { if (!cancelled) setIsLoading(false); });
    });
    return () => { cancelled = true; };
  }, [id, user, validId]);

  if (!user) return null;

  const role = user.role;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <Activity size={40} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: '15px' }}>Chargement du rapport…</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Accès refusé ou consultation introuvable</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
        <button onClick={() => router.back()}
          style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
          Retour
        </button>
      </div>
    );
  }

  if (!consultation) return null;

  const canSeeClinical = role === 'ADMIN' || role === 'MEDECIN';
  const canSeePatientSummary = role === 'PATIENT';
  const isPatientRole = role === 'PATIENT';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <button onClick={() => router.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', marginBottom: '12px', padding: 0 }}>
            <ArrowLeft size={16} /> Retour
          </button>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Rapport de Consultation <span style={{ color: '#3b82f6' }}>#{consultation.id}</span>
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
            {fmtDate(consultation.dateVisite)} à {fmtTime(consultation.dateVisite)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
            background: '#f0f9ff', color: '#3b82f6'
          }}>
            {ROLE_LABELS[role] || role}
          </span>
          <button
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={15} /> Imprimer
          </button>
        </div>
      </div>

      {/* Patient info */}
      <Section icon={<User size={20} />} title="Informations Patient">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <Field label="Nom complet" value={`${consultation.patientPrenom} ${consultation.patientNom}`} />
          {!isPatientRole && <Field label="CIN" value={consultation.patientCin} />}
          <Field label="ID Patient" value={`#${consultation.patientId}`} />
        </div>
      </Section>

      {/* Médecin info */}
      <Section icon={<Stethoscope size={20} />} title="Médecin traitant">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <Field label="Nom complet" value={`Dr. ${consultation.medecinPrenom} ${consultation.medecinNom}`} />
          <Field label="Spécialité" value={consultation.medecinSpecialite} />
          <Field label="ID Médecin" value={`#${consultation.medecinId}`} />
        </div>
      </Section>

      {/* Motif */}
      <Section icon={<Calendar size={20} />} title="Motif de consultation">
        <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: 0 }}>
          {consultation.motif || '—'}
        </p>
      </Section>

      {consultation.ordonnance ? (
        <div style={{ background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0', padding: '22px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '16px', fontWeight: 800, margin: 0 }}>
                <FileText size={18} /> Ordonnance associee
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800 }}>
                  {consultation.ordonnance.statut}
                </span>
              </h3>
              <p style={{ color: '#166534', margin: '8px 0 0', fontSize: '13px' }}>
                {consultation.ordonnance.medicaments?.length ?? 0} medicament(s) prescrit(s) - Duree : {consultation.ordonnance.dureeTraitement}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/dashboard/ordonnances/${consultation.ordonnance.id}`} style={{ color: '#166534', fontSize: '13px', fontWeight: 800, textDecoration: 'none', padding: '8px 10px' }}>
                Voir l&apos;ordonnance
              </Link>
              <button
                onClick={() => consultation.ordonnance && downloadOrdonnancePdf(consultation.ordonnance.id, consultation.patientNom)}
                style={{ background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '9px', fontWeight: 800, cursor: 'pointer' }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      ) : role === 'MEDECIN' ? (
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontWeight: 800, color: '#334155', margin: 0 }}>Aucune ordonnance</p>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '5px 0 0' }}>Aucune ordonnance n&apos;a ete creee pour cette consultation.</p>
          </div>
          <Link href={`/dashboard/ordonnances/nouvelle?consultationId=${consultation.id}`} style={{ background: '#2563eb', color: 'white', padding: '10px 14px', borderRadius: '10px', textDecoration: 'none', fontWeight: 800 }}>
            Creer une ordonnance
          </Link>
        </div>
      ) : null}

      {/* Clinical sections — ADMIN / MEDECIN only */}
      {canSeeClinical && (
        <>
          <Section icon={<FileText size={20} />} title="Diagnostic clinique">
            {consultation.diagnostic ? (
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.75', margin: 0, whiteSpace: 'pre-wrap' }}>
                {consultation.diagnostic}
              </p>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>Aucun diagnostic enregistré.</p>
            )}
          </Section>

          <Section icon={<ClipboardList size={20} />} title="Notes médicales">
            {consultation.notes ? (
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.75', margin: 0, whiteSpace: 'pre-wrap' }}>
                {consultation.notes}
              </p>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>Aucune note.</p>
            )}
          </Section>
        </>
      )}

      {/* Patient-friendly summary — PATIENT role only */}
      {canSeePatientSummary && (
        <Section icon={<CheckCircle size={20} />} title="Résumé médical">
          {consultation.diagnosticPatient ? (
            <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #3b82f6' }}>
              <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.75', margin: 0, whiteSpace: 'pre-wrap' }}>
                {consultation.diagnosticPatient}
              </p>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>
              Le médecin n&apos;a pas encore renseigné le résumé patient.
            </p>
          )}
        </Section>
      )}

      {/* Actes réalisés — all roles */}
      <Section icon={<ClipboardList size={20} />} title="Actes réalisés">
        {consultation.actesRealises ? (
          <p style={{ fontSize: '15px', color: '#334155', lineHeight: '1.75', margin: 0, whiteSpace: 'pre-wrap' }}>
            {consultation.actesRealises}
          </p>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>Aucun acte enregistré.</p>
        )}
      </Section>

      {/* Montant — all roles */}
      <Section icon={<DollarSign size={20} />} title="Facturation">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '16px 24px', display: 'inline-block' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
              Montant total
            </p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', margin: 0 }}>
              {consultation.montantTotal != null
                ? `${Number(consultation.montantTotal).toFixed(2)} MAD`
                : '—'}
            </p>
          </div>
          {consultation.rendezVousId && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 24px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
                Rendez-vous lié
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#64748b', margin: 0 }}>
                #{consultation.rendezVousId}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, header, aside, button { display: none !important; }
          body { background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
