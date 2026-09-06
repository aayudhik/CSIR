/* V5.9 — remove legacy "V5.8 FINAL" branding from the public website */
(()=>{
  'use strict';
  const OLD='V5.8 FINAL';
  const NEW='';
  const clean=()=>{
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      if(n.nodeValue&&n.nodeValue.includes(OLD)) n.nodeValue=n.nodeValue.split(OLD).join(NEW).replace(/\s{2,}/g,' ');
    });
    if(document.title.includes(OLD)) document.title=document.title.split(OLD).join('').replace(/\s{2,}/g,' ').trim();
  };
  const run=()=>{clean();};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  new MutationObserver(clean).observe(document.body,{childList:true,subtree:true});
})();
