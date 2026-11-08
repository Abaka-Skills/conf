// Regenerate assets/data.js from the official CoRL 2026 site (www.corl.org).
// Usage: node corl26/tools/pull_official.mjs
// corl.org is a Google Sites page; each program table is an "embed code" block
// stored HTML-escaped in a data-code="…" attribute. We fetch the pages, unescape
// those blocks and regex-parse them into the same EVENTS shape siggraph26 uses,
// plus a few fields this planner adds: venue, group, desc, tba.
// Times on the site are Austin local (CST, UTC-6 in November); stored as UTC.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://www.corl.org';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'data.js');
const UA = { headers: {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
} };
const UTC_OFFSET_H = -6;   // CST
const MONTH_DAY = { '11/8': '2026-11-08', '11/9': '2026-11-09', '11/10': '2026-11-10', '11/11': '2026-11-11', '11/12': '2026-11-12' };
const DAY_BY_NAME = { Sunday: '2026-11-08', Monday: '2026-11-09', Tuesday: '2026-11-10', Wednesday: '2026-11-11', Thursday: '2026-11-12' };

const decode = s => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&middot;/g, '·').replace(/&times;/g, '×')
  .replace(/&rarr;/g, '→').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
  .replace(/&amp;/g, '&');
const text = h => decode(h.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
const one = s => s.replace(/\s+/g, ' ').trim();

async function fetchText(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.text();
}
// all embed-code blocks on a Google Sites page, unescaped once
async function embeds(path) {
  const html = await fetchText(BASE + path);
  return { html, codes: [...html.matchAll(/data-code="([^"]*)"/g)].map(m => decode(m[1])) };
}
const pick = (codes, needle) => {
  const c = codes.find(x => x.includes(needle));
  if (!c) throw new Error(`embed containing "${needle}" not found`);
  return c;
};

// "5:00 PM" / "5:00" + meridiem hint -> minutes after midnight
function mins(t, mer) {
  const m = t.trim().match(/^(\d{1,2})(?::(\d\d))?\s*(AM|PM)?$/i);
  if (!m) throw new Error('bad time ' + t);
  let h = +m[1] % 12; const ap = (m[3] || mer || '').toUpperCase();
  if (ap === 'PM') h += 12;
  return h * 60 + (+m[2] || 0);
}
// "10:30–11:00 AM", "11:30 AM–12:30 PM", "8:30 AM– 9:00 AM" -> [start, end] minutes
function range(s) {
  const [a, b] = decode(s).replace(/\s+/g, ' ').split(/\s*[–-]\s*/);
  const eMer = (b.match(/AM|PM/i) || [])[0];
  let sMer = (a.match(/AM|PM/i) || [])[0];
  if (!sMer) {   // "10:30–11:00 AM": same meridiem unless that would put start after end
    sMer = eMer;
    if (mins(a, sMer) > mins(b)) sMer = eMer === 'PM' ? 'AM' : 'PM';
  }
  return [mins(a, sMer), mins(b, eMer)];
}
const iso = (day, m) => new Date(Date.parse(day + 'T00:00:00Z') + (m - UTC_OFFSET_H * 60) * 60e3).toISOString().replace('.000Z', 'Z');
const ev = (day, [sm, em], o) => ({
  day, s_utc: iso(day, sm), e_utc: iso(day, em),
  type: o.type, psid: o.psid || 'none', ssid: 'none', title: o.title, url: o.url,
  room: o.room || '', venue: o.venue, group: o.group || '', speakers: o.speakers || [], tags: o.tags || [],
  ...(o.desc ? { desc: o.desc } : {}), ...(o.tba ? { tba: true } : {}),
});
function venueOf(s) {
  const hil = /Hilton(?! Garden)/.test(s), jw = /JW|Marriott|Griffin|Lone Star/.test(s);
  if (hil && jw) return 'Hilton + JW Marriott';
  if (hil) return 'Hilton Austin';
  if (jw) return 'JW Marriott';
  if (/Bass/.test(s)) return 'Bass Hall (UT)';
  if (/Long Center/.test(s)) return 'Long Center';
  return 'Off-site';
}
const posterRoom = n => n <= 116 ? 'Lone Star ballroom (L3)' : 'Griffin Hall (L2)';
const EVENTS = [];
const counts = {};
const add = e => { EVENTS.push(e); counts[e.type] = (counts[e.type] || 0) + 1; };

// ---- keynote / early-career pages: titles + abstracts by speaker name (plain Sites text)
function talksByName(html) {
  const t = text(html.replace(/<(p|div|h\d|li)\b/g, '\n<$1')).replace(/\n\s*\n+/g, '\n');
  const out = {};
  for (const m of t.matchAll(/\n([^\n]{3,40})\nTitle:\s*([^\n]+)\nAbstract:\s*([\s\S]*?)\nBio:/g))
    out[one(m[1])] = { title: one(m[2]), abstract: one(m[3]) };
  return out;
}
const KEY = talksByName((await embeds('/program/keynotes')).html);
const ECK = talksByName((await embeds('/program/early-career-keynotes')).html);

// panelists: linked names in the special-panel page headings
const PANEL = [...(await embeds('/program/special-panel')).html.matchAll(/<a class="XqQF9c"[^>]*><span[^>]*>(.*?)<\/span><\/a>/g)].map(m => one(text(m[1])));

// ---- main agenda (program page): plenary, breaks, keynotes, receptions
const prog = await embeds('/program');
const agenda = pick(prog.codes, 'class="agenda"');
const chairs = {};   // "Oral O1" -> chair
for (const day of agenda.split(/<section class="agday">/).slice(1)) {
  const dname = day.match(/<h2 id="\w+">(\w+),/)[1];
  const d = DAY_BY_NAME[dname];
  for (const it of day.matchAll(/<div class="item"><div class="when">(.*?)<\/div><div class="what event-([a-z-]+)">(.*?)<\/div><\/div>(?=\s*<div class="item"|\s*<\/section>)/gs)) {
    const [, when, cls, what] = it;
    const rng = range(text(when));
    const par = what.match(/<div class="parallel">(.*)$/s);
    const main = par ? what.slice(0, par.index) : what;
    const chair = (main.match(/Session Chair:\s*<strong>(.*?)<\/strong>/) || [])[1];
    const lines = text(main.replace(/<span class="chair">.*?<\/span>(<\/strong>)?/s, '')).split('\n').map(one).filter(Boolean);
    const where = (lines.find(l => /^\(.*\)$/.test(l)) || '').slice(1, -1);
    const label = lines[0];
    if (/^(Spotlight|Oral) /.test(label)) { chairs[label] = chair; continue; }       // from papers page
    if (cls === 'poster' || cls === 'sponsor' || cls === 'workshop') continue;       // from their own pages
    const url = BASE + '/program';
    if (cls === 'keynote' || cls === 'early-career') {
      const name = lines[1];
      const k = (cls === 'keynote' ? KEY : ECK)[name] || {};
      add(ev(d, rng, { type: cls === 'keynote' ? 'Keynotes' : 'Early Career Keynotes', psid: 'kn-' + name,
        title: `${label} · ${name}${k.title ? ': ' + k.title : ''}`, url: BASE + (cls === 'keynote' ? '/program/keynotes' : '/program/early-career-keynotes'),
        room: where, venue: venueOf(where), speakers: [name, ...(lines.join(' ').match(/Fireside Chat with ([^(]+)/) || [, ''])[1].split(/\s*,\s*/).map(x => x.trim()).filter(Boolean)],
        tags: chair ? ['Chair: ' + chair] : [], desc: k.abstract }));
      continue;
    }
    if (cls === 'panel') {
      add(ev(d, rng, { type: 'Panel', psid: 'panel', title: 'Special Panel (debate)', url: BASE + '/program/special-panel',
        room: where, venue: venueOf(where), speakers: PANEL, tags: chair ? ['Chair: ' + chair] : [] }));
      continue;
    }
    if (/^Closing Interlude/.test(label)) {
      // "Closing Interlude (5:00-5:15PM)" + "Awards & Farewell (Bass Hall)"
      add(ev(d, [rng[0], rng[0] + 15], { type: 'Ceremonies & Receptions', title: 'Closing Interlude', url, room: 'Bass Concert Hall', venue: 'Bass Hall (UT)' }));
      add(ev(d, [rng[0] + 15, rng[1]], { type: 'Ceremonies & Receptions', title: 'Awards & Farewell', url: BASE + '/program/awards', room: 'Bass Concert Hall', venue: 'Bass Hall (UT)' }));
      continue;
    }
    const full = lines.filter(l => !/^\(.*\)$/.test(l)).join(' ');
    const loc = where || (full.match(/\(([^)]+)\)/) || [, ''])[1];
    const type = { break: 'Breaks & Meals', lunch: 'Breaks & Meals', general: 'Ceremonies & Receptions', reception: 'Ceremonies & Receptions',
      social: /Transportation/.test(full) ? 'Logistics' : 'Ceremonies & Receptions' }[cls] || 'Other';
    add(ev(d, rng, { type, title: full.replace(/\s*\(([^)]+)\)\s*/g, ' ').replace(/\s+\+/g, ' +').trim(), url, room: loc, venue: venueOf(loc || full) }));
  }
}
// ---- accepted papers: oral/spotlight sessions (Hilton) + poster sessions (JW Marriott)
const papers = pick((await embeds('/program/accepted-papers')).codes, 'class="session');
const sessDay = s => MONTH_DAY[s.match(/(\d+\/\d+),/)[1]];
for (const sec of papers.matchAll(/<section class="session"[^>]*><h3 id="sess-(\w+)" class="(\w+)"><span class="tag">(.*?)<\/span>(.*?)<\/h3><p class="meta">(.*?)<\/p>(.*?)<\/section>/gs)) {
  const [, , kind, tag, theme, meta, body] = sec;
  const m = decode(meta);
  const d = sessDay(m), rng = range(m.match(/, ([^·]+?) ·/)[1]);
  const group = `${tag} · ${one(decode(theme))}`;
  for (const p of body.matchAll(/<li class="paper"><a href="([^"]+)"[^>]*>(.*?)<\/a><div class="pinfo">(.*?)<\/div>/gs)) {
    const poster = text(p[3]).replace(/^Poster:\s*/, '');
    add(ev(d, rng, { type: kind === 'oral' ? 'Orals' : 'Spotlights', psid: p[1].split('id=')[1],
      title: text(p[2]), url: decode(p[1]), room: 'Hilton Austin, Level 6', venue: 'Hilton Austin', group,
      tags: [chairs[tag] ? 'Chair: ' + chairs[tag] : '', 'Poster: ' + poster].filter(Boolean) }));
  }
}
for (const sec of papers.matchAll(/<section class="session poster" id="post-p(\d)">.*?<p class="meta">(.*?)<br>.*?<tbody>(.*?)<\/tbody>/gs)) {
  const [, n, meta, body] = sec;
  const m = decode(meta);
  const d = sessDay(m), rng = range(m.match(/, ([^·]+?) ·/)[1]);
  for (const r of body.matchAll(/<tr class="paper"><td class="num">(\d+)<\/td><td><a href="([^"]+)"[^>]*>(.*?)<\/a><\/td><td class="also">(.*?)<\/td>/gs)) {
    const no = +r[1];
    add(ev(d, rng, { type: 'Posters', psid: r[2].split('id=')[1], title: text(r[3]), url: decode(r[2]),
      room: `Poster #${no} · ${posterRoom(no)}`, venue: 'JW Marriott', group: `Poster Session ${n}`,
      tags: [text(r[4])].filter(Boolean).map(t => 'Also: ' + t) }));
  }
}

