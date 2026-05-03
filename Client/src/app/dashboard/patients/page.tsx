"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { getPatients, createPatient, updatePatient, deletePatient, Patient, PatientRequestDto } from '@/lib/api';

export default function PatientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialForm: PatientRequestDto = { nom: '', prenom: '', cin: '', dateNaissance: '', telephone: '', adresse: '', email: '', groupeSanguin: '', allergies: '', antecedents: '' };
  const [formData, setFormData] = useState<PatientRequestDto>(initialForm);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const res = await getPatients(0, 100); // Fetch up to 100 for now, or implement pagination
      setPatients(res.content);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingId(patient.id);
    setFormData({
      nom: patient.nom,
      prenom: patient.prenom,
      cin: patient.cin,
      dateNaissance: patient.dateNaissance || '',
      telephone: patient.telephone || '',
      adresse: patient.adresse || '',
      email: patient.email || '',
      groupeSanguin: patient.groupeSanguin || '',
      allergies: patient.allergies || '',
      antecedents: patient.antecedents || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Etes-vous sûr de vouloir supprimer ce patient ?')) {
      try {
        await deletePatient(id);
        fetchPatients();
      } catch (err: any) {
        alert(err.message || "Erreur lors de la suppression");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId !== null) {
        await updatePatient(editingId, formData);
      } else {
        await createPatient(formData);
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'enregistrement");
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.prenom} ${p.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.cin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--secondary)' }}>Patient Management</h1>
        <button onClick={openAddModal} className="btn-primary" style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}>
          <Plus size={16} /> Add New Patient
        </button>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 16px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by Name or CIN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', width: '100%', outline: 'none', fontSize: '14px' }} 
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>CIN</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Phone</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Last Visit</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px' }}>#{patient.id.toString().padStart(4, '0')}</td>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--primary)' }}>{patient.prenom} {patient.nom}</td>
                  <td style={{ padding: '16px' }}>{patient.cin}</td>
                  <td style={{ padding: '16px' }}>{patient.telephone || '-'}</td>
                  <td style={{ padding: '16px' }}>{'-'}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: 600,
                      backgroundColor: '#20c26522',
                      color: 'var(--success)'
                    }}>
                      Active
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                      <button onClick={() => setViewingPatient(patient)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} title="View Record"><Eye size={18} /></button>
                      <button onClick={() => openEditModal(patient)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} title="Edit"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(patient.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!isLoading && filteredPatients.length === 0 && !error && (
           <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucun patient trouvé.</div>
        )}
      </div>

      {/* Register / Edit Patient Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              {editingId ? 'Modifier Patient' : 'Nouveau Patient'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              {editingId ? 'Modifiez les informations du patient ci-dessous.' : 'Entrez les informations du nouveau patient.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} type="text" placeholder="Nom" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
                <input value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} type="text" placeholder="Prénom" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              </div>
              <input value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} type="text" placeholder="Numéro de CIN" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input value={formData.dateNaissance} onChange={e => setFormData({...formData, dateNaissance: e.target.value})} type="date" placeholder="Date de naissance" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#64748b' }} />
                <input value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} type="text" placeholder="Téléphone" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              </div>
              <input value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} type="text" placeholder="Adresse" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="Email" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
                <input value={formData.groupeSanguin} onChange={e => setFormData({...formData, groupeSanguin: e.target.value})} type="text" placeholder="Groupe Sanguin" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              </div>
              <input value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} type="text" placeholder="Allergies" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <input value={formData.antecedents} onChange={e => setFormData({...formData, antecedents: e.target.value})} type="text" placeholder="Antécédents médicaux" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
              <button onClick={handleSubmit} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                {editingId ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Information Modal */}
      {viewingPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              Dossier Patient: <span style={{ color: 'var(--primary)' }}>{viewingPatient.prenom} {viewingPatient.nom}</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Numéro CIN</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.cin || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Téléphone</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.telephone || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Date de Naissance</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.dateNaissance || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Dernière Visite</span><div style={{fontWeight: 600, fontSize: '15px'}}>{'-'}</div></div>
              <div style={{gridColumn: '1 / span 2'}}><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Adresse</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.adresse || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Email</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.email || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Groupe Sanguin</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.groupeSanguin || '-'}</div></div>
              <div style={{gridColumn: '1 / span 2'}}><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Allergies</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.allergies || '-'}</div></div>
              <div style={{gridColumn: '1 / span 2'}}><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Antécédents Médicaux</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.antecedents || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Statut</span>
                <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, backgroundColor: '#20c26522', color: 'var(--success)' }}>
                  Active
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingPatient(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', color: '#0f172a', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
