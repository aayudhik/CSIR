/* Physics JRF Journey V5.8.4 — public experience layer */
(()=>{
  'use strict';
  const VERSION='5.8.4';
  const style=document.createElement('style');
  style.textContent=`
    .v584-public{margin:22px 0 0;padding:20px;border:1px solid #e1e6ef;border-radius:18px;background:linear-gradient(135deg,#fff,#f6f7ff)}
    .v584-public h3{margin:0 0 6px}.v584-public p{color:#69758a;line-height:1.6;margin:6px 0}.v584-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.v584-card{border:1px solid #e1e6ef;border-radius:13px;padding:13px;background:#fff}.v584-card b{display:block;margin-bottom:5px}.v584-card span{font-size:12px;color:#69758a;line-height:1.5}.v584-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.v584-link{display:inline-flex;align-items:center;gap:6px;border:1px solid #d9deea;border-radius:10px;padding:8px 11px;text-decoration:none;color:inherit;background:#fff;font-size:12px}.v584-faq{margin-top:18px}.v584-faq details{border-top:1px solid #e1e6ef;padding:10px 0}.v584-faq summary{cursor:pointer;font-weight:800}.v584-footer{margin-top:20px;padding:16px 4px;color:#69758a;font-size:11px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.v584-badge{border:1px solid #d9deea;border-radius:999px;padding:4px 8px;background:#fff}@media(max-width:680px){.v584-grid{grid-template-columns:1fr}.v584-footer{display:block}.v584-footer>*{display:block;margin:5px 0}}
  `;
  document.head.appendChild(style);

  function mount(){
    if(document.getElementById('v584-public'))return;
    const main=document.querySelector('main'); if(!main)return;
    const host=document.createElement('section');host.id='v584-public';host.className='v584-public';
    host.innerHTML=`<h3>🎓 Physics JRF Journey</h3><p>A focused preparation workspace for CSIR-NET Physical Sciences aspirants — built around <b>Study → Practice → Revision → Mock → Analytics</b>.</p><div class="v584-grid"><div class="v584-card"><b>📚 Study</b><span>Structured topics with concepts, formulas, derivations, worked examples and exam traps.</span></div><div class="v584-card"><b>📝 Practice</b><span>Topic, subject, mixed and weak-area practice with explanations and randomized sets.</span></div><div class="v584-card"><b>📊 Track</b><span>Mastery, accuracy, attempts, revision and mock performance in your browser.</span></div></div><div class="v584-links"><a class="v584-link" href="https://github.com/aayudhik/CSIR" target="_blank" rel="noopener">💬 Feedback / Report an issue</a><a class="v584-link" href="#" id="v584-help-link">❓ Help & FAQ</a><span class="v584-link v584-badge">V5.8.4</span></div><div class="v584-faq" id="v584-faq"><details><summary>How should I use the portal?</summary><p>Start with Study Content, practice the same topic, revise weak points, then use Mini Mock and Analytics to measure improvement.</p></details><details><summary>Is my progress stored online?</summary><p>Current progress is stored locally in this browser. Cloud synchronization is planned for a future version.</p></details><details><summary>Are the reference books hosted here?</summary><p>The library provides lawful book pages and previews where available. Copyrighted books are not redistributed by this portal.</p></details><details><summary>What if the data does not load?</summary><p>Refresh once after deployment finishes. The V5.8 stability layer also provides a retry action when a loading error is detected.</p></details></div>`;
    main.appendChild(host);
    const help=document.getElementById('v584-help-link');if(help)help.onclick=e=>{e.preventDefault();document.getElementById('v584-faq')?.scrollIntoView({behavior:'smooth',block:'start'})};
    const footer=document.createElement('footer');footer.className='v584-footer';footer.innerHTML='<span>Physics JRF Journey · CSIR-NET Physical Sciences preparation</span><span>V5.8.4 · Built for focused preparation</span>';main.appendChild(footer);
  }
  let n=0;const t=setInterval(()=>{if(document.querySelector('main')){mount();clearInterval(t)}if(++n>40)clearInterval(t)},250);
})();
