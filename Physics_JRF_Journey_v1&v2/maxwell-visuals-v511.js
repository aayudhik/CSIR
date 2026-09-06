(()=>{
  const ASSETS=[
    {key:'gauss-electric',file:'maxwell-gauss-electric.svg',alt:"Gauss's law electric flux through a Gaussian surface",caption:"Visual: electric flux through a closed Gaussian surface and the enclosed-charge relation."},
    {key:'faraday-induction',file:'maxwell-faraday-induction.svg',alt:"Faraday's law showing changing magnetic flux and induced electric circulation",caption:"Visual: changing magnetic flux produces a circulating induced electric field."},
    {key:'em-wave',file:'maxwell-em-wave.svg',alt:'Plane electromagnetic wave with mutually perpendicular E, B and k',caption:'Visual: E, B and k are mutually perpendicular for a simple plane electromagnetic wave.'},
    {key:'poynting',file:'maxwell-poynting.svg',alt:'Poynting vector showing electromagnetic energy transport through a surface',caption:'Visual: the Poynting vector S = E × H represents electromagnetic energy flux density.'}
  ];
  const isMaxwell=el=>/maxwell.?s equations|maxwell.?equations/i.test(el?.textContent||'');
  function render(){
    const detail=document.getElementById('topicdetail');
    if(!detail||detail.classList.contains('hidden')||!isMaxwell(detail)) return;
    for(const a of ASSETS){
      if(detail.querySelector(`[data-pjr-maxwell-visual="${a.key}"]`)) continue;
      const fig=document.createElement('figure');
      fig.setAttribute('data-pjr-maxwell-visual',a.key);
      fig.style.cssText='margin:24px 0;padding:16px;border:1px solid var(--line,#e1e6ef);border-radius:16px;background:#fff;box-shadow:0 10px 30px #1b25520d';
      const img=document.createElement('img');
      img.src=`./data/visuals/${a.file}?v=5.11.1`;
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