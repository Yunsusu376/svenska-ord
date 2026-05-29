import { useState, useEffect } from 'react';
import { lookupWord } from '../services/dictionary';
import { addWord, checkWordExists } from '../services/wordbank';
import NoteEditor from '../components/NoteEditor';
import TatoebaClips from '../components/TatoebaClips';
import './SearchPage.css';

const POS_EN = {
  noun:'noun', verb:'verb', adjective:'adj.', adverb:'adv.',
  preposition:'prep.', conjunction:'conj.', pronoun:'pron.',
  interjection:'interj.', numeral:'num.', particle:'particle', abbreviation:'abbr.',
};

export default function SearchPage() {
  const [query, setQuery]         = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [bankEntry, setBankEntry] = useState(null); // existing or just-added entry

  // When a new result loads, check if it's already in the bank
  useEffect(() => {
    if (!result) { setBankEntry(null); return; }
    checkWordExists(result.word).then(setBankEntry);
  }, [result]);

  async function doSearch(word) {
    setLoading(true); setError(''); setResult(null); setBankEntry(null);
    try { setResult(await lookupWord(word)); }
    catch { setError('Word not found. Please check the spelling or try another form.'); }
    finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (q) doSearch(q);
  }

  async function handleAdd() {
    if (!result) return;
    const entry = await addWord(result);
    setBankEntry(entry);
  }

  const inBank    = !!bankEntry;
  const justAdded = bankEntry && !result?._wasAlreadyInBank;

  return (
    <div className="search-page">
      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a Swedish word… (hus, köpa, vacker…)"
          autoFocus spellCheck={false}
        />
        <button className="search-btn" type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div className="search-error">{error}</div>}

      {result && (
        <div className="result-card">
          <div className="result-header">
            <div className="result-word-row">
              <h2 className="result-word">{result.word}</h2>
              {result.phonetic && <span className="result-phonetic">[{result.phonetic}]</span>}
            </div>
            {result.wordEn && <span className="result-word-en">{result.wordEn}</span>}
            <div className="result-meta-row">
              {result.pos && <span className="pos-tag">{POS_EN[result.pos] || result.pos}</span>}
              {result.inflections?.length > 0 && (
                <span className="inflections">〈{result.inflections.join(', ')}〉</span>
              )}
              <a
                className={`source-badge source-${result.source}`}
                href={result.source === 'lexin'
                  ? `https://lexin.nada.kth.se/lexin/#searchinfo=search,swe_swe,${encodeURIComponent(result.word)}`
                  : `https://en.wiktionary.org/wiki/${encodeURIComponent(result.word)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {result.source === 'lexin' ? 'Lexin ↗' : 'Wiktionary ↗'}
              </a>
            </div>
          </div>

          <div className="add-row">
            {bankEntry ? (
              <span className="already-added">
                {justAdded ? '✓ Added to today\'s word bank' : '✓ Already in word bank'}
              </span>
            ) : (
              <button className="add-btn" onClick={handleAdd}>＋ Add to word bank</button>
            )}
          </div>

          {bankEntry && <NoteEditor wordId={bankEntry.id} />}

          <hr className="result-divider" />

          {result.definition && (
            <div className="def-section">
              <div className="section-label">Definition</div>
              <div className="def-block">
                <p className="def-sv">{result.definition}</p>
                {result.definitionEn && result.definitionEn !== result.definition && (
                  <p className="def-en">{result.definitionEn}</p>
                )}
              </div>
            </div>
          )}

          {result.examples?.length > 0 && (
            <div className="def-section">
              <div className="section-label">Examples</div>
              <div className="examples-list">
                {result.examples.map((ex, i) => (
                  <div key={i} className="example-item">
                    <span className="ex-sv">{ex.sv}</span>
                    {ex.en && <span className="ex-en">{ex.en}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.idioms?.filter(i => i.phrase).length > 0 && (
            <div className="def-section">
              <div className="section-label">Idioms</div>
              <div className="idioms-list">
                {result.idioms.filter(i => i.phrase).map((id, i) => (
                  <div key={i} className="idiom-item">
                    <span className="idiom-phrase">{id.phrase}</span>
                    {id.meaning   && <span className="idiom-sv">{id.meaning}</span>}
                    {id.meaningEn && <span className="idiom-en">{id.meaningEn}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.compounds?.length > 0 && (
            <div className="def-section">
              <div className="section-label">Compounds</div>
              <div className="compounds-wrap">
                {result.compounds.map((c, i) => (
                  <button key={i} className="compound-chip" onClick={() => {
                    const w = c.replace(/\|/g, '');
                    setQuery(w); doSearch(w);
                  }}>{c.replace(/\|/g, '')}</button>
                ))}
              </div>
            </div>
          )}

          <div className="def-section">
            <TatoebaClips word={result.word} />
          </div>

          {result.extraDefs?.length > 0 && (
            <details className="extra-defs-section">
              <summary>More definitions ({result.extraDefs.length})</summary>
              {result.extraDefs.map((d, i) => (
                <div key={i} className="extra-def-item">
                  <span className="pos-tag sm">{POS_EN[d.pos] || d.pos}</span>
                  <span className="extra-def-text">{d.definition}</span>
                </div>
              ))}
            </details>
          )}

        </div>
      )}

      {!result && !loading && !error && (
        <div className="search-hint">
          <div className="hint-illustration-wrap">
            <img src="/stickers/07.png" className="hint-illustration" alt="" />
            {[...Array(12)].map((_, i) => (
              <span key={i} className={`petal petal-${i}`}>🌻</span>
            ))}
          </div>
          <h3>Find every word in the book</h3>
          <p>Look up Swedish words — definitions, pronunciation & examples</p>
          <p className="hint-sub">Lexin (KTH) · Wiktionary · Auto English translation</p>
          <div className="hint-examples">
            {['hus', 'köpa', 'vacker', 'kärlek', 'springa'].map(w => (
              <button key={w} className="hint-chip" onClick={() => { setQuery(w); doSearch(w); }}>
                {w}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
