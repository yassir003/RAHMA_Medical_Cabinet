"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/dashboard');
  };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', marginTop: '0' }}>Login</h1>
      <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '40px' }}>
        Lorem Ipsum is simply dummy text of the printing and
        typesetting industry.
      </p>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            User name
          </label>
          <input 
            type="text" 
            placeholder="Lorem lorem" 
            style={{ width: '100%', padding: '16px', border: '1px solid #20c265', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
            defaultValue="Lorem lorem"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            Enter your Password
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Type your password here" 
              style={{ width: '100%', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', paddingRight: '44px' }}
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
          Login
        </button>

      </form>
    </div>
  );
}