// ---- late-breaking results (Griffin, lunch)
const lbr = pick((await embeds('/program/late-breaking-results')).codes, 'class="lbr"');
for (const blk of lbr.matchAll(/<h3 id="[\w-]+" class="section-heading">(.*?)<\/h3>\s*<p class="meta">(.*?)<\/p>(.*?)<\/table>/gs)) {
  const meta = text(blk[2]);
  const d = DAY_BY_NAME[meta.match(/(Monday|Tuesday|Wednesday)/)[1]];
  const rng = range(meta.match(/(\d{1,2}:\d\d[–-]\d{1,2}:\d\d\s*[AP]M)/)[1]);
  for (const r of blk[3].matchAll(/<td class="board">(\d+)<\/td><td class="ttl"><a href="([^"]+)"[^>]*>(.*?)<\/a><\/td><td class="num">(\d+)<\/td>/gs))
    add(ev(d, rng, { type: 'Late-Breaking Results', psid: r[2].split('id=')[1], title: text(r[3]), url: decode(r[2]),
      room: `Board ${r[1]} · Griffin Hall (L2)`, venue: 'JW Marriott', group: 'LBR · ' + text(blk[1]), tags: ['LBR #' + r[4]] }));
}

// ---- researcher demos (days only on the site; shown across that day's exhibit hours)
const EXHIBIT = { '2026-11-09': [12 * 60, 18 * 60 + 30], '2026-11-10': [10 * 60, 18 * 60 + 30], '2026-11-11': [8 * 60 + 30, 13 * 60] };
const demos = pick((await embeds('/program/demos')).codes, 'class="demo"');
for (const g of demos.matchAll(/<section class="group" id="group-\d"><h3 class="section-heading">(.*?)<\/h3>(.*?)<\/section>/gs)) {
  const area = text(g[1]);
  for (const a of g[2].matchAll(/<article class="demo" id="demo-(\d+)">(.*?)<\/article>/gs)) {
    const body = a[2];
    const title = text(body.match(/<h4 class="demo-title">(.*?)<\/h4>/s)[1]);
    const badges = [...body.matchAll(/<span class="badge">(.*?)<\/span>/g)].map(x => text(x[1]));
    const field = k => one(text((body.match(new RegExp(`<strong>${k}:</strong>(.*?)</p>`, 's')) || [, ''])[1]));
    const where = text((body.match(/<p class="(?:loc|where)[^"]*">(.*?)<\/p>/s) || [, ''])[1]) ||
      (text(body).match(/(Pre-function[^\n]*|During the social[^\n]*)/) || [, ''])[1] || area;
    const paper = badges.find(b => /paper ID/.test(b));
    let days = badges.map(b => DAY_BY_NAME[(b.match(/^(\w+),/) || [])[1]]).filter(Boolean);
    const dinner = /Long Center|welcome dinner/i.test(where);
    if (dinner) days = ['2026-11-09'];
    for (const d of days)
      add(ev(d, dinner ? [19 * 60, 22 * 60] : EXHIBIT[d], { type: 'Demos', psid: 'demo-' + a[1], title: `Demo ${a[1]}: ${title}`,
        url: BASE + '/program/demos', room: one(where), venue: venueOf(where), group: dinner ? '' : 'Researcher demos',
        speakers: field('Presenters').split(/\s*,\s*/).filter(Boolean),
        tags: [field('Affiliation'), paper || ''].filter(Boolean),
        desc: dinner ? '' : 'Demo hours are not posted; shown across the exhibit hall hours for that day.' }));
  }
}

// ---- workshops (Thu 11/12; morning / afternoon)
const ws = pick((await embeds('/program/workshops')).codes, 'class="ws"');
for (const blk of ws.matchAll(/<h3 id="(morning|afternoon)" class="section-heading">.*?<span class="time">(.*?)<\/span>.*?<tbody>(.*?)<\/tbody>/gs)) {
  const rng = range(decode(blk[2]));
  for (const r of blk[3].matchAll(/<td class="wtitle"><a href="([^"]+)"[^>]*>(.*?)<\/a><\/td>\s*<td[^>]*><span class="vb[^"]*">(.*?)<\/span><\/td>\s*<td[^>]*class="room">(.*?)<\/td>/gs)) {
    const venue = venueOf(text(r[3]));
    add(ev('2026-11-12', rng, { type: /tutorial/i.test(text(r[2])) ? 'Tutorials' : 'Workshops', psid: 'ws-' + decode(r[1]),
      title: text(r[2]), url: decode(r[1]), room: `${text(r[4])} · ${text(r[3])}`, venue,
      group: `Workshops · ${blk[1] === 'morning' ? 'morning' : 'afternoon'}` }));
  }
}

// ---- diamond sponsor talks (Hilton)
const sp = pick((await embeds('/program/diamond-sponsor-talks')).codes, 'class="talkcard"');
for (const c of sp.matchAll(/<article class="talkcard"><div class="when"><span class="time">(.*?)<\/span><span class="dt">(\w+),.*?<\/span><\/div><div class="what">(.*?)<\/div><\/article>/gs)) {
  const w = c[3];
  const sponsor = text(w.match(/<div class="sponsor">(.*?)<\/div>/)[1]);
  const talk = text((w.match(/<div class="talk">(.*?)<\/div>/) || [, ''])[1]);
  const speakers = [...w.matchAll(/<div class="speaker"><strong>(.*?)<\/strong>/g)].map(x => text(x[1]));
  add(ev(DAY_BY_NAME[c[2]], range(c[1]), { type: 'Sponsor Talks', psid: 'sp-' + sponsor, title: `${sponsor}${talk ? ': ' + talk : ''}`,
    url: BASE + '/program/diamond-sponsor-talks', room: 'Hilton Austin, Level 6', venue: 'Hilton Austin', speakers, tags: [sponsor] }));
}

// ---- recruitment sessions (JW Marriott rooms 302 / 307)
const rec = pick(prog.codes, 'Recruitment Sessions');
for (const day of rec.matchAll(/<h3 id="day-\w+" class="section-heading">(\w+),.*?<\/h3>(.*?)<\/table>/gs)) {
  for (const r of day[2].matchAll(/<tr><td>(.*?)<\/td>((?:<td data-label="[^"]*">.*?<\/td>)+)<\/tr>/g))
    for (const c of r[2].matchAll(/<td data-label="([^"]*)">(.*?)<\/td>/g))
      if (text(c[2])) add(ev(DAY_BY_NAME[day[1]], range(r[1]), { type: 'Recruitment Sessions', psid: 'rec-' + text(c[2]),
        title: `Recruiting: ${text(c[2])}`, url: BASE + '/program', room: `${c[1]} · JW Marriott (L3)`, venue: 'JW Marriott', tags: [text(c[2])] }));
}

// ---- socials (hosted by external organizations; times not posted)
const soc = pick((await embeds('/program/socials')).codes, 'class="event"');
for (const day of soc.matchAll(/<h3 id="\w+" class="section-heading">(\w+),.*?<\/h3>\s*<div class="events">(.*?)<\/div>\s*(?=<h3|<\/main|<footer|$)/gs)) {
  for (const a of day[2].matchAll(/<article class="event">(.*?)<\/article>/gs)) {
    const host = text(a[1].match(/<div class="host">(.*?)<\/div>/s)[1]);
    const where = text((a[1].match(/<div class="venue"><span class="lbl">Venue<\/span>(.*?)<\/div>/s) || [, ''])[1]);
    const note = text((a[1].match(/<div class="enote">(.*?)<\/div>/s) || [, ''])[1]);
    const link = (a[1].match(/<a class="elink" href="([^"]+)"/) || [])[1];
    add(ev(DAY_BY_NAME[day[1]], [18 * 60, 23 * 60], { type: 'Socials (external)', psid: 'soc-' + host, title: `${host}${/afterparty/i.test(note + where) ? ' afterparty' : ' social'}`,
      url: link ? decode(link) : BASE + '/program/socials', room: where || 'Location on registration', venue: venueOf(where),
      tags: [host], desc: [note, 'Hosted outside the official program; time not posted, check the host page.'].filter(Boolean).join(' '), tba: true }));
  }
}

// ---- fixed items from the program / venue pages (not in an embed)
const fixed = [
  ['2026-11-08', '2:00 PM–8:00 PM'], ['2026-11-09', '7:30 AM–5:00 PM'], ['2026-11-10', '7:30 AM–5:00 PM'],
  ['2026-11-11', '9:00 AM–1:30 PM'], ['2026-11-12', '8:00 AM–1:30 PM']];
for (const [d, r] of fixed)
  add(ev(d, range(r), { type: 'Logistics', title: 'Badge pickup', url: BASE + '/attending/venue-information', room: 'Room 201 · JW Marriott (L2)', venue: 'JW Marriott' }));
for (const [d, [s, e]] of Object.entries(EXHIBIT))
  add(ev(d, [s, e], { type: 'Exhibition', psid: 'exhibit-' + d, title: 'Exhibit hall open', url: BASE + '/program', room: 'Griffin Hall · JW Marriott (L2)', venue: 'JW Marriott' }));
add(ev('2026-11-10', range('12:00 PM–1:30 PM'), { type: 'Community', title: 'Women & Allies Lunch (registration required)', url: BASE + '/attending/women-and-allies-lunch',
  room: 'Hilton Austin, room TBC', venue: 'Hilton Austin', tags: ['Sponsored by TRI'] }));

const byDay = {};
EVENTS.forEach(e => byDay[e.day] = (byDay[e.day] || 0) + 1);
console.log('per day:', byDay);
console.log('per type:', counts);
const header = `// CoRL 2026 — all ${EVENTS.length} events (sessions, papers, posters, demos, workshops, talks, socials), scraped from www.corl.org\n` +
  `// Canonical data file (times in UTC; the app converts to CST). Regenerate with tools/pull_official.mjs.\n`;
writeFileSync(OUT, header + 'const EVENTS = ' + JSON.stringify(EVENTS, null, 1) + ';\n');
console.log(`Wrote ${EVENTS.length} events to ${OUT}`);
