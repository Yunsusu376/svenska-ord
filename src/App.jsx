import { useState, useEffect } from 'react';
import Nav from './components/Nav';
import SearchPage from './pages/SearchPage';
import WordBankPage from './pages/WordBankPage';
import ReviewPage from './pages/ReviewPage';
import AuthGate from './components/AuthGate';
import { useAuth } from './contexts/AuthContext';
import { useSound } from './hooks/useSound';
import { supabase } from './lib/supabase';
import './App.css';

export default function App() {
  const [tab, setTab]           = useState('search');
  const [bankDate, setBankDate] = useState(null);
  const { user } = useAuth();
  const { enabled, setEnabled, play } = useSound();

  useEffect(() => {
    function handleClick() { play(); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [play]);

  function goBank(date = null) {
    setBankDate(date);
    setTab('bank');
  }

  function goReview() { setTab('review'); }

  return (
    <AuthGate>
      <div className="app">
        <header className="app-header">
          <div className="header-inner">
            <div className="header-text">
              <h1>Svenska Ord</h1>
              <div className="tagline">Swedish Vocabulary</div>
            </div>
            <div className="header-deco">
              <img src="/stickers/014.png" className="header-img" alt="" />
              <img src="/stickers/02.png"  className="header-img" style={{height:42}} alt="" />
              <button
                className="sound-toggle"
                onClick={e => { e.stopPropagation(); setEnabled(v => !v); }}
                title={enabled ? 'Mute sounds' : 'Enable sounds'}
              >
                {enabled ? '🔊' : '🔇'}
              </button>
              {user && (
                <button
                  className="signout-btn"
                  onClick={() => supabase.auth.signOut()}
                  title={user.email}
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </header>

        <Nav active={tab} onChange={t => { setTab(t); if (t !== 'bank') setBankDate(null); }} />

        <main className="app-main">
          {tab === 'search' && <SearchPage />}
          {tab === 'bank'   && <WordBankPage onGoReview={goReview} initialDate={bankDate} />}
          {tab === 'review' && <ReviewPage  onGoBank={goBank} />}
        </main>
        <footer className="app-footer">🐾 Made by YUN</footer>
      </div>
    </AuthGate>
  );
}
