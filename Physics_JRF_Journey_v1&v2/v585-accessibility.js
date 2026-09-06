/* Physics JRF Journey V5.8.5 — accessibility + UI polish */
(()=>{
  'use strict';
  const KEY='pjr_v585_ui';
  const saved=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}})();
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}};
  const style=document.createElement('style');
  style.textContent=`
    .v585-skip{position:fixed;left:12px;top:10px;z-index:10001;transform:translateY(-180%);background:#111827;color:#fff;padding:10px 14px;border-radius:10px;font-weight:800;text-decoration:none;box-shadow:0 8px 25px #0003}.v585-skip:focus{transform:none}
    :focus-visible{outline:3px solid #5753d8!important;outline-offset:3px!important}
    .v585-toolbar{display:flex;justify-content:flex-end;gap:8px;align-items:center;margin:0 0 12px;flex-wrap:wrap}.v585-btn{border:1px solid #d9deea;background:#fff;color:inherit;border-radius:10px;padding:8px 11px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.v585-btn:hover{filter:brightness(.97)}
    html.v585-dark{background:#111827;color:#e5e7eb}html.v585-dark body{background:#111827;color:#e5e7eb}html.v585-dark .card,html.v585-dark .v584-public,html.v585-dark .v584-card,html.v585-dark .v584-link,html.v585-dark .v582-load-card,html.v585-dark .v582-wizard,html.v585-dark .v585-btn{background:#1f2937;color:#e5e7eb;border-color:#374151}html.v585-dark .muted,html.v585-dark .v584-public p,html.v585-dark .v584-card span,html.v585-dark .v584-footer,html.v585-dark .v584-faq p{color:#c1c8d4}html.v585-dark input,html.v585-dark select,html.v585-dark textarea{background:#111827;color:#e5e7eb;border-color:#4b5563}html.v585-dark .pill{background:#374151;color:#e5e7eb}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
    @media(max-width:680px){.v585-toolbar{justify-content:stretch}.v585-btn{flex:1;min-width:130px}}
  `;
  document.head.appendChild(style);

  function labelControls(){
    document.querySelectorAll('button,input,select,textarea').forEach((el,i)=>{
      if(!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')){
        const txt=(el.innerText||el.textContent||'').trim();
        const ph=el.getAttribute('placeholder');
        const name=el.getAttribute('name');
        if(txt)el.setAttribute('aria-label',txt.replace(/\s+/g,' ').slice(0,100));
        else if(ph)el.setAttribute('aria-label',ph);
        else if(name)el.setAttribute('aria-label',name.replace(/[-_]/g,' '));
        else if(el.tagName==='BUTTON')el.setAttribute('aria-label','Action button '+(i+1));
      }
    });
    document.querySelectorAll('a[target="_blank"]').forEach(a=>{if(!a.getAttribute('aria-label'))a.setAttribute('aria-label',(a.textContent||'Open link')+' (opens in new tab)')});
  }
  function install(){
    if(document.getElementById('v585-toolbar'))return;
    const main=document.querySelector('main');if(!main)return;
    if(!document.getElementById('v585-skip')){const a=document.createElement('a');a.id='v585-skip';a.className='v585-skip';a.href='#v585-main';a.textContent='Skip to main content';document.body.prepend(a);main.id='v585-main';}
    const bar=document.createElement('div');bar.id='v585-toolbar';bar.className='v585-toolbar';bar.setAttribute('aria-label','Accessibility controls');
    bar.innerHTML='<button class="v585-btn" id="v585-theme" type="button" aria-pressed="false">🌙 Dark mode</button><button class="v585-btn" id="v585-motion" type="button" aria-pressed="false">⏸ Reduce motion</button>';
    main.prepend(bar);
    const dark=saved.dark===true; const reduced=saved.reduced===true;
    document.documentElement.classList.toggle('v585-dark',dark); document.documentElement.classList.toggle('v585-reduced',reduced);
    const theme=document.getElementById('v585-theme'), motion=document.getElementById('v585-motion');
    const sync=()=>{theme.textContent=document.documentElement.classList.contains('v585-dark')?'☀️ Light mode':'🌙 Dark mode';theme.setAttribute('aria-pressed',String(document.documentElement.classList.contains('v585-dark')));motion.textContent=document.documentElement.classList.contains('v585-reduced')?'▶ Restore motion':'⏸ Reduce motion';motion.setAttribute('aria-pressed',String(document.documentElement.classList.contains('v585-reduced')))};
    theme.onclick=()=>{saved.dark=!document.documentElement.classList.contains('v585-dark');document.documentElement.classList.toggle('v585-dark',saved.dark);save();sync()};
    motion.onclick=()=>{saved.reduced=!document.documentElement.classList.contains('v585-reduced');document.documentElement.classList.toggle('v585-reduced',saved.reduced);save();sync()};
    sync();labelControls();
    const obs=new MutationObserver(()=>labelControls());obs.observe(main,{childList:true,subtree:true});
  }
  let n=0;const t=setInterval(()=>{if(document.querySelector('main')){install();clearInterval(t)}if(++n>40)clearInterval(t)},250);
})();
