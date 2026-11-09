const DAYS = ['2026-11-08','2026-11-09','2026-11-10','2026-11-11','2026-11-12'];
const DAYNAME = {'2026-11-08':'Sun 8','2026-11-09':'Mon 9','2026-11-10':'Tue 10','2026-11-11':'Wed 11','2026-11-12':'Thu 12'};
const DAYFULL = {'2026-11-08':'Sunday, 8 November','2026-11-09':'Monday, 9 November','2026-11-10':'Tuesday, 10 November','2026-11-11':'Wednesday, 11 November','2026-11-12':'Thursday, 12 November'};
const TZ = 'CST', TZOFF = -6;   // Austin in November (DST ended Nov 1)
const TYCOLOR = {
 'Keynotes':'#d4a017','Early Career Keynotes':'#b8862b','Panel':'#5f8f4e','Orals':'#3d7eff','Spotlights':'#5a6fd6',
 'Posters':'#37718e','Late-Breaking Results':'#7e5266','Demos':'#a1567d','Workshops':'#2a9d8f','Tutorials':'#3f7368',
 'Sponsor Talks':'#8a5d4e','Recruitment Sessions':'#606c8c','Socials (external)':'#8e44ad','Ceremonies & Receptions':'#b0703c',
 'Breaks & Meals':'#556077','Logistics':'#4e5570','Exhibition':'#8a7350','Community':'#6b8f3f','Other':'#444a60'};
const clr = t => TYCOLOR[t] || '#444a60';
const TYDESC = {
 'Keynotes':'Headline talks — Burgard and Tedrake at the Hilton, Fei-Fei Li (+ fireside with Lisa Su) at Bass Hall.',
 'Early Career Keynotes':'30-minute talks by early-career researchers on the Hilton main stage.',
 'Panel':'The CoRL 2026 debate panel at Bass Hall.',
 'Orals':'Three 10-minute oral papers per session, Hilton Austin. Every oral also has a poster.',
 'Spotlights':'Nine 3-minute spotlight papers per session, Hilton Austin. Every spotlight also has a poster.',
 'Posters':'All 687 accepted papers. Posters #1–116 in Lone Star (JW L3), #117–232 in Griffin Hall (JW L2).',
 'Late-Breaking Results':'Late-breaking posters in Griffin Hall over lunch — Agentic Robotics (Mon), Real2Sim2Real (Tue).',
 'Demos':'Researcher demos in Lone Star / Griffin (JW Marriott). Times not posted — shown over exhibit hours.',
 'Workshops':'Half-day workshops on Thursday at the JW Marriott and the Hilton.',
 'Tutorials':'Hands-on tutorials on workshop day.',
 'Sponsor Talks':'10-minute Diamond sponsor talks on the Hilton main stage.',
 'Recruitment Sessions':'One-hour company recruiting sessions, JW Marriott rooms 302 / 307.',
 'Socials (external)':'Evening events hosted by companies outside the official program — times not posted, see host page.',
 'Ceremonies & Receptions':'Welcome, social dinner, dessert reception, awards and farewell.',
 'Breaks & Meals':'Coffee breaks and lunch.',
 'Logistics':'Badge pickup and shuttles.',
 'Exhibition':'Exhibit hall (Griffin Hall, JW Marriott L2) — see the Exhibition tab for the booth map.',
 'Community':'Community gatherings (registration required).',
 'Other':"Events that don't fit another program."};
