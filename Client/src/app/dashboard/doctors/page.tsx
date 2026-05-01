"use client";
import React, { useState } from 'react';
import { 
  FileText, ClipboardList, PenTool, CheckCircle, 
  History, CalendarDays, Search, PlusCircle, User, Activity
} from 'lucide-react';

export default function DoctorWorkspacePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const recentConsultations = [
    { patient: 'Annette Black', date: 'Aujourd\'hui, 10:30', motif: 'Suivi HyperTension', status: 'En Rédaction', bg: '#fef3c7', color: '#d97706' },
    { patient: 'Savannah Nguyen', date: 'Hier, 14:00', motif: 'Consultation dermatologique', status: 'Validé', bg: '#dcfce7', color: '#16a34a' },
    { patient: 'Ronald Richards', date: '04 Avr 2026', motif: 'Check-up Annuel', status: 'Validé', bg: '#dcfce7', color: '#16a34a' },
  ];

  const plannedCare = [
    { time: '11:30 AM', task: 'Validation IRM', patient: 'Bessie Cooper', type: 'Acte Médical' },
    { time: '02:00 PM', task: 'Planification traitement diabète', patient: 'Eleanor Pena', type: 'Soins' },
    { time: '04:30 PM', task: 'Renouvellement Ordonnance', patient: 'Devon Lane', type: 'Prescription' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header & Global Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Espace Médecin</h2>
           <p style={{ color: '#64748b', fontSize: '14px' }}>Gérez vos consultations, rédigez vos diagnostics et validez les actes médicaux.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
           <PlusCircle size={18} /> Créer une Consultation
        </button>
      </div>

      {/* Quick Access Modules (Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
         {[
           { title: 'Dossiers Médicaux', desc: 'Consulter & Historiques', icon: History, color: '#3b82f6', bg: '#eff6ff' },
           { title: 'Diagnostics', desc: 'Rédaction en cours', icon: PenTool, color: '#8b5cf6', bg: '#f5f3ff' },
           { title: 'Actes Médicaux', desc: 'Validation requise (3)', icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
           { title: 'Planification', desc: 'Soins nécessaires', icon: CalendarDays, color: '#f59e0b', bg: '#fffbeb' }
         ].map((module, i) => (
           <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', border: '1px solid #f8fafc', transition: 'transform 0.2s' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: module.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <module.icon size={24} color={module.color} />
             </div>
             <div>
               <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{module.title}</h3>
               <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{module.desc}</p>
             </div>
           </div>
         ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
         
         {/* LEFT COLUMN: Consultations & Diagnostics */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
           <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Consultations & Diagnostics Récents</h3>
                 <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="text" placeholder="Rechercher un patient..." style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {recentConsultations.map((cons, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} color="#94a3b8" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px', marginBottom: '2px' }}>{cons.patient}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{cons.motif} • <span style={{ color: '#94a3b8' }}>{cons.date}</span></div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ backgroundColor: cons.bg, color: cons.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{cons.status}</span>
                        <button style={{ background: '#f8fafc', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#3b82f6' }}>
                          <PenTool size={16} />
                        </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         </div>

         {/* RIGHT COLUMN: Planification & Actes */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
           <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Planification des Soins</h3>
                 <button style={{ color: '#3b82f6', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Voir tout</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                 {plannedCare.map((care, i) => (
                   <div key={i} style={{ display: 'flex', gap: '16px' }}>
                     <div style={{ width: '60px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>{care.time}</div>
                     <div style={{ flex: 1, borderLeft: '2px solid #3b82f6', paddingLeft: '16px', position: 'relative' }}>
                       <div style={{ position: 'absolute', left: '-6px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', border: '2px solid white' }}></div>
                       <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{care.task}</div>
                       <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                         <User size={12} /> {care.patient}
                       </div>
                       <div style={{ marginTop: '8px', display: 'inline-block', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
                         {care.type}
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
           </div>
         </div>

      </div>

      {/* Create Consultation Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '600px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Nouvelle Consultation</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Remplissez les détails pour créer une nouvelle fiche de consultation.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input type="text" placeholder="Nom du patient" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
                <input type="date" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#64748b' }} />
              </div>
              <input type="text" placeholder="Motif de consultation" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <textarea placeholder="Notes et observations initiales..." rows={4} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', resize: 'none' }}></textarea>
              <select style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#64748b', background: 'white' }}>
                <option>Sélectionnez un statut</option>
                <option>En Rédaction</option>
                <option>Terminé</option>
                <option>Validé</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
              <button onClick={() => { alert('Consultation créée avec succès!'); setIsModalOpen(false); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
