"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, FileText, Users } from 'lucide-react';
import { getMyPatientsAsMedecin, Patient } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPatients = useCallback(async (search: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getMyPatientsAsMedecin(0, 200, search);
      setPatients(res.content);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les patients.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPatients('');
  }, [fetchPatients]);

  // Debounced search — server-side so results are always accurate
  function handleSearch(value: string) {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(value), 300);
  }

  const handlePatientClick = (patientId: number) => {
    router.push(`/dashboard/doctors/patients/${patientId}`);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Mes Patients
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {isLoading ? 'Chargement…' : `${patients.length} patient${patients.length !== 1 ? 's' : ''} suivi${patients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 24,
        border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou CIN…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0f172a' }}
          />
        </div>

        {/* States */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>
            Chargement…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#ef4444', fontSize: 14 }}>
            {error}
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient pour le moment'}
            </p>
            <p style={{ fontSize: 13 }}>
              {searchQuery
                ? 'Essayez un autre nom ou CIN.'
                : 'Vos patients apparaîtront ici dès qu\'une consultation ou un rendez-vous leur est associé.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['ID', 'Nom', 'CIN', 'Téléphone', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12,
                    fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => handlePatientClick(patient.id)}
                  style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 500 }}>
                    #{String(patient.id).padStart(4, '0')}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#2fb5fc' }}>
                    {patient.prenom} {patient.nom}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{patient.cin}</td>
                  <td style={{ padding: '14px 16px', color: '#475569' }}>{patient.telephone || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12,
                      fontWeight: 600, background: '#f0fdf4', color: '#16a34a' }}>
                      Actif
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePatientClick(patient.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none',
                        border: 'none', cursor: 'pointer', color: '#2fb5fc',
                        fontWeight: 600, fontSize: 13 }}
                      title="Voir le dossier médical"
                    >
                      <FileText size={15} /> Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
