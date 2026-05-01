"use client";
import React, { useState } from 'react';
import { FileText, Download, Eye, Activity, Filter, Search } from 'lucide-react';

export default function MedicalReportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const reports = [
    { id: '#REP-001', name: 'Annette Black', date: 'Jul 04, 2022', type: 'Complete Blood Count', doctor: 'Dr. Carol D. Pollack', status: 'Available', statusColor: '#22c55e', bg: '#dcfce7' },
    { id: '#REP-002', name: 'Savannah Nguyen', date: 'Jul 05, 2022', type: 'MRI Resonance', doctor: 'Dr. Donald F. Watren', status: 'Processing', statusColor: '#f59e0b', bg: '#fef3c7' },
    { id: '#REP-003', name: 'Ronald Richards', date: 'Jul 06, 2022', type: 'Chest X-Ray', doctor: 'Dr. Gina F. Durham', status: 'Available', statusColor: '#22c55e', bg: '#dcfce7' },
    { id: '#REP-004', name: 'Bessie Cooper', date: 'Jul 10, 2022', type: 'Lipid Panel', doctor: 'Dr. Shantanu Jambhekar', status: 'In Review', statusColor: '#3b82f6', bg: '#dbeafe' },
    { id: '#REP-005', name: 'Eleanor Pena', date: 'Jul 12, 2022', type: 'Urinalysis', doctor: 'Dr. Carol D. Pollack', status: 'Available', statusColor: '#22c55e', bg: '#dcfce7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Top Banner / Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Medical Reports</h2>
           <p style={{ color: '#64748b', fontSize: '14px' }}>Access and manage patient lab results, imaging, and clinical documents.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
           <FileText size={18} /> Upload New Report
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { label: 'Total Reports Generated', value: '1,280', color: '#3b82f6' },
            { label: 'Pending Doctor Review', value: '24', color: '#f59e0b' },
            { label: 'Files Shared This Week', value: '156', color: '#22c55e' }
          ].map((metric, i) => (
             <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
               <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>{metric.label}</div>
               <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                 <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{metric.value}</div>
                 <Activity size={24} color={metric.color} opacity={0.6} />
               </div>
             </div>
          ))}
      </div>

      {/* Main Reports Table Area */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
           <div style={{ display: 'flex', gap: '16px' }}>
             <div style={{ position: 'relative', width: '280px' }}>
                <input 
                  type="text" 
                  placeholder="Search patient or ID..." 
                  style={{ width: '100%', padding: '10px 16px', paddingLeft: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
                />
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
             </div>
             <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
               <Filter size={16} /> Filters
             </button>
           </div>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Report ID</th>
              <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Patient Name</th>
              <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Date</th>
              <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Report Type</th>
              <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Prescribing Doctor</th>
              <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Status</th>
              <th style={{ paddingBottom: '20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((rep, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '20px 0', fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>{rep.id}</td>
                <td style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0', backgroundImage: `url('https://ui-avatars.com/api/?name=${rep.name.replace(' ', '+')}&background=f1f5f9&color=64748b')`, backgroundSize: 'cover' }}></div>
                  {rep.name}
                </td>
                <td style={{ padding: '20px 0', fontSize: '13px', color: '#64748b' }}>{rep.date}</td>
                <td style={{ padding: '20px 0', fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{rep.type}</td>
                <td style={{ padding: '20px 0', fontSize: '13px', color: '#64748b' }}>{rep.doctor}</td>
                <td style={{ padding: '20px 0' }}>
                  <span style={{ backgroundColor: rep.bg, color: rep.statusColor, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    {rep.status}
                  </span>
                </td>
                <td style={{ padding: '20px 0', textAlign: 'right' }}>
                   <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button style={{ background: '#f8fafc', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}>
                        <Eye size={16} />
                      </button>
                      <button style={{ background: '#f0f9ff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6' }}>
                        <Download size={16} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Upload Medical Report</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Please provide the report details and select the file.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder="Patient Name" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <input type="text" placeholder="Report Type (e.g. Blood Test)" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <input type="file" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px dashed #cbd5e1', outline: 'none', background: '#f8fafc', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={() => { alert('Report uploaded!'); setIsModalOpen(false); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
