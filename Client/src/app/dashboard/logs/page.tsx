"use client";
import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, History, Clock } from 'lucide-react';
import { getAuditLogs, AuditLog } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await getAuditLogs(0, 100);
      setLogs(res.content);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Establish SSE connection for real-time updates
    const stored = localStorage.getItem("rahma_auth_user");
    let token = "";
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        token = parsed.token;
      } catch (e) {}
    }

    const eventSource = new EventSource(`/api/v1/audit/stream?token=${token}`);
    
    eventSource.addEventListener("new_log", (e) => {
      try {
        const newLog = JSON.parse(e.data);
        // Prepend the new log to the list so it appears at the top
        setLogs((prev) => {
          // Avoid duplicates if fetchLogs and SSE race
          if (prev.some(log => log.id === newLog.id)) return prev;
          return [newLog, ...prev];
        });
      } catch (err) {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return { color: '#22c55e', bg: '#dcfce7' };
    if (action.includes('UPDATE')) return { color: '#3b82f6', bg: '#dbeafe' };
    if (action.includes('DELETE')) return { color: '#ef4444', bg: '#fee2e2' };
    if (action.includes('LOGIN')) return { color: '#8b5cf6', bg: '#ede9fe' };
    return { color: '#64748b', bg: '#f1f5f9' };
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.utilisateur.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entite.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <ShieldAlert size={28} color="var(--primary)" />
             System Audit Logs
           </h2>
           <p style={{ color: '#64748b', fontSize: '14px' }}>Monitor security events, logins, and data modifications.</p>
        </div>
        <button onClick={fetchLogs} style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
           <History size={18} /> Refresh Logs
        </button>
      </div>

      {/* Main Table Area */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
           <div style={{ display: 'flex', gap: '16px' }}>
             <div style={{ position: 'relative', width: '300px' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, action, or entity..." 
                  style={{ width: '100%', padding: '10px 16px', paddingLeft: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
                />
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
             </div>
           </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading logs...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ paddingBottom: '20px' }}>Timestamp</th>
                <th style={{ paddingBottom: '20px' }}>Action</th>
                <th style={{ paddingBottom: '20px' }}>Entity</th>
                <th style={{ paddingBottom: '20px' }}>User</th>
                <th style={{ paddingBottom: '20px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const actionStyle = getActionColor(log.action);
                return (
                <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px 0', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} />
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ backgroundColor: actionStyle.bg, color: actionStyle.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {log.entite} <span style={{ color: '#94a3b8', fontWeight: 400 }}>#{log.entiteId}</span>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', color: '#3b82f6', fontWeight: 500 }}>
                    {log.utilisateur}
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', color: '#64748b' }}>
                    {log.details || '-'}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
        
        {!isLoading && filteredLogs.length === 0 && !error && (
           <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No audit logs found.</div>
        )}
      </div>
    </div>
  );
}