function fmt(m){m=((m%1440)+1440)%1440;let h=Math.floor(m/60),mm=m%60,ap=h<12?'am':'pm';h=(h%12)||12;return h+(mm?':'+String(mm).padStart(2,'0'):'')+ap;}
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function lsGet(k,d){try{const v=localStorage.getItem(k);return v===null?d:v;}catch(_){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(_){}}

// ---- venues: two main hotels + Bass Hall / Long Center / off-site
const VENUES = [['hilton','Hilton'],['jw','JW Marriott'],['other','Bass Hall · Long Center · off-site']];
const VCLR = {hilton:'#e07a5f', jw:'#3d9be9', other:'#9c7cd4'};
function vkeys(v){const k=[];if(/Hilton/.test(v))k.push('hilton');if(/JW/.test(v))k.push('jw');if(!k.length)k.push('other');return k;}
function vshort(v){return /Hilton/.test(v)&&/JW/.test(v)?'Hilton+JW':/Hilton/.test(v)?'Hilton':/JW/.test(v)?'JW':/Bass/.test(v)?'Bass Hall':/Long/.test(v)?'Long Ctr':'off-site';}
function rshort(e){return e.r.replace(/(^|\s*·\s*)(Hilton Austin|JW Marriott|Hilton)(, Level 6| \(L\d\))?$/,'');}
function vtag(v){const k=vkeys(v)[0];return '<span class="vtag" style="border-color:'+VCLR[k]+';color:'+VCLR[k]+'">'+esc(vshort(v))+'</span>';}

// ---- picks (assets/picks.js)
const TOPIC = Object.fromEntries(TOPICS.map(t=>[t.id,t]));
const TOPSET = TOP_PICKS.map(p=>p.toLowerCase());
const topicsOf = txt => TOPICS.filter(t=>t.re.test(txt)&&!(t.not&&t.not.test(txt))).map(t=>t.id);
const dots = ids => ids.map(id=>'<span class="tdot" title="'+esc(TOPIC[id].label)+'" style="background:'+TOPIC[id].color+'"></span>').join('');

// derive display model from canonical EVENTS (assets/data.js, times in UTC → CST)
const EV = EVENTS.map(ev => {
  const s = new Date(Date.parse(ev.s_utc) + TZOFF*3600e3), en = new Date(Date.parse(ev.e_utc) + TZOFF*3600e3);
  let em = en.getUTCHours()*60 + en.getUTCMinutes();
  if (en.toISOString().slice(0,10) > s.toISOString().slice(0,10)) em += 1440;
  return {orig: ev, d: ev.day, sm: s.getUTCHours()*60 + s.getUTCMinutes(), em,
    ty: ev.type, t: ev.title, r: ev.room, u: ev.url, sp: ev.speakers, tg: ev.tags,
    v: ev.venue, vk: vkeys(ev.venue), g: ev.group, tba: !!ev.tba,
    num: +((ev.room.match(/^(?:Poster #|Board )(\d+)/)||[])[1]||0),
    pk: topicsOf(ev.title+' '+ev.group), top: TOPSET.some(p=>ev.title.toLowerCase().startsWith(p))};
});

const TABHASH={'#schedule':'sched','#exhibition':'expo','#recruiting':'rec'};
let day='all', view='tl', q='', venue='all', tab=TABHASH[location.hash]||(['expo','rec'].includes(lsGet('corl26tab','sched'))?lsGet('corl26tab','sched'):'sched');
// recruiting sessions live in their own tab; starred ones still show in the schedule
const REC='Recruitment Sessions';
// programs hidden via the matrix checkboxes (persisted)
const disabledTy = new Set(JSON.parse(lsGet('corl26hidety','[]')));
// external socials fold into one chip per day in the timeline; days listed here are unfolded
const socOpen = new Set();
function saveDisabled(){lsSet('corl26hidety', JSON.stringify([...disabledTy]));}
// picks filter: no topic selected → everything; selected topics → their union; ✦ narrows to top picks
const topicSel=new Set(); let topOnly=false;
const pickOn=()=>topOnly||topicSel.size>0;
const topicPass=pk=>!topicSel.size||pk.some(t=>topicSel.has(t));
function pickOK(e){return (!topOnly||e.top)&&topicPass(e.pk);}

// ---- favorites
let favMode=false, favOnly=false;
const FAV = new Set(JSON.parse(lsGet('corl26fav','[]')));
// favorites stay visible even when their program is hidden (matrix fav row)
let favAlways=lsGet('corl26favalways','1')!=='0';
function saveFavAlways(){lsSet('corl26favalways',favAlways?'1':'0');}
const fkey = e => e.d+'|'+e.sm+'|'+e.t;
function saveFav(){lsSet('corl26fav', JSON.stringify([...FAV]));}
function toggleFav(e){const k=fkey(e);FAV.has(k)?FAV.delete(k):FAV.add(k);saveFav();render();}
function favBox(e, cls){
  const cb=document.createElement('input');cb.type='checkbox';cb.className=cls;
  cb.checked=FAV.has(fkey(e));cb.title='mark as favorite';
  cb.onclick=ev=>{ev.preventDefault();ev.stopPropagation();toggleFav(e);};
  return cb;
}

// ---- search
function hayMatch(hay){return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>hay.toLowerCase().includes(w));}
function matches(e){
  if(!q)return true;
  return hayMatch(e.t+' '+e.ty+' '+e.r+' '+e.v+' '+e.g+' '+e.sp.join(' ')+' '+e.tg.join(' ')+' '+e.pk.map(t=>TOPIC[t].label).join(' '));
}
function markHit(el,e){ if(q) el.classList.add(matches(e)?'hit':'miss'); }
function visible(e){
  const fav=FAV.has(fkey(e));
  return (e.ty!==REC||fav) && (day==='all'||e.d===day) && (venue==='all'||e.vk.includes(venue)) &&
    (!disabledTy.has(e.ty)||(favAlways&&fav)) && (!favOnly||fav) && pickOK(e);
}

// ---- header stats & controls
const types = [...new Set(EV.filter(e=>e.ty!==REC).map(e=>e.ty))].sort((a,b)=>EV.filter(e=>e.ty===b).length-EV.filter(e=>e.ty===a).length);
document.getElementById('stats').innerHTML =
  '<span><b>'+EV.length+'</b>events</span><span><b>'+DAYS.length+'</b>days</span><span><b>'+types.length+'</b>program types</span>'+
  '<span><b>2</b>main venues + Bass Hall</span><span><b>'+EV.filter(e=>e.top).length+'</b>✦ top picks</span>'+
  '<span><b>'+EXHIBITORS.length+'</b>booths</span><span><b>'+EV.filter(e=>e.ty===REC).length+'</b>recruiting sessions</span>';
// phones open on today's day while the conference is on (five day columns are too wide for a phone)
if(matchMedia('(max-width:760px)').matches&&DAYS.includes(nowLocal().d))day=nowLocal().d;
const db=document.getElementById('daybtns');
['all',...DAYS].forEach(d=>{const b=document.createElement('button');b.className='day'+(d===day?' on':'');
  b.textContent=d==='all'?'All days':DAYNAME[d];b.onclick=()=>{day=d;[...db.children].forEach(x=>x.classList.toggle('on',x===b));render();};db.appendChild(b);});
const vb=document.getElementById('venuebtns');
[['all','All venues'],...VENUES].forEach(([k,l])=>{const b=document.createElement('button');b.className='venue'+(k==='all'?' on':'');
  b.innerHTML=(k==='all'?'':'<span class="vdot" style="background:'+VCLR[k]+'"></span>')+esc(l);
  b.onclick=()=>{venue=k;[...vb.children].forEach(x=>x.classList.toggle('on',x===b));render();};vb.appendChild(b);});
const bPick=document.getElementById('pickmode'), tb=document.getElementById('topicbtns'), bClear=document.getElementById('pickclear');
bClear.onclick=()=>{topicSel.clear();topOnly=false;render();};
bPick.onclick=()=>{topOnly=!topOnly;render();};
TOPICS.forEach(t=>{const b=document.createElement('button');b.className='topic';b.dataset.id=t.id;
  b.innerHTML='<span class="vdot" style="background:'+t.color+'"></span>'+esc(t.label);
  b.onclick=()=>{topicSel.has(t.id)?topicSel.delete(t.id):topicSel.add(t.id);render();};tb.appendChild(b);});
function updatePickUI(){
  bPick.classList.toggle('on',topOnly);
  bPick.textContent='✦ Top picks only';
  [...tb.children].forEach(b=>{const on=topicSel.has(b.dataset.id);b.classList.toggle('on',on);
    b.style.background=on?TOPIC[b.dataset.id].color+'33':'';b.style.borderColor=on?TOPIC[b.dataset.id].color:'';});
  bClear.style.display=pickOn()?'':'none';
}
document.getElementById('clearty').onclick=()=>{disabledTy.clear();saveDisabled();render();};
// tabs
const tSched=document.getElementById('tabsched'), tExpo=document.getElementById('tabexpo'), tRec=document.getElementById('tabrec');
tSched.onclick=()=>{tab='sched';lsSet('corl26tab',tab);render();};
tExpo.onclick=()=>{tab='expo';lsSet('corl26tab',tab);render();};
tRec.onclick=()=>{tab='rec';lsSet('corl26tab',tab);render();};
// foldable matrix
let mxFold = true;   // always start folded
const mxhdr=document.getElementById('mxhdr'), mxbox=document.getElementById('mxbox');
function applyFold(){mxhdr.classList.toggle('closed',mxFold);mxbox.style.display=mxFold?'none':'';}
mxhdr.onclick=()=>{mxFold=!mxFold;applyFold();};
applyFold();
const vtl=document.getElementById('vtl'),vlist=document.getElementById('vlist');
function setView(v){view=v;vtl.classList.toggle('on',v==='tl');vlist.classList.toggle('on',v==='list');}
vtl.onclick=()=>{setView('tl');render();};
vlist.onclick=()=>{setView('list');render();};
const bFavMode=document.getElementById('favmode'),bFavOnly=document.getElementById('favonly');
bFavMode.onclick=()=>{favMode=!favMode;render();};
bFavOnly.onclick=()=>{favOnly=!favOnly;render();};
document.getElementById('favexp').onclick=()=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify([...FAV],null,1)],{type:'application/json'}));
  a.download='corl26_favorites.json';a.click();URL.revokeObjectURL(a.href);
};
const favFile=document.getElementById('favfile');
document.getElementById('favimp').onclick=()=>favFile.click();
favFile.onchange=()=>{
  const f=favFile.files[0];favFile.value='';if(!f)return;
  f.text().then(txt=>{
    const arr=JSON.parse(txt);
    if(!Array.isArray(arr)||!arr.every(k=>typeof k==='string'))throw 0;
    const before=FAV.size;arr.forEach(k=>FAV.add(k));saveFav();render();
    alert('Imported '+(FAV.size-before)+' new favorite(s) — '+FAV.size+' total.');
  }).catch(()=>alert('Could not import: not a favorites JSON file (expected an array of strings).'));
};
function updateFavUI(){
  bFavMode.classList.toggle('on',favMode);
  bFavMode.textContent=favMode?'✓ Done':'✎ Edit';
  bFavOnly.classList.toggle('on',favOnly);
  bFavOnly.textContent='★ Favorites ('+[...FAV].filter(k=>!k.startsWith('booth|')).length+')';
}
// ---- floating search box with match navigation
const qInput=document.getElementById('q'), qCount=document.getElementById('qcount');
let qTimer=null, qHits=[], qIdx=0, qChanged=false;
qInput.oninput=()=>{clearTimeout(qTimer);qTimer=setTimeout(()=>{q=qInput.value.trim();qChanged=true;render();},250);};
qInput.onkeydown=ev=>{
  if(ev.key==='Enter'){ev.preventDefault();qNav(ev.shiftKey?-1:1);}
  if(ev.key==='Escape'){qInput.value='';q='';qChanged=true;render();qInput.blur();}
};
document.getElementById('qnext').onclick=()=>qNav(1);
document.getElementById('qprev').onclick=()=>qNav(-1);
function qNav(dir){if(!qHits.length)return;qIdx=(qIdx+dir+qHits.length)%qHits.length;focusHit();}
function focusHit(){
  const el=qHits[qIdx];if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  el.classList.remove('flash');void el.getBoundingClientRect();el.classList.add('flash');
  qCount.textContent=(qIdx+1)+'/'+qHits.length;
}
function updateSearchNav(){
  qHits=q?[...document.querySelectorAll('#'+({expo:'expo',rec:'rec'}[tab]||'agenda')+' .hit')]:[];
  if(!q){qCount.textContent='';return;}
  if(!qHits.length){qCount.textContent='0/0';return;}
  if(qChanged){qChanged=false;qIdx=0;focusHit();}
  else{qIdx=Math.min(qIdx,qHits.length-1);qCount.textContent=(qIdx+1)+'/'+qHits.length;}
}

