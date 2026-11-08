// Exhibition tab: two booth maps — Griffin Hall (JW Marriott L2) and Lone Star (JW L3) — plus the exhibitor list.
// Loaded before app.js; buildExpo() runs from app.js render() and uses its globals.
// Booth numbers 100–510 are in Griffin, 600–1207 in Lone Star.
const hallOf = b => b >= 600 ? 'lonestar' : 'griffin';
let hall = 'griffin';
// Griffin units follow the Freeman plan drawing (≈3.85 per foot); Lone Star is laid out from the on-site sign at 4 per foot.
const FT = {griffin: 3.85, lonestar: 4};
const BOOTH_GEO = (() => {
  const g = {}, xs = [410, 487, 603, 680, 796, 873];
  [[[510,508,506,504,502,500], 333, 37], [[410,408,406,404,402,400], 406, 77], [[210,208,205,204,202,200], 517, 38]]
    .forEach(([row, y, h]) => row.forEach((b, j) => g[b] = {x: xs[j], y, w: 77, h}));
  [[111,110,109,108], [107,106,105,104], [103,102,101,100]]
    .forEach((row, i) => row.forEach((b, j) => g[b] = {x: [410, 603, 796][i] + j * 38.5, y: 556, w: 38.5, h: 40}));
  // Lone Star: 4 blocks per row. Top blocks: two 10×10 rows over a 20×20. Bottom blocks per the sign.
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * 210, b2 = 2 * i;
    g[1200 + b2] = {x, y: 70, w: 40, h: 40}; g[1201 + b2] = {x: x + 40, y: 70, w: 40, h: 40};
    g[1100 + b2] = {x, y: 110, w: 40, h: 40}; g[1101 + b2] = {x: x + 40, y: 110, w: 40, h: 40};
    g[1000 + b2] = {x, y: 150, w: 80, h: 80};
    if (i === 0 || i === 3) {   // 20×10 / two 10×10 / 20×10
      g[800 + b2] = {x, y: 320, w: 80, h: 40};
      g[700 + b2] = {x, y: 360, w: 40, h: 40}; g[701 + b2] = {x: x + 40, y: 360, w: 40, h: 40};
      g[600 + b2] = {x, y: 400, w: 80, h: 40};
    } else {                    // 20×20 over 20×10
      g[800 + b2] = {x, y: 320, w: 80, h: 80};
      g[600 + b2] = {x, y: 400, w: 80, h: 40};
    }
  }
  return g;
})();
const BOOTH_SIZE = b => { const g = BOOTH_GEO[b], f = FT[hallOf(b)] * 10;
  return Math.round(g.w / f) * 10 + "'×" + Math.round(g.h / f) * 10 + "'"; };
const HALL = {griffin: 'Griffin Hall · JW Marriott Level 2', lonestar: 'Lone Star · JW Marriott Level 3'};
const HALL_BTN = {griffin: 'Griffin Hall · L2', lonestar: 'Lone Star · L3'};
const CAT_TOPIC = {'dex-hand':'dex', tactile:'dex', humanoid:'hum', 'teleop-data':'data', 'data-services':'data', rl:'rl', sim:'rl'};
const XB = EXHIBITORS.map(x => {
  const pk = [...new Set(x.cats.map(c => CAT_TOPIC[c]).filter(Boolean))];
  return {...x, pk, top: TOP_BOOTHS.includes(x.booth), key: 'booth|' + x.booth};
});
const ORG_TYPES = ['Sponsor Talks', 'Recruitment Sessions', 'Socials (external)'];
const orgEvents = aka => EV.filter(e => ORG_TYPES.includes(e.ty) && e.tg.some(t => aka.test(t)));
const evLine = e => esc(e.ty === 'Sponsor Talks' ? 'Talk' : e.ty === 'Recruitment Sessions' ? 'Recruiting' : 'Social') + ' · ' +
  DAYNAME[e.d] + ' ' + (e.tba ? 'evening (time TBA)' : fmt(e.sm)) + ' · ' + esc(e.r.replace(/ · JW Marriott \(L3\)/, ' (JW L3)'));
