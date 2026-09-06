/* Physics JRF Journey V5.8.6 — offline/cache foundation */
const VERSION='pjr-v586-1';
const SHELL=VERSION+'-shell';
const DATA=VERSION+'-data';
const SHELL_FILES=['./','./index.html','./v58-final.html','./v58-enhancements.js','./v584-public.js','./v585-accessibility.js','./v586-learning.js','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(SHELL_FILES)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>![SHELL,DATA].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||!req.url.startsWith(self.location.origin))return;
  const url=new URL(req.url);
  const isData=/\/data\/.*\.json$/i.test(url.pathname);
  if(isData){
    event.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(DATA).then(c=>c.put(req,copy));}
      return res;
    }).catch(()=>caches.match(req)));
    return;
  }
  if(req.mode==='navigate'||/\.(?:html|js|css|webmanifest)$/i.test(url.pathname)){
    event.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(SHELL).then(c=>c.put(req,copy));}
      return res;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
  }
});