// ---- matrix
function buildMatrix(){
  const mx=document.getElementById('mx');
  const cnt={}, dtot={};
  types.forEach(t=>{cnt[t]={};DAYS.forEach(d=>cnt[t][d]=0);});
  EV.forEach(e=>{if(!cnt[e.ty])return;cnt[e.ty][e.d]++;dtot[e.d]=(dtot[e.d]||0)+1;});
  let html='<thead><tr><th class="showbox-th"><input type="checkbox" class="showbox" id="showall" title="show/hide all programs"></th><th>Program</th>'+DAYS.map(d=>'<th>'+DAYNAME[d]+'</th>').join('')+'<th>Total</th></tr></thead><tbody>';
  const favCnt={};let favTot=0;
  EV.forEach(e=>{if(FAV.has(fkey(e))){favCnt[e.d]=(favCnt[e.d]||0)+1;favTot++;}});
  html+='<tr class="favrow">'+
    '<td class="showbox-td"><input type="checkbox" class="showbox" title="keep favorites visible even when their program is hidden"'+(favAlways?' checked':'')+'></td>'+
    '<td><span class="sw" style="background:#ffd54a"></span>★ My favorites<div class="tydesc">Events you starred. When ticked they stay on the calendar even if their program is hidden.</div></td>'+
    DAYS.map(d=>'<td><span class="cell" style="background:'+(favCnt[d]?'rgba(255,213,74,.22)':'transparent')+'">'+(favCnt[d]||'·')+'</span></td>').join('')+
    '<td class="tot">'+favTot+'</td></tr>';
  types.forEach(t=>{
    const tot=DAYS.reduce((a,d)=>a+cnt[t][d],0);
    const off=disabledTy.has(t);
    html+='<tr data-ty="'+esc(t)+'"'+(off?' class="off"':'')+'>'+
      '<td class="showbox-td"><input type="checkbox" class="showbox" title="show/hide these events"'+(off?'':' checked')+'></td>'+
      '<td><span class="sw" style="background:'+clr(t)+'"></span>'+esc(t)+(TYDESC[t]?'<div class="tydesc">'+esc(TYDESC[t])+'</div>':'')+'</td>';
    DAYS.forEach(d=>{const n=cnt[t][d];const a=n?Math.min(.85,.13+n/26):0;
      html+='<td><span class="cell" style="background:'+(n?'rgba(61,126,255,'+a.toFixed(2)+')':'transparent')+'">'+(n||'·')+'</span></td>';});
    html+='<td class="tot">'+tot+'</td></tr>';
  });
  html+='</tbody><tfoot><tr><td class="showbox-td"></td><td>All programs</td>'+DAYS.map(d=>'<td>'+(dtot[d]||0)+'</td>').join('')+'<td>'+DAYS.reduce((a,d)=>a+(dtot[d]||0),0)+'</td></tr></tfoot>';
  mx.innerHTML=html;
  mx.querySelectorAll('tbody tr').forEach(r=>{
    r.onclick=()=>{
      const t=r.dataset.ty;
      if(!t){favAlways=!favAlways;saveFavAlways();render();return;}   // favorites row
      disabledTy.has(t)?disabledTy.delete(t):disabledTy.add(t);
      saveDisabled();render();
    };
  });
  const sa=document.getElementById('showall');
  sa.checked=disabledTy.size===0;
  sa.indeterminate=disabledTy.size>0&&disabledTy.size<types.length;
  sa.onclick=ev=>{
    ev.stopPropagation();
    if(disabledTy.size)disabledTy.clear();          // any hidden → show all
    else types.forEach(t=>disabledTy.add(t));       // all shown → hide all
    saveDisabled();render();
  };
}

