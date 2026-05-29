import { supabase } from '../lib/supabase';

const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

// ── helpers ──────────────────────────────────────────────────────────────────

export function todayStr() { return new Date().toISOString().slice(0, 10); }

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function toRow(entry) {
  return {
    id:              entry.id,
    word:            entry.word,
    source:          entry.source,
    phonetic:        entry.phonetic || '',
    audio_url:       entry.audioUrl || null,
    inflections:     entry.inflections || [],
    pos:             entry.pos || '',
    definition:      entry.definition || '',
    definition_en:   entry.definitionEn || '',
    examples:        entry.examples || [],
    idioms:          entry.idioms || [],
    compounds:       entry.compounds || [],
    added_date:      entry.addedDate,
    review_schedule: entry.reviewSchedule,
  };
}

function fromRow(row) {
  return {
    id:             row.id,
    word:           row.word,
    source:         row.source,
    phonetic:       row.phonetic,
    audioUrl:       row.audio_url,
    inflections:    row.inflections,
    pos:            row.pos,
    definition:     row.definition,
    definitionEn:   row.definition_en,
    examples:       row.examples,
    idioms:         row.idioms,
    compounds:      row.compounds,
    addedDate:      row.added_date,
    reviewSchedule: row.review_schedule,
  };
}

// ── words ─────────────────────────────────────────────────────────────────────

export async function getAllWords() {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('added_date', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function getWordById(id) {
  const { data, error } = await supabase
    .from('words').select('*').eq('id', id).single();
  if (error) return null;
  return fromRow(data);
}

export async function checkWordExists(word) {
  const { data } = await supabase
    .from('words').select('*').eq('word', word).maybeSingle();
  return data ? fromRow(data) : null;
}

export async function addWord(wordData) {
  const existing = await checkWordExists(wordData.word);
  if (existing) return existing;

  const today = todayStr();
  const entry = {
    id: Date.now().toString(),
    word:         wordData.word,
    source:       wordData.source,
    phonetic:     wordData.phonetic || '',
    audioUrl:     wordData.audioUrl || null,
    inflections:  wordData.inflections || [],
    pos:          wordData.pos || '',
    definition:   wordData.definition || '',
    definitionEn: wordData.definitionEn || '',
    examples:     wordData.examples || [],
    idioms:       wordData.idioms || [],
    compounds:    wordData.compounds || [],
    addedDate:    today,
    reviewSchedule: REVIEW_INTERVALS.map(days => ({
      date:   addDays(today, days),
      done:   false,
      result: null,
    })),
  };

  const { error } = await supabase.from('words').insert(toRow(entry));
  if (error) throw error;
  return entry;
}

export async function removeWord(id) {
  const { error } = await supabase.from('words').delete().eq('id', id);
  if (error) throw error;
}

export async function markReview(wordId, date, result) {
  const word = await getWordById(wordId);
  if (!word) return;
  const slot = word.reviewSchedule.find(r => r.date === date);
  if (!slot) return;
  slot.done   = true;
  slot.result = result;
  const { error } = await supabase
    .from('words')
    .update({ review_schedule: word.reviewSchedule })
    .eq('id', wordId);
  if (error) throw error;
}

export async function getDueWords() {
  const today = todayStr();
  const words = await getAllWords();
  return words.filter(w => w.reviewSchedule.some(r => !r.done && r.date <= today));
}

export async function getWordsByDate(date) {
  const { data, error } = await supabase
    .from('words').select('*').eq('added_date', date);
  if (error) throw error;
  return data.map(fromRow);
}

export async function getAddedDates() {
  const words = await getAllWords();
  return [...new Set(words.map(w => w.addedDate))].sort().reverse();
}

export async function getAddedCountByDate() {
  const words = await getAllWords();
  const map = {};
  for (const w of words) map[w.addedDate] = (map[w.addedDate] || 0) + 1;
  return map;
}

export async function getDueDateMap() {
  const today = todayStr();
  const words = await getAllWords();
  const map = {};
  for (const w of words)
    for (const r of w.reviewSchedule)
      if (!r.done && r.date >= today) map[r.date] = (map[r.date] || 0) + 1;
  return map;
}

// ── notes ─────────────────────────────────────────────────────────────────────

export async function getNote(wordId) {
  const { data } = await supabase
    .from('notes').select('text').eq('word_id', wordId).maybeSingle();
  return data?.text || '';
}

export async function saveNote(wordId, text) {
  if (text.trim()) {
    await supabase.from('notes').upsert({ word_id: wordId, text: text.trim() });
  } else {
    await supabase.from('notes').delete().eq('word_id', wordId);
  }
}
