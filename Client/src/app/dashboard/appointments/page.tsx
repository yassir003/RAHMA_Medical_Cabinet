"use client";
import React, { useState } from 'react';
import { Calendar, Plus, Clock, User } from 'lucide-react';

export default function AppointmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const appointments = [
    { title: 'Dental Checkup - Alice Smith', time: '09:00 AM - 09:30 AM', status: 'Confirmed', doctor: 'Dr. Shantanu Jambhekar', type: 'Checkup' },
    { title: 'Follow-up - Bob Johnson', time: '10:00 AM - 10:45 AM', status: 'Pending', doctor: 'Dr. Shantanu Jambhekar', type: 'Follow-up' },
    { title: 'Teeth Whitening - Charlie D.', time: '11:30 AM - 12:30 PM', status: 'Confirmed', doctor: 'Dr. Shantanu Jambhekar', type: 'Operation' },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--secondary)' }}>Appointments Calendar</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}>
          <Plus size={16} /> New Appointment
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Side: Mock Calendar View Component */}
        <div className="card" style={{ padding: '24px', flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>May 2026</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white' }}>Today</button>
              <button style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white' }}>&lt;</button>
              <button style={{ padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white' }}>&gt;</button>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '1px', 
            background: 'var(--border)', 
            border: '1px solid var(--border)' 
          }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} style={{ background: '#f8fafc', padding: '10px', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>
                {day}
              </div>
            ))}
            {/* Mock days logic */}
            {Array.from({length: 35}).map((_, i) => (
              <div key={i} style={{ 
                background: i === 10 ? '#e0f2fe' : 'white', 
                minHeight: '100px', 
                padding: '8px', 
                fontSize: '14px',
                color: i < 4 || i > 34 ? 'var(--text-muted)' : 'var(--foreground)'
               }}>
                {((i % 31) + 1)}
                {i === 10 && (
                  <div style={{ background: 'var(--primary)', color: 'white', padding: '2px 4px', borderRadius: '4px', fontSize: '10px', marginTop: '8px' }}>
                    3 Appointments
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Upcoming List */}
        <div className="card" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} className="text-primary" /> Upcoming Today
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appointments.map((apt, i) => (
              <div key={i} style={{ borderLeft: '4px solid var(--primary)', padding: '12px 16px', background: '#f8fafc', borderRadius: '4px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{apt.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <Clock size={12} /> {apt.time}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--secondary)' }}>
                    <User size={12} /> {apt.doctor}
                  </div>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 6px', 
                    borderRadius: '10px', 
                    background: apt.status === 'Confirmed' ? '#20c26522' : '#f59e0b22', 
                    color: apt.status === 'Confirmed' ? 'var(--success)' : '#f59e0b' 
                  }}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Schedule Appointment</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Book a new appointment slot for a patient.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" placeholder="Patient Name" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              <div style={{ display: 'flex', gap: '16px' }}>
                <input type="date" style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
                <input type="time" style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }} />
              </div>
              <select style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#64748b', fontSize: '14px' }}>
                <option>Select Doctor...</option>
                <option>Dr. Shantanu Jambhekar</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={() => { alert('Appointment booked!'); setIsModalOpen(false); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
