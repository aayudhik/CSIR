const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const DATA_DIR=path.join(ROOT,'data');
const BASE_HTML=path.join(ROOT,'v58-final.html');
const EXP=path.join(DATA_DIR,'content-expansion-v5.9.1.json');
const STUDY=path.join(DATA_DIR,'study-content.json');
const DEEP=path.join(DATA_DIR,'deep-content-v5.10-schrodinger.json');
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
function deepAsTopic(d){
  const questions=arr(d.practice_problems).map((p,i)=>({qid:`${d.topic_id}-D${String(i+1).padStart(2,'0')}`,topic_id:d.topic_id,subject_id:d.subject_id,subject:d.subject,topic:d.topic,difficulty:p.level,type:p.tier,question:p.question,options:p.options,answer:p.answer,explanation:p.explanation,source:'V5.10 deep content',pyq_ref:null}));
  const revision=arr(d.revision_deck).map(x=>({front:x.front,back:x.back}));
  const visual_assets=arr(d.visual_aids).map((v,i)=>({...v,file:i===0?'data/visuals/schrodinger-infinite-well.svg':v.file||'',status:i===0?'RENDERED':'PENDING_RENDERING'}));
  return {id:d.topic_id,subject_id:d.subject_id,subject:d.subject,topic:d.topic,sequence:109,level:'Advanced',overview:d.scope,learning_objectives:arr(d.learning_outcomes),syllabus_points:['Historical motivation','Wavefunction and probability interpretation','Time-dependent and time-independent equations','Operator structure and boundary conditions','Infinite/finite wells, harmonic oscillator and tunnelling','CSIR-NET problem-solving, traps and revision'],concepts:[...arr(d.conceptual_foundation?.wavefunction?.key_points),d.conceptual_foundation?.why_wave_equation||'',d.conceptual_foundation?.time_dependence?.time_dependent||'',d.conceptual_foundation?.time_dependence?.time_independent||''].filter(Boolean),formula_focus:arr(d.mathematical_structure?.standard_forms),worked_example:arr(d.worked_examples).map(e=>`${e.title}: ${e.problem} ${arr(e.solution).join(' ')}`).join('\n\n'),common_mistakes:arr(d.common_mistakes).map(x=>`${x.mistake} → ${x.right} Why: ${x.why}`),practice:questions.map(q=>({q:q.question,options:q.options,answer:q.answer,explanation:q.explanation})),revision:{quick_notes:[d.why_this_matters?.advantage||'',d.equation_and_derivations?.probability_current?.result||'',...arr(d.connections)],flashcards:revision},resources:arr(d.references),version:'V5.10',core_notes:[...arr(d.why_this_matters?.historical_journey).map(x=>`${x.period}: ${x.story}`),d.equation_and_derivations?.operator_postulate?.derivation?.join(' '),d.equation_and_derivations?.matter_wave_route?.steps?.join(' '),d.equation_and_derivations?.probability_current?.derivation?.join(' ')].filter(Boolean),key_concepts:arr(d.conceptual_foundation?.wavefunction?.key_points),formula_sheet:arr(d.mathematical_structure?.standard_forms),worked_example_detail:{problem:arr(d.worked_examples)[0]?.problem||'',solution:arr(d.worked_examples)[0]?.solution?.join(' ')||''},pyq_mapping:{status:'topic-mapped',instruction:'Use the official CSIR-HRDG/NTA archive for authentic PYQs; copyrighted paper text is not reproduced.'},revision_v5_4:{one_minute:'Model → Hamiltonian → boundary conditions → eigenvalues/eigenfunctions → normalisation → interpretation → checks.',formula_triggers:arr(d.mathematical_structure?.standard_forms),flashcards:revision},deep_content:d,questions,visual_assets};
}
function mergeSources(base,ext,deep){
  const subjects=arr(base.subjects).map(s=>({...s})),subjectIds=new Set(subjects.map(s=>String(s.id)));
  for(const s of ext.subjects)if(s?.id&&!subjectIds.has(String(s.id))){subjects.push(s);subjectIds.add(String(s.id))}
  const topics=normalizeTopics(base),topicIds=new Set(topics.map(tid));
  for(const t of ext.topics)if(!topicIds.has(tid(t))){topics.push(t);topicIds.add(tid(t))}
  if(deep){const dt=deepAsTopic(deep);const existing=topics.find(t=>String(t.topic||'').toLowerCase().includes('schrödinger')||String(t.topic||'').toLowerCase().includes('schrodinger'));if(existing){Object.assign(existing,dt,{id:existing.id})}else{topics.push(dt);topicIds.add(dt.id)}}
  return{subjects,topics,questionCount:arr(base.questions).length+ext.questions.length+arr(deep?.practice_problems).length};
}
function buildLoad(){
  const lines=['async function load(){',"  const get=async url=>{const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(String(r.status)+' '+String(r.statusText));return r.json()};","  const optional=async url=>{try{return await get(url)}catch(e){console.warn('Optional V5 source unavailable:',url,e);return null}};",'  try{',"    const [s,q,p,b,x,d]=await Promise.all([get(DATA+'?v=5.10'),get(QB+'?v=5.10'),get(PAPERS+'?v=5.10'),get(BOOKS+'?v=5.10'),optional('./data/content-expansion-v5.9.1.json?v=5.10'),optional('./data/deep-content-v5.10-schrodinger.json?v=5.10')]);","    data=s||{subjects:[],topics:[]};data.topics=flatTopics(data);questions=(q&&q.questions)||[];papers=(p&&p.papers)||[];books=(b&&b.subjects)||[];",'    if(x){',"      const extraTopics=Array.isArray(x.topics)?x.topics:flatTopics(x),existingTopics=new Set(data.topics.map(tid));","      data.topics=data.topics.concat(extraTopics.filter(t=>{const id=tid(t);if(!id||existingTopics.has(id))return false;existingTopics.add(id);return true;}));","      const extraSubjects=Array.isArray(x.subjects)?x.subjects:[],existingSubjects=new Set((data.subjects||[]).map(s=>String(s.id)));data.subjects=(data.subjects||[]).concat(extraSubjects.filter(s=>s&&s.id&&!existingSubjects.has(String(s.id))));","      const existingQuestions=new Set(questions.map(q=>String(q.qid)));questions=questions.concat((x.questions||[]).filter(q=>q&&q.qid&&!existingQuestions.has(String(q.qid))&&(existingQuestions.add(String(q.qid)),true)));",'    }',"    if(d&&d.topic){const deep=d,existing=data.topics.find(t=>String(t.topic||'').toLowerCase().includes('schrödinger')||String(t.topic||'').toLowerCase().includes('schrodinger'));const deepTopic={id:existing?.id||deep.topic_id,subject_id:deep.subject_id,subject:deep.subject,topic:deep.topic,sequence:existing?.sequence||109,level:'Advanced',overview:deep.scope,learning_objectives:deep.learning_outcomes,syllabus_points:['Historical motivation','Wavefunction and probability interpretation','Time-dependent and time-independent equations','Operator structure and boundary conditions','Infinite/finite wells, harmonic oscillator and tunnelling','CSIR-NET problem-solving, traps and revision'],concepts:[...(deep.conceptual_foundation?.wavefunction?.key_points||[]),deep.conceptual_foundation?.why_wave_equation||'',deep.conceptual_foundation?.time_dependence?.time_dependent||'',deep.conceptual_foundation?.time_dependence?.time_independent||''].filter(Boolean),formula_focus:deep.mathematical_structure?.standard_forms||[],worked_example:(deep.worked_examples||[]).map(e=>e.title+'\\n'+e.problem+'\\n'+(e.solution||[]).join('\\n')).join('\\n\\n'),common_mistakes:(deep.common_mistakes||[]).map(x=>x.mistake+' → '+x.right+' Why: '+x.why),practice:(deep.practice_problems||[]).map(p=>({q:p.question,options:p.options,answer:p.answer,explanation:p.explanation})),revision:{quick_notes:[deep.why_this_matters?.advantage||'',deep.equation_and_derivations?.probability_current?.result||'',...(deep.connections||[])],flashcards:deep.revision_deck||[]},resources:deep.references||[],version:'V5.10',core_notes:[...(deep.why_this_matters?.historical_journey||[]).map(x=>x.period+': '+x.story),deep.equation_and_derivations?.operator_postulate?.derivation?.join(' '),deep.equation_and_derivations?.matter_wave_route?.steps?.join(' '),deep.equation_and_derivations?.probability_current?.derivation?.join(' ')].filter(Boolean),key_concepts:deep.conceptual_foundation?.wavefunction?.key_points||[],formula_sheet:deep.mathematical_structure?.standard_forms||[],worked_example_detail:{problem:deep.worked_examples?.[0]?.problem||'',solution:(deep.worked_examples?.[0]?.solution||[]).join(' ')},pyq_mapping:{status:'topic-mapped',instruction:'Use the official CSIR-HRDG/NTA archive for authentic PYQs; copyrighted paper text is not reproduced.'},revision_v5_4:{one_minute:'Model → Hamiltonian → boundary conditions → eigenvalues/eigenfunctions → normalisation → interpretation → checks.',formula_triggers:deep.mathematical_structure?.standard_forms||[],flashcards:deep.revision_deck||[]},deep_content:deep,visual_assets:(deep.visual_aids||[]).map((v,i)=>({...v,file:i===0?'data/visuals/schrodinger-infinite-well.svg':v.file||'',status:i===0?'RENDERED':'PENDING_RENDERING'}))};if(existing)Object.assign(existing,deepTopic);else data.topics.push(deepTopic);const existingDeep=new Set(questions.map(q=>String(q.qid)));for(const p of (deep.practice_problems||[])){const qid=deep.topic_id+'-D'+String((questions.length+1)).padStart(4,'0');if(!existingDeep.has(qid)){questions.push({qid,topic_id:deep.topic_id,subject_id:deep.subject_id,subject:deep.subject,topic:deep.topic,difficulty:p.level,type:p.tier,question:p.question,options:p.options,answer:p.answer,explanation:p.explanation,source:'V5.10 deep content'});existingDeep.add(qid)}}}",'    init();window.__PJR_DATA_READY={topics:data.topics,questions:questions};window.dispatchEvent(new CustomEvent(\'pjr:data-ready\',{detail:window.__PJR_DATA_READY}));',"  }catch(e){document.querySelector('main').innerHTML='<div class=\"card\"><h2>Physics JRF data loading error</h2><p>'+esc(e.message)+'</p><p class=\"muted\">Refresh once after GitHub Pages finishes deployment.</p></div>';throw e}",' }'];return lines.join('\n');
}
const base=json(STUDY),ext=normalizeExpansion(json(EXP)),deep=json(DEEP),merged=mergeSources(base,ext,deep);
let html=read(BASE_HTML);
const start=html.indexOf('async function load(){'),end=html.indexOf('\nfunction init(){',start);
if(start<0||end<0)throw new Error('Could not locate canonical load()/init() boundary in v58-final.html');
html=html.slice(0,start)+buildLoad()+'\nfunction init(){'+html.slice(end+'\nfunction init(){'.length);
html=html.replaceAll('V5.8 FINAL','V5.10 FINAL');
html=html.replaceAll('V5.8 · Final Application Layer','V5.10 · Final Application Layer');
html=html.replace(/<title>[^<]*<\/title>/i,'<title>Physics JRF Journey</title>');
html=html.replace(/(name=["']description["'][^>]*content=["'][^"']*?)V5\.8([^"']*["'])/i,'$1V5.10$2');
const head=read(path.join(ROOT,'v584-head.html'));html=html.replace('</head>',head+'</head>');
const scripts='\n<script src="v58-enhancements.js?v=5.9.1"></script><script src="v585-accessibility.js?v=5.8.5"></script><script src="v586-learning.js?v=5.8.6"></script><script src="v587-exam-intelligence.js?v=5.8.7"></script><script src="v590-clean-brand.js?v=5.9.1"></script><script src="v591-spaced-review.js?v=5.9.1"></script><script src="v592-ui-cleanup.js?v=5.9.2"></script><script src="schrodinger-visuals-v510.js?v=5.10.1"></script>\n';
if(!html.includes('v591-spaced-review.js'))html=html.replace('</body>',scripts+'</body>');
if(!html.includes('schrodinger-visuals-v510.js'))throw new Error('Schrödinger visual renderer missing');
if(!html.includes('content-expansion-v5.9.1.json?v=5.10'))throw new Error('Generated app does not reference normalized expansion source');
if(!html.includes('deep-content-v5.10-schrodinger.json?v=5.10'))throw new Error('Generated app does not reference V5.10 Schrödinger content');
if((html.match(/async function load\(\)\{/g)||[]).length!==1)throw new Error('Generated app must contain exactly one load()');
if(!html.includes('pjr:data-ready'))throw new Error('Generated app data-ready hook missing');
if(html.includes('V5.8 FINAL')||html.includes('V5.8 · Final Application Layer'))throw new Error('Legacy V5.8 branding remains in generated app');
if(!/<title>Physics JRF Journey<\/title>/i.test(html))throw new Error('Generated page title is incorrect');
const inline=[...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
if(inline.length!==1)throw new Error('Expected exactly one inline application script, found '+inline.length);
new vm.Script(inline[0],{filename:'generated-index-inline.js'});
if(!/<\/body>\s*<\/html>\s*$/.test(html))throw new Error('Generated HTML closing structure is invalid');
fs.writeFileSync(OUT,html,'utf8');
console.log('V5.10 Pages build OK: '+merged.topics.length+' merged topics, '+merged.questionCount+' base+expansion+deep questions, '+merged.subjects.length+' subjects');
console.log('Schrödinger deep content integrated from '+DEEP);
console.log('Infinite-well visual renderer integrated from schrodinger-visuals-v510.js');
console.log('Generated: '+OUT);