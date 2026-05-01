"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', marginTop: '60px' }}>Register</h1>
      <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '40px' }}>
        Lorem Ipsum is simply dummy text of the printing and
        typesetting industry.
      </p>
      
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            Email Address
          </label>
          <input 
            type="email" 
            placeholder="Lorem lorem" 
            style={{ width: '100%', padding: '16px', border: '1px solid #20c265', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' }} 
            defaultValue="Lorem lorem"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            User name
          </label>
          <input 
            type="text" 
            placeholder="Lorem lorem" 
            style={{ width: '100%', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' }} 
            defaultValue="Lorem lorem"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            Password
            <span style={{ backgroundColor: '#dcfce7', color: '#20c265', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
              Strong_
            </span>
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Type your password here" 
              style={{ width: '100%', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' }} 
            />
            <span 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}
            >
               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#cbd5e1', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            Remember me?
          </label>
          <Link href="/forgot" style={{ color: '#94a3b8', textDecoration: 'none' }}>Forgot Passowrd ?</Link>
        </div>

        <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 600, borderRadius: '8px', backgroundColor: '#2fb5fc', color: 'white', border: 'none', cursor: 'pointer' }}>
          Register
        </button>

      </form>
    </div>
  );
}
