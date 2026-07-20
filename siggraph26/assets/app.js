const DAYS = ['2026-07-19','2026-07-20','2026-07-21','2026-07-22','2026-07-23'];
const DAYNAME = {'2026-07-19':'Sun 19','2026-07-20':'Mon 20','2026-07-21':'Tue 21','2026-07-22':'Wed 22','2026-07-23':'Thu 23'};
const DAYFULL = {'2026-07-19':'Sunday, 19 July','2026-07-20':'Monday, 20 July','2026-07-21':'Tuesday, 21 July','2026-07-22':'Wednesday, 22 July','2026-07-23':'Thursday, 23 July'};
const TYCOLOR = {
 'Technical Papers':'#3d7eff','Courses':'#2a9d8f','Talks':'#4f7058','Panels':'#5f8f4e',
 'Birds of a Feather':'#556077','Industry Sessions':'#8a5d4e','Production Sessions':'#b0703c',
 'Keynote Speakers':'#d4a017','ACM SIGGRAPH Award Talks':'#d4a017','Real-Time Live!':'#c0392b',
 'Computer Animation Festival':'#8e44ad','Electronic Theater':'#8e44ad','Art Gallery':'#a1567d','Art Papers':'#a1567d',
 'Emerging Technologies':'#3f7368','Immersive Pavilion':'#456a78','Spatial Storytelling':'#5d5780',
 'Frontiers':'#7e5266','Games Summit':'#7f5570','Posters':'#4a5568','Technical Workshops':'#37718e',
 "Educator's Forum":'#6b8f3f',"Educator's Day Sessions":'#6b8f3f','ACM SIGGRAPH 365':'#606c8c',
 'Exhibition':'#8a7350','Appy Hour':'#3f7368','Pathfinders':'#8a7350','Other':'#444a60'};
const clr = t => TYCOLOR[t] || '#444a60';
const TYDESC = {
 'Technical Papers':'Peer-reviewed research presentations — the core scientific program.',
 'Courses':'In-depth tutorials taught by experts, from introductory to advanced.',
 'Talks':'Short presentations of techniques, tools, and work in progress from research and production.',
 'Panels':'Moderated discussions where experts debate current topics.',
 'Birds of a Feather':'Informal community meetups around a shared interest.',
 'Industry Sessions':'Company-hosted presentations of tools, pipelines, and tech.',
 'Production Sessions':'Behind-the-scenes breakdowns of films, games, and VFX by the teams who made them.',
 'Keynote Speakers':'Headline addresses from leaders in graphics and interactive techniques.',
 'ACM SIGGRAPH Award Talks':"Talks by this year's ACM SIGGRAPH award recipients.",
 'Real-Time Live!':'Live on-stage demos of cutting-edge real-time graphics — rendered live, no cheating.',
 'Computer Animation Festival':"Juried festival showcasing the year's best animated shorts and VFX.",
 'Electronic Theater':"The Computer Animation Festival's flagship curated screening.",
 'Art Gallery':'Curated exhibition of digital, interactive, and media artworks.',
 'Art Papers':'Peer-reviewed papers at the intersection of art, science, and technology.',
 'Emerging Technologies':'Hands-on demos of novel displays, haptics, robotics, and interfaces.',
 'Immersive Pavilion':'VR, AR, and mixed-reality experiences you can try on the floor.',
 'Spatial Storytelling':'Immersive and location-based narrative works.',
 'Frontiers':'Talks and workshops connecting graphics with frontier fields like AI, medicine, and space.',
 'Games Summit':'Sessions dedicated to game development and interactive entertainment.',
 'Posters':'Research posters on display all week — meet the authors at scheduled sessions.',
 'Technical Workshops':'Interactive workshops digging into emerging research areas.',
 "Educator's Forum":'Sessions for teachers of graphics and interactive media.',
 "Educator's Day Sessions":'A focused day of programming for educators.',
 'ACM SIGGRAPH 365':'Community, committee, and networking events run by ACM SIGGRAPH.',
 'Exhibition':'The trade-show floor: vendors, studios, and hardware.',
 'Appy Hour':'Social hour where indie developers demo mobile and casual apps.',
 'Pathfinders':'Mentoring and guided experiences for students and newcomers.',
 'Stage Sessions':'Exhibitor talks on the Exhibition stage.',
 'Other':"Events that don't fit another program."};
