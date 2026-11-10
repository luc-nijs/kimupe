// At build time, read a live sheet; if it can't be reached, use the copy in src/data.
import { parseCSV } from './sheets.js';

export async function load(url, fallback) {
  if (url) {
    try {
      const r = await fetch(url);
      if (r.ok) return parseCSV(await r.text());
    } catch {}
  }
  return parseCSV(fallback);
}
