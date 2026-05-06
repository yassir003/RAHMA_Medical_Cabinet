"use client";
import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Activity, Filter, Search, Plus } from 'lucide-react';
import { getDossiers, createDossier, updateDossierStatut, getPatients, getConsultations, getMutuelles, DossierRemboursement, DossierRemboursementRequestDto, Patient, Consultation, Mutuelle } from '@/lib/api';

export default function MedicalReportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reports, setReports] = useState<DossierRemboursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // For the modal
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [mutuelles, setMutuelles] = useState<Mutuelle[]>([]);
  
  const [formData, setFormData] = useState<DossierRemboursementRequestDto>({
    patientId: 0,
    mutuelleId: 0,
    consultationId: 0,
    documentJustificatif: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dossiersRes, patientsRes, mutuellesRes, consultationsRes] = await Promise.all([
        getDossiers(0, 100),
        getPatients(0, 100),
        getMutuelles(0, 100),
        getConsultations(0, 100)
      ]);
      setReports(dossiersRes.content);
      setPatients(patientsRes.content);
      setMutuelles(mutuellesRes.content);
      setConsultations(consultationsRes.content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async () => {
    if (!formData.patientId || !formData.mutuelleId || !formData.consultationId) {
      alert("Please select patient, mutuelle, and consultation");
      return;
    }
    try {
      await createDossier(formData);
      setIsModalOpen(false);
      setFormData({ patientId: 0, mutuelleId: 0, consultationId: 0, documentJustificatif: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' };
      case 'ENVOYE': return { color: '#3b82f6', bg: '#dbeafe', label: 'Sent' };
      case 'ACCEPTE': return { color: '#22c55e', bg: '#dcfce7', label: 'Accepted' };
      case 'REJETE': return { color: '#ef4444', bg: '#fee2e2', label: 'Rejected' };
      case 'REMBOURSE': return { color: '#10b981', bg: '#d1fae5', label: 'Reimbursed' };
      default: return { color: '#64748b', bg: '#f1f5f9', label: statut };
    }
  };

  const filteredReports = reports.filter(r => 
    `${r.patientPrenom} ${r.patientNom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toString().includes(searchQuery)
  );

  const pendingCount = reports.filter(r => r.statut === 'EN_ATTENTE').length;
  const reimbursedCount = reports.filter(r => r.statut === 'REMBOURSE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Top Banner / Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Medical Reports (Dossiers)</h2>
           <p style={{ color: '#64748b', fontSize: '14px' }}>Access and manage patient reimbursement files and clinical documents.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
           <FileText size={18} /> Upload New Report
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { label: 'Total Reports', value: reports.length.toString(), color: '#3b82f6' },
            { label: 'Pending Review', value: pendingCount.toString(), color: '#f59e0b' },
            { label: 'Reimbursed', value: reimbursedCount.toString(), color: '#22c55e' }
          ].map((metric, i) => (
             <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
               <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>{metric.label}</div>
               <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                 <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{metric.value}</div>
                 <Activity size={24} color={metric.color} opacity={0.6} />
               </div>
             </div>
          ))}
      </div>

      {/* Main Reports Table Area */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
           <div style={{ display: 'flex', gap: '16px' }}>
             <div style={{ position: 'relative', width: '280px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient or ID..." 
                  style={{ width: '100%', padding: '10px 16px', paddingLeft: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
                />
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
             </div>
           </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading reports...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Report ID</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Patient Name</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Date</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Organisme Mutuelle</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Consultation ID</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Status</th>
                <th style={{ paddingBottom: '20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((rep, i) => {
                const statusStyle = getStatusColor(rep.statut);
                return (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '20px 0', fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>#REP-{rep.id.toString().padStart(3, '0')}</td>
                  <td style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0', backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(rep.patientPrenom + ' ' + rep.patientNom)}&background=f1f5f9&color=64748b')`, backgroundSize: 'cover' }}></div>
                    {rep.patientPrenom} {rep.patientNom}
                  </td>
                  <td style={{ padding: '20px 0', fontSize: '13px', color: '#64748b' }}>
                    {rep.dateCreation ? new Date(rep.dateCreation).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '20px 0', fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{rep.mutuelleOrganisme || '-'}</td>
                  <td style={{ padding: '20px 0', fontSize: '13px', color: '#64748b' }}>#{rep.consultationId}</td>
                  <td style={{ padding: '20px 0' }}>
                    <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td style={{ padding: '20px 0', textAlign: 'right' }}>
                     <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button style={{ background: '#f8fafc', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}>
                          <Eye size={16} />
                        </button>
                        <button style={{ background: '#f0f9ff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6' }}>
                          <Download size={16} />
                        </button>
                     </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
        
        {!isLoading && filteredReports.length === 0 && !error && (
           <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No medical reports found.</div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Upload Medical Report</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Select patient, mutuelle, and consultation details.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <select 
                value={formData.patientId} 
                onChange={(e) => setFormData({...formData, patientId: Number(e.target.value)})}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value={0}>Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom} (CIN: {p.cin})</option>
                ))}
              </select>

              <select 
                value={formData.mutuelleId} 
                onChange={(e) => setFormData({...formData, mutuelleId: Number(e.target.value)})}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value={0}>Select Mutuelle</option>
                {mutuelles.map(m => (
                  <option key={m.id} value={m.id}>{m.organismeNom ?? m.type} ({m.type})</option>
                ))}
              </select>

              <select 
                value={formData.consultationId} 
                onChange={(e) => setFormData({...formData, consultationId: Number(e.target.value)})}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: 'white' }}
              >
                <option value={0}>Select Consultation</option>
                {consultations.map(c => (
                  <option key={c.id} value={c.id}>#{c.id} - {c.dateVisite ? new Date(c.dateVisite).toLocaleDateString() : 'No date'}</option>
                ))}
              </select>

              <input 
                type="text" 
                placeholder="Document description / Filename"
                value={formData.documentJustificatif || ''}
                onChange={(e) => setFormData({...formData, documentJustificatif: e.target.value})}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={handleUpload} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
