// Recruiting tab: company recruiting sessions (JW Marriott rooms 302 / 307, Level 3),
// one card per session, laid out day × time slot × room. Neutral on purpose: no picks styling here.
// Loaded after exhibit.js (uses XB / OTHER_ORGS) and before app.js; buildRec() runs from render().
function orgOf(name) {
  return XB.find(x => x.aka.test(name)) || OTHER_ORGS.find(o => o.aka.test(name)) || null;
}
function gotoBooth(b) {
  tab = 'expo'; lsSet('corl26tab', tab); render();
  const el = document.querySelector('#expo .booth[data-b="' + b + '"]');
  if (el) { el.scrollIntoView({block: 'center'}); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 2500); }
}
function buildRec() {
  const box = document.getElementById('rec');
  const rec = EV.filter(e => e.ty === REC);
  const days = DAYS.filter(d => rec.some(e => e.d === d));
  const rooms = [...new Set(rec.map(e => e.r.split(' · ')[0]))].sort();
  let html = '<div class="expohdr"><h2>Recruiting sessions · JW Marriott Level 3, ' + rooms.join(' & ') + '</h2>' +
    '<div class="sub">' + rec.length + ' one-hour company sessions (15 min changeover). Times in ' + TZ +
    '. Starred sessions also appear in your Schedule.</div></div><div class="recgrid">';
  for (const d of days) {
    const list = rec.filter(e => e.d === d);
    const slots = [...new Set(list.map(e => e.sm))].sort((a, b) => a - b);
    html += '<div class="recday"><h3><span>' + DAYFULL[d] + '</span><span class="sub">' + list.length + ' sessions</span></h3>' +
      '<div class="recslot recroomhdr"><span></span>' + rooms.map(r => '<span>' + esc(r) + '</span>').join('') + '</div>';
    for (const sm of slots) {
      const at = list.filter(e => e.sm === sm);
      html += '<div class="recslot"><span class="tm">' + fmt(sm) + '–' + fmt(at[0].em) + '</span>';
      for (const r of rooms) {
        const e = at.find(x => x.r.startsWith(r));
        if (!e) { html += '<span></span>'; continue; }
        const name = e.tg[0] || e.t.replace(/^Recruiting:\s*/, '');
        const o = orgOf(name), x = o && o.booth ? o : null;
        const talks = o ? EV.filter(t => t.ty === 'Sponsor Talks' && t.tg.some(g => o.aka.test(g))) : [];
        const cls = 'rcard' + (FAV.has(fkey(e)) ? ' faved' : '') + (q ? (matches(e) || (x && xMatch(x)) ? ' hit' : ' miss') : '');
        html += '<div class="' + cls + '" data-k="' + esc(fkey(e)) + '">' +
          '<button class="star' + (FAV.has(fkey(e)) ? ' on' : '') + '" title="star this session">' + (FAV.has(fkey(e)) ? '★' : '☆') + '</button>' +
          '<div class="co">' + esc(name) + '</div>' +
          '<div class="meta">' + (x ? '<a href="#" data-b="' + x.booth + '">Booth ' + x.booth + ' →</a>' : 'no booth') +
          talks.map(t => ' · talk ' + DAYNAME[t.d] + ' ' + fmt(t.sm)).join('') + '</div></div>';
      }
      html += '</div>';
    }
    html += '</div>';
  }
  box.innerHTML = html + '</div>';
  box.querySelectorAll('.rcard').forEach(el => {
    const e = rec.find(v => fkey(v) === el.dataset.k);
    const x = orgOf(e.tg[0] || '');
    hookTipFn(el, () => tipEvent(e) + (x && x.what ? '<div class="desc">' + esc(x.what) + '</div>' : ''));
    el.querySelector('.star').onclick = ev => { ev.stopPropagation(); toggleFav(e); };
    const a = el.querySelector('a[data-b]');
    if (a) a.onclick = ev => { ev.preventDefault(); gotoBooth(+a.dataset.b); };
  });
}
