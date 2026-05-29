// MyMemory free translation API — no key needed, 1000 req/day
const CACHE = new Map();

export async function translateSvEn(text) {
  if (!text?.trim()) return '';
  const key = text.trim();
  if (CACHE.has(key)) return CACHE.get(key);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(key)}&langpair=sv|en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return '';
    const data = await res.json();
    const result = data.responseData?.translatedText || '';
    // MyMemory sometimes returns the same text if it can't translate
    const translated = result === key ? '' : result;
    CACHE.set(key, translated);
    return translated;
  } catch {
    return '';
  }
}

export async function translateBatch(texts) {
  return Promise.all(texts.map(t => translateSvEn(t)));
}
