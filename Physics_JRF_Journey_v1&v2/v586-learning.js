/* Physics JRF Journey V5.8.6 — Advanced Learning Engine */
(()=>{
  'use strict';
  const KEY='pjr_v586_learning';
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}};
  const save=x=>{try{localStorage.setItem(KEY,JSON.stringify(x))}catch(e){}};
  const s=load();
  s.visits=Number(s.visits||0)+1;
  const today=new Date().toISOString().slice(0,10);
  if(s.lastDay!==today){
    const prev=s.lastDay?new Date(s.lastDay):null, cur=new Date(today);
    const gap=prev?Math.round((cur-prev)/86400000):0;
    s.streak=gap===1?Number(s.streak||0)+1:1; s.lastDay=today;
  }
  save(s);

  const topics=()=>Array.isArray(window.data?.topics)?window.data.topics:[];
  const byId=id=>topics().find(t=>String(t.id||t.topic_id||t.topicId)===String(id));
  const tid=t=>String(t.id||t.topic_id||t.topicId||'');
  const name=t=>t?.topic||t?.name||t?.title||'Topic';
  const subjectId=t=>String(t?.subject_id||t?.subjectId||t?.subject||'');
  const state=()=>window.state||{};
  const stats=t=>{
    const b=state().byTopic||{}; const x=b[tid(t)]||{}; const a=Number(x.attempts||0), c=Number(x.correct||0);
    return {attempts:a,correct:c,accuracy:a?c/a:0,mastered:!!x.mastered};
  };
  const mastery=t=>{const x=stats(t);if(x.mastered)return 1;if(!x.attempts)return 0;return Math.min(1,(x.accuracy*.75)+(Math.min(x.attempts,8)/8)*.25)};
  const priority=t=>{
    const x=stats(t), untested=x.attempts===0?1:0, weak=x.attempts?1-x.accuracy:0, stale=x.attempts?Math.min(1,(Date.now()-(s.topicSeen?.[tid(t)]||0))/604800000):0;
    return (untested*0.48)+(weak*0.34)+(stale*0.18);
  };
  const recommend=()=>topics().filter(Boolean).filter(t=>!stats(t).mastered).sort((a,b)=>priority(b)-priority(a))[0]||topics()[0];
  const due=()=>topics().filter(Boolean).filter(t=>{const x=stats(t);if(x.mastered)return false;const last=Number(s.topicSeen?.[tid(t)]||0);const interval=x.attempts===0?0:x.accuracy<.6?86400000:x.accuracy<.8?3*86400000:7*86400000;return !last||Date.now()-last>=interval}).sort((a,b)=>priority(b)-priority(a));

  function css(){
    if(document.getElementById('v586-css'))return;
    const st=document.createElement('style');st.id='v586-css';st.textContent=`
      .v586-engine{margin-top:18px}.v586-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.v586-card{border:1px solid var(--line);border-radius:14px;padding:15px;background:var(--card)}
      .v586-card h3{margin:0 0 7px}.v586-card p{line-height:1.55}.v586-score{font-size:25px;font-weight:900}.v586-meter{height:8px;background:#e5e8f0;border-radius:99px;overflow:hidden}.v586-meter i{display:block;height:100%;background:var(--brand)}
      .v586-badge{display:inline-block;font-size:10px;font-weight:850;padding:5px 8px;border-radius:999px;background:var(--soft);color:#514bc6}.v586-list{margin:8px 0 0;padding-left:18px}.v586-list li{margin:6px 0}.v586-action{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v586-small{font-size:11px;color:var(--muted)}
      .v586-pillrow{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.v586-topic-row{padding:11px 0;border-bottom:1px solid var(--line)}.v586-topic-row:last-child{border-bottom:0}
      @media(max-width:900px){.v586-grid{grid-template-columns:1fr 1fr}}@media(max-width:680px){.v586-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(st);
  }

  function markSeen(id){s.topicSeen=s.topicSeen||{};s.topicSeen[String(id)]=Date.now();save(s)}
  function openTopic(t){if(!t)return;markSeen(tid(t));if(window.openTopic)window.openTopic(tid(t));else if(window.go)window.go('topics')}
  function adaptivePractice(t){
    const sub=document.getElementById('pqsubject'), top=document.getElementById('pqtopic'), mode=document.getElementById('pqmode'), count=document.getElementById('pqcount');
    if(!mode)return;
    window.go?.('practice');
    setTimeout(()=>{
      mode.value='topic';
      if(top){top.value=tid(t);top.dispatchEvent(new Event('change',{bubbles:true}))}
      if(sub)sub.value=subjectId(t);
      if(count)count.value='10';
      document.getElementById('newPractice')?.click();
    },80);
  }
  function renderHome(){
    const home=document.getElementById('home');if(!home||document.getElementById('v586-engine'))return;
    const rec=recommend(), d=due(), mastered=topics().filter(t=>stats(t).mastered).length, pct=topics().length?Math.round(mastered/topics().length*100):0;
    const box=document.createElement('div');box.id='v586-engine';box.className='v586-engine';
    box.innerHTML=`<div class="card"><div class="top"><div><h2 style="margin:0">🧠 V5.8.6 Advanced Learning Engine</h2><p class="muted" style="margin:6px 0 0">Your next session is selected from mastery, accuracy, practice history and review timing.</p></div><span class="v586-badge">Adaptive mode</span></div><div class="v586-grid"><div class="v586-card"><h3>🎯 Next Best Topic</h3><div class="v586-score">${esc(name(rec))}</div><p class="v586-small">${rec?`Priority ${Math.round(priority(rec)*100)}% · ${stats(rec).attempts?`${Math.round(stats(rec).accuracy*100)}% accuracy`:'Not attempted yet'}`:'Complete the study data load first.'}</p><div class="v586-action"><button class="btn" id="v586-study">Study topic</button><button class="btn alt" id="v586-practice">Practice 10</button></div></div><div class="v586-card"><h3>🔁 Smart Review</h3><div class="v586-score">${d.length}</div><p class="v586-small">topics currently due for review, weighted toward weak areas.</p><div class="v586-pillrow"><span class="v586-badge">Weak first</span><span class="v586-badge">Spaced timing</span></div><button class="btn alt" id="v586-review">Open Revision</button></div><div class="v586-card"><h3>🔥 Learning Streak</h3><div class="v586-score">${Number(s.streak||1)} day${Number(s.streak||1)===1?'':'s'}</div><p class="v586-small">Keep a daily study touchpoint. Sessions are tracked locally on this device.</p><div class="v586-meter"><i style="width:${pct}%"></i></div><p class="v586-small">${mastered}/${topics().length} topics mastered · ${pct}%</p></div></div></div>`;
    const anchor=document.getElementById('v582-resume');if(anchor)anchor.insertAdjacentElement('afterend',box);else home.querySelector('.section')?.insertAdjacentElement('beforebegin',box);
    document.getElementById('v586-study')?.addEventListener('click',()=>openTopic(rec));
    document.getElementById('v586-practice')?.addEventListener('click',()=>adaptivePractice(rec));
    document.getElementById('v586-review')?.addEventListener('click',()=>window.go?.('revision'));
  }
  function renderAnalytics(){
    const sec=document.getElementById('analytics');if(!sec||document.getElementById('v586-analytics'))return;
    const arr=topics().map(t=>({t,x:stats(t),m:mastery(t),p:priority(t)})).sort((a,b)=>a.m-b.m);
    const box=document.createElement('div');box.id='v586-analytics';box.className='section card';
    const weak=arr.filter(x=>x.x.attempts&&x.x.accuracy<.6).slice(0,6), untouched=arr.filter(x=>!x.x.attempts).slice(0,6);
    const rows=[...weak.map(x=>`<div class="v586-topic-row"><b>${esc(name(x.t))}</b><div class="v586-small">${Math.round(x.x.accuracy*100)}% accuracy · ${x.x.attempts} attempts · priority ${Math.round(x.p*100)}%</div></div>`),...(!weak.length?untouched.map(x=>`<div class="v586-topic-row"><b>${esc(name(x.t))}</b><div class="v586-small">Not attempted · recommended to establish a baseline</div></div>`):[])].join('')||'<div class="empty">No weak topics yet — keep practicing.</div>';
    box.innerHTML=`<div class="top"><div><h3 style="margin:0">🧠 Adaptive Learning Insights</h3><span class="muted">The engine prioritizes untested topics, low accuracy and review intervals.</span></div><span class="v586-badge">V5.8.6</span></div><div class="v586-grid"><div class="v586-card"><h3>Mastery model</h3><div class="v586-score">${arr.length?Math.round(arr.reduce((a,x)=>a+x.m,0)/arr.length*100):0}%</div><p class="v586-small">Estimated learning mastery across mapped topics.</p></div><div class="v586-card"><h3>Needs attention</h3><div class="v586-score">${arr.filter(x=>x.x.attempts&&x.x.accuracy<.6).length}</div><p class="v586-small">Topics below 60% accuracy.</p></div><div class="v586-card"><h3>Untouched</h3><div class="v586-score">${arr.filter(x=>!x.x.attempts).length}</div><p class="v586-small">Topics without question attempts.</p></div></div><div class="section"><h4>Priority queue</h4>${rows}</div>`;
    const table=document.getElementById('practiceStatsTable');if(table)table.parentElement.insertAdjacentElement('beforebegin',box);else sec.appendChild(box);
  }
  function observeTopics(){
    const original=window.openTopic;
    if(original&&!window.__v586OpenWrapped){window.__v586OpenWrapped=true;window.openTopic=function(id){markSeen(id);return original.apply(this,arguments)}}
  }
  function init(){
    css();observeTopics();renderHome();renderAnalytics();
    if(window.__v586Installed)return;window.__v586Installed=true;
    setTimeout(()=>{renderHome();renderAnalytics()},800);
  }
  let n=0;const timer=setInterval(()=>{n++;if(window.data?.topics&&window.state){init();clearInterval(timer)}if(n>100)clearInterval(timer)},200);
})();
