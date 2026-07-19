// Regenerate assets/data.js from the official schedule site.
// Usage: node siggraph26/tools/pull_official.mjs
// Fetches the per-day HTML snippets that s2026.conference-schedule.org itself
// lazy-loads (wp-content/linklings_snippets/wp_program_view_all_<date>.txt),
// parses the session rows and rewrites assets/data.js in the same format.
// (Must run outside the browser: the snippet files send no CORS headers.)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://s2026.conference-schedule.org';
const DAYS = ['2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23'];
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'data.js');
const UA = { headers: {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
} };

// Used when the schedule homepage (source of the live type filter) is
// unreachable — e.g. its WAF 415s requests from CI/datacenter IPs.
const FALLBACK_TYPE_NAMES = ['ACM SIGGRAPH 365', 'ACM SIGGRAPH Award Talks', 'Appy Hour',
  'Art Gallery', 'Art Papers', 'Birds of a Feather', 'Computer Animation Festival', 'Courses',
  "Educator's Day Sessions", "Educator's Forum", 'Emerging Technologies', 'Exhibition',
  'Frontiers', 'Games Summit', 'Immersive Pavilion', 'Industry Sessions', 'Keynote Speakers',
  'Panels', 'Pathfinders', 'Posters', 'Production Sessions', 'Real-Time Live!',
  'Spatial Storytelling', 'Stage Sessions', 'Talks', 'Technical Papers', 'Technical Workshops'];

const decode = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
const text = html => decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

async function fetchText(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.text();
}

// Event-type ids (evtt*/sstype*) -> display names, from the schedule page's
// type filter. Rows only carry singular labels ("Technical Paper"); the filter
// has the canonical plural ones the app's colors are keyed on.
async function fetchTypeMap() {
  try {
    const html = await fetchText(BASE + '/');
    const sel = html.match(/name=.etype_filt.(.*?)<\/select>/s);
    if (!sel) throw new Error('etype_filt select not found on schedule page');
    return Object.fromEntries(
      [...sel[1].matchAll(/<option value="((?:evtt|sstype)\d+)">(.*?)<\/option>/g)]
        .map(m => [m[1], decode(m[2])]));
  } catch (e) {
    console.warn(`type filter fetch failed (${e.message}); using built-in type names`);
    return Object.fromEntries(FALLBACK_TYPE_NAMES.map((n, i) => ['fallback' + i, n]));
  }
}

function parseDay(html, day, typeMap) {
  const typeNames = new Set(Object.values(typeMap));
  const events = [];
  for (const row of html.split(/(?=<tr class=")/)) {
    const m = row.match(/^<tr class="agenda-item[^"]*presentation-row[^"]*"((?:\s+[a-z_]+="[^"]*")*)>/);
    if (!m) continue;
    const at = Object.fromEntries([...m[1].matchAll(/([a-z_]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
    const title = row.match(/class="presentation-title">(.*?)<\/td>/s);
    const href = row.match(/class="presentation-title"><a[^>]*href="([^"]*)"/);
    // the row label is what the official site displays but is often singular
    // ("Technical Paper"); normalize to the filter's canonical plural name
    const label = (l => typeNames.has(l) ? l : typeNames.has(l + 's') ? l + 's' : '')
      (text((row.match(/class="event-type-name[^"]*">(.*?)<\/div>/s) || [, ''])[1]));
    const room = row.match(/class="presentation-location">(.*?)<\/span>/s);
    const speakers = [...row.matchAll(/class="presenter-name">(.*?)<\/div>/gs)].map(x => text(x[1]));
    const tagCell = row.match(/class="full-tag-td[^"]*">(.*?)<\/td>/s);
    const tags = tagCell ? [...tagCell[1].matchAll(/class="program-track[^"]*">(.*?)<\/div>/gs)].map(x => text(x[1])) : [];
    events.push({
      day, s_utc: at.s_utc, e_utc: at.e_utc,
      type: label
        || (at.etypes || '').split(/\s+/).map(id => typeMap[id]).find(Boolean)
        || 'Other',
      psid: at.psid || 'none', ssid: at.ssid || 'none',
      title: title ? text(title[1]) : '(untitled)',
      url: BASE + (href ? decode(href[1]) : `/?post_type=page&p=16&sess=${at.psid}`),
      room: room ? text(room[1]) : '', speakers, tags,
    });
  }
  return events;
}

const typeMap = await fetchTypeMap();
const all = [];
for (const day of DAYS) {
  const html = await fetchText(`${BASE}/wp-content/linklings_snippets/wp_program_view_all_${day}.txt?v=${Date.now()}`);
  const events = parseDay(html, day, typeMap);
  console.log(`${day}: ${events.length} events`);
  all.push(...events);
}
const header = `// SIGGRAPH 2026 — all ${all.length} session-level events, scraped from s2026.conference-schedule.org\n` +
  `// Canonical data file (times in UTC; the app converts to PDT). Regenerate with tools/pull_official.mjs.\n`;
writeFileSync(OUT, header + 'const EVENTS = ' + JSON.stringify(all, null, 1) + ';\n');
console.log(`Wrote ${all.length} events to ${OUT}`);
