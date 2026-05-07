"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'notfound' | 'credentials' | 'other' | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setErrorType(null);
    try {
      await login(email, password);
      // redirect is handled inside AuthContext.login()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setErrorType('notfound');
          setError("Aucun compte trouvé pour cet email.");
        } else if (err.status === 401) {
          setErrorType('credentials');
          setError("Mot de passe incorrect. Vérifiez vos identifiants.");
        } else if (err.status === 429) {
          setErrorType('other');
          setError("Trop de tentatives. Réessayez dans 1 minute.");
        } else {
          setErrorType('other');
          setError(err.message);
        }
      } else if (err instanceof TypeError) {
        setErrorType('other');
        setError('Impossible de joindre le serveur — est-il démarré ?');
      } else {
        setErrorType('other');
        setError('Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#0f172a', marginBottom: '16px', marginTop: '0' }}>Login</h1>
      <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '40px' }}>
        Sign in to access your Rahma Medical Cabinet dashboard.
      </p>
      
      {error && (
        <div style={{
          padding: '14px 16px',
          marginBottom: '24px',
          borderRadius: '8px',
          backgroundColor: errorType === 'notfound' ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${errorType === 'notfound' ? '#fde68a' : '#fecaca'}`,
          color: errorType === 'notfound' ? '#92400e' : '#dc2626',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          <div>{error}</div>
          {errorType === 'notfound' && (
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              Vous n&apos;avez pas encore de compte ?{' '}
              <Link href="/register" style={{ color: '#d97706', fontWeight: 700, textDecoration: 'underline' }}>
                Créer un compte
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            Email
          </label>
          <input 
            type="email" 
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', opacity: loading ? 0.6 : 1 }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Type your password here"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', paddingRight: '44px', opacity: loading ? 0.6 : 1 }}
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
          <Link href="/forgot" style={{ color: '#94a3b8', textDecoration: 'none' }}>Forgot Password?</Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '8px',
            backgroundColor: loading ? '#7dd3fc' : '#2fb5fc',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
          }}
        >
          {loading && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Signing in…' : 'Login'}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}
