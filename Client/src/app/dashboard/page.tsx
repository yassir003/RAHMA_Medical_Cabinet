"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Calendar as CalendarIcon, MousePointerClick, Users, RefreshCcw, Stethoscope, PlusCircle, Loader2 } from 'lucide-react';
import { getDashboardStats, getPatients, getRendezVousAll, DashboardStats, Patient, RendezVous } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { defaultRouteForRole } from '@/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [upcoming, setUpcoming] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Only ADMIN belongs on this dashboard — all other roles go to their own workspace
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace(defaultRouteForRole(user.role));
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    async function loadData() {
      try {
        setIsLoading(true);
        const [statsRes, patientsRes, rdvRes] = await Promise.allSettled([
          getDashboardStats(),
          getPatients(0, 5),
          getRendezVousAll(0, 4, 'asc'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (patientsRes.status === 'fulfilled') setPatients(patientsRes.value.content);
        if (rdvRes.status === 'fulfilled') setUpcoming(rdvRes.value.content);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const chartData = months.map((month, index) => {
    const monthKey = String(index + 1);
    const monthData = stats?.rendezVousParMois?.[monthKey] || {};
    return {
      name: month,
      planifies: monthData['PLANIFIE'] || 0,
      termines: (monthData['TERMINE'] || 0) + (monthData['HONORE'] || 0),
    };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
      
      {/* LEFT COLUMN: Metrics, Charts, Tables */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[
            { label: 'Total Patients', value: stats?.totalPatients || 0, icon: Users, color: '#22c55e' },
            { label: 'Total Doctors', value: stats?.totalMedecins || 0, icon: Stethoscope, color: '#3b82f6' },
            { label: 'RDV Today', value: stats?.rdvAujourdhui || 0, icon: CalendarIcon, color: '#f59e0b' },
            { label: 'Consultations', value: stats?.totalConsultations || 0, icon: RefreshCcw, color: '#d946ef' }
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

        {/* Rendez-vous Overview Chart Area (Mocked visually) */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Aperçu des Rendez-vous</h3>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#3b82f6' }}></div> Planifiés</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#10b981' }}></div> Terminés</span>
               </div>
            </div>
            <select style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', color: '#64748b', fontWeight: 500 }}>
              <option>Mensuel</option>
            </select>
          </div>
          
          <div style={{ height: '300px', width: '100%', marginTop: '10px', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                <RechartsTooltip 
                  cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', fontWeight: 600, fontSize: '12px', color: '#0f172a' }} 
                />
                <Line type="monotone" dataKey="planifies" name="Planifiés" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 3 }} />
                <Line type="monotone" dataKey="termines" name="Terminés" stroke="#10b981" strokeWidth={3} strokeOpacity={0.7} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
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
              {patients.map((p) => {
                const name = `${p.prenom} ${p.nom}`;
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '20px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e2e8f0', backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random')`, backgroundSize: 'cover' }}></div>
                      {name}
                    </td>
                    <td style={{ padding: '20px 0', fontSize: '13px', color: '#94a3b8' }}>{p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '20px 0', fontSize: '13px', color: '#64748b' }}>{p.antecedents || 'Aucun antécédent'}</td>
                    <td style={{ padding: '20px 0', fontSize: '12px', fontWeight: 700, color: '#10b981' }}>Enregistré</td>
                    <td style={{ padding: '20px 0', textAlign: 'right' }}><MoreHorizontal size={18} color="#cbd5e1" cursor="pointer" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: Calendar & Upcoming */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Calendar Widget */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
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
             {upcoming.map((apt, i) => {
               const colors = ['#3b82f6', '#f59e0b', '#eab308', '#22c55e', '#d946ef'];
               const color = colors[apt.id % colors.length];
               const dateStr = new Date(apt.dateHeure).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
               return (
                 <div key={apt.id} style={{ display: 'flex', gap: '16px' }}>
                   {/* Timeline node */}
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px' }}>
                     <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, marginTop: '4px' }}></div>
                     {i !== upcoming.length - 1 && <div style={{ width: '2px', flex: 1, backgroundColor: '#f1f5f9', marginTop: '4px', marginBottom: '-30px' }}></div>}
                   </div>
                   {/* Content */}
                   <div style={{ flex: 1 }}>
                     <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>{dateStr}</div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <div style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{apt.motif || 'Consultation'} - {apt.patientPrenom} {apt.patientNom}</div>
                         <div style={{ color: '#94a3b8', fontSize: '12px' }}>Dr. {apt.medecinNom}</div>
                       </div>
                       <span style={{ color: '#0f172a', fontWeight: 'bold' }}>&gt;</span>
                     </div>
                   </div>
                 </div>
               );
             })}
             {upcoming.length === 0 && <div style={{ color: '#94a3b8', fontSize: '13px' }}>No upcoming appointments</div>}
           </div>
        </div>

      </div>
    </div>
  );
}
