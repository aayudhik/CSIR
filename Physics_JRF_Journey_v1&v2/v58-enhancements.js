/* Physics JRF Journey V5.8.2 — stability + UX enhancement layer */
(()=>{
  'use strict';
  const KEY='pjr_v582_meta', SESSION='pjr_v582_practice';
  const meta=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}})();
  const saveMeta=()=>{try{localStorage.setItem(KEY,JSON.stringify(meta))}catch(e){}};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const style=document.createElement('style');
  style.textContent=`
    #v582-loader{position:fixed;inset:0;background:rgba(244,246,251,.94);z-index:9999;display:grid;place-items:center;transition:opacity .25s}
    #v582-loader.hide{opacity:0;pointer-events:none}
    .v582-load-card{width:min(430px,calc(100vw - 32px));background:#fff;border:1px solid #e1e6ef;border-radius:18px;padding:24px;box-shadow:0 20px 60px #1b25521c;text-align:center}
    .v582-load-logo{font-size:28px;margin-bottom:8px}.v582-load-title{font-weight:900;font-size:18px}.v582-load-sub{color:#69758a;font-size:12px;margin:7px 0 15px}.v582-load-track{height:8px;background:#e7eaf1;border-radius:99px;overflow:hidden}.v582-load-track i{display:block;width:20%;height:100%;background:#5753d8;border-radius:99px;animation:v582load 1.25s infinite ease-in-out}@keyframes v582load{0%{transform:translateX(-120%)}100%{transform:translateX(520%)}}
    .v582-modal{position:fixed;inset:0;background:#11172bb8;z-index:9998;display:grid;place-items:center;padding:18px}.v582-modal[hidden]{display:none}
    .v582-wizard{width:min(680px,100%);background:#fff;border-radius:20px;padding:28px;box-shadow:0 25px 80px #0005}.v582-wizard h2{margin:0 0 8px}.v582-wizard p{line-height:1.6;color:#69758a}.v582-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0}.v582-step{border:1px solid #e1e6ef;border-radius:12px;padding:13px}.v582-step b{display:block;margin-bottom:5px}.v582-step span{font-size:12px;color:#69758a}.v582-wizard-actions{display:flex;justify-content:flex-end;gap:8px}.v582-resume{margin-top:18px}.v582-resume-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v582-resume-item{border:1px solid #e1e6ef;border-radius:13px;padding:14px;background:#fff}.v582-resume-item h4{margin:0 0 5px}.v582-resume-item p{margin:0 0 10px;color:#69758a;font-size:12px}.v582-activity{margin-top:18px}.v582-activity-row{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #e1e6ef}.v582-activity-row:last-child{border-bottom:0}.v582-time{font-size:11px;color:#69758a;white-space:nowrap}.v582-retry{margin-top:12px}.v582-help{font-size:11px;color:#69758a;margin-top:8px}@media(max-width:680px){.v582-steps,.v582-resume-grid{grid-template-columns:1fr}.v582-wizard{padding:20px}}
  `;
  document.head.appendChild(style);

  const loader=document.createElement('div');
  loader.id='v582-loader';
  loader.innerHTML='<div class="v582-load-card"><div class="v582-load-logo">⚛</div><div class="v582-load-title">Preparing your study workspace</div><div class="v582-load-sub">Loading study content, questions, papers and reference books…</div><div class="v582-load-track"><i></i></div></div>';
  document.body.appendChild(loader);

  function hideLoader(){setTimeout(()=>loader.classList.add('hide'),180);setTimeout(()=>loader.remove(),500)}
  function ready(){return !!(window.data&&Array.isArray(window.data.topics)&&window.questions&&window.books)}

  function activity(type,label,id){
    meta.activity=Array.isArray(meta.activity)?meta.activity:[];
    const item={type,label,id:id||'',time:Date.now()};
    meta.activity=[item,...meta.activity.filter(x=>!(x.type===type&&x.id===item.id))].slice(0,8);
    meta.last={type,label,id:id||'',time:Date.now()}; saveMeta();
  }
  function timeAgo(t){const m=Math.max(0,Math.floor((Date.now()-t)/60000));if(m<1)return'just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`}

  function install(){
    if(!ready())return false;
    hideLoader();
    if(window.__v582Installed)return true; window.__v582Installed=true;

    const originalGo=window.go;
    window.go=function(v){activity('view',({home:'Dashboard',topics:'Study Content',books:'Reference Books',papers:'Question Papers',practice:'Practice Lab',revision:'Revision Deck',mock:'Mini Mock',planner:'Daily Planner',analytics:'Progress Analytics',architecture:'V5 Architecture'}[v]||v));return originalGo.apply(this,arguments)};
    if(window.openTopic){const originalOpen=window.openTopic;window.openTopic=function(id){const t=(window.data.topics||[]).find(x=>String(x.id||x.topic_id||x.topicId)===String(id));activity('topic',t?.topic||t?.name||'Study topic',String(id));return originalOpen.apply(this,arguments)}}

    const home=document.getElementById('home');
    const anchor=document.getElementById('homekpis');
    if(home&&anchor&&!document.getElementById('v582-resume')){
      const box=document.createElement('div'); box.id='v582-resume'; box.className='v582-resume';
      anchor.insertAdjacentElement('afterend',box);
    }
    renderResume();

    // Persist the currently generated practice session so a refresh can be recovered later.
    const persist=()=>{try{localStorage.setItem(SESSION,JSON.stringify({qids:(window.practiceSession||[]).map(q=>q.qid),answers:window.practiceAnswers||{},savedAt:Date.now()}))}catch(e){}};
    if(window.answerPractice){const fn=window.answerPractice;window.answerPractice=function(){const r=fn.apply(this,arguments);persist();renderResume();return r}}
    const np=document.getElementById('newPractice'); if(np)np.addEventListener('click',()=>setTimeout(persist,0));

    // Track completion of the first-run wizard and offer a short, useful workflow.
    if(!meta.onboarded){showWizard()}

    // Recoverable error state for data-loading failures.
    const observer=new MutationObserver(()=>{
      const h=[...document.querySelectorAll('main h2')].find(x=>/data loading error/i.test(x.textContent||''));
      if(h&&!document.getElementById('v582-retry')){
        const b=document.createElement('button');b.id='v582-retry';b.className='btn v582-retry';b.textContent='↻ Retry loading';b.onclick=()=>location.reload();h.parentElement.appendChild(b)
      }
    });
    observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true});

    return true;
  }

  function renderResume(){
    const box=document.getElementById('v582-resume');if(!box)return;
    const acts=Array.isArray(meta.activity)?meta.activity:[];
    const last=meta.last;
    const resume=last?`<div class="card"><div class="top"><h3 style="margin:0">▶ Quick Resume</h3><span class="pill">${timeAgo(last.time)}</span></div><p class="muted">Continue from <b>${esc(last.label)}</b>.</p><button class="btn" id="v582-resume-btn">Continue</button></div>`:'';
    const rows=acts.length?acts.slice(0,5).map(a=>`<div class="v582-activity-row"><span>${a.type==='topic'?'📚':'🧭'} ${esc(a.label)}</span><span class="v582-time">${timeAgo(a.time)}</span></div>`).join(''):'<div class="empty">Your recent study activity will appear here.</div>';
    box.innerHTML=`${resume}<div class="card v582-activity"><div class="top"><h3 style="margin:0">🕘 Recent Activity</h3><span class="pill">Last ${Math.min(5,acts.length||0)}</span></div>${rows}</div>`;
    const rb=document.getElementById('v582-resume-btn');if(rb)rb.onclick=()=>{if(last?.type==='topic'&&last.id&&window.openTopic)window.openTopic(last.id);else if(last?.type==='view'&&window.go)window.go(({Dashboard:'home','Study Content':'topics','Reference Books':'books','Question Papers':'papers','Practice Lab':'practice','Revision Deck':'revision','Mini Mock':'mock','Daily Planner':'planner','Progress Analytics':'analytics','V5 Architecture':'architecture'}[last.label]||'home'))};
  }

  function showWizard(){
    const m=document.createElement('div');m.className='v582-modal';m.innerHTML=`<div class="v582-wizard" role="dialog" aria-modal="true" aria-labelledby="v582-title"><h2 id="v582-title">Welcome to Physics JRF Journey V5.8 👋</h2><p>Use this workspace in a simple cycle: <b>Study → Practice → Review → Test → Track progress.</b> Your progress is stored locally in this browser.</p><div class="v582-steps"><div class="v582-step"><b>1. 📚 Study</b><span>Open a topic and build the concepts, derivations and formulae.</span></div><div class="v582-step"><b>2. 📝 Practice</b><span>Use topic, subject or weak-area filters and read every explanation.</span></div><div class="v582-step"><b>3. 📊 Track</b><span>Use Revision, Mini Mock and Analytics to close weak areas.</span></div></div><div class="v582-wizard-actions"><button class="btn" id="v582-start">Start my preparation</button></div></div>`;
    document.body.appendChild(m);
    const close=()=>{meta.onboarded=true;saveMeta();m.remove();};
    document.getElementById('v582-start').onclick=()=>{close();window.go?.('topics')};
    m.addEventListener('click',e=>{if(e.target===m)close()});
    document.addEventListener('keydown',function escKey(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',escKey)}});
  }

  // Install after the original app's async data load. Also covers slow GitHub Pages starts.
  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(timer)},250);
})();
