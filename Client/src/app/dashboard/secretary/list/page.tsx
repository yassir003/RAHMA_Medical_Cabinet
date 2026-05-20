"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, PlusCircle, Users, Activity, Mail, Phone, Edit, Trash2, Building, Eye, X } from 'lucide-react';
import { getSecretaires, deleteSecretaire, updateSecretaire, Secretaire } from '@/lib/api';

export default function SecretaryListPage() {
  const router = useRouter();
  const [secretaries, setSecretaries] = useState<Secretaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewSec, setViewSec] = useState<Secretaire | null>(null);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSecretaries = async () => {
    try {
      setIsLoading(true);
      const res = await getSecretaires(0, 100);
      setSecretaries(res.content);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecretaries();
  }, []);

  const handleDelete = async (id: number) => {
    if(confirm('Voulez-vous vraiment supprimer ce secrétaire ?')) {
      try {
        await deleteSecretaire(id);
        fetchSecretaries();
      } catch (err: any) {
        alert(err.message || "Erreur lors de la suppression");
      }
    }
  };

  const openEdit = (sec: Secretaire) => {
    setEditId(sec.id);
    setNom(sec.nom || '');
    setPrenom(sec.prenom || '');
    setEmail(sec.email || '');
    setTelephone(sec.telephone || '');
    setIsModalOpen(true);
  };

  const openView = (sec: Secretaire) => {
    setViewSec(sec);
    setIsViewModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!nom || !prenom || !email) {
      alert("Le nom, prénom et email sont obligatoires.");
      return;
    }
    if (editId === null) return;

    try {
      setIsUpdating(true);
      await updateSecretaire(editId, {
        nom,
        prenom,
        email,
        telephone,
      });
      setIsModalOpen(false);
      fetchSecretaries();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header & Global Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Liste des Secrétaires</h2>
           <p style={{ color: '#64748b', fontSize: '14px' }}>Gérez les accès et les profils de votre équipe de secrétariat.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
           <button onClick={() => router.push('/dashboard/secretary/create')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
             <PlusCircle size={18} /> Nouveau Secrétaire
           </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Rechercher par nom..." style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
           </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>Chargement...</div>
        ) : secretaries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Users size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Aucun secrétaire</h3>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>Vous n'avez pas encore ajouté de secrétaire.</p>
            <button onClick={() => router.push('/dashboard/secretary/create')} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Créer le premier profil
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {secretaries.map((sec, i) => (
              <div key={sec.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid #f1f5f9', borderRadius: '12px', transition: 'all 0.2s', background: '#f8fafc' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                   <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.2)' }}>
                     {sec.nom ? sec.nom.charAt(0).toUpperCase() : 'S'}
                   </div>
                   <div>
                     <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>{sec.prenom} {sec.nom}</div>
                     <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                       <Building size={14} /> Assigné: {sec.assignedDoctor || 'Tous les médecins'}
                     </div>
                   </div>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '32px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                         <Mail size={16} /> {sec.email || 'N/A'}
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                         <Phone size={16} /> {sec.telephone || 'N/A'}
                     </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <button onClick={() => openView(sec)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#10b981', transition: 'all 0.2s' }} title="Voir informations">
                     <Eye size={18} />
                   </button>
                   <button onClick={() => openEdit(sec)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#3b82f6', transition: 'all 0.2s' }} title="Modifier">
                     <Edit size={18} />
                   </button>
                   <button onClick={() => handleDelete(sec.id)} style={{ background: 'white', border: '1px solid #fee2e2', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s' }} title="Supprimer">
                     <Trash2 size={18} />
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Modifier Secrétaire</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Mettez à jour les informations du profil.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <input type="text" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
                <input type="text" placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              </div>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <input type="text" placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
              <button onClick={handleUpdate} disabled={isUpdating} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px', opacity: isUpdating ? 0.7 : 1 }}>
                {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewSec && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Informations du Secrétaire</h3>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px' }}>
                    {viewSec.nom ? viewSec.nom.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{viewSec.prenom} {viewSec.nom}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>ID: {viewSec.id}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} color="#3b82f6" />
                    {viewSec.email || 'Non spécifié'}
                  </div>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>Téléphone</div>
                  <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="#10b981" />
                    {viewSec.telephone || 'Non spécifié'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button onClick={() => setIsViewModalOpen(false)} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
