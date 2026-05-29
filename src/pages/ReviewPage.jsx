import { useState, useEffect, useRef } from 'react';
import { getDueWords, markReview, todayStr } from '../services/wordbank';
import WordCalendar from '../components/WordCalendar';
import './ReviewPage.css';

export default function ReviewPage({ onGoBank }) {
  const [queue, setQueue]       = useState([]);
  const [index, setIndex]       = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone]         = useState(false);
  const [session, setSession]   = useState({ remembered: 0, forgotten: 0 });
  const [showCal, setShowCal]   = useState(false);
  const audioRef = useRef(null);

  function playAudio(url) {
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    }
  }

  async function loadQueue() {
    const due = await getDueWords();
    setQueue(due); setIndex(0);
    setRevealed(false); setDone(false);
    setSession({ remembered: 0, forgotten: 0 });
  }
  useEffect(() => { loadQueue(); }, []);

  async function handleResult(result) {
    const today = todayStr();
    const dueSlot = queue[index]?.reviewSchedule.find(r => !r.done && r.date <= today);
    if (dueSlot) await markReview(queue[index].id, dueSlot.date, result);
    setSession(s => ({
      remembered: s.remembered + (result === 'remembered' ? 1 : 0),
      forgotten:  s.forgotten  + (result === 'forgotten'  ? 1 : 0),
    }));
    if (index + 1 >= queue.length) setDone(true);
    else { setIndex(i => i + 1); setRevealed(false); }
  }

  const today = todayStr();
  const current = queue[index];
  const dueSlot = current?.reviewSchedule.find(r => !r.done && r.date <= today);
  const reviewNum = current ? current.reviewSchedule.findIndex(r => r === dueSlot) + 1 : 0;

  return (
    <div className="review-page">
      <div className="review-cal-section">
        <button className="cal-toggle-btn" onClick={() => setShowCal(v => !v)}>
          <span>📅 Word Bank Calendar</span>
          <span className="cal-toggle-arrow">{showCal ? '▲' : '▼'}</span>
        </button>
        {showCal && (
          <div className="cal-wrapper">
            <WordCalendar onSelectDate={date => { setShowCal(false); onGoBank(date); }} />
            <p className="cal-tip">Click a date to view words added that day</p>
          </div>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="review-empty">
          <img src="/stickers/daffodil-06.png" className="empty-img" alt="" />
          <h3>No words due today</h3>
          <p>Go to Lookup to add new words</p>
          <div className="interval-chips">
            {[1,2,4,7,15,30].map(d => <span key={d} className="interval-chip">+{d}d</span>)}
          </div>
          <p className="interval-label">Ebbinghaus spaced repetition schedule</p>
        </div>
      ) : done ? (
        <div className="review-done">
          <img src="/stickers/011.png" className="empty-img" alt="" />
          <h3>Session complete!</h3>
          <div className="session-stats">
            <div className="stat remembered">
              <span className="stat-n">{session.remembered}</span>
              <span className="stat-l">Remembered</span>
            </div>
            <div className="stat forgotten">
              <span className="stat-n">{session.forgotten}</span>
              <span className="stat-l">Forgotten</span>
            </div>
          </div>
          <button className="restart-btn" onClick={loadQueue}>Go again</button>
        </div>
      ) : (
        <>
          <div className="review-progress-row">
            <div className="review-progress">
              <div className="progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
            </div>
            <span className="review-counter">{index + 1}/{queue.length} · Review #{reviewNum}</span>
          </div>

          <div className="review-card">
            <div className="rv-word-row">
              <span className="rv-word">{current.word}</span>
              {current.audioUrl && (
                <button className="rv-audio" onClick={() => playAudio(current.audioUrl)}>🔊</button>
              )}
            </div>
            {current.phonetic && <span className="rv-phonetic">[{current.phonetic}]</span>}
            {current.inflections?.length > 0 && (
              <span className="rv-inflections">〈{current.inflections.join(', ')}〉</span>
            )}
            <p className="rv-hint">Do you remember what this word means?</p>

            {!revealed ? (
              <button className="reveal-btn" onClick={() => setRevealed(true)}>
                Show definition
              </button>
            ) : (
              <div className="rv-answer">
                {current.pos && <span className="rv-pos">{current.pos}</span>}
                <p className="rv-def-sv">{current.definition}</p>
                {current.definitionEn && current.definitionEn !== current.definition && (
                  <p className="rv-def-en">{current.definitionEn}</p>
                )}
                {current.examples?.[0] && (
                  <div className="rv-example">
                    <span className="rv-ex-sv">"{current.examples[0].sv}"</span>
                    {current.examples[0].en && (
                      <span className="rv-ex-en">"{current.examples[0].en}"</span>
                    )}
                  </div>
                )}
                {current.idioms?.[0]?.phrase && (
                  <div className="rv-idiom">
                    <strong>{current.idioms[0].phrase}</strong>
                    {current.idioms[0].meaningEn && ` — ${current.idioms[0].meaningEn}`}
                  </div>
                )}
                <div className="rv-btns">
                  <button className="btn-forgotten"  onClick={() => handleResult('forgotten')}>😵 Forgot</button>
                  <button className="btn-remembered" onClick={() => handleResult('remembered')}>😊 Got it</button>
                </div>
              </div>
            )}
          </div>
          <span className="rv-added-date">Added on {current.addedDate}</span>
        </>
      )}

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
