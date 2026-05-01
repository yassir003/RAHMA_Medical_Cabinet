"use client";
import React from 'react';
import { MoreHorizontal, Calendar as CalendarIcon, MousePointerClick, Users, RefreshCcw, Stethoscope, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  
  const patients = [
    { name: 'Annette Black', date: 'Dec 18, 2021', diag: 'Skin rash and eczema', status: 'Incoming', statusColor: '#f59e0b', bg: '#fef3c7' },
    { name: 'Savannah Nguyen', date: 'Dec 18, 2021', diag: 'Nail problems', status: 'Confirmed', statusColor: '#3b82f6', bg: '#dbeafe' },
    { name: 'Ronald Richards', date: 'Dec 18, 2021', diag: 'Contraceptives', status: 'Cancelled', statusColor: '#94a3b8', bg: '#f1f5f9' },
    { name: 'Bessie Cooper', date: 'Dec 18, 2021', diag: 'Quit smoking', status: 'Confirmed', statusColor: '#3b82f6', bg: '#dbeafe' },
  ];

  const upcoming = [
    { title: 'Nurse Visit 20', doctor: 'Dr. Carol D. Pollack-rundle', color: '#3b82f6' },
    { title: 'Annual Visit 15', doctor: 'Dr. Donald F. Watren', color: '#f59e0b' },
    { title: 'Established Patient 30', doctor: 'Dr. Gina F. Durham', color: '#eab308' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
      
      {/* LEFT COLUMN: Metrics, Charts, Tables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[
            { label: 'Total Doctor', value: '3', icon: MousePointerClick, color: '#3b82f6' },
            { label: 'Total Staff', value: '10', icon: Users, color: '#d946ef' },
            { label: 'Total Patient', value: '2.414', icon: RefreshCcw, color: '#22c55e' },
            { label: 'New Appointment', value: '150', icon: CalendarIcon, color: '#f59e0b' }
          ].map((metric, i) => (
             <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
               <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 500, marginBottom: '12px' }}>{metric.label}</div>
               <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                 <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{metric.value}</div>
                 <metric.icon size={24} color={metric.color} />
               </div>
             </div>
          ))}
        </div>

        {/* Patient Overview Chart Area (Mocked visually) */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Patient Overview</h3>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#3b82f6' }}></div> Male</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#f472b6' }}></div> Female</span>
               </div>
            </div>
            <select style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', color: '#64748b', fontWeight: 500 }}>
              <option>Monthly</option>
            </select>
          </div>
          
          <div style={{ height: '300px', width: '100%', position: 'relative', borderLeft: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-end', paddingBottom: '30px' }}>
            {/* Y axis labels */}
            <div style={{ position: 'absolute', left: '-25px', top: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
              <span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
            </div>
            {/* X axis labels */}
            <div style={{ position: 'absolute', bottom: '-20px', left: 0, width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', paddingLeft: '20px' }}>
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
            {/* Mock Chart lines SVG */}
             <svg width="100%" height="250px" viewBox="0 0 800 250" preserveAspectRatio="none" style={{ position: 'absolute', bottom: '30px', left: 0 }}>
                {/* Female Line (Pink) */}
                <path d="M0,200 C50,150 100,50 150,100 C200,150 250,150 300,100 C350,50 400,200 450,150 C500,100 550,150 600,100 C650,50 700,200 750,150 C800,180 800,180 800,180" fill="none" stroke="#f472b6" strokeWidth="3" opacity="0.4" />
                {/* Male Line (Blue) */}
                <path d="M0,220 C50,220 100,100 150,150 C200,200 300,150 350,130 C400,180 450,100 500,70 C550,100 650,20 700,80 C750,120 780,20 800,20" fill="none" stroke="#3b82f6" strokeWidth="4" />
                {/* Overlay Tooltip on Male Line (Aug/Sep) */}
                <circle cx="500" cy="70" r="5" fill="#3b82f6" stroke="white" strokeWidth="3" />
             </svg>
             {/* Mock floating tooltip */}
             <div style={{ position: 'absolute', top: '15px', left: '55%', background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div> Male</span>
                <span style={{ color: '#0f172a' }}>50 Patients</span>
             </div>
          </div>
        </div>

        {/* Patient Data Table */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Patient Data</h3>
             <button style={{ color: '#3b82f6', background: 'transparent', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View all</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Patient name</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Date in</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Diagnostic</th>
                <th style={{ paddingBottom: '20px', fontWeight: 500 }}>Status</th>
                <th style={{ paddingBottom: '20px' }}></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0' }}></div>
                    {p.name}
                  </td>
                  <td style={{ padding: '20px 0', fontSize: '13px', color: '#94a3b8' }}>{p.date}</td>
                  <td style={{ padding: '20px 0', fontSize: '13px', color: '#64748b' }}>{p.diag}</td>
                  <td style={{ padding: '20px 0', fontSize: '12px', fontWeight: 700, color: p.statusColor }}>{p.status}</td>
                  <td style={{ padding: '20px 0', textAlign: 'right' }}><MoreHorizontal size={18} color="#cbd5e1" cursor="pointer" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: Calendar & Upcoming */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Calendar Widget */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>July, 2022</h3>
            <div style={{ display: 'flex', gap: '12px', color: '#94a3b8' }}>
              <span style={{ cursor: 'pointer' }}>&lt;</span>
              <span style={{ cursor: 'pointer' }}>&gt;</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '20px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div style={{ color: d === 'Mon' || d === 'Wed' || d === 'Fri' ? '#3b82f6' : '#64748b' }} key={d}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', rowGap: '20px', textAlign: 'center', fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
             <div style={{ color: '#cbd5e1' }}>26</div><div style={{ color: '#cbd5e1' }}>27</div><div style={{ color: '#cbd5e1' }}>28</div>
             <div style={{ color: '#cbd5e1' }}>29</div><div style={{ color: '#cbd5e1' }}>30</div><div>1</div><div>2</div>
             <div>3</div><div>4</div><div>5</div>
             <div style={{ position: 'relative' }}>
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '32px', height: '32px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>6</div>
             </div>
             <div>7</div><div>8</div><div>9</div>
             <div>10</div><div>11</div><div>12</div><div>13</div><div>14</div><div>15</div><div>16</div>
             <div>17</div><div>18</div><div>19</div><div>20</div><div>21</div><div>22</div><div>23</div>
          </div>
        </div>

        {/* Upcoming Appointment */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', flex: 1 }}>
           <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '30px' }}>Upcoming Appointment</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
             {upcoming.map((apt, i) => (
               <div key={i} style={{ display: 'flex', gap: '16px' }}>
                 {/* Timeline node */}
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px' }}>
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: apt.color, marginTop: '4px' }}></div>
                   {i !== upcoming.length - 1 && <div style={{ width: '2px', flex: 1, backgroundColor: '#f1f5f9', marginTop: '4px', marginBottom: '-30px' }}></div>}
                 </div>
                 {/* Content */}
                 <div style={{ flex: 1 }}>
                   <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>Today, 08:30 am - 10:30 am</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{apt.title}</div>
                       <div style={{ color: '#94a3b8', fontSize: '12px' }}>{apt.doctor}</div>
                     </div>
                     <span style={{ color: '#0f172a', fontWeight: 'bold' }}>&gt;</span>
                   </div>
                 </div>
               </div>
             ))}
             {/* Mock next timeline marker */}
             <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', marginTop: '4px' }}></div>
                <div style={{ color: '#94a3b8', fontSize: '12px', flex: 1 }}>Today, 08:30 am - 10:30 am</div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
