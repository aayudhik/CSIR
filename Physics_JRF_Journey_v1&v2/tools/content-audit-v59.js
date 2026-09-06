const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'study-content.json');
const OUT = path.join(ROOT, 'data', 'content-audit-v5.9.json');

const SUBJECT_TARGETS = {
  PA: {name:'Part A — General Aptitude', minTopics:15, keywords:['quantitative','reasoning','data interpretation','graph','series','probability','permutation','combinatorics']},
  MP: {name:'Mathematical Physics', minTopics:10, keywords:['vector calculus','linear algebra','differential equation','complex analysis','fourier','laplace','special function','probability']},
  CM: {name:'Classical Mechanics', minTopics:12, keywords:['lagrangian','hamiltonian','canonical','poisson bracket','central force','scattering','rigid body','collision','oscillation','normal mode']},
  EM: {name:'Electromagnetic Theory', minTopics:18, keywords:['coulomb','gauss','laplace','poisson','boundary value','green','multipole','magnetostatic','faraday','maxwell','displacement current','poynting','wave','radiation','retarded potential','gauge','waveguide','cavity']},
  QM: {name:'Quantum Mechanics', minTopics:20, keywords:['wavefunction','schrodinger','particle in a box','harmonic oscillator','angular momentum','spin','hydrogen','perturbation','variational','wkb','adiabatic','identical particle','scattering','born approximation','phase shift','time-dependent','fermi golden rule','selection rule','symmetry','conservation']},
  TS: {name:'Thermodynamics & Statistical Physics', minTopics:14, keywords:['first law','second law','entropy','thermodynamic potential','maxwell relation','chemical potential','ensemble','partition function','microcanonical','canonical','grand canonical','fermi-dirac','bose-einstein','phase transition','boltzmann equation','transport','ising','critical exponent']},
  EE: {name:'Electronics & Experimental Methods', minTopics:15, keywords:['semiconductor','p-n junction','diode','bjt','fet','op-amp','logic gate','amplifier','oscillator','error analysis','oscilloscope','spectroscopy','x-ray diffraction','electron microscopy','fourier transform','data acquisition']},
  AM: {name:'Atomic & Molecular Physics', minTopics:12, keywords:['bohr','hydrogen','fine structure','hyperfine','zeeman','stark','selection rule','spin-orbit','molecular rotation','molecular vibration','raman','laser','spectroscopy']},
  CP: {name:'Condensed Matter Physics', minTopics:16, keywords:['crystal','bravais','reciprocal lattice','miller','bragg','structure factor','free electron','nearly free electron','bloch','band gap','density of states','semiconductor','conductivity','heat capacity','diamagnetism','paramagnetism','ferromagnetism','superconductivity']},
  NP: {name:'Nuclear & Particle Physics', minTopics:12, keywords:['nuclear','binding energy','semi-empirical','radioactive','decay','shell model','liquid drop','fission','fusion','scattering','standard model','quark','lepton','symmetry','conservation']},
  RE: {name:'Relativity', minTopics:7, keywords:['lorentz','time dilation','length contraction','four-vector','relativistic energy','momentum','invariant','electromagnetic field']}
};

const REQUIRED_FIELDS = [
  ['overview','overview'],
  ['learning_objectives','learning objectives'],
  ['syllabus_points','syllabus points'],
  ['concepts','concepts'],
  ['formula_focus','formula focus'],
  ['worked_example','worked example'],
  ['common_mistakes','common mistakes'],
  ['practice','practice'],
  ['core_notes','core notes'],
  ['key_concepts','key concepts'],
  ['formula_sheet','formula sheet'],
  ['worked_example_detail','worked example detail'],
  ['revision','revision'],
  ['pyq_mapping','PYQ mapping'],
  ['resources','resources']
];

const GENERIC_PATTERNS = [
  /core ideas of /i,
  /governing equations and how to derive\/use them/i,
  /standard limiting cases, symmetries and conservation laws/i,
  /write the governing definitions\/equations first/i,
  /start with the defining equation for /i,
  /this is the standard workflow/i,
  /definitions, notation and physical interpretation of /i,
  /standard equations, derivations and boundary\/initial conditions/i
];

