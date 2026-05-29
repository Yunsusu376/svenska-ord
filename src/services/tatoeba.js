// Tatoeba public API — Swedish sentences with audio + English translations
const BASE = 'https://tatoeba.org/api_v0/search';
const AUDIO_BASE = 'https://tatoeba.org/en/audio/download';

export async function fetchSentences(word, limit = 6) {
  const url = `${BASE}?query=${encodeURIComponent(word)}&from=swe&page_size=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error('Tatoeba unavailable');
  const data = await res.json();

  const results = [];
  for (const s of (data.results || [])) {
    if (results.length >= limit) break;

    // Must have Swedish audio
    const audio = s.audios?.[0];
    if (!audio) continue;

    // Find first English translation
    let enText = '';
    for (const group of (s.translations || [])) {
      const arr = Array.isArray(group) ? group : [group];
      const en = arr.find(t => t.lang === 'eng' && t.text);
      if (en) { enText = en.text; break; }
    }

    results.push({
      id: s.id,
      sv: s.text,
      en: enText,
      audioUrl: `${AUDIO_BASE}/${audio.id}`,
    });
  }
  return results;
}
