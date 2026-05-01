"use client";
import React from 'react';
import { ArrowLeft, Stethoscope, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateDoctorPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => router.back()} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} color="#64748b" />
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Ajouter un nouveau médecin</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Remplissez les informations ci-dessous pour créer un profil de médecin.</p>
        </div>
      </div>

      {/* Form Container */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1 */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} color="#3b82f6" /> Informations Professionnelles
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Spécialité</label>
                <select style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a', background: 'transparent' }}>
                  <option>Dentiste</option>
                  <option>Cardiologue</option>
                  <option>Généraliste</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Années d'expérience</label>
                <input type="number" placeholder="Ex: 5" style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a' }} />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '24px' }}>
              Informations Personnelles
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Nom</label>
                <input type="text" placeholder="Entrez le nom" style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Prénom</label>
                <input type="text" placeholder="Entrez le prénom" style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Email</label>
                <input type="email" placeholder="contact@medecin.com" style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Téléphone</label>
                <input type="text" placeholder="+212 ..." style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Mot de passe (Accès système)</label>
                <input type="password" placeholder="••••••••" style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', color: '#0f172a' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <button type="button" onClick={() => router.back()} style={{ padding: '14px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'transparent', color: '#475569', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Annuler</button>
            <button type="button" onClick={() => alert('Le médecin a été créé avec succès!')} style={{ padding: '14px 32px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
