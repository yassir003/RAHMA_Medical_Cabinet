"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, CalendarClock, PhoneOutgoing, Building, 
  MessageSquare, FileText, CheckCircle2, ChevronRight, PlusCircle, Search
} from 'lucide-react';

export default function SecretaryWorkspacePage() {
  const router = useRouter();
  
  const todayAppointments = [
    { time: '08:30', patient: 'Annette Black', type: 'Consultation', doctor: 'Dr. Pollack', status: 'En Attente', bg: '#fef3c7', color: '#d97706' },
    { time: '09:00', patient: 'Savannah Nguyen', type: 'Examen', doctor: 'Dr. Watren', status: 'En Cours', bg: '#dbeafe', color: '#3b82f6' },
    { time: '10:30', patient: 'Ronald Richards', type: 'Contrôle', doctor: 'Dr. Durham', status: 'Confirmé', bg: '#dcfce7', color: '#16a34a' },
    { time: '11:00', patient: 'Bessie Cooper', type: 'Urgence', doctor: 'Dr. Pollack', status: 'Annulé', bg: '#f1f5f9', color: '#94a3b8' },
  ];

  const pendingMutuals = [
    { patient: 'Eleanor Pena', organism: 'CNOPS', amount: '450 MAD', date: '04 Avr 2026', status: 'Dossier Rejeté (Manque PJ)', alert: true },
    { patient: 'Devon Lane', organism: 'CNSS', amount: '200 MAD', date: '05 Avr 2026', status: 'En attente de signature', alert: false },
    { patient: 'Guy Hawkins', organism: 'Saham Assurance', amount: '750 MAD', date: '05 Avr 2026', status: 'À télétransmettre', alert: false },
  ];

  const messages = [
    { patient: 'Dianne Russell', preview: 'Bonjour, est-il possible de décaler mon...', time: '10:15' },
    { patient: 'Jacob Jones', preview: 'J\'ai reçu les résultats du labo, je les...', time: '09:40' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header & Global Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Espace Secrétariat</h2>
           <p style={{ color: '#64748b', fontSize: '14px' }}>Accueil, planification, facturation et gestion administrative du cabinet.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
           <button style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 500, cursor: 'pointer' }}>
             <Search size={18} /> Trouver Un Dossier
           </button>
           <button onClick={() => router.push('/dashboard/secretary/create')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
             <PlusCircle size={18} /> Nouveau Secrétaire
           </button>
        </div>
      </div>

      {/* Quick Access Modules (Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
         {[
           { title: 'RDV du Jour', desc: '12 confirmés, 2 en attente', icon: CalendarClock, color: '#3b82f6', bg: '#eff6ff' },
           { title: 'Dossiers Mutuelle', desc: '5 à traiter, 1 rejeté', icon: Building, color: '#8b5cf6', bg: '#f5f3ff' },
           { title: 'Admissions', desc: 'Saisir consultations', icon: Users, color: '#10b981', bg: '#ecfdf5' },
           { title: 'Appels & Messages', desc: '3 appels manqués, 2 msg', icon: PhoneOutgoing, color: '#f59e0b', bg: '#fffbeb' }
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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
         
         {/* LEFT COLUMN: Planning du Jour (Rendez-vous) */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
           <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Planning du Jour</h3>
                 <button style={{ color: '#3b82f6', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Gérer le calendrier</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {todayAppointments.map((apt, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'stretch', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ width: '80px', backgroundColor: 'white', borderRight: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{apt.time.split(':')[0]}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{apt.time.split(':')[1]}</span>
                      </div>
                      <div style={{ flex: 1, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{apt.patient}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{apt.type}</span> • <span>{apt.doctor}</span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ backgroundColor: apt.bg, color: apt.color, padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{apt.status}</span>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>
                               Dossier <ChevronRight size={14} />
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         </div>

         {/* RIGHT COLUMN: Mutuelles & Messages */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
           
           {/* Suivi des Mutuelles */}
           <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Alertes Mutuelles</h3>
                 <button style={{ color: '#3b82f6', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Tous les dossiers</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {pendingMutuals.map((mut, i) => (
                   <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: i === pendingMutuals.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{mut.patient}</span>
                       <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{mut.amount}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                         <FileText size={12} /> {mut.organism} • {mut.date}
                       </span>
                     </div>
                     <div style={{ fontSize: '12px', fontWeight: 600, color: mut.alert ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {mut.status}
                     </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Communications & Messages */}
           <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                 <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   Communications <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>2</span>
                 </h3>
                 <MessageSquare size={18} color="#94a3b8" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {messages.map((msg, i) => (
                   <div key={i} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{msg.patient}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{msg.time}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{msg.preview}</p>
                   </div>
                 ))}
                 <button style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                   Ouvrir la messagerie
                 </button>
              </div>
           </div>
         </div>

      </div>
    </div>
  );
}
