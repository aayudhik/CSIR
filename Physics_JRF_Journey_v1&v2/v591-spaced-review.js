/* V5.9.1 — spaced repetition: 1,2,3,5,7,14,30 day review queue */
(()=>{
'use strict';
const KEY='pjr_v591_spaced';
const INTERVALS=[1,2,3,5,7,14,30];
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const esc=s=>String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
let cachedTopics=[];
function ensure(){
 const home=document.querySelector('#home');if(!home||document.querySelector('#pjr-spaced-review'))return false;
 const card=document.createElement('div');card.className='card';card.id='pjr-spaced-review';
 card.innerHTML='<div class="top"><h2>Spaced Review</h2><span class="pill">1 · 2 · 3 · 5 · 7 · 14 · 30 days</span></div><p class="muted">Review topics at expanding intervals. Mark a topic reviewed to schedule its next interval.</p><div id="pjr-spaced-list"></div>';
 home.appendChild(card);return true;
}
function normalize(raw){
 if(Array.isArray(raw?.topics))return raw.topics;
 if(Array.isArray(raw?.records))return raw.records;
 const out=[];for(const s of Array.isArray(raw?.subjects)?raw.subjects:[])for(const t of Array.isArray(s.topics)?s.topics:[])out.push({...t,subject_id:t.subject_id??s.id,subject:t.subject??s.name});return out;
}
function render(){
 if(!ensure())return;
 const box=document.querySelector('#pjr-spaced-list');if(!box)return;
 const s=load(),now=today();
 const due=cachedTopics.map(r=>{const x=s[r.id]||{stage:0,last:0};const stage=Math.min(x.stage||0,INTERVALS.length-1);const last=x.last?new Date(x.last):null;const dueAt=last?new Date(last.getTime()+INTERVALS[stage]*86400000):now;return{r,x,stage,dueAt,isDue:!last||dueAt<=now}}).filter(x=>x.isDue).sort((a,b)=>a.stage-b.stage||String(a.r.subject_id).localeCompare(String(b.r.subject_id)));
 if(!due.length){box.innerHTML='<div class="card"><b>All caught up.</b><p class="muted">No scheduled reviews are due today. Keep studying and return tomorrow.</p></div>';return}
 box.innerHTML=due.slice(0,8).map(x=>`<div class="pjr-review-row" style="display:flex;gap:12px;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid var(--line)"><div><b>${esc(x.r.topic)}</b><div class="muted">${esc(x.r.subject||x.r.subject_id||'Physics')} · ${x.x.last?'Next interval: '+INTERVALS[Math.min(x.stage+1,INTERVALS.length-1)]+' days':'First review'}</div></div><button class="btn" data-pjr-review="${esc(x.r.id)}">Mark reviewed</button></div>`).join('');
 box.querySelectorAll('[data-pjr-review]').forEach(btn=>btn.onclick=()=>{const id=btn.getAttribute('data-pjr-review');const st=load();const old=st[id]||{stage:0,last:0};st[id]={stage:Math.min((old.stage||0)+1,INTERVALS.length-1),last:new Date().toISOString()};save(st);render()});
}
function accept(detail){
 const topics=detail?.topics||[];if(Array.isArray(topics)&&topics.length)cachedTopics=topics;render();
}
function boot(){
 if(window.__PJR_DATA_READY)accept(window.__PJR_DATA_READY);
 else window.addEventListener('pjr:data-ready',e=>accept(e.detail),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('pjr:data-ready',e=>accept(e.detail));
})();