function textOf(v){
  if(v == null) return '';
  if(typeof v === 'string') return v;
  if(Array.isArray(v)) return v.map(textOf).join(' ');
  if(typeof v === 'object') return Object.values(v).map(textOf).join(' ');
  return String(v);
}
function countWords(v){ return textOf(v).trim().split(/\s+/).filter(Boolean).length; }
function present(v){ return countWords(v) > 0; }
function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9+\- ]/g,' '); }
function questionCount(r){
  const a = Array.isArray(r.practice) ? r.practice.length : 0;
  const b = Array.isArray(r.practice_v5_5) ? r.practice_v5_5.length : 0;
  return Math.max(a,b);
}
function genericHits(r){
  const all = REQUIRED_FIELDS.map(([k])=>textOf(r[k])).join('\n');
  return GENERIC_PATTERNS.filter(p=>p.test(all)).length;
}
function depthScore(r){
  let score=0;
  const weights = {
    overview:0.7, learning_objectives:0.5, syllabus_points:0.5, concepts:0.8,
    formula_focus:0.7, worked_example:1.0, common_mistakes:0.7, practice:1.2,
    core_notes:0.8, key_concepts:0.6, formula_sheet:0.6, worked_example_detail:1.0,
    revision:0.6, pyq_mapping:0.8, resources:0.4
  };
  for(const [k] of REQUIRED_FIELDS) if(present(r[k])) score += weights[k]||0;
  const q = questionCount(r);
  if(q >= 10) score += 1.2; else if(q >= 6) score += 0.8; else if(q >= 3) score += 0.4;
  const words = countWords(r.core_notes)+countWords(r.overview)+countWords(r.worked_example)+countWords(r.syllabus_points)+countWords(r.concepts);
  if(words >= 700) score += 1.0; else if(words >= 400) score += 0.6; else if(words >= 200) score += 0.3;
  score -= genericHits(r)*0.18;
  return Math.max(0, Math.min(10, Number(score.toFixed(2))));
}
function level(score){ if(score >= 8) return 'Mastery'; if(score >= 6) return 'Application'; if(score >= 4) return 'Concept'; return 'Definition'; }

const raw = JSON.parse(fs.readFileSync(DATA,'utf8'));
const records = Array.isArray(raw.records) ? raw.records : [];
const subjects = Array.isArray(raw.subjects) ? raw.subjects : [];

const topicAudit = records.map(r => {
  const missing = REQUIRED_FIELDS.filter(([k])=>!present(r[k])).map(([,label])=>label);
  const q = questionCount(r);
  if(q < 10) missing.push(`practice questions (<10; ${q})`);
  const score = depthScore(r);
  return {
    id:r.id, subject_id:r.subject_id, subject:r.subject, topic:r.topic, sequence:r.sequence,
    depth_score_10:score, depth_level:level(score),
    word_count:countWords(r), practice_questions:q, generic_template_hits:genericHits(r), missing
  };
});

const subjectAudit = subjects.map(s => {
  const rows = topicAudit.filter(r=>r.subject_id===s.id);
  const target = SUBJECT_TARGETS[s.id] || {name:s.name,minTopics:s.topic_count||0,keywords:[]};
  const corpus = norm(rows.map(r=>records.find(x=>x.id===r.id)).map(textOf).join(' '));
  const missingKeywords = target.keywords.filter(k=>!corpus.includes(norm(k)));
  const avg = rows.length ? Number((rows.reduce((a,r)=>a+r.depth_score_10,0)/rows.length).toFixed(2)) : 0;
  return {
    id:s.id,name:s.name,current_topics:rows.length,target_min_topics:target.minTopics,
    topic_gap:Math.max(0,target.minTopics-rows.length), average_depth_score_10:avg,
    below_application:rows.filter(r=>r.depth_score_10<6).length,
    mastery_ready:rows.filter(r=>r.depth_score_10>=8).length,
    missing_keyword_signals:missingKeywords,
    priority: rows.length < target.minTopics || avg < 5 ? 'CRITICAL' : avg < 6.5 ? 'HIGH' : 'MEDIUM'
  };
});

const overall = topicAudit.length ? Number((topicAudit.reduce((a,r)=>a+r.depth_score_10,0)/topicAudit.length).toFixed(2)) : 0;
const genericTopics = topicAudit.filter(r=>r.generic_template_hits>=3);
const weakTopics = topicAudit.filter(r=>r.depth_score_10<4);
const underPracticed = topicAudit.filter(r=>r.practice_questions<6);

const report = {
  version:'V5.9', generated_at:new Date().toISOString(), source_version:raw.version,
  methodology:{max_depth_score:10, target_application:6, target_mastery:8, target_practice_questions:10},
  summary:{topic_count:topicAudit.length, declared_subject_count:subjects.length, average_depth_score_10:overall, weak_topics:weakTopics.length, generic_template_topics:genericTopics.length, under_practiced_topics:underPracticed.length},
  subjects:subjectAudit,
  topics:topicAudit,
  next_actions:[
    'Replace generic/template passages with topic-specific physics explanations.',
    'Raise major topics to Application or Mastery depth.',
    'Create missing high-priority syllabus topics before adding more UI features.',
    'Expand major-topic practice toward 10–15 questions with explicit difficulty and detailed solutions.',
    'Add derivations, visual aids, prerequisites, related-topic links and PYQ mappings.'
  ]
};

fs.writeFileSync(OUT, JSON.stringify(report,null,2)+'\n');
console.log(`V5.9 content audit: ${topicAudit.length} topics; average depth ${overall}/10; weak ${weakTopics.length}; generic-heavy ${genericTopics.length}; under-practiced ${underPracticed.length}`);
for(const s of subjectAudit) console.log(`${s.id}: ${s.current_topics} topics, target ${s.target_min_topics}, avg ${s.average_depth_score_10}/10, priority ${s.priority}`);
