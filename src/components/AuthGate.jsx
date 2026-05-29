import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const [mode, setMode]       = useState('password'); // 'password' | 'signup'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  if (loading) return <div className="auth-loading">Loading…</div>;
  if (user) return children;

  async function handlePassword(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  function switchMode(m) {
    setMode(m); setError(''); setSent(false); setPassword('');
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <h2>Svenska Ord</h2>
        <p className="auth-sub">Sign in to sync your vocabulary across devices</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'password' ? 'active' : ''}`}
            onClick={() => switchMode('password')}
          >Sign in</button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >Sign up</button>
        </div>

        {sent ? (
          <div className="auth-sent">
            <p>✉️ Check your email to confirm your account, then sign in with your password.</p>
            <button className="auth-back" onClick={() => { setSent(false); switchMode('password'); }}>
              Back to sign in
            </button>
          </div>
        ) : mode === 'password' ? (
          <form className="auth-form" onSubmit={handlePassword}>
            <input type="email" className="auth-input" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required autoFocus />
            <input type="password" className="auth-input" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password" required />
            <button className="auth-btn" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {error && <p className="auth-error">{error}</p>}
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignup}>
            <input type="email" className="auth-input" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required autoFocus />
            <input type="password" className="auth-input" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Choose a password (min 6 chars)" required minLength={6} />
            <button className="auth-btn" type="submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
            {error && <p className="auth-error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
