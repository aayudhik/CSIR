const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const DATA_DIR=path.join(ROOT,'data');
const BASE_HTML=path.join(ROOT,'v58-final.html');
const EXP=path.join(DATA_DIR,'content-expansion-v5.9.1.json');
const STUDY=path.join(DATA_DIR,'study-content.json');
const OUT=path.join(ROOT,'index.html');
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const arr=x=>Array.isArray(x)?x:[];
const tid=t=>String(t?.id??t?.topic_id??t?.topicId??'').trim();
function normalizeTopics(raw){
  if(Array.isArray(raw?.topics))return raw.topics;
  if(Array.isArray(raw?.records))return raw.records;
  const out=[];for(const s of arr(raw?.subjects))for(const t of arr(s?.topics))out.push({...t,subject_id:t.subject_id??s.id,subject:t.subject??s.name});return out;
}
function normalizeExpansion(raw){
  const topics=normalizeTopics(raw),questions=arr(raw?.questions);
  if(topics.length<1)throw new Error('V5.9.1 expansion contains no topics');
  if(questions.length<1)throw new Error('V5.9.1 expansion contains no questions');
  const ids=new Set();
  for(const t of topics){const id=tid(t);if(!id)throw new Error('Expansion topic missing id');if(ids.has(id))throw new Error('Duplicate expansion topic id: '+id);ids.add(id);for(const k of ['subject_id','subject','topic','overview','learning_objectives','syllabus_points','concepts','formula_focus','worked_example','common_mistakes'])if(t[k]==null)throw new Error('Expansion topic '+id+' missing '+k)}
  const qids=new Set();
  for(const q of questions){if(!q.qid)throw new Error('Expansion question missing qid');if(qids.has(q.qid))throw new Error('Duplicate expansion question id: '+q.qid);qids.add(q.qid);for(const k of ['question','options','answer','explanation','topic_id','subject_id'])if(q[k]==null)throw new Error('Expansion question '+q.qid+' missing '+k);if(!Array.isArray(q.options)||q.options.length<2)throw new Error('Expansion question '+q.qid+' has invalid options')}
  return{version:raw.version||'V5.9.1',generated_at:raw.generated_at||new Date().toISOString(),subjects:arr(raw.subjects),topics,questions};
}
function mergeSources(base,ext){
  const subjects=arr(base.subjects).map(s=>({...s})),subjectIds=new Set(subjects.map(s=>String(s.id)));
  for(const s of ext.subjects)if(s?.id&&!subjectIds.has(String(s.id))){subjects.push(s);subjectIds.add(String(s.id))}
  const topics=normalizeTopics(base),topicIds=new Set(topics.map(tid));
  for(const t of ext.topics)if(!topicIds.has(tid(t))){topics.push(t);topicIds.add(tid(t))}
  return{subjects,topics,questionCount:arr(base.questions).length+ext.questions.length};
}
function buildLoad(){
  const lines=[
    'async function load(){',
    "  const get=async url=>{const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(String(r.status)+' '+String(r.statusText));return r.json()};",
    "  const optional=async url=>{try{return await get(url)}catch(e){console.warn('Optional V5.9.1 source unavailable:',url,e);return null}};",
    '  try{',
    "    const [s,q,p,b,x]=await Promise.all([get(DATA+'?v=5.9.1'),get(QB+'?v=5.9.1'),get(PAPERS+'?v=5.9.1'),get(BOOKS+'?v=5.9.1'),optional('./data/content-expansion-v5.9.1.json?v=5.9.1')]);",
    "    data=s||{subjects:[],topics:[]};data.topics=flatTopics(data);questions=(q&&q.questions)||[];papers=(p&&p.papers)||[];books=(b&&b.subjects)||[];",
    '    if(x){',
    "      const extraTopics=Array.isArray(x.topics)?x.topics:flatTopics(x),existingTopics=new Set(data.topics.map(tid));",
    "      data.topics=data.topics.concat(extraTopics.filter(t=>{const id=tid(t);if(!id||existingTopics.has(id))return false;existingTopics.add(id);return true;}));",
    "      const extraSubjects=Array.isArray(x.subjects)?x.subjects:[],existingSubjects=new Set((data.subjects||[]).map(s=>String(s.id)));data.subjects=(data.subjects||[]).concat(extraSubjects.filter(s=>s&&s.id&&!existingSubjects.has(String(s.id))));",
    "      const existingQuestions=new Set(questions.map(q=>String(q.qid)));questions=questions.concat((x.questions||[]).filter(q=>q&&q.qid&&!existingQuestions.has(String(q.qid))&&(existingQuestions.add(String(q.qid)),true)));",
    '    }',
    '    init();window.__PJR_DATA_READY={topics:data.topics,questions:questions};window.dispatchEvent(new CustomEvent(\'pjr:data-ready\',{detail:window.__PJR_DATA_READY}));',
    "  }catch(e){document.querySelector('main').innerHTML='<div class=\"card\"><h2>Physics JRF data loading error</h2><p>'+esc(e.message)+'</p><p class=\"muted\">Refresh once after GitHub Pages finishes deployment.</p></div>';throw e}",
    '}'
  ];
  return lines.join('\n');
}
const base=json(STUDY),ext=normalizeExpansion(json(EXP)),merged=mergeSources(base,ext);
fs.writeFileSync(EXP,JSON.stringify({...ext,subjects:ext.subjects,topics:ext.topics},null,2)+'\n');
let html=read(BASE_HTML);
const start=html.indexOf('async function load(){'),end=html.indexOf('\nfunction init(){',start);
if(start<0||end<0)throw new Error('Could not locate canonical load()/init() boundary in v58-final.html');
html=html.slice(0,start)+buildLoad()+'\nfunction init(){'+html.slice(end+'\nfunction init(){'.length);
html=html.replaceAll('V5.8 FINAL','');
html=html.replaceAll('V5.8 · Final Application Layer','');
html=html.replace(/<title>[^<]*<\/title>/i,'<title>Physics JRF Journey</title>');
const head=read(path.join(ROOT,'v584-head.html'));html=html.replace('</head>',head+'</head>');
const scripts='\n<script src="v58-enhancements.js?v=5.9.1"></script><script src="v585-accessibility.js?v=5.8.5"></script><script src="v586-learning.js?v=5.8.6"></script><script src="v587-exam-intelligence.js?v=5.8.7"></script><script src="v590-clean-brand.js?v=5.9.1"></script><script src="v591-spaced-review.js?v=5.9.1"></script>\n';
if(!html.includes('v591-spaced-review.js'))html=html.replace('</body>',scripts+'</body>');
if(!html.includes('content-expansion-v5.9.1.json?v=5.9.1'))throw new Error('Generated app does not reference normalized expansion source');
if((html.match(/async function load\(\)\{/g)||[]).length!==1)throw new Error('Generated app must contain exactly one load()');
if(!html.includes('pjr:data-ready'))throw new Error('Generated app data-ready hook missing');
if(html.includes('V5.8 FINAL')||html.includes('V5.8 · Final Application Layer'))throw new Error('Legacy V5.8 branding remains in generated app');
if(!/<title>Physics JRF Journey<\/title>/i.test(html))throw new Error('Generated page title is incorrect');
const inline=[...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
if(inline.length!==1)throw new Error('Expected exactly one inline application script, found '+inline.length);
new vm.Script(inline[0],{filename:'generated-index-inline.js'});
if(!/<\/body>\s*<\/html>\s*$/.test(html))throw new Error('Generated HTML closing structure is invalid');
fs.writeFileSync(OUT,html,'utf8');
console.log('V5.9.1 Pages build OK: '+merged.topics.length+' merged topics, '+merged.questionCount+' base+expansion questions, '+merged.subjects.length+' subjects');
console.log('Generated: '+OUT);
