"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Eye, Activity, Search, Plus, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getDossiers, createDossier, getPatients, getConsultations, getMutuelles,
  getConsultationsByMedecinMe,
  DossierRemboursement, DossierRemboursementRequestDto, Patient, Consultation, Mutuelle
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Dossiers de remboursement (ADMIN / SECRETAIRE)
// ─────────────────────────────────────────────────────────────────────────────
function DossierView() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reports, setReports] = useState<DossierRemboursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [mutuelles, setMutuelles] = useState<Mutuelle[]>([]);
  const [formData, setFormData] = useState<DossierRemboursementRequestDto>({
    patientId: 0, mutuelleId: 0, consultationId: 0, documentJustificatif: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const results = await Promise.allSettled([
        getDossiers(0, 100),
        getPatients(0, 100),
        getMutuelles(0, 100),
        getConsultations(0, 100),
      ]);
      if (results[0].status === 'fulfilled') setReports(results[0].value.content);
      if (results[1].status === 'fulfilled') setPatients(results[1].value.content);
      if (results[2].status === 'fulfilled') setMutuelles(results[2].value.content);
      if (results[3].status === 'fulfilled') setConsultations(results[3].value.content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async () => {
    if (!formData.patientId || !formData.mutuelleId || !formData.consultationId) {
      alert("Veuillez sélectionner un patient, une mutuelle et une consultation.");
      return;
    }
    try {
      await createDossier(formData);
      setIsModalOpen(false);
      setFormData({ patientId: 0, mutuelleId: 0, consultationId: 0, documentJustificatif: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création');
    }
  };

  const statusStyle = (statut: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      EN_ATTENTE: { color: '#f59e0b', bg: '#fef3c7', label: 'En attente' },
      ENVOYE:     { color: '#3b82f6', bg: '#dbeafe', label: 'Envoyé' },
      ACCEPTE:    { color: '#22c55e', bg: '#dcfce7', label: 'Accepté' },
      REJETE:     { color: '#ef4444', bg: '#fee2e2', label: 'Rejeté' },
      REMBOURSE:  { color: '#10b981', bg: '#d1fae5', label: 'Remboursé' },
    };
    return map[statut] ?? { color: '#64748b', bg: '#f1f5f9', label: statut };
  };

  const filtered = reports.filter(r =>
    `${r.patientPrenom} ${r.patientNom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toString().includes(searchQuery)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Dossiers de Remboursement
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Gérez les dossiers de remboursement des patients.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary"
          style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <Plus size={18} /> Nouveau dossier
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {[
          { label: 'Total dossiers', value: reports.length, color: '#3b82f6' },
          { label: 'En attente', value: reports.filter(r => r.statut === 'EN_ATTENTE').length, color: '#f59e0b' },
          { label: 'Remboursés', value: reports.filter(r => r.statut === 'REMBOURSE').length, color: '#22c55e' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{m.value}</div>
              <Activity size={24} color={m.color} opacity={0.6} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', width: '280px', marginBottom: '24px' }}>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher patient ou ID..."
            style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }} />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chargement…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>ID</th>
                <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Patient</th>
                <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Date</th>
                <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Mutuelle</th>
                <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Consultation</th>
                <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Statut</th>
                <th style={{ paddingBottom: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rep) => {
                const s = statusStyle(rep.statut);
                return (
                  <tr key={rep.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>
                      #REP-{rep.id.toString().padStart(3, '0')}
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                      {rep.patientPrenom} {rep.patientNom}
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: '#64748b' }}>
                      {rep.dateCreation ? new Date(rep.dateCreation).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: '#0f172a' }}>{rep.mutuelleOrganisme || '-'}</td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: '#64748b' }}>#{rep.consultationId}</td>
                    <td style={{ padding: '16px 0' }}>
                      <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <button
                        onClick={() => rep.consultationId && router.push(`/dashboard/reports/${rep.consultationId}`)}
                        style={{ background: '#f0f9ff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6' }}
                        title="Voir la consultation">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!isLoading && filtered.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Aucun dossier trouvé.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Nouveau dossier</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Sélectionnez les informations du dossier.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <select value={formData.patientId} onChange={e => setFormData({ ...formData, patientId: Number(e.target.value) })}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}>
                <option value={0}>Sélectionner un patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom} (CIN: {p.cin})</option>)}
              </select>
              <select value={formData.mutuelleId} onChange={e => setFormData({ ...formData, mutuelleId: Number(e.target.value) })}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}>
                <option value={0}>Sélectionner une mutuelle</option>
                {mutuelles.map(m => <option key={m.id} value={m.id}>{m.organismeNom ?? m.type} ({m.type})</option>)}
              </select>
              <select value={formData.consultationId} onChange={e => setFormData({ ...formData, consultationId: Number(e.target.value) })}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}>
                <option value={0}>Sélectionner une consultation</option>
                {consultations.map(c => <option key={c.id} value={c.id}>#{c.id} — {c.dateVisite ? new Date(c.dateVisite).toLocaleDateString('fr-FR') : 'Sans date'}</option>)}
              </select>
              <input type="text" placeholder="Description / Nom du document"
                value={formData.documentJustificatif || ''}
                onChange={e => setFormData({ ...formData, documentJustificatif: e.target.value })}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsModalOpen(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                Annuler
              </button>
              <button onClick={handleUpload}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Mes consultations (MEDECIN)
// ─────────────────────────────────────────────────────────────────────────────
function MedecinConsultationsView() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const SIZE = 10;

  useEffect(() => {
    setIsLoading(true);
    getConsultationsByMedecinMe(page, SIZE)
      .then(res => {
        setConsultations(res.content);
        setTotalPages(res.totalPages);
        setError(null);
      })
      .catch(err => setError(err.message || 'Erreur de chargement'))
      .finally(() => setIsLoading(false));
  }, [page]);

  const filtered = consultations.filter(c => {
    const q = search.toLowerCase();
    return (
      `${c.patientPrenom} ${c.patientNom}`.toLowerCase().includes(q) ||
      (c.motif || '').toLowerCase().includes(q)
    );
  });

  const statusColor = (idx: number) => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[idx % colors.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Mes Consultations
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Historique de toutes vos consultations médicales.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0f9ff', borderRadius: '12px', padding: '10px 16px' }}>
          <Stethoscope size={18} color="#3b82f6" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>Médecin</span>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', width: '300px', marginBottom: '24px' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher patient ou motif..."
            style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }} />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Chargement…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <FileText size={48} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b', fontSize: '15px' }}>Aucune consultation trouvée.</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Date</th>
                  <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Patient</th>
                  <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>CIN</th>
                  <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'left' }}>Motif</th>
                  <th style={{ paddingBottom: '16px', fontWeight: 500, textAlign: 'right' }}>Montant</th>
                  <th style={{ paddingBottom: '16px', textAlign: 'right' }}>Rapport</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: '#64748b' }}>
                      {new Date(c.dateVisite).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '16px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: statusColor(i), opacity: 0.15,
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                          {c.patientPrenom} {c.patientNom}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: '#64748b' }}>{c.patientCin || '-'}</td>
                    <td style={{ padding: '16px 0', fontSize: '13px', color: '#475569', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.motif || '-'}
                    </td>
                    <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                      {c.montantTotal != null ? `${c.montantTotal.toFixed(2)} MAD` : '-'}
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <button
                        onClick={() => c.id && router.push(`/dashboard/reports/${c.id}`)}
                        style={{ background: '#f0f9ff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#3b82f6', fontWeight: 600, fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} /> Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === 0 ? '#f8fafc' : 'white', cursor: page === 0 ? 'default' : 'pointer', color: '#475569' }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Page {page + 1} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page >= totalPages - 1 ? '#f8fafc' : 'white', cursor: page >= totalPages - 1 ? 'default' : 'pointer', color: '#475569' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root page — dispatches based on role
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'MEDECIN') return <MedecinConsultationsView />;
  return <DossierView />;
}