// current wall-clock in conference time (CST), same convention as EV times
function nowLocal(){const n=new Date(Date.now()+TZOFF*3600e3);
  return {d:n.toISOString().slice(0,10), m:n.getUTCHours()*60+n.getUTCMinutes()};}
setInterval(()=>{if(tab==='sched'&&view==='tl')render();},60000);   // keep the now-line moving

// ---- tooltip
const tip=document.getElementById('tip');
let tipXY=null;
const whenTxt = e => DAYFULL[e.d]+' · '+(e.tba?'time not posted':fmt(e.sm)+'–'+fmt(e.em)+' '+TZ);
function showTipHTML(html,ev){tip.innerHTML=html;tip.classList.add('show');moveTip(ev);}
function tipEvent(e){
  const dsc=e.orig.desc;
  return '<div class="tt">'+(FAV.has(fkey(e))?'★ ':'')+(e.top?'<span class="tpk">✦</span> ':'')+esc(e.t)+'</div>'+
    '<div class="row"><span class="k">When</span><b>'+whenTxt(e)+'</b></div>'+
    '<div class="row"><span class="k">Where</span><b>'+esc(e.r)+'</b> '+vtag(e.v)+'</div>'+
    '<div class="row"><span class="k">Program</span><b>'+esc(e.ty)+(e.g?' · '+esc(e.g):'')+'</b></div>'+
    (e.sp&&e.sp.length?'<div class="row"><span class="k">People</span><b>'+esc(e.sp.join(', '))+'</b></div>':'')+
    (dsc?'<div class="desc">'+esc(dsc)+'</div>':'')+
    (e.pk.length||e.tg.length?'<div class="chips">'+e.pk.map(id=>'<span class="chip" style="background:'+TOPIC[id].color+'33;color:'+TOPIC[id].color+'">'+esc(TOPIC[id].label)+'</span>').join('')+
      e.tg.slice(0,6).map(t=>'<span class="chip">'+esc(t)+'</span>').join('')+'</div>':'');
}
function tipGroup(u){
  const it=u.items, e0=it[0];
  const rooms=[...new Set(it.map(e=>e.r.replace(/^(Poster #\d+|Board \d+) · /,'')))];
  const shown=it.filter(e=>e.top||FAV.has(fkey(e))||(q&&matches(e))).sort((a,b)=>b.top-a.top||a.num-b.num);
  const nTop=it.filter(e=>e.top).length;
  return '<div class="tt">'+esc(u.g)+'</div>'+
    '<div class="row"><span class="k">When</span><b>'+whenTxt(e0)+'</b></div>'+
    '<div class="row"><span class="k">Where</span><b>'+esc(rooms.slice(0,3).join(' · ')+(rooms.length>3?' · …':''))+'</b> '+[...new Set(it.map(e=>e.v))].map(vtag).join(' ')+'</div>'+
    '<div class="row"><span class="k">Program</span><b>'+it.length+' × '+esc(e0.ty)+(nTop?' · <span class="tpk">✦ '+nTop+' top picks</span>':'')+'</b></div>'+
    (shown.length?'<ul class="glist">'+shown.slice(0,14).map(e=>'<li>'+(e.top?'<span class="tpk">✦</span> ':'')+(FAV.has(fkey(e))?'★ ':'')+
      (e.num?'<b>#'+e.num+'</b> ':'')+esc(e.t)+'</li>').join('')+(shown.length>14?'<li class="sub">+'+(shown.length-14)+' more</li>':'')+'</ul>':'')+
    '<div class="desc">Click to open the list of all '+it.length+' in List view.</div>';
}
function moveTip(ev){tipXY=ev;const p=14,w=tip.offsetWidth,h=tip.offsetHeight;let x=ev.clientX+p,y=ev.clientY+p;
  if(x+w>innerWidth-8)x=ev.clientX-w-p;if(y+h>innerHeight-8)y=Math.max(8,innerHeight-h-8);tip.style.left=x+'px';tip.style.top=y+'px';}
function hookTipFn(el,fn){el.onmouseenter=ev=>showTipHTML(fn(),ev);el.onmousemove=moveTip;el.onmouseleave=()=>tip.classList.remove('show');}
const hookTip=(el,e)=>hookTipFn(el,()=>tipEvent(e));

function filterInfo(){
  const shown=EV.filter(visible);
  let s=shown.length+' events · '+(day==='all'?'all days':DAYFULL[day])+
    (venue!=='all'?' · '+VENUES.find(x=>x[0]===venue)[1]:'')+
    (disabledTy.size?' · '+disabledTy.size+' program'+(disabledTy.size===1?'':'s')+' hidden':'')+
    (favOnly?' · favorites only':'')+(topicSel.size?' · topics: '+[...topicSel].map(t=>TOPIC[t].label).join(' ∪ '):'')+(topOnly?' · top picks only':'');
  if(q)s+=' · <span class="hitcount">'+shown.filter(matches).length+' match “'+esc(q)+'”</span>';
  return s;
}
function updateProgUI(){
  document.getElementById('tysel').textContent=disabledTy.size?(disabledTy.size+' hidden'):'';
  document.getElementById('clearty').classList.toggle('on',!disabledTy.size);
}

// ---- grouping: sessions (posters, orals, workshops …) collapse to one block in the timeline
const gkey = e => e.d+'|'+e.g+'|'+e.sm+'|'+e.em;
function units(list){
  const m=new Map(), out=[];
  for(const e of list){
    if(!e.g){out.push({one:e,sm:e.sm,em:e.em,tba:e.tba});continue;}
    let u=m.get(gkey(e));
    if(!u){u={g:e.g,key:gkey(e),items:[],sm:e.sm,em:e.em,tba:e.tba};m.set(u.key,u);out.push(u);}
    u.items.push(e);
  }
  out.forEach(u=>{if(u.items){const c={};u.items.forEach(e=>c[e.ty]=(c[e.ty]||0)+1);u.ty=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];}else u.ty=u.one.ty;});
  return out;
}
let pendingGroup=null;
function gotoGroup(u){pendingGroup=u.key;setView('list');render();}

// ---- agenda list
function buildAgenda(){
  const ag=document.getElementById('agenda');ag.innerHTML='';
  DAYS.forEach(d=>{
    if(day!=='all'&&day!==d)return;
    const list=EV.filter(e=>e.d===d&&visible(e)).sort((a,b)=>a.tba-b.tba||a.sm-b.sm||a.em-b.em||a.g.localeCompare(b.g)||a.num-b.num||a.t.localeCompare(b.t));
    const blk=document.createElement('div');blk.className='dayblock';
    blk.innerHTML='<div class="dayhdr"><span>'+DAYFULL[d]+'</span><span class="n">'+list.length+' event'+(list.length===1?'':'s')+'</span></div>';
    let lastG=null, prev=null;
    list.forEach(e=>{
      // venue change between consecutive favorites: the two hotels are a 10–15 min walk apart
      if(favOnly&&prev&&!prev.tba&&!e.tba&&!prev.vk.some(k=>e.vk.includes(k))&&e.sm-prev.em<20){
        const w=document.createElement('div');w.className='walk';
        w.textContent='⚠ venue change '+vshort(prev.v)+' → '+vshort(e.v)+' with '+Math.max(0,e.sm-prev.em)+' min between (hotels are a 10–15 min walk apart)';
        blk.appendChild(w);
      }
      prev=e;
      const gk=e.g?gkey(e):null;
      if(gk&&gk!==lastG){
        const n=list.filter(x=>x.g&&gkey(x)===gk).length;
        const h=document.createElement('div');h.className='grphdr';h.dataset.gk=gk;
        h.innerHTML='<span class="sw" style="background:'+clr(e.ty)+'"></span>'+esc(e.g)+' <span class="sub">'+(e.tba?'':fmt(e.sm)+'–'+fmt(e.em)+' · ')+n+' shown</span>';
        blk.appendChild(h);
      }
      lastG=gk;
      const a=document.createElement('a');a.className='evrow'+(gk?' ingrp':'');a.href=e.u;a.target='_blank';a.rel='noopener';
      if(FAV.has(fkey(e)))a.classList.add('faved');
      if(e.top)a.classList.add('top');
      markHit(a,e);
      a.innerHTML='<span class="tm">'+(e.tba?'time TBA':fmt(e.sm)+'–'+fmt(e.em))+'</span>'+
        '<span class="badge" style="background:'+clr(e.ty)+'">'+esc(e.ty)+'</span>'+
        '<span class="body"><span class="ti">'+(e.top?'<span class="tpk">✦</span> ':'')+esc(e.t)+'</span><div class="rm">'+vtag(e.v)+' '+esc(rshort(e))+
        (e.sp.length?' · '+esc(e.sp.slice(0,4).join(', '))+(e.sp.length>4?' …':''):'')+' '+dots(e.pk)+'</div></span>';
      if(favMode)a.insertBefore(favBox(e,'favbox2'),a.firstChild);
      hookTip(a,e);
      blk.appendChild(a);
    });
    if(!list.length)blk.innerHTML+='<div class="sub" style="padding:8px">no matching events</div>';
    ag.appendChild(blk);
  });
  document.getElementById('agendahdr').innerHTML='Agenda <span class="sub">'+filterInfo()+'</span>';
  if(pendingGroup){
    const h=[...ag.querySelectorAll('.grphdr')].find(x=>x.dataset.gk===pendingGroup);pendingGroup=null;
    if(h){h.scrollIntoView({block:'start'});scrollBy(0,-document.querySelector('header').offsetHeight-40);h.classList.add('flash');}
  }
}

// ---- timeline
const ONGOING_MIN = 300;           // units ≥5h (or with no posted time) shown as chips, not blocks
const PXMIN = 2.2;
function packColumns(list){
  const evs=list.slice().sort((a,b)=>a.sm-b.sm||b.em-a.em);
  let cluster=[],ends=[],clusterEnd=-1;
  const flush=()=>{const n=ends.length;cluster.forEach(e=>e._n=n);cluster=[];ends=[];clusterEnd=-1;};
  for(const e of evs){
    if(cluster.length&&e.sm>=clusterEnd)flush();
    let c=ends.findIndex(x=>x<=e.sm);
    if(c<0){c=ends.length;ends.push(e.em);}else ends[c]=e.em;
    e._c=c;cluster.push(e);clusterEnd=Math.max(clusterEnd,e.em);
  }
  if(cluster.length)flush();
  return evs;
}
function unitFlags(el,u){
  if(u.one){const e=u.one;if(FAV.has(fkey(e)))el.classList.add('faved');if(e.top)el.classList.add('top');markHit(el,e);return;}
  if(u.items.some(e=>FAV.has(fkey(e))))el.classList.add('faved');
  if(u.items.some(e=>e.top))el.classList.add('top');
  if(q)el.classList.add(u.items.some(matches)?'hit':'miss');
}
function unitLabel(u){
  const it=u.items, nTop=it.filter(e=>e.top).length, nFav=it.filter(e=>FAV.has(fkey(e))).length;
  return it.length+'×'+(nTop?' · ✦'+nTop:'')+(nFav?' · ★'+nFav:'');
}
function buildTimeline(){
  const ag=document.getElementById('agenda');ag.innerHTML='';
  // "All days": one column per day on a shared time axis (week view); single day: full width
  const cols=day==='all';
  const parts=DAYS.filter(d=>day==='all'||day===d).map(d=>{
    const list=EV.filter(e=>e.d===d&&visible(e));
    const us=units(list);
    const timed=packColumns(us.filter(u=>!(u.tba||u.em-u.sm>=ONGOING_MIN)));
    return {d,list,timed,ongoing:us.filter(u=>u.tba||u.em-u.sm>=ONGOING_MIN).sort((a,b)=>a.sm-b.sm),
      lanes:Math.max(0,...timed.map(u=>u._n))};
  });
  const allTimed=parts.flatMap(p=>p.timed);
  const range=ts=>ts.length?[Math.floor(Math.min(...ts.map(e=>e.sm))/60)*60,Math.ceil(Math.max(...ts.map(e=>e.em))/60)*60]:null;
  const shared=cols?range(allTimed):null;
  // in columns mode each day's width is proportional to its busiest moment (parallel lanes)
  const wrap=cols?document.createElement('div'):ag;
  if(cols){wrap.className='daycols';wrap.style.gridTemplateColumns=parts.map(p=>'minmax(0,'+Math.max(1.2,p.lanes)+'fr)').join(' ');ag.appendChild(wrap);}
  parts.forEach(({d,list,ongoing,timed},pi)=>{
    const hdr=document.createElement('div');hdr.className='dayhdr';
    hdr.innerHTML='<span>'+(cols?DAYNAME[d]:DAYFULL[d])+'</span><span class="n">'+list.length+' event'+(list.length===1?'':'s')+'</span>';
    const og=document.createElement('div');og.className='ongoing';
    if(ongoing.length){
      og.innerHTML='<span class="onglbl">All day / long / time TBA</span>';
      const isSoc=u=>u.one&&u.one.ty==='Socials (external)';
      const soc=ongoing.filter(isSoc), open=socOpen.has(d);
      const shown=ongoing.filter(u=>!isSoc(u)||open);
      if(soc.length){   // fold toggle for the day's external socials
        const t=document.createElement('a');t.href='#';t.className='ong fold';t.style.background=clr('Socials (external)');
        if(soc.some(u=>FAV.has(fkey(u.one))))t.classList.add('faved');
        if(q)t.classList.add(soc.some(u=>matches(u.one))?'hit':'miss');
        t.textContent=(open?'▾ ':'▸ ')+'Socials ('+soc.length+')'+(open?'':' · click to unfold');
        t.onclick=ev=>{ev.preventDefault();open?socOpen.delete(d):socOpen.add(d);render();};
        shown.splice(shown.findIndex(isSoc)>=0?shown.findIndex(isSoc):shown.length,0,{fold:t});
      }
      shown.forEach(u=>{
        if(u.fold){og.appendChild(u.fold);return;}
        const a=document.createElement('a');a.className='ong'+(isSoc(u)?' socitem':'');a.style.background=clr(u.ty);
        unitFlags(a,u);
        if(u.one){const e=u.one;a.href=e.u;a.target='_blank';a.rel='noopener';
          a.innerHTML=(e.top?'✦ ':'')+esc(e.t)+' · '+(e.tba?'time TBA':fmt(e.sm)+'–'+fmt(e.em))+' · '+esc(vshort(e.v))+(rshort(e)?' · '+esc(rshort(e)):'');
          if(favMode)a.insertBefore(favBox(e,'favbox3'),a.firstChild);
          hookTip(a,e);
        }else{a.href='#';a.onclick=ev=>{ev.preventDefault();gotoGroup(u);};
          a.innerHTML=esc(u.g)+' · '+fmt(u.sm)+'–'+fmt(u.em)+' · '+unitLabel(u);
          hookTipFn(a,()=>tipGroup(u));}
        og.appendChild(a);
      });
    }
    if(!list.length)og.innerHTML+='<div class="sub" style="padding:8px">no matching events</div>';
    const grid=document.createElement('div');grid.className='tlgrid'+(favMode?' favmode':'')+(pi===0?' first':'');
    const rg=shared||range(timed);
    if(rg){
      const [start,end]=rg;
      grid.style.height=((end-start)*PXMIN)+'px';
      for(let m=start;m<=end;m+=60){
        const y=(m-start)*PXMIN;
        const ln=document.createElement('div');ln.className='hourline';ln.style.top=y+'px';grid.appendChild(ln);
        const lb=document.createElement('div');lb.className='hourlbl';lb.style.top=y+'px';lb.textContent=fmt(m);grid.appendChild(lb);
      }
      const now=nowLocal();
      if(d===now.d&&now.m>=start&&now.m<=end){
        const nl=document.createElement('div');nl.className='nowline';nl.style.top=((now.m-start)*PXMIN)+'px';
        nl.innerHTML='<span class="nowlbl">'+fmt(now.m)+'</span>';
        grid.appendChild(nl);
      }
      timed.forEach(u=>{
        const a=document.createElement('a');a.className='tlev'+(u.items?' grp':'');a.style.background=clr(u.ty);
        unitFlags(a,u);
        const w=100/u._n;
        a.style.top=((u.sm-start)*PXMIN)+'px';
        a.style.height=Math.max(17,(u.em-u.sm)*PXMIN-2)+'px';
        a.style.left='calc('+(u._c*w)+'% + 2px)';
        a.style.width='calc('+w+'% - 5px)';
        if(u.one){const e=u.one;a.href=e.u;a.target='_blank';a.rel='noopener';
          a.innerHTML='<span class="tt2">'+(e.top?'✦ ':'')+esc(e.t)+'</span><span class="tm2">'+fmt(e.sm)+' · '+esc(vshort(e.v))+(rshort(e)?' · '+esc(rshort(e)):'')+'</span>';
          if(favMode)a.appendChild(favBox(e,'favbox'));
          hookTip(a,e);
        }else{a.href='#';a.onclick=ev=>{ev.preventDefault();gotoGroup(u);};
          const vs=[...new Set(u.items.map(e=>vshort(e.v)))].join(' + ');
          a.innerHTML='<span class="tt2">'+esc(u.g)+'</span><span class="tm2">'+fmt(u.sm)+' · '+esc(vs)+' · '+unitLabel(u)+'</span>';
          hookTipFn(a,()=>tipGroup(u));}
        grid.appendChild(a);
      });
    }
    if(cols){wrap.append(hdr,og,grid);return;}
    const blk=document.createElement('div');blk.className='dayblock';
    blk.append(hdr);if(og.childNodes.length)blk.append(og);if(rg)blk.append(grid);
    ag.appendChild(blk);
  });
  document.getElementById('agendahdr').innerHTML='Timeline <span class="sub">'+filterInfo()+' · hover for details · click a session block to list its papers</span>';
}

function render(){
  tip.classList.remove('show');
  tSched.classList.toggle('on',tab==='sched');tExpo.classList.toggle('on',tab==='expo');tRec.classList.toggle('on',tab==='rec');
  document.body.dataset.tab=tab;
  updateFavUI();updatePickUI();
  if(tab==='expo'){buildExpo();updateSearchNav();return;}
  if(tab==='rec'){buildRec();updateSearchNav();return;}
  updateProgUI();buildMatrix();(view==='tl'?buildTimeline:buildAgenda)();updateSearchNav();
}
// foldable menu: everything under the title except search; folded by default on phones
const bMenu=document.getElementById('menutog');
function setMenu(fold){document.body.classList.toggle('menufold',fold);bMenu.classList.toggle('on',!fold);setHdr();}
bMenu.onclick=()=>setMenu(!document.body.classList.contains('menufold'));
// sticky offsets follow the (wrapping) header height
function setHdr(){const h=document.querySelector('header');   // 0 when the header isn't sticky (phones)
  document.documentElement.style.setProperty('--hdr',(getComputedStyle(h).position==='sticky'?h.offsetHeight:0)+'px');}
addEventListener('resize',setHdr);
render();setMenu(matchMedia('(max-width:760px)').matches);
