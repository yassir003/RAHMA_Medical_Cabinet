"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, PlusCircle, User, Activity, Mail, Phone, Edit, Trash2 } from 'lucide-react';

export default function DoctorsListPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('custom_doctors') || '[]');
    setDoctors(stored);
  }, []);

  const handleDelete = (id: number) => {
    if(confirm('Are you sure you want to delete this doctor?')) {
      const updated = doctors.filter(img => img.id !== id);
      setDoctors(updated);
      localStorage.setItem('custom_doctors', JSON.stringify(updated));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header & Global Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Doctors Directory</h2>
           <p style={{ color: '#64748b', fontSize: '14px' }}>View and manage all registered doctors in the system.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
           <button onClick={() => router.push('/dashboard/doctors/create')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
             <PlusCircle size={18} /> Add New Doctor
           </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
           <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search doctor by name or specialty..." style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
           </div>
        </div>

        {doctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <User size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>No doctors found</h3>
            <p style={{ fontSize: '14px', marginBottom: '24px' }}>You haven't added any doctors yet.</p>
            <button onClick={() => router.push('/dashboard/doctors/create')} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Create First Doctor
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {doctors.map((doc, i) => (
              <div key={doc.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid #f1f5f9', borderRadius: '12px', transition: 'all 0.2s', background: '#f8fafc' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                   <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '20px', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.2)' }}>
                     {doc.name ? doc.name.replace('Dr. ', '').charAt(0) : 'D'}
                   </div>
                   <div>
                     <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>{doc.name}</div>
                     <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600, background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>{doc.specialty}</div>
                   </div>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '32px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                         <Mail size={16} /> {doc.email || 'N/A'}
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                         <Phone size={16} /> {doc.phone || 'N/A'}
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                         <Activity size={16} /> {doc.experience ? `${doc.experience} years exp` : 'N/A'}
                     </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#3b82f6', transition: 'all 0.2s' }}>
                     <Edit size={18} />
                   </button>
                   <button onClick={() => handleDelete(doc.id)} style={{ background: 'white', border: '1px solid #fee2e2', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s' }}>
                     <Trash2 size={18} />
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}