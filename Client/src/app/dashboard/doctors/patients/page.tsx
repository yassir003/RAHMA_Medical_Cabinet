"use client";
import React, { useState, useEffect } from 'react';
import { Search, FileText } from 'lucide-react';
import { getPatients, Patient } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const res = await getPatients(0, 100); // Using getPatients to fetch list
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

  const handlePatientClick = (patientId: number) => {
    router.push(`/dashboard/doctors/patients/${patientId}`);
  };

  const filteredPatients = patients.filter(p => 
    `${p.prenom} ${p.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.cin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--secondary)' }}>My Patients</h1>
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
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onClick={() => handlePatientClick(patient.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>#{patient.id.toString().padStart(4, '0')}</td>
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--primary)' }}>{patient.prenom} {patient.nom}</td>
                  <td style={{ padding: '16px' }}>{patient.cin}</td>
                  <td style={{ padding: '16px' }}>{patient.telephone || '-'}</td>
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
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // prevent triggering row click twice
                          handlePatientClick(patient.id);
                        }} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 500 }} 
                        title="View Medical Record"
                      >
                        <FileText size={16} /> Record
                      </button>
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
    </>
  );
}
