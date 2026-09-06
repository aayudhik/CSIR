const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const FILE=path.join(ROOT,'data','content-expansion-v5.9.1.json');
const arr=x=>Array.isArray(x)?x:[];
const tid=t=>String(t?.id??t?.topic_id??t?.topicId??'').trim();
function topics(raw){
  if(Array.isArray(raw.topics))return raw.topics;
  if(Array.isArray(raw.records))return raw.records;
  const out=[];
  for(const s of arr(raw.subjects))for(const t of arr(s.topics))out.push({...t,subject_id:t.subject_id??s.id,subject:t.subject??s.name});
  return out;
}
const raw=JSON.parse(fs.readFileSync(FILE,'utf8'));
const records=topics(raw);
const questions=arr(raw.questions);
if(records.length<30)throw new Error(`Expansion topics too small: ${records.length}`);
if(questions.length<150)throw new Error(`Expansion questions too small: ${questions.length}`);
const ids=new Set();
for(const t of records){const id=tid(t);if(!id)throw new Error('Expansion topic missing id');if(ids.has(id))throw new Error(`Duplicate topic id: ${id}`);ids.add(id);for(const k of ['subject_id','subject','topic','overview','learning_objectives','syllabus_points','concepts','formula_focus','worked_example','common_mistakes'])if(t[k]==null)throw new Error(`Topic ${id} missing ${k}`)}
const qids=new Set();
for(const q of questions){if(!q.qid)throw new Error('Expansion question missing qid');if(qids.has(q.qid))throw new Error(`Duplicate question id: ${q.qid}`);qids.add(q.qid);if(!Array.isArray(q.options)||q.options.length<2)throw new Error(`Question ${q.qid} has invalid options`);for(const k of ['question','answer','explanation','topic_id','subject_id'])if(q[k]==null)throw new Error(`Question ${q.qid} missing ${k}`)}
const subjects=arr(raw.subjects);
const normalized={version:raw.version||'V5.9.1',title:raw.title||'Physics JRF Journey — Deep Content Expansion',generated_at:raw.generated_at||new Date().toISOString(),subjects,topics:records,questions,question_count:questions.length};
fs.writeFileSync(FILE,JSON.stringify(normalized,null,2)+'\n');
console.log(`V5.9.1 expansion source validated and normalized: ${records.length} topics; ${questions.length} questions`);
