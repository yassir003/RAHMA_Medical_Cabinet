"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { 
  LayoutDashboard, CalendarRange, FileText, Users, 
  Stethoscope, MessageSquare, Settings, Search, Bell, ChevronDown, Check, UserPlus
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<'Admin' | 'Médecin' | 'Secrétaire' | 'Patient'>('Admin');
  const [showRoles, setShowRoles] = useState(false);

  const getMenuItems = () => {
    const base = [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'Appointment', icon: CalendarRange, path: '/dashboard/appointments' },
    ];
    if (role === 'Admin') {
      return [...base, 
        { name: 'Medical Report', icon: FileText, path: '/dashboard/reports' },
        { name: 'Patient', icon: Users, path: '/dashboard/patients' },
        { name: 'Doctor', icon: Stethoscope, path: '/dashboard/doctors' },
        { name: 'Doctors list', icon: Stethoscope, path: '/dashboard/doctors/list' },
        { name: 'Create Doctor', icon: UserPlus, path: '/dashboard/doctors/create' },
        { name: 'Secretary', icon: Users, path: '/dashboard/secretary' },
        { name: 'Secretary list', icon: Users, path: '/dashboard/secretary/list' },
        { name: 'Create Secretary', icon: UserPlus, path: '/dashboard/secretary/create' },
        { name: 'Log', icon: Settings, path: '/dashboard/settings' }
      ];
    }
    if (role === 'Médecin') {
      return [...base, 
        { name: 'Workspace', icon: Stethoscope, path: '/dashboard/doctors' },
        { name: 'Medical Report', icon: FileText, path: '/dashboard/reports' },
        { name: 'Patient', icon: Users, path: '/dashboard/patients' },
        { name: 'Message', icon: MessageSquare, path: '/dashboard/messages' },
        { name: 'Setting', icon: Settings, path: '/dashboard/settings' }
      ];
    }
    if (role === 'Secrétaire') {
      return [
        { name: 'Workspace', icon: LayoutDashboard, path: '/dashboard/secretary' },
        { name: 'Appointment', icon: CalendarRange, path: '/dashboard/appointments' },
        { name: 'Patient', icon: Users, path: '/dashboard/patients' },
        { name: 'Mutuals', icon: FileText, path: '/dashboard/mutuals' },
        { name: 'Message', icon: MessageSquare, path: '/dashboard/messages' },
        { name: 'Setting', icon: Settings, path: '/dashboard/settings' }
      ];
    }
    return [...base, 
      { name: 'My Reports', icon: FileText, path: '/dashboard/reports' },
      { name: 'Message', icon: MessageSquare, path: '/dashboard/messages' },
      { name: 'Setting', icon: Settings, path: '/dashboard/settings' }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ padding: '30px 24px', marginBottom: '20px' }}>
          <Logo light={true} />
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 24px' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', 
                  borderRadius: '12px', cursor: 'pointer', textDecoration: 'none',
                  backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                  color: isActive ? 'var(--primary)' : '#64748b',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header style={{ height: '90px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', flexShrink: 0 }}>
           <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Dashboard Overview</h1>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
             {/* Search */}
             <div style={{ position: 'relative', width: '350px' }}>
               <input 
                 type="text" 
                 placeholder="Search type of keywords" 
                 style={{ width: '100%', padding: '14px 20px', paddingRight: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'white', color: '#0f172a', outline: 'none', fontSize: '13px', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}
               />
               <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} />
             </div>

             {/* notifications */}
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
               <Bell size={20} color="#64748b" />
             </div>

             {/* Profile & Role Dropdown */}
             <div style={{ position: 'relative' }}>
               <div onClick={() => setShowRoles(!showRoles)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px', borderRadius: '12px', background: showRoles ? '#f1f5f9' : 'transparent', transition: 'all 0.2s' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '4px' }}>
                   <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Arlene McCoy</span>
                   <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', marginTop: '4px' }}>Role: {role}</span>
                 </div>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e2e8f0', backgroundImage: 'url("https://ui-avatars.com/api/?name=Arlene+McCoy&background=e0f2fe&color=0284c7")', backgroundSize: 'cover' }}></div>
                 <ChevronDown size={16} color="#64748b" />
               </div>

               {showRoles && (
                 <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '220px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '8px', zIndex: 100, border: '1px solid #f8fafc' }}>
                   <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Switch Active Role</div>
                   {['Admin', 'Médecin', 'Secrétaire', 'Patient'].map(r => (
                     <div 
                       key={r} 
                       onClick={() => { setRole(r as any); setShowRoles(false); }}
                       style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: role === r ? '#f0f9ff' : 'transparent', color: role === r ? 'var(--primary)' : '#334155', fontWeight: role === r ? 700 : 500, transition: 'all 0.1s' }}
                     >
                       {r}
                       {role === r && <Check size={16} color="var(--primary)" />}
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '0 40px 40px 40px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
