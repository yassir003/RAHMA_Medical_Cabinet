"use client";
import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';

export default function PatientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingPatient, setViewingPatient] = useState<any>(null);
  
  const [patients, setPatients] = useState([
    { id: 1, nom: 'Smith', prenom: 'Alice', cin: 'AB123456', dob: '1990-05-15', phone: '+212 600-000000', address: '123 Main St', lastVisit: '2026-04-01', status: 'Active' },
    { id: 2, nom: 'Johnson', prenom: 'Bob', cin: 'CD987654', dob: '1985-08-22', phone: '+212 611-111111', address: '456 Elm St', lastVisit: '2026-03-25', status: 'Active' },
    { id: 3, nom: 'Davis', prenom: 'Charlie', cin: 'EF567123', dob: '1978-11-30', phone: '+212 622-222222', address: '789 Oak Ave', lastVisit: '2026-02-14', status: 'Inactive' },
  ]);

  const initialForm = { nom: '', prenom: '', cin: '', dob: '', phone: '', address: '' };
  const [formData, setFormData] = useState(initialForm);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (patient: any) => {
    setEditingId(patient.id);
    setFormData({
      nom: patient.nom,
      prenom: patient.prenom,
      cin: patient.cin,
      dob: patient.dob,
      phone: patient.phone,
      address: patient.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Etes-vous sûr de vouloir supprimer ce patient ?')) {
      setPatients(patients.filter(p => p.id !== id));
    }
  };

  const handleSubmit = () => {
    if (editingId !== null) {
      // Update
      setPatients(patients.map(p => p.id === editingId ? { ...p, ...formData } : p));
    } else {
      // Add
      const newPatient = {
        id: Math.max(...patients.map(p => p.id), 0) + 1,
        ...formData,
        lastVisit: 'Nouveau',
        status: 'Active'
      };
      setPatients([...patients, newPatient]);
    }
    setIsModalOpen(false);
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
                <td style={{ padding: '16px' }}>{patient.phone}</td>
                <td style={{ padding: '16px' }}>{patient.lastVisit}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    backgroundColor: patient.status === 'Active' ? '#20c26522' : '#e2e8f0',
                    color: patient.status === 'Active' ? 'var(--success)' : 'var(--text-muted)'
                  }}>
                    {patient.status}
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
        
        {filteredPatients.length === 0 && (
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
                <input value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} type="date" placeholder="Date de naissance" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#64748b' }} />
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} type="text" placeholder="Téléphone" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              </div>
              <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} type="text" placeholder="Adresse" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
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
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Téléphone</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.phone || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Date de Naissance</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.dob || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Dernière Visite</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.lastVisit || '-'}</div></div>
              <div style={{gridColumn: '1 / span 2'}}><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Adresse</span><div style={{fontWeight: 600, fontSize: '15px'}}>{viewingPatient.address || '-'}</div></div>
              <div><span style={{color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px'}}>Statut</span>
                <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, backgroundColor: viewingPatient.status === 'Active' ? '#20c26522' : '#e2e8f0', color: viewingPatient.status === 'Active' ? 'var(--success)' : 'var(--text-muted)' }}>
                  {viewingPatient.status}
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
