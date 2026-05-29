import { useState, useEffect, useRef } from 'react';
import { fetchSentences } from '../services/tatoeba';
import './TatoebaClips.css';

export default function TatoebaClips({ word }) {
  const [clips, setClips]     = useState([]);
  const [loading, setLoading] = useState(false);

  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!word) return;
    setLoading(true); setClips([]);
    fetchSentences(word)
      .then(setClips)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [word]);

  function play(clip) {
    if (!audioRef.current) return;
    audioRef.current.src = clip.audioUrl;
    audioRef.current.play().catch(() => {});
    setPlaying(clip.id);
    audioRef.current.onended = () => setPlaying(null);
  }

  if (loading) return (
    <div className="tatoeba-wrap">
      <div className="tatoeba-loading">Loading audio sentences…</div>
    </div>
  );

  if (clips.length === 0) return (
    <div className="tatoeba-wrap">
      <div className="tatoeba-empty">No audio sentences found for "{word}"</div>
    </div>
  );

  return (
    <div className="tatoeba-wrap">
      <div className="tatoeba-label">
        Native sentences · <a href={`https://tatoeba.org/en/sentences/search?query=${word}&from=swe`} target="_blank" rel="noreferrer">Tatoeba ↗</a>
      </div>
      <div className="clips-list">
        {clips.map(clip => (
          <div key={clip.id} className={`clip-row ${playing === clip.id ? 'playing' : ''}`}>
            <button
              className="play-btn"
              onClick={() => play(clip)}
              title="Play audio"
            >
              {playing === clip.id ? '▶' : '▷'}
            </button>
            <div className="clip-text">
              <span className="clip-sv">{clip.sv}</span>
              {clip.en && <span className="clip-en">{clip.en}</span>}
            </div>
          </div>
        ))}
      </div>
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
