import { useState } from 'react';
import { getAllWords } from '../services/wordbank';
import TatoebaClips from '../components/TatoebaClips';
import './ListenPage.css';

// Curated YouTube videos for Swedish learners, organised by level
const VIDEOS = [
  // A1
  {
    level: 'A1', tag: 'Beginner',
    title: 'Easy Swedish 1 — What do you do in summer?',
    channel: 'Easy Swedish',
    id: 'Ns79wE5bWCM',
    desc: 'Street interviews with real Swedes, slow and clear speech.',
  },
  {
    level: 'A1', tag: 'Beginner',
    title: 'Swedish in 7 Minutes',
    channel: 'SwedishPod101',
    id: 'psSN1LzJuOg',
    desc: 'Core everyday phrases with pronunciation guide.',
  },
  {
    level: 'A1', tag: 'Beginner',
    title: 'Swedish Listening for Absolute Beginners',
    channel: 'Lingo Mastery',
    id: 'IVT-_1f2zsQ',
    desc: 'Slow, clearly narrated stories for beginners.',
  },
  // A2
  {
    level: 'A2', tag: 'Elementary',
    title: 'Easy Swedish 5 — What do you eat?',
    channel: 'Easy Swedish',
    id: 'oQNFdmXQJgg',
    desc: 'Everyday vocabulary in natural conversations.',
  },
  {
    level: 'A2', tag: 'Elementary',
    title: 'Comprehensible Swedish — Daily Life',
    channel: 'Comprehensible Swedish',
    id: 'U7mRmm5WPIE',
    desc: 'Comprehensible input — slow narration with visuals.',
  },
  // B1
  {
    level: 'B1', tag: 'Intermediate',
    title: 'Easy Swedish 10 — What makes you happy?',
    channel: 'Easy Swedish',
    id: 'DRfkBNlUv0Q',
    desc: 'Longer interviews with a wider range of vocabulary.',
  },
  {
    level: 'B1', tag: 'Intermediate',
    title: 'Swedish With Christian — Conversation',
    channel: 'Swedish With Christian',
    id: 'QqWq3a6grWs',
    desc: 'Natural conversation practice at intermediate level.',
  },
  // B2
  {
    level: 'B2', tag: 'Upper Intermediate',
    title: 'SVT Nyheter — Short News Report',
    channel: 'SVT Nyheter',
    id: 'WTEfAMpEWNs',
    desc: 'Real Swedish news at native speed.',
  },
  {
    level: 'B2', tag: 'Upper Intermediate',
    title: 'Easy Swedish 20 — Politics',
    channel: 'Easy Swedish',
    id: 'O4hN3OtW4F8',
    desc: 'Authentic discussions on current topics.',
  },
  // C1
  {
    level: 'C1', tag: 'Advanced',
    title: 'Sommar i P1 — Long-form Radio Essay',
    channel: 'Sveriges Radio',
    id: 'fJR_eoIyISU',
    desc: 'Literary, personal essays broadcast on Swedish national radio.',
  },
];

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_COLOR = {
  A1: '#5a8c78', A2: '#6a9a6a',
  B1: '#8a7a50', B2: '#7a6a9a',
  C1: '#5a7a9a',
};

export default function ListenPage() {
  const [activeTab, setActiveTab] = useState('videos');
  const [levelFilter, setLevelFilter] = useState('All');
  const [selectedWord, setSelectedWord] = useState(null);
  const [videoErrors, setVideoErrors] = useState({});

  const words = getAllWords();
  const filtered = levelFilter === 'All' ? VIDEOS : VIDEOS.filter(v => v.level === levelFilter);

  return (
    <div className="listen-page">
      {/* Tab bar */}
      <div className="listen-tabs">
        <button
          className={`listen-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <img src="/stickers/07.png" className="tab-icon" alt="" />
          Watch & Listen
        </button>
        <button
          className={`listen-tab ${activeTab === 'words' ? 'active' : ''}`}
          onClick={() => setActiveTab('words')}
        >
          <img src="/stickers/09.png" className="tab-icon" alt="" />
          My Words in Context
        </button>
      </div>

      {/* ── Videos tab ── */}
      {activeTab === 'videos' && (
        <div className="tab-content">
          <div className="level-filter">
            {LEVELS.map(l => (
              <button
                key={l}
                className={`level-chip ${levelFilter === l ? 'active' : ''}`}
                style={levelFilter === l && l !== 'All' ? { background: LEVEL_COLOR[l], color: '#fff', borderColor: LEVEL_COLOR[l] } : {}}
                onClick={() => setLevelFilter(l)}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="videos-grid">
            {filtered.map(v => (
              <div key={v.id} className="video-card">
                <div className="video-embed-wrap">
                  {videoErrors[v.id] ? (
                    <div className="video-blocked">
                      <p>Preview unavailable</p>
                      <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="yt-link">
                        Watch on YouTube ↗
                      </a>
                    </div>
                  ) : (
                    <iframe
                      src={`https://www.youtube.com/embed/${v.id}?rel=0`}
                      className="video-embed"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={v.title}
                      onError={() => setVideoErrors(e => ({ ...e, [v.id]: true }))}
                    />
                  )}
                </div>
                <div className="video-info">
                  <div className="video-meta">
                    <span
                      className="video-level"
                      style={{ background: (LEVEL_COLOR[v.level] || '#888') + '18', color: LEVEL_COLOR[v.level] || '#888' }}
                    >
                      {v.level}
                    </span>
                    <span className="video-channel">{v.channel}</span>
                  </div>
                  <h4 className="video-title">{v.title}</h4>
                  <p className="video-desc">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="yt-note">
            Can't play a video? <a href="https://www.youtube.com/results?search_query=learn+swedish" target="_blank" rel="noreferrer">Search more on YouTube ↗</a>
          </p>
        </div>
      )}

      {/* ── Word audio tab ── */}
      {activeTab === 'words' && (
        <div className="tab-content">
          {words.length === 0 ? (
            <div className="words-empty">
              <img src="/stickers/08.png" className="empty-img" alt="" />
              <p>No words in your bank yet.</p>
              <p>Go to <strong>Lookup</strong> to add words — then hear them in real Swedish sentences here.</p>
            </div>
          ) : (
            <div className="word-audio-layout">
              {/* Word picker */}
              <div className="word-picker">
                <div className="picker-label">Your words</div>
                {words.map(w => (
                  <button
                    key={w.id}
                    className={`picker-word ${selectedWord === w.word ? 'active' : ''}`}
                    onClick={() => setSelectedWord(w.word)}
                  >
                    {w.word}
                  </button>
                ))}
              </div>

              {/* Clips panel */}
              <div className="clips-panel">
                {!selectedWord ? (
                  <div className="clips-placeholder">
                    <img src="/stickers/09.png" className="placeholder-img" alt="" />
                    <p>Select a word to hear it in native Swedish sentences</p>
                  </div>
                ) : (
                  <>
                    <div className="clips-word-header">
                      <h3>{selectedWord}</h3>
                      <span className="clips-source">Audio from Tatoeba</span>
                    </div>
                    <TatoebaClips word={selectedWord} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