const xMatch = x => !q || hayMatch(x.name + ' ' + x.what + ' ' + x.cats.join(' ') + ' ' + x.booth);
const xPickOK = x => (!topOnly || x.top) && topicPass(x.pk);
// JW L2 meeting rooms under the hall: what runs there (workshops Thu, badge pickup in 201)
const ROOMS = [[201, 300, 105], [202, 405, 120], [203, 525, 110], [204, 635, 122], [205, 757, 118]];
const roomEvents = n => EV.filter(e => {
  const m = e.v === 'JW Marriott' && e.r.match(/^Rooms? (\d+)(?:–(\d+))?/);
  return m && n >= +m[1] && n <= +(m[2] || m[1]);
});

function tipExhibitor(x) {
  const evs = orgEvents(x.aka);
  return '<div class="tt">' + (FAV.has(x.key) ? '★ ' : '') + (x.top ? '<span class="tpk">✦</span> ' : '') + esc(x.name) + '</div>' +
    '<div class="row"><span class="k">Booth</span><b>' + x.booth + ' · ' + BOOTH_SIZE(x.booth) + ' · ' + HALL[hallOf(x.booth)] + '</b></div>' +
    '<div class="desc">' + esc(x.what) + '</div>' +
    (evs.length ? '<ul class="glist">' + evs.map(e => '<li>' + evLine(e) + '</li>').join('') + '</ul>' : '') +
    '<div class="chips">' + x.pk.map(id => '<span class="chip" style="background:' + TOPIC[id].color + '33;color:' + TOPIC[id].color + '">' + esc(TOPIC[id].label) + '</span>').join('') +
    x.cats.map(c => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>';
}
function svgText(x, y, w, s, size, cls) {
  // greedy word wrap to the booth width
  const max = Math.max(3, Math.floor((w - 4) / (size * 0.56))), lines = [];
  for (const word of s.split(/\s+/)) {
    const l = lines[lines.length - 1];
    if (l && (l + ' ' + word).length <= max) lines[lines.length - 1] = l + ' ' + word; else lines.push(word);
  }
  return '<text class="' + cls + '" x="' + x + '" y="' + (y - (lines.length - 1) * size * 0.55) + '" font-size="' + size + '">' +
    lines.map((l, i) => '<tspan x="' + x + '" dy="' + (i ? size * 1.1 : 0) + '">' + esc(l) + '</tspan>').join('') + '</text>';
}
function svgGriffin() {
  let s = '<svg viewBox="0 250 1020 720" class="plan" role="img" aria-label="Griffin Hall booth map">' +
    '<rect class="hall" x="160" y="265" width="840" height="435" rx="4"/>' +
    '<text class="lbl dim" x="580" y="258">service corridor</text>' +
    '<text class="hallname" x="680" y="505">GRIFFIN HALL</text>' +
    '<text class="lbl dim" x="580" y="728">PREFUNCTION — Demo 16 (Spot) runs in this hallway</text>' +
    '<rect class="aux" x="15" y="770" width="140" height="190" rx="3"/><text class="lbl" x="85" y="850">Coffee</text><text class="lbl" x="85" y="900">Lounge</text>' +
    '<rect class="aux" x="20" y="320" width="70" height="380" rx="3"/>' +
    '<text class="lbl dim" x="55" y="510" transform="rotate(-90 55 510)">stairs · escalators → L3 (Lone Star, rooms 301–311)</text>';
  for (const x0 of [212, 252, 300, 340]) s += '<rect class="boards" x="' + x0 + '" y="300" width="6" height="335"/>';
  s += '<text class="lbl" x="278" y="660">Poster boards</text><text class="lbl dim" x="278" y="676">posters #117–232 · LBR at lunch</text>';
  for (const [n, x0, w] of ROOMS) {
    const evs = roomEvents(n);
    s += '<g class="room" data-room="' + n + '"><rect x="' + x0 + '" y="770" width="' + w + '" height="190"/>' +
      '<text class="bno" x="' + (x0 + w / 2) + '" y="830" font-size="22">' + n + '</text>' +
      svgText(x0 + w / 2, 870, w, evs.length ? evs.map(e => e.ty === 'Logistics' ? 'Badge pickup' : e.t.split(/[:(—]/)[0]).filter((v, i, a) => a.indexOf(v) === i).join(' / ') : '', 9, 'rtxt') + '</g>';
  }
  return s;
}
function svgLoneStar() {
  return '<svg viewBox="0 0 930 520" class="plan" role="img" aria-label="Lone Star booth map">' +
    '<rect class="hall" x="30" y="30" width="870" height="450" rx="4"/>' +
    '<text class="hallname" x="465" y="282">LONE STAR</text>' +
    '<text class="lbl dim" x="465" y="470">Lone Star ballroom also holds posters #1–116 and researcher demos 1–8</text>';
}
function buildExpo() {
  const box = document.getElementById('expo');
  let s = hall === 'lonestar' ? svgLoneStar() : svgGriffin();
  for (const x of XB.filter(v => hallOf(v.booth) === hall)) {
    const g = BOOTH_GEO[x.booth], small = g.w < 50;
    const cls = 'booth' + (x.top ? ' top' : x.pk.length ? ' pk' : '') + (FAV.has(x.key) ? ' faved' : '') +
      (q ? (xMatch(x) ? ' hit' : ' miss') : '') + (xPickOK(x) ? '' : ' dim');
    s += '<g class="' + cls + '" data-b="' + x.booth + '"><rect x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '"/>' +
      svgText(g.x + g.w / 2, g.y + g.h / 2 - (small ? 3 : 2), g.w, x.name, small ? 7 : g.h > 60 ? 11.5 : 10, 'bname') +
      '<text class="bno" x="' + (g.x + 3) + '" y="' + (g.y + g.h - 3) + '" style="text-anchor:start" font-size="' + (small ? 7 : 9) + '">' + x.booth + '</text>' +
      (x.top ? '<text class="bstar tpk" x="' + (g.x + g.w - 3) + '" y="' + (g.y + 10) + '" style="text-anchor:end" font-size="9">✦</text>' : '') +
      (FAV.has(x.key) ? '<text class="bstar fav" x="' + (g.x + g.w - 3) + '" y="' + (g.y + g.h - 3) + '" style="text-anchor:end" font-size="9">★</text>' : '') + '</g>';
  }
  s += '</svg>';

  const sorted = XB.filter(x => hallOf(x.booth) === hall).sort((a, b) => b.top - a.top || b.pk.length - a.pk.length || b.booth - a.booth);
  const sec = (title, arr) => arr.length ? '<h3>' + title + ' <span class="sub">' + arr.length + '</span></h3>' + arr.map(x => {
    const evs = orgEvents(x.aka);
    return '<div class="xrow' + (x.top ? ' top' : '') + (q ? (xMatch(x) ? ' hit' : ' miss') : '') + (xPickOK(x) ? '' : ' dim') + '" data-b="' + x.booth + '">' +
      '<button class="star' + (FAV.has(x.key) ? ' on' : '') + '" data-k="' + x.key + '" title="star this booth">' + (FAV.has(x.key) ? '★' : '☆') + '</button>' +
      '<span class="bnum">' + x.booth + '</span><div class="xb"><a href="' + esc(x.url || '#') + '" target="_blank" rel="noopener">' +
      (x.top ? '<span class="tpk">✦</span> ' : '') + esc(x.name) + '</a> ' + dots(x.pk) + '<div class="what">' + esc(x.what) + '</div>' +
      evs.map(e => '<div class="xev">' + evLine(e) + '</div>').join('') + '</div></div>';
  }).join('') : '';
  const others = OTHER_ORGS.map(o => ({...o, evs: orgEvents(o.aka)})).filter(o => o.evs.length && (!q || hayMatch(o.name)));
  const list = sec('✦ Top picks', sorted.filter(x => x.top)) + sec('Topic matches', sorted.filter(x => !x.top && x.pk.length)) +
    sec('Other exhibitors', sorted.filter(x => !x.top && !x.pk.length)) +
    (others.length ? '<h3>No booth — talks, recruiting, socials <span class="sub">' + others.length + '</span></h3>' + others.map(o =>
      '<div class="xrow' + (q ? ' hit' : '') + '"><span class="bnum">—</span><div class="xb"><b>' + esc(o.name) + '</b>' +
      o.evs.map(e => '<div class="xev">' + evLine(e) + '</div>').join('') + '</div></div>').join('') : '');

  const hallBtn = h => { const n = XB.filter(x => hallOf(x.booth) === h), hits = q ? n.filter(xMatch).length : 0;
    return '<button data-hall="' + h + '"' + (h === hall ? ' class="on"' : '') + '>' + HALL_BTN[h] +
      ' <span class="sub">' + n.length + '</span>' + (hits ? ' <span class="hitcount">' + hits + ' match</span>' : '') + '</button>'; };
  box.innerHTML = '<div class="expohdr"><div class="seg">' + hallBtn('griffin') + hallBtn('lonestar') + '</div>' +
    '<h2>Exhibition · ' + HALL[hall] + '</h2>' +
    '<div class="sub">Open Mon 9 12:00–6:30pm · Tue 10 10am–6:30pm · Wed 11 8:30am–1pm (' + TZ + '). ' +
    (hall === 'griffin' ? 'Also in Griffin: posters #117–232 at every poster session, late-breaking boards at lunch Mon/Tue, researcher demos 9–15 (Mon–Tue).'
      : 'Also in Lone Star: posters #1–116 at every poster session, researcher demos 1–8 (Mon–Tue).') + '</div>' +
    '<div class="legend"><span><i class="lg top"></i>✦ top pick</span><span><i class="lg pk"></i>topic match</span><span><i class="lg"></i>other</span>' +
    '<span>★ starred (click ☆ in the list)</span><span class="sub">' +
    (hall === 'griffin' ? 'Floor plan rev. 10/22/2026' : 'Layout from the on-site Lone Star exhibits sign (Nov 8)') +
    ' — booths can still move; hover a booth for details.</span></div></div>' +
    '<div class="expogrid"><div class="planbox">' + s + '</div><div class="xlist">' + list + '</div></div>';

  box.querySelectorAll('button[data-hall]').forEach(b => b.onclick = () => { hall = b.dataset.hall; render(); });
  const byB = b => box.querySelector('.booth[data-b="' + b + '"]');
  box.querySelectorAll('.booth').forEach(el => {
    const x = XB.find(v => v.booth === +el.dataset.b);
    hookTipFn(el, () => tipExhibitor(x));
    el.onclick = () => { if (x.url) window.open(x.url, '_blank', 'noopener'); };
  });
  box.querySelectorAll('.room').forEach(el => {
    const evs = roomEvents(+el.dataset.room);
    hookTipFn(el, () => '<div class="tt">Room ' + el.dataset.room + ' · JW Marriott L2</div>' +
      (evs.length ? '<ul class="glist">' + evs.map(e => '<li>' + DAYNAME[e.d] + ' ' + fmt(e.sm) + '–' + fmt(e.em) + ' · ' + esc(e.t) + '</li>').join('') + '</ul>' : '<div class="desc">Nothing scheduled here in the program.</div>'));
  });
  box.querySelectorAll('.xrow[data-b]').forEach(el => {
    el.onmouseenter = () => byB(el.dataset.b)?.classList.add('hl');
    el.onmouseleave = () => byB(el.dataset.b)?.classList.remove('hl');
  });
  box.querySelectorAll('button.star').forEach(b => b.onclick = () => {
    const k = b.dataset.k; FAV.has(k) ? FAV.delete(k) : FAV.add(k); saveFav(); render();
  });
}
