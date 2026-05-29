// Lexin dictionary (KTH) — primary source for Swedish
// Wiktionary — fallback
// MyMemory — translations of definitions & examples

import { translateSvEn, translateBatch } from './translate';

const LEXIN_BASE = 'https://lexin.nada.kth.se/lexin/service';
const CORS_PROXY = 'https://corsproxy.io/?url=';

const POS_MAP = {
  'subst.': 'noun',
  'verb': 'verb',
  'adj.': 'adjective',
  'adv.': 'adverb',
  'prep.': 'preposition',
  'konj.': 'conjunction',
  'pron.': 'pronoun',
  'interj.': 'interjection',
  'räkn.': 'numeral',
  'partikel': 'particle',
  'förk.': 'abbreviation',
};

export async function lookupWord(word) {
  let result = null;

  // Try Lexin direct, then via proxy, then Wiktionary
  try {
    result = await fetchLexin(word, false);
  } catch { /* CORS blocked */ }

  if (!result) {
    try {
      result = await fetchLexin(word, true);
    } catch { /* proxy failed */ }
  }

  if (!result) {
    result = await fetchWiktionary(word);
  }

  // Enrich with English translations (parallel)
  if (result.source === 'lexin') {
    const toTranslate = [
      result.word,
      result.definition,
      ...result.examples.map(e => e.sv),
      ...result.idioms.map(i => i.meaning),
    ];
    const translated = await translateBatch(toTranslate);
    let i = 0;
    result.wordEn = translated[i++] || '';
    result.definitionEn = translated[i++] || '';
    result.examples = result.examples.map(e => ({ ...e, en: translated[i++] || '' }));
    result.idioms = result.idioms.map(id => ({ ...id, meaningEn: translated[i++] || '' }));
  }

  if (!result.wordEn) {
    result.wordEn = await translateSvEn(result.word);
  }

  return result;
}

async function fetchLexin(word, useProxy) {
  const url = `${LEXIN_BASE}?searchinfo=search,swe_swe,${encodeURIComponent(word.toLowerCase())}&output=json`;
  const fetchUrl = useProxy ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;

  const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.Status !== 'found' || !data.Result?.length) return null;

  const entry = data.Result[0];
  const lexeme = entry.Lexeme?.[0] || {};

  const phonetic = entry.Phonetic?.[0]?.Content || '';
  const audioUrl = entry.Phonetic?.[0]?.File || null;
  const inflections = (entry.Inflection || []).map(i => i.Content).filter(Boolean);
  const posRaw = entry.Type || '';
  const pos = POS_MAP[posRaw] || posRaw;
  const definition = lexeme.Definition?.Content || '';
  const examples = (lexeme.Example || []).map(e => ({ sv: e.Content || '', en: '' }));
  const idioms = (lexeme.Idioms || []).map(i => ({
    phrase: i.Content || '',
    meaning: i.Definition?.Content || '',
    meaningEn: '',
  }));
  const compounds = (lexeme.Compound || []).map(c => c.Value || c.Content || c).filter(Boolean);

  if (!definition && examples.length === 0) return null;

  return {
    word: entry.Value || word,
    source: 'lexin',
    phonetic,
    audioUrl,
    inflections,
    pos,
    definition,
    definitionEn: '',
    examples,
    idioms,
    compounds,
  };
}

async function fetchWiktionary(word) {
  const res = await fetch(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error('Word not found');

  const data = await res.json();
  const entries = data['sv'] || data['en'] || [];
  if (!entries.length) throw new Error('Word not found');

  const defs = [];
  for (const entry of entries.slice(0, 3)) {
    for (const def of (entry.definitions || []).slice(0, 3)) {
      defs.push({
        pos: entry.partOfSpeech,
        definition: stripHtml(def.definition),
        examples: (def.examples || []).slice(0, 2).map(e => ({ sv: stripHtml(e), en: '' })),
      });
    }
  }

  if (!defs.length) throw new Error('Word not found');

  // Wiktionary returns English definitions already; translate examples sv→en if any
  const mainExamples = defs[0]?.examples || [];
  const translated = await translateBatch(mainExamples.map(e => e.sv));
  defs[0].examples = mainExamples.map((e, i) => ({ ...e, en: translated[i] || '' }));

  return {
    word: word.toLowerCase(),
    source: 'wiktionary',
    phonetic: '',
    audioUrl: null,
    inflections: [],
    pos: defs[0]?.pos || '',
    definition: defs[0]?.definition || '',
    definitionEn: defs[0]?.definition || '', // already English
    examples: defs[0]?.examples || [],
    idioms: [],
    compounds: [],
    extraDefs: defs.slice(1),
  };
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<a[^>]*>([^<]*)<\/a>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .trim();
}
