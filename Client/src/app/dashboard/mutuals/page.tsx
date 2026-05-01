"use client";
import React from 'react';
import { Search, FileText, CheckCircle, Clock } from 'lucide-react';

export default function MutualsPage() {
  const folders = [
    { id: 'MT-1001', patient: 'Alice Smith', mutual: 'CNSS', date: '2026-04-01', amount: 'MAD 350.00', status: 'Pending' },
    { id: 'MT-1002', patient: 'Youssef Alaoui', mutual: 'CNOPS', date: '2026-03-28', amount: 'MAD 800.00', status: 'Reimbursed' },
    { id: 'MT-1003', patient: 'Khadija Bennani', mutual: 'SAHAM Assurance', date: '2026-03-15', amount: 'MAD 1,200.00', status: 'Reimbursed' },
    { id: 'MT-1004', patient: 'Bob Johnson', mutual: 'CNSS', date: '2026-04-04', amount: 'MAD 200.00', status: 'Submitted' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--secondary)' }}>Mutuals Management</h1>
        <button className="btn-primary" style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}>
          <FileText size={16} /> New Record
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
             <FileText size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total CNSS</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>124</div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
             <FileText size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total CNOPS</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>86</div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
             <Clock size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Pending</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>45</div>
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
             <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Reimbursed</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>210</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 16px' }}>
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Search records by patient or mutual..." style={{ border: 'none', width: '100%', outline: 'none', fontSize: '14px' }} />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 500 }}>Folder ID</th>
              <th style={{ padding: '12px 16px', fontWeight: 500 }}>Patient Name</th>
              <th style={{ padding: '12px 16px', fontWeight: 500 }}>Mutual</th>
              <th style={{ padding: '12px 16px', fontWeight: 500 }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 500 }}>Amount</th>
              <th style={{ padding: '12px 16px', fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {folders.map((f) => (
              <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px', color: 'var(--primary)', fontWeight: 500 }}>{f.id}</td>
                <td style={{ padding: '16px', fontWeight: 500 }}>{f.patient}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px', background: '#f8fafc' }}>
                    {f.mutual}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{f.date}</td>
                <td style={{ padding: '16px', fontWeight: 500 }}>{f.amount}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    backgroundColor: f.status === 'Reimbursed' ? '#dcfce7' : f.status === 'Submitted' ? '#e0f2fe' : '#fef3c7',
                    color: f.status === 'Reimbursed' ? '#16a34a' : f.status === 'Submitted' ? '#0284c7' : '#d97706'
                  }}>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
