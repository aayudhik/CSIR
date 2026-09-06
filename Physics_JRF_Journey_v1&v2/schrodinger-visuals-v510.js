(()=>{
  const ASSETS=[
    {key:'infinite-well',file:'schrodinger-infinite-well.svg',alt:'Particle in an infinite potential well: potential walls, quantized energy levels, first four stationary wavefunctions, and probability densities.',caption:'Visual: infinite potential well — quantization, wavefunctions, nodes, and probability density.'},
    {key:'psi-vs-psi-squared',file:'schrodinger-psi-squared.svg',alt:'Comparison of the wavefunction psi, probability density absolute psi squared, and repeated position-measurement histogram.',caption:'Visual: ψ is a probability amplitude; |ψ|² is probability density; repeated measurements approach that distribution.'},
    {key:'time-evolution',file:'schrodinger-time-evolution.svg',alt:'Five snapshots of a free-particle Gaussian wavepacket moving and spreading with time.',caption:'Visual: a free Gaussian wavepacket moves while spreading because its momentum components acquire different phases.'},
    {key:'tunneling',file:'schrodinger-tunneling.svg',alt:'Finite rectangular barrier showing incident, reflected, exponentially decaying, and transmitted quantum waves for E below the barrier.',caption:'Visual: quantum tunnelling through a finite rectangular barrier, including exponential attenuation and transmission.'}
  ];
  const isSchrodinger=el=>/schrödinger equation|schrodinger equation/i.test(el?.textContent||'');
  function render(){
    const detail=document.getElementById('topicdetail');
    if(!detail||detail.classList.contains('hidden')||!isSchrodinger(detail)) return;
    const marker='data-pjr-visual';
    for(const a of ASSETS){
      if(detail.querySelector(`[${marker}="${a.key}"]`)) continue;
      const fig=document.createElement('figure');
      fig.setAttribute(marker,a.key);
      fig.style.cssText='margin:24px 0;padding:16px;border:1px solid var(--line,#e1e6ef);border-radius:16px;background:#fff;box-shadow:0 10px 30px #1b25520d';
      const img=document.createElement('img');
      img.src=`./data/visuals/${a.file}?v=5.10.2`;
      img.alt=a.alt;
      img.loading='lazy';
      img.decoding='async';
      img.style.cssText='width:100%;height:auto;display:block';
      const cap=document.createElement('figcaption');
      cap.textContent=a.caption;
      cap.style.cssText='margin-top:10px;color:var(--muted,#69758a);font-size:12px;line-height:1.5';
      fig.append(img,cap);
      detail.appendChild(fig);
    }
  }
  window.addEventListener('pjr:data-ready',render);
  const start=()=>{render();const d=document.getElementById('topicdetail');if(d)new MutationObserver(()=>render()).observe(d,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
