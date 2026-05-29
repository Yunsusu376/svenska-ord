import { useState, useEffect, useCallback } from 'react';
import { getAllWords, getAddedDates, removeWord, getDueWords, todayStr, getNote } from '../services/wordbank';
import NoteEditor from '../components/NoteEditor';
import './WordBankPage.css';

const INTERVALS = [1, 2, 4, 7, 15, 30];

export default function WordBankPage({ onGoReview, initialDate }) {
  const [words, setWords]       = useState([]);
  const [dates, setDates]       = useState([]);
  const [selected, setSelected] = useState(initialDate || null);
  const [dueCount, setDueCount] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes]       = useState({}); // wordId → note text

  const refresh = useCallback(async () => {
    const [allWords, allDates, dueWords] = await Promise.all([
      getAllWords(),
      getAddedDates(),
      getDueWords(),
    ]);
    setWords(allWords);
    setDates(allDates);
    setDueCount(dueWords.length);

    // Load notes for all words
    const noteEntries = await Promise.all(
      allWords.map(w => getNote(w.id).then(text => [w.id, text]))
    );
    setNotes(Object.fromEntries(noteEntries));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (initialDate) setSelected(initialDate); }, [initialDate]);

  const today = todayStr();
  const filtered = selected ? words.filter(w => w.addedDate === selected) : words;

  async function handleRemove(id) {
    if (!confirm('Remove this word from your bank?')) return;
    await removeWord(id);
    refresh();
  }

  return (
    <div className="bank-page">
      {dueCount > 0 && (
        <div className="due-banner" onClick={onGoReview}>
          <span><strong>{dueCount}</strong> word{dueCount > 1 ? 's' : ''} due for review today</span>
          <span className="go-review">Start review →</span>
        </div>
      )}

      <div className="bank-layout">
        <aside className="date-sidebar">
          <button
            className={`date-btn ${selected === null ? 'active' : ''}`}
            onClick={() => setSelected(null)}
          >
            <span>All</span>
            <span className="date-count">{words.length}</span>
          </button>
          {dates.map(d => (
            <button
              key={d}
              className={`date-btn ${selected === d ? 'active' : ''}`}
              onClick={() => setSelected(d)}
            >
              <span className="date-label">{formatDate(d)}</span>
              <span className="date-count">{words.filter(w => w.addedDate === d).length}</span>
              {d === today && <span className="today-dot" />}
            </button>
          ))}
        </aside>

        <div className="word-list">
          {selected && (
            <div className="list-header">
              <span>{formatDate(selected)}</span>
              <button className="clear-filter" onClick={() => setSelected(null)}>× All</button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="bank-empty">
              <img src="/stickers/08.png" className="bank-empty-img" alt="" />
              <p>No words yet — go to Lookup to add some</p>
            </div>
          )}

          {filtered.map(w => (
            <div key={w.id} className="word-item">
              <div className="word-row" onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
                <span className="word-sv">{w.word}</span>
                <span className="word-def-short">
                  {(w.definitionEn || w.definition)?.slice(0, 48)}
                  {(w.definitionEn || w.definition)?.length > 48 ? '…' : ''}
                </span>
                <div className="review-dots">
                  {INTERVALS.map((_, i) => {
                    const slot = w.reviewSchedule?.[i];
                    if (!slot) return null;
                    const isDue = !slot.done && slot.date <= today;
                    return <span key={i} className={`dot ${
                      slot.done
                        ? slot.result === 'remembered' ? 'dot-ok' : 'dot-fail'
                        : isDue ? 'dot-due' : 'dot-pending'
                    }`} title={`Review #${i+1}: ${slot.date}`} />;
                  })}
                </div>
                {notes[w.id] && <span className="note-indicator" title="Has note">📝</span>}
                <button className="remove-btn" onClick={e => { e.stopPropagation(); handleRemove(w.id); }}>×</button>
              </div>

              {expanded === w.id && (
                <div className="word-expand">
                  {w.pos && <span className="expand-pos">{w.pos}</span>}
                  {w.inflections?.length > 0 && (
                    <span className="expand-infl">〈{w.inflections.join(', ')}〉</span>
                  )}
                  {w.definition && <p className="expand-def-sv">{w.definition}</p>}
                  {w.definitionEn && w.definitionEn !== w.definition && (
                    <p className="expand-def-en">{w.definitionEn}</p>
                  )}
                  {w.examples?.[0] && (
                    <div className="expand-example">
                      <span className="expand-ex-sv">{w.examples[0].sv}</span>
                      {w.examples[0].en && <span className="expand-ex-en">{w.examples[0].en}</span>}
                    </div>
                  )}

                  <div className="expand-note">
                    <NoteEditor wordId={w.id} onSave={refresh} />
                  </div>

                  <div className="review-schedule">
                    {w.reviewSchedule?.map((r, i) => (
                      <div key={i} className={`sched-item ${
                        r.done ? (r.result === 'remembered' ? 'sched-ok' : 'sched-fail')
                               : r.date <= today ? 'sched-due' : 'sched-future'
                      }`}>
                        <span className="sched-n">+{INTERVALS[i]}d</span>
                        <span className="sched-date">{r.date.slice(5)}</span>
                        <span className="sched-status">
                          {r.done ? (r.result === 'remembered' ? '✓' : '✗') : r.date <= today ? 'due' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}
