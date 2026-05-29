import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState('');

  if (loading) return <div className="auth-loading">Loading…</div>;
  if (user) return children;

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <h2>Svenska Ord</h2>
        <p className="auth-sub">Sign in to sync your vocabulary across devices</p>

        {sent ? (
          <div className="auth-sent">
            <p>✉️ Check your email — we sent a magic link to <strong>{email}</strong>.</p>
            <button className="auth-back" onClick={() => setSent(false)}>Use a different email</button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
            <button className="auth-btn" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send magic link'}
            </button>
            {error && <p className="auth-error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
