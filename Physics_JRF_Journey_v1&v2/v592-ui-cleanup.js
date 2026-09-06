/* V5.9.2 UI cleanup — remove deprecated Dashboard Quick Resume card */
(()=>{
'use strict';
function removeQuickResume(){
  const home=document.querySelector('#home');
  if(!home)return;
  const nodes=[...home.querySelectorAll('*')];
  for(const el of nodes){
    const text=(el.textContent||'').trim();
    if(!text.startsWith('▶ Quick Resume'))continue;
    const card=el.closest('.card');
    if(card){card.remove();return true;}
    el.remove();return true;
  }
  return false;
}
function boot(){
  removeQuickResume();
  const observer=new MutationObserver(()=>{if(removeQuickResume())observer.disconnect()});
  const home=document.querySelector('#home');
  if(home)observer.observe(home,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
