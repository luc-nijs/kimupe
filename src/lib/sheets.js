// Publications and lectures come from two published Google Sheets (filled in the sheets
// themselves or through the Content Desk). Used when the site is built and again in the
// visitor's browser, which reads the sheets live, so a new row shows straight away.

// "File > Share > Publish to web > CSV" addresses. Empty = use the copy in src/data.
export const SHEETS = {
  publications: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQi9cnHKoIsxaefCjl-nO0ehIE3KPfc7v1brtluQfuMMeKJK66P_hDXN5EnrLT6y8UoO6msYRPht7Cr/pub?output=csv',
  lectures: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTGANZzOizejHJxyG5n2JFBPhvZbXvFgcC7PGyNKIohhpWzTkUojcZCa3r-9lv8dmRvyl6Ag-ZszBuh/pub?output=csv',
};

export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  return rows
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])))
    .filter((r) => !/^(no|n|false|0)$/i.test(r.publish || ''));
}

export const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const link = (href, text, cls = '') => {
  const ext = /^https?:/i.test(href);
  return `<a${cls ? ` class="${cls}"` : ''} href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
};
const end = (s) => (/[.!?"”]$/.test(s) ? s : s + '.');
const typeOf = (r) => String(r.type || '').toLowerCase();

// ---------- publications (APA style) ----------

// *text* in the sheet means italics. Without asterisks, the italics follow APA:
// the journal and volume for articles, the book title for books and chapters.
const stars = (s) => esc(s).replace(/\*([^*]+)\*/g, '<i>$1</i>');
const hasStars = (s) => /\*[^*]+\*/.test(s || '');

function title(r) {
  if (hasStars(r.title) || typeOf(r) !== 'book') return stars(r.title);
  // A book title in italics, a translation in [brackets] after it not.
  const m = /^(.*?)(\s*\[[^\]]*\])?$/.exec(r.title);
  return `<i>${esc(m[1])}</i>${esc(m[2] || '')}`;
}

function venue(r) {
  const v = r.venue || '';
  if (!v || hasStars(v)) return stars(v);
  if (/journal/.test(typeOf(r))) {
    // "Education Sciences, 15(9), Article 1245" -> journal and volume in italics.
    const m = /^([^,]+)(?:,\s*(\d+))?(.*)$/.exec(v);
    return `<i>${esc(m[1])}</i>${m[2] ? `, <i>${m[2]}</i>` : ''}${esc(m[3])}`;
  }
  // "In A. B. (Eds.), Book title (pp. 1–2). Publisher" -> book title in italics.
  const m = /^(In .*?\(Eds?\.\),\s*)(.*)$/.exec(v);
  if (!m) return esc(v);
  const rest = m[2];
  let cut = rest.indexOf(' (pp.');
  if (cut < 0) cut = rest.lastIndexOf('. ');
  if (cut < 0) cut = rest.length;
  return `${esc(m[1])}<i>${esc(rest.slice(0, cut))}</i>${esc(rest.slice(cut))}`;
}

// The year, or the status when it isn't published yet: "(in press)", "(invited, 2026)".
function when(r) {
  const s = (r.status || '').trim();
  if (!s || /^published$/i.test(s)) return esc(r.year || 'n.d.');
  if (/press|submitted|preparation/i.test(s) || !r.year) return esc(s);
  return `${esc(s)}, ${esc(r.year)}`;
}

export function publication(r) {
  let out = `${esc(r.authors)} (${when(r)}). ${end(title(r))}`;
  const v = venue(r);
  if (v) out += ' ' + end(v);
  if (r.doi) {
    const url = /^https?:/.test(r.doi) ? r.doi : 'https://doi.org/' + r.doi;
    out += ' ' + link(url, esc(url));
  } else if (r.link) {
    out += ' ' + link(r.link, r.isbn ? 'ISBN ' + esc(r.isbn) : esc(r.link), r.isbn ? 'plain' : '');
  }
  return `<p>${out}</p>`;
}

export const SECTIONS = [
  ['kinemusical approach', 'On the Kinemusical Approach'],
  ['background', 'Background literature'],
];
const sectionOf = (r) => /kinemusical/i.test(r.section || '') ? 'kinemusical approach' : 'background';

export const TYPE_ORDER = ['journal article', 'book', 'book chapter', 'conference paper',
  'editorial', 'professional article', 'report', 'thesis'];
export const TYPE_LABEL = {
  'journal article': 'Journal articles',
  book: 'Books',
  'book chapter': 'Book chapters',
  'conference paper': 'Conference papers',
  editorial: 'Editorials',
  'professional article': 'Professional and practitioner articles',
  report: 'Reports',
  thesis: 'Theses',
};

// Newest year first; within a year the order of the sheet stays.
const byYear = (a, b) => (parseInt(b.year, 10) || 9999) - (parseInt(a.year, 10) || 9999);

// Grouped list: mode 'section' (as on the Wix page), 'year' or 'type'.
export function publicationsHtml(recs, mode = 'section') {
  const buckets = new Map();
  if (mode === 'section') for (const [k] of SECTIONS) buckets.set(k, []);
  for (const r of recs) {
    const k = mode === 'section' ? sectionOf(r)
      : mode === 'type' ? (typeOf(r) || 'other')
      : (/^\d{4}/.test(r.year) ? r.year.slice(0, 4) : 'Undated / forthcoming');
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(r);
  }
  let keys = [...buckets.keys()];
  if (mode === 'type') keys.sort((a, b) => (TYPE_ORDER.indexOf(a) + 1 || 99) - (TYPE_ORDER.indexOf(b) + 1 || 99));
  if (mode === 'year') keys.sort((a, b) => (!/^\d/.test(a) ? -1 : !/^\d/.test(b) ? 1 : Number(b) - Number(a)));
  const label = (k) => mode === 'section' ? Object.fromEntries(SECTIONS)[k] : mode === 'type' ? (TYPE_LABEL[k] || k) : k;
  const out = [];
  for (const k of keys) {
    const items = buckets.get(k).sort(byYear);
    if (!items.length) continue;
    out.push(`<h2 class="subtitle">${esc(label(k))} <span class="count">${items.length}</span></h2>`);
    out.push(`<div class="refs">${items.map(publication).join('')}</div>`);
  }
  return out.join('') || '<p class="none">Nothing matches these filters.</p>';
}

export function filterPublications(recs, { type = '', from = 0, to = 9999, q = '' } = {}) {
  q = q.trim().toLowerCase();
  return recs.filter((r) => {
    if (type && typeOf(r) !== type) return false;
    const y = parseInt(r.year, 10);
    if (y && (y < from || y > to)) return false;   // undated items always stay
    if (q && ![r.authors, r.title, r.venue, r.type, r.year, r.doi, r.isbn].join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
}

export function countText(recs) {
  const withDoi = recs.filter((r) => r.doi).length;
  return `${recs.length} publication${recs.length === 1 ? '' : 's'} · ${withDoi} with DOI`;
}

// ---------- lectures (Dissemination page) ----------

const MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

// 2026-10-16 -> "Oct. 16, 2026", as written on the Wix page.
export function dateLabel(s) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s || '');
  return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : esc(s);
}

// Orange date ⎸ blue occasion and place, then the title, and an optional link.
export function lecture(r) {
  let where = r.occasion || '';
  if (r.location) where += (where ? ', ' : '') + r.location;
  if (r.country) where += ` (${r.country})`;
  if (/^(yes|y|true|1|online)$/i.test(r.online || '')) where += (where ? ', ' : '') + 'online';
  const more = r.link ? ` &nbsp;&nbsp;&nbsp;➛ ${link(r.link, 'ressources')}` : '';
  return `<p><span class="orange">${dateLabel(r.date)}</span> ⎸ <span class="blue">${esc(where)}</span> ${esc(r.title)}${more}</p>`;
}

// Newest first; on the same day the order of the sheet stays.
export function lecturesHtml(recs) {
  return [...recs].sort((a, b) => String(b.date).localeCompare(String(a.date))).map(lecture).join('');
}
