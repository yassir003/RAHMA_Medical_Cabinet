"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { useAuth, type Role } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getUnreadCount } from '@/lib/api';
import {
  LayoutDashboard, CalendarRange, FileText, Users,
  Stethoscope, MessageSquare, Settings, Search, Bell, LogOut, UserPlus,
  Home, Activity
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Menu configuration per role
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Map backend page names to icons
// ---------------------------------------------------------------------------

function getIconForPage(name: string) {
  switch (name) {
    case 'Dashboard':
    case 'Workspace':
      return LayoutDashboard;
    case 'Appointment':
    case 'Rendez-vous':
      return CalendarRange;
    case 'Medical Report':
    case 'My Reports':
    case 'Mutuals':
    case 'Suivi Médical':
      return FileText;
    case 'Patient':
    case 'Secretary':
    case 'Secretary list':
      return Users;
    case 'Doctor':
    case 'Doctors list':
      return Stethoscope;
    case 'Create Doctor':
    case 'Create Secretary':
      return UserPlus;
    case 'Message':
      return MessageSquare;
    case 'Log':
    case 'Setting':
      return Settings;
    case 'Accueil':
      return Home;
    case 'Notifications':
      return Bell;
    default:
      return LayoutDashboard;
  }
}

// ---------------------------------------------------------------------------
// Friendly role label for the badge
// ---------------------------------------------------------------------------

function roleBadgeLabel(role: Role): string {
  switch (role) {
    case 'ADMIN':      return 'Admin';
    case 'MEDECIN':    return 'Médecin';
    case 'SECRETAIRE': return 'Secrétaire';
    case 'PATIENT':    return 'Patient';
    default:           return role;
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const role: Role = user?.role ?? 'PATIENT';
  const email = user?.email ?? '';

  useEffect(() => {
    if (role !== 'PATIENT') return;
    const load = () => getUnreadCount().then(setUnreadCount).catch(() => {});
    load();
    pollRef.current = setInterval(load, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [role]);

  // Map backend pages to menu items with icons
  // MEDECIN has their own workspace — the generic "Dashboard" entry is excluded for them
  const menuItems = (user?.pages || [])
    .filter(page => !(role === 'MEDECIN' && page.name === 'Dashboard'))
    .map(page => ({
      name: page.name,
      path: page.path,
      icon: getIconForPage(page.name)
    }));

  return (
    <ProtectedRoute>
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

          {/* Logout button at sidebar bottom */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: '#ef4444', fontWeight: 500, fontSize: '14px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
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

               {/* Notifications */}
               <Link
                 href={role === 'PATIENT' ? '/dashboard/patient/notifications' : '#'}
                 style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.01)', textDecoration: 'none' }}
               >
                 <Bell size={20} color="#64748b" />
                 {role === 'PATIENT' && unreadCount > 0 && (
                   <span style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                     {unreadCount > 9 ? '9+' : unreadCount}
                   </span>
                 )}
               </Link>

               {/* Profile — shows real email & role */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px', borderRadius: '12px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '4px' }}>
                   <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{email}</span>
                   <span style={{ fontSize: '11px', fontWeight: 700, color: 'white', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', marginTop: '4px' }}>
                     {roleBadgeLabel(role)}
                   </span>
                 </div>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e2e8f0', backgroundImage: `url("https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=e0f2fe&color=0284c7")`, backgroundSize: 'cover' }}></div>
               </div>
             </div>
          </header>

          {/* Page Content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '0 40px 40px 40px' }}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