function fmt(m){m=((m%1440)+1440)%1440;let h=Math.floor(m/60),mm=m%60,ap=h<12?'am':'pm';h=(h%12)||12;return h+(mm?':'+String(mm).padStart(2,'0'):'')+ap;}
function esc(s){return (s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

// derive display model from canonical EVENTS (assets/data.js, times in UTC → PDT)
const HIDDEN_TAGS = ['Full Conference','Full Conference Supporter','Experience','Exhibits Only'];
const EV = EVENTS.map(ev => {
  const s = new Date(Date.parse(ev.s_utc) - 7*3600e3), en = new Date(Date.parse(ev.e_utc) - 7*3600e3);
  let em = en.getUTCHours()*60 + en.getUTCMinutes();
  if (en.toISOString().slice(0,10) > s.toISOString().slice(0,10)) em += 1440;
  return {orig: ev, d: ev.day, sm: s.getUTCHours()*60 + s.getUTCMinutes(), em,
    ty: ev.type, t: ev.title, r: ev.room, u: ev.url, sp: ev.speakers,
    tg: ev.tags.filter(t => !HIDDEN_TAGS.includes(t))};
});

let day='all', view='tl', q='';
// programs hidden via the matrix checkboxes (persisted)
const disabledTy = new Set(JSON.parse(localStorage.getItem('sig26hidety')||'[]'));
function saveDisabled(){localStorage.setItem('sig26hidety', JSON.stringify([...disabledTy]));}

// ---- favorites
let favMode=false, favOnly=false;
const FAV = new Set(JSON.parse(localStorage.getItem('sig26fav')||'[]'));
const fkey = e => e.d+'|'+e.sm+'|'+e.t;
function saveFav(){localStorage.setItem('sig26fav', JSON.stringify([...FAV]));}
function toggleFav(e){const k=fkey(e);FAV.has(k)?FAV.delete(k):FAV.add(k);saveFav();render();}
function favBox(e, cls){
  const cb=document.createElement('input');cb.type='checkbox';cb.className=cls;
  cb.checked=FAV.has(fkey(e));cb.title='mark as favorite';
  cb.onclick=ev=>{ev.preventDefault();ev.stopPropagation();toggleFav(e);};
  return cb;
}

// ---- search
function matches(e){
  if(!q)return true;
  const hay=(e.t+' '+e.ty+' '+e.r+' '+e.sp.join(' ')+' '+e.tg.join(' ')).toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>hay.includes(w));
}
function markHit(el,e){ if(q) el.classList.add(matches(e)?'hit':'miss'); }
function visible(e){
  return (day==='all'||e.d===day) && !disabledTy.has(e.ty) && (!favOnly||FAV.has(fkey(e)));
}

// ---- header stats & controls
const types = [...new Set(EV.map(e=>e.ty))].sort((a,b)=>EV.filter(e=>e.ty===b).length-EV.filter(e=>e.ty===a).length);
document.getElementById('stats').innerHTML =
  '<span><b>'+EV.length+'</b>events</span><span><b>5</b>days</span><span><b>'+types.length+'</b>program types</span>'+
  '<span><b>'+[...new Set(EV.map(e=>e.r))].length+'</b>venues</span>';
const db=document.getElementById('daybtns');
['all',...DAYS].forEach(d=>{const b=document.createElement('button');b.className='day'+(d==='all'?' on':'');
  b.textContent=d==='all'?'All days':DAYNAME[d];b.onclick=()=>{day=d;[...db.children].forEach(x=>x.classList.toggle('on',x===b));render();};db.appendChild(b);});
document.getElementById('clearty').onclick=()=>{disabledTy.clear();saveDisabled();render();};
// foldable matrix
let mxFold = true;   // always start folded
const mxhdr=document.getElementById('mxhdr'), mxbox=document.getElementById('mxbox');
function applyFold(){mxhdr.classList.toggle('closed',mxFold);mxbox.style.display=mxFold?'none':'';}
mxhdr.onclick=()=>{mxFold=!mxFold;applyFold();};
applyFold();
const vtl=document.getElementById('vtl'),vlist=document.getElementById('vlist');
vtl.onclick=()=>{view='tl';vtl.classList.add('on');vlist.classList.remove('on');render();};
vlist.onclick=()=>{view='list';vlist.classList.add('on');vtl.classList.remove('on');render();};
const bFavMode=document.getElementById('favmode'),bFavOnly=document.getElementById('favonly');
bFavMode.onclick=()=>{favMode=!favMode;render();};
bFavOnly.onclick=()=>{favOnly=!favOnly;render();};
document.getElementById('favexp').onclick=()=>{
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify([...FAV],null,1)],{type:'application/json'}));
  a.download='siggraph26_favorites.json';a.click();URL.revokeObjectURL(a.href);
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
  bFavMode.textContent=favMode?'✓ Done editing':'✎ Edit favorites';
  bFavOnly.classList.toggle('on',favOnly);
  bFavOnly.textContent='★ Favorites ('+FAV.size+')';
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
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
  qCount.textContent=(qIdx+1)+'/'+qHits.length;
}
function updateSearchNav(){
  qHits=q?[...document.querySelectorAll('.hit')]:[];
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
  EV.forEach(e=>{cnt[e.ty][e.d]++;dtot[e.d]=(dtot[e.d]||0)+1;});
  let html='<thead><tr><th class="showbox-th"><input type="checkbox" class="showbox" id="showall" title="show/hide all programs"></th><th>Program</th>'+DAYS.map(d=>'<th>'+DAYNAME[d]+'</th>').join('')+'<th>Total</th></tr></thead><tbody>';
  types.forEach(t=>{
    const tot=DAYS.reduce((a,d)=>a+cnt[t][d],0);
    const off=disabledTy.has(t);
    html+='<tr data-ty="'+esc(t)+'"'+(off?' class="off"':'')+'>'+
      '<td class="showbox-td"><input type="checkbox" class="showbox" title="show/hide these events"'+(off?'':' checked')+'></td>'+
      '<td><span class="sw" style="background:'+clr(t)+'"></span>'+esc(t)+'</td>';
    DAYS.forEach(d=>{const n=cnt[t][d];const a=n?Math.min(.85,.13+n/26):0;
      html+='<td><span class="cell" style="background:'+(n?'rgba(61,126,255,'+a.toFixed(2)+')':'transparent')+'">'+(n||'·')+'</span></td>';});
    html+='<td class="tot">'+tot+'</td></tr>';
  });
  html+='</tbody><tfoot><tr><td class="showbox-td"></td><td>All programs</td>'+DAYS.map(d=>'<td>'+(dtot[d]||0)+'</td>').join('')+'<td>'+EV.length+'</td></tr></tfoot>';
  mx.innerHTML=html;
  mx.querySelectorAll('tbody tr').forEach(r=>{
    r.onclick=()=>{
      const t=r.dataset.ty;
      disabledTy.has(t)?disabledTy.delete(t):disabledTy.add(t);
      saveDisabled();render();
    };
    const td=r.children[1], t=r.dataset.ty;
    if(TYDESC[t]){
      td.onmouseenter=ev=>{tipK=null;
        tip.innerHTML='<div class="tt"><span class="sw" style="background:'+clr(t)+'"></span>'+esc(t)+'</div><div class="desc">'+esc(TYDESC[t])+'</div>';
        tip.classList.add('show');moveTip(ev);};
      td.onmousemove=moveTip;
      td.onmouseleave=()=>tip.classList.remove('show');
    }
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

// ---- tooltip
const tip=document.getElementById('tip');
// Description is fetched live from the official site's REST API on first hover
// (the only CORS-open route there; the plain session pages are not fetchable).
const DESC=new Map();   // fkey -> text ('' = fetched, none found; undefined = not yet)
let tipK=null, tipE=null, tipXY=null;
function descUrl(e){
  const q=new URLSearchParams((e.orig.url.split('?')[1]||''));
  if(!q.get('p'))return null;
  return 'https://s2026.conference-schedule.org/wp-json/wp/v2/pages?_fields=content'+
    '&include='+q.get('p')+'&sess='+(q.get('sess')||'')+(q.get('id')?'&id='+q.get('id'):'');
}
function loadDesc(e){
  const k=fkey(e), u=descUrl(e);
  if(DESC.has(k)||!u)return;
  DESC.set(k,undefined);  // in-flight
  fetch(u).then(r=>r.json()).then(d=>{
    const html=(d[0]&&d[0].content&&d[0].content.rendered)||'';
    const a=new DOMParser().parseFromString(html,'text/html').querySelector('.abstract');
    DESC.set(k,a?a.textContent.trim():'');
    if(tipK===k)showTip(tipE,tipXY);          // update the open tooltip in place
  }).catch(()=>DESC.delete(k));               // network error: retry on next hover
}
function showTip(e,ev){
  tipK=fkey(e);tipE=e;tipXY={clientX:ev.clientX,clientY:ev.clientY};
  const dsc=DESC.get(tipK);
  if(dsc===undefined)loadDesc(e);
  tip.innerHTML='<div class="tt">'+(FAV.has(fkey(e))?'★ ':'')+esc(e.t)+'</div>'+
    '<div class="row"><span class="k">When</span><b>'+DAYFULL[e.d]+' · '+fmt(e.sm)+'–'+fmt(e.em)+' PDT</b></div>'+
    '<div class="row"><span class="k">Where</span><b>'+esc(e.r)+'</b></div>'+
    '<div class="row"><span class="k">Program</span><b>'+esc(e.ty)+'</b></div>'+
    (e.sp&&e.sp.length?'<div class="row"><span class="k">People</span><b>'+esc(e.sp.join(', '))+'</b></div>':'')+
    (dsc?'<div class="desc">'+esc(dsc)+'</div>':dsc===undefined&&descUrl(e)?'<div class="desc loading">loading description…</div>':'')+
    (e.tg&&e.tg.length?'<div class="chips">'+e.tg.slice(0,8).map(t=>'<span class="chip">'+esc(t)+'</span>').join('')+'</div>':'');
  tip.classList.add('show');moveTip(ev);
}
function moveTip(ev){const p=14,w=tip.offsetWidth,h=tip.offsetHeight;let x=ev.clientX+p,y=ev.clientY+p;
  if(x+w>innerWidth-8)x=ev.clientX-w-p;if(y+h>innerHeight-8)y=innerHeight-h-8;tip.style.left=x+'px';tip.style.top=y+'px';}
function hookTip(el,e){el.onmouseenter=ev=>showTip(e,ev);el.onmousemove=ev=>{tipXY={clientX:ev.clientX,clientY:ev.clientY};moveTip(ev);};el.onmouseleave=()=>{tipK=null;tip.classList.remove('show');};}

function filterInfo(){
  const shown=EV.filter(visible);
  let s=shown.length+' events · '+(day==='all'?'all days':DAYFULL[day])+
    (disabledTy.size?' · '+disabledTy.size+' program'+(disabledTy.size===1?'':'s')+' hidden':'')+
    (favOnly?' · favorites only':'');
  if(q)s+=' · <span class="hitcount">'+shown.filter(matches).length+' match “'+esc(q)+'”</span>';
  return s;
}
function updateProgUI(){
  document.getElementById('tysel').textContent=disabledTy.size?(disabledTy.size+' hidden'):'';
  document.getElementById('clearty').classList.toggle('on',!disabledTy.size);
}

// ---- agenda list
function buildAgenda(){
  const ag=document.getElementById('agenda');ag.innerHTML='';
  DAYS.forEach(d=>{
    if(day!=='all'&&day!==d)return;
    const list=EV.filter(e=>e.d===d&&visible(e)).sort((a,b)=>a.sm-b.sm||a.em-b.em);
    const blk=document.createElement('div');blk.className='dayblock';
    blk.innerHTML='<div class="dayhdr"><span>'+DAYFULL[d]+'</span><span class="n">'+list.length+' event'+(list.length===1?'':'s')+'</span></div>';
    list.forEach(e=>{
      const a=document.createElement('a');a.className='evrow';a.href=e.u;a.target='_blank';a.rel='noopener';
      if(FAV.has(fkey(e)))a.classList.add('faved');
      markHit(a,e);
      a.innerHTML='<span class="tm">'+fmt(e.sm)+'–'+fmt(e.em)+'</span>'+
        '<span class="badge" style="background:'+clr(e.ty)+'">'+esc(e.ty)+'</span>'+
        '<span class="body"><span class="ti">'+esc(e.t)+'</span><div class="rm">'+esc(e.r)+
        (e.sp.length?' · '+esc(e.sp.slice(0,4).join(', '))+(e.sp.length>4?' …':''):'')+'</div></span>';
      if(favMode)a.insertBefore(favBox(e,'favbox2'),a.firstChild);
      hookTip(a,e);
      blk.appendChild(a);
    });
    if(!list.length)blk.innerHTML+='<div class="sub" style="padding:8px">no matching events</div>';
    ag.appendChild(blk);
  });
  document.getElementById('agendahdr').innerHTML='Agenda <span class="sub">'+filterInfo()+'</span>';
}

// ---- timeline
const ONGOING_MIN = 300;           // events ≥5h shown as chips, not blocks
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
function buildTimeline(){
  const ag=document.getElementById('agenda');ag.innerHTML='';
  DAYS.forEach(d=>{
    if(day!=='all'&&day!==d)return;
    const list=EV.filter(e=>e.d===d&&visible(e));
    const ongoing=list.filter(e=>e.em-e.sm>=ONGOING_MIN).sort((a,b)=>a.sm-b.sm);
    const timed=list.filter(e=>e.em-e.sm<ONGOING_MIN);
    const blk=document.createElement('div');blk.className='dayblock';
    blk.innerHTML='<div class="dayhdr"><span>'+DAYFULL[d]+'</span><span class="n">'+list.length+' event'+(list.length===1?'':'s')+'</span></div>';
    if(ongoing.length){
      const og=document.createElement('div');og.className='ongoing';
      og.innerHTML='<span class="onglbl">All day / long</span>';
      ongoing.forEach(e=>{
        const a=document.createElement('a');a.className='ong';a.style.background=clr(e.ty);
        a.href=e.u;a.target='_blank';a.rel='noopener';
        if(FAV.has(fkey(e)))a.classList.add('faved');
        markHit(a,e);
        a.textContent=e.t+' · '+fmt(e.sm)+'–'+fmt(e.em);
        if(favMode)a.insertBefore(favBox(e,'favbox3'),a.firstChild);
        hookTip(a,e);
        og.appendChild(a);
      });
      blk.appendChild(og);
    }
    if(timed.length){
      const start=Math.floor(Math.min(...timed.map(e=>e.sm))/60)*60;
      const end=Math.ceil(Math.max(...timed.map(e=>e.em))/60)*60;
      const grid=document.createElement('div');grid.className='tlgrid'+(favMode?' favmode':'');
      grid.style.height=((end-start)*PXMIN)+'px';
      for(let m=start;m<=end;m+=60){
        const y=(m-start)*PXMIN;
        const ln=document.createElement('div');ln.className='hourline';ln.style.top=y+'px';grid.appendChild(ln);
        const lb=document.createElement('div');lb.className='hourlbl';lb.style.top=y+'px';lb.textContent=fmt(m);grid.appendChild(lb);
      }
      packColumns(timed).forEach(e=>{
        const a=document.createElement('a');a.className='tlev';a.style.background=clr(e.ty);
        a.href=e.u;a.target='_blank';a.rel='noopener';
        if(FAV.has(fkey(e)))a.classList.add('faved');
        markHit(a,e);
        const w=100/e._n;
        a.style.top=((e.sm-start)*PXMIN)+'px';
        a.style.height=Math.max(17,(e.em-e.sm)*PXMIN-2)+'px';
        a.style.left='calc('+(e._c*w)+'% + 2px)';
        a.style.width='calc('+w+'% - 5px)';
        a.innerHTML='<span class="tt2">'+esc(e.t)+'</span><span class="tm2">'+fmt(e.sm)+' · '+esc(e.r)+'</span>';
        if(favMode)a.appendChild(favBox(e,'favbox'));
        hookTip(a,e);
        grid.appendChild(a);
      });
      blk.appendChild(grid);
    }
    if(!list.length)blk.innerHTML+='<div class="sub" style="padding:8px">no matching events</div>';
    ag.appendChild(blk);
  });
  document.getElementById('agendahdr').innerHTML='Timeline <span class="sub">'+filterInfo()+' · hover for details</span>';
}

function render(){updateFavUI();updateProgUI();buildMatrix();(view==='tl'?buildTimeline:buildAgenda)();updateSearchNav();}
render();
