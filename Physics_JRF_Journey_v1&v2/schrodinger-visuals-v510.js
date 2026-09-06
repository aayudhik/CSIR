(()=>{
  const ASSET='./data/visuals/schrodinger-infinite-well.svg';
  const isSchrodinger=el=>/schrödinger equation|schrodinger equation/i.test(el?.textContent||'');
  function render(){
    const detail=document.getElementById('topicdetail');
    if(!detail||detail.classList.contains('hidden')||!isSchrodinger(detail)||detail.querySelector('[data-pjr-visual="infinite-well"]')) return;
    const fig=document.createElement('figure');
    fig.dataset.pjrVisual='infinite-well';
    fig.style.cssText='margin:24px 0;padding:16px;border:1px solid var(--line,#e1e6ef);border-radius:16px;background:#fff;box-shadow:0 10px 30px #1b25520d';
    const img=document.createElement('img');
    img.src=ASSET+'?v=5.10.1';
    img.alt='Particle in an infinite potential well: potential walls, quantized energy levels, first four stationary wavefunctions, and probability densities.';
    img.loading='lazy';
    img.style.cssText='width:100%;height:auto;display:block';
    const cap=document.createElement('figcaption');
    cap.textContent='Visual: infinite potential well — quantization, wavefunctions, nodes, and probability density.';
    cap.style.cssText='margin-top:10px;color:var(--muted,#69758a);font-size:12px;line-height:1.5';
    fig.append(img,cap);
    detail.appendChild(fig);
  }
  window.addEventListener('pjr:data-ready',render);
  const start=()=>{render();const d=document.getElementById('topicdetail');if(d)new MutationObserver(()=>render()).observe(d,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
