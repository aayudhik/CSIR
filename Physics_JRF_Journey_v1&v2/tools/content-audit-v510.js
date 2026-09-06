const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data', 'study-content.json');
const EXP = path.join(ROOT, 'data', 'content-expansion-v5.9.1.json');
const OUT = path.join(ROOT, 'data', 'content-depth-audit-v5.10.json');
const MD = path.join(ROOT, 'data', 'content-depth-audit-v5.10.md');

const CRITICAL = [
  ['QM', 'Schrödinger Equation'],
  ['QM', 'Perturbation Theory'],
  ['QM', 'Hydrogen Atom'],
  ['EM', "Maxwell's Equations"],
  ['EM', 'Waves & Radiation'],
  ['TS', 'Partition Function'],
  ['TS', 'Phase Transitions'],
  ['CM', 'Lagrangian & Hamiltonian'],
  ['CP', 'Band Structure'],
  ['AM', 'Atomic Spectra'],
  ['MP', 'Vector Calculus']
];

const FIELD_GROUPS = {
  conceptual_foundation: ['overview', 'concepts', 'core_notes', 'key_concepts', 'learning_objectives', 'syllabus_points'],
  equations: ['formula_focus', 'formula_sheet', 'equations', 'key_equations', 'derived_equations'],
  examples: ['worked_example', 'worked_example_detail', 'worked_examples', 'examples'],
  derivations: ['derivation', 'derivations', 'derivation_steps', 'proof', 'proofs'],
  visuals: ['visual', 'visuals', 'diagram', 'diagrams', 'figure', 'figures', 'plot', 'plots', 'schematic', 'schematics'],
  practice: ['practice', 'practice_questions', 'questions', 'question_ids', 'pyq_mapping'],
  revision: ['revision', 'common_mistakes', 'exam_tips', 'summary']
};

const VISUAL_WORDS = /diagram|figure|plot|graph|schematic|visual|flowchart|illustration|vector field|energy level|band diagram|circuit diagram/i;
const DERIVATION_WORDS = /derive|derivation|proof|prove|show that|obtain|from .* equation|differentiat|integrat|expand|diagonaliz|solve .* equation/i;
const EXAMPLE_WORDS = /worked example|example|consider a|for a |given .* find|calculate|compute|let .* be/i;
const FORMULA_WORDS = /[=∫∑∇ħπ]|\b[A-Z][A-Za-z_]*\s*=|equation|formula/i;
const GENERIC = [/core ideas of [^.]+/i, /standard equations, derivations/i, /standard limiting cases, symmetries/i, /write the governing definitions\/equations first/i, /start with the defining equation for/i, /this is the standard workflow/i, /physical meaning of [^.]+ is a core/i, /memorizing a formula without checking/i];

const arr = v => Array.isArray(v) ? v : [];
const text = v => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(text).join(' ');
  if (typeof v === 'object') return Object.values(v).map(text).join(' ');
  return '';
};
const words = v => text(v).trim().split(/\s+/).filter(Boolean).length;
const topicId = t => String(t?.id ?? t?.topic_id ?? t?.topicId ?? '').trim();
const title = t => String(t?.topic ?? t?.title ?? t?.name ?? '').trim();

function normalizeTopics(raw) {
  if (Array.isArray(raw.topics)) return raw.topics;
  if (Array.isArray(raw.records)) return raw.records;
  const out = [];
  for (const s of arr(raw.subjects)) {
    for (const t of arr(s.topics)) out.push({ ...t, subject_id: t.subject_id ?? s.id, subject: t.subject ?? s.name });
  }
  return out;
}

function fieldEvidence(record, fields) {
  const present = [];
  for (const key of fields) if (words(record[key]) > 0) present.push(key);
  return present;
}

function countSentences(v) {
  const s = text(v).trim();
  return s ? s.split(/[.!?]+/).map(x => x.trim()).filter(Boolean).length : 0;
}

function countPractice(record) {
  const candidates = [record.practice, record.practice_v5_5, record.practice_questions, record.questions];
  return Math.max(0, ...candidates.map(x => Array.isArray(x) ? x.length : 0));
}

function countEvidence(record, group, regex) {
  const corpus = fieldEvidence(record, FIELD_GROUPS[group]).map(k => text(record[k])).join(' ');
  if (!corpus) return { count: 0, fields: [] };
  const fields = fieldEvidence(record, FIELD_GROUPS[group]);
  const hits = corpus.split(/\n+/).flatMap(line => line.match(regex) ? [line] : []);
  return { count: hits.length, fields };
}

function classifyQuestions(record) {
  const q = arr(record.practice).concat(arr(record.practice_v5_5));
  const out = { concept: 0, calculation: 0, derivation: 0, pyq: 0, other: 0 };
  for (const item of q) {
    const s = text(item).toLowerCase();
    const pyq = /pyq|previous year|csir|net\b|jrf/.test(s);
    const der = /derive|derivation|prove|show that|proof/.test(s);
    const calc = /calculate|compute|numerical|find .*value|evaluate|solve/.test(s);
    if (pyq) out.pyq++;
    else if (der) out.derivation++;
    else if (calc) out.calculation++;
    else if (s) out.concept++;
    else out.other++;
  }
  return out;
}

function specificity(record) {
  const corpus = text(record).toLowerCase();
  return {
    formula_evidence: FORMULA_WORDS.test(corpus),
    derivation_evidence: DERIVATION_WORDS.test(corpus),
    example_evidence: EXAMPLE_WORDS.test(text(record.worked_example) + ' ' + text(record.worked_example_detail)),
    visual_evidence: VISUAL_WORDS.test(corpus),
    interpretation_evidence: /physical meaning|interpret|why |because|significance|intuition/.test(corpus)
  };
}

function genericHits(record) {
  const corpus = [record.overview, record.core_notes, record.worked_example, record.worked_example_detail].map(text).join(' ');
  return GENERIC.reduce((n, p) => n + (p.test(corpus) ? 1 : 0), 0);
}

function depthScore(m) {
  const conceptual = Math.min(1.5, m.conceptual_words / 700 * 1.5);
  const equations = Math.min(1.2, (m.equation_count + (m.specificity.formula_evidence ? 1 : 0)) * 0.3);
  const examples = Math.min(1.5, m.example_count * 0.5);
  const derivations = Math.min(1.8, m.derivation_count * 0.6 + (m.specificity.derivation_evidence ? 0.3 : 0));
  const visuals = Math.min(1.2, m.visual_count * 0.4);
  const practice = Math.min(1.2, m.practice_total / 10 * 1.2);
  const interpretation = m.specificity.interpretation_evidence ? 0.6 : 0;
  const genericPenalty = Math.min(1.5, m.generic_template_hits * 0.25);
  const score = conceptual + equations + examples + derivations + visuals + practice + interpretation - genericPenalty;
  return Math.max(0, Math.min(10, Number(score.toFixed(2))));
}

function level(score) {
  if (score >= 8) return 'Mastery';
  if (score >= 6) return 'Application';
  if (score >= 4) return 'Concept';
  return 'Definition';
}

const base = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const ext = JSON.parse(fs.readFileSync(EXP, 'utf8'));
const baseTopics = normalizeTopics(base);
const extTopics = normalizeTopics(ext);
const seen = new Set();
const merged = [];
for (const t of [...baseTopics, ...extTopics]) {
  const id = topicId(t);
  if (!id || seen.has(id)) continue;
  seen.add(id);
  merged.push(t);
}

const subjects = [];
const subjectSeen = new Set();
for (const s of [...arr(base.subjects), ...arr(ext.subjects)]) {
  const id = String(s?.id ?? '').trim();
  if (!id || subjectSeen.has(id)) continue;
  subjectSeen.add(id);
  subjects.push(s);
}

const topics = merged.map(record => {
  const conceptualFields = fieldEvidence(record, FIELD_GROUPS.conceptual_foundation);
  const equationFields = fieldEvidence(record, FIELD_GROUPS.equations);
  const exampleFields = fieldEvidence(record, FIELD_GROUPS.examples);
  const derivationFields = fieldEvidence(record, FIELD_GROUPS.derivations);
  const visualFields = fieldEvidence(record, FIELD_GROUPS.visuals);
  const practiceFields = fieldEvidence(record, FIELD_GROUPS.practice);
  const conceptualWords = conceptualFields.reduce((n, k) => n + words(record[k]), 0);
  const examples = countEvidence(record, 'examples', EXAMPLE_WORDS);
  const derivations = countEvidence(record, 'derivations', DERIVATION_WORDS);
  const visuals = countEvidence(record, 'visuals', VISUAL_WORDS);
  const equationCorpus = equationFields.map(k => text(record[k])).join(' ');
  const equationCount = (equationCorpus.match(/(?:=|∫|∑|∇|ħ|equation|formula)/gi) || []).length;
  const practiceTotal = countPractice(record);
  const specificitySignals = specificity(record);
  const metrics = {
    id: topicId(record),
    subject_id: record.subject_id,
    subject: record.subject,
    topic: title(record),
    conceptual_foundation_fields: conceptualFields,
    conceptual_paragraphs: conceptualFields.reduce((n, k) => n + countSentences(record[k]), 0),
    conceptual_words: conceptualWords,
    equation_fields: equationFields,
    equation_count: equationCount,
    example_fields: exampleFields,
    example_count: examples.count,
    example_evidence_fields: examples.fields,
    derivation_fields: derivationFields,
    derivation_count: derivations.count,
    derivation_evidence_fields: derivations.fields,
    visual_fields: visualFields,
    visual_count: visuals.count,
    visual_evidence_fields: visuals.fields,
    practice_fields: practiceFields,
    practice_total: practiceTotal,
    practice_types: classifyQuestions(record),
    generic_template_hits: genericHits(record),
    specificity: specificitySignals,
    derivation_coverage_percent: specificitySignals.derivation_evidence ? 100 : 0,
    visual_coverage_percent: specificitySignals.visual_evidence ? 100 : 0,
    depth_score_10: 0,
    depth_level: ''
  };
  metrics.depth_score_10 = depthScore(metrics);
  metrics.depth_level = level(metrics.depth_score_10);
  metrics.gaps = [];
  if (metrics.conceptual_words < 150) metrics.gaps.push('conceptual foundation');
  if (metrics.equation_count < 2) metrics.gaps.push('derived/key equations');
  if (metrics.example_count < 3) metrics.gaps.push('3+ worked examples');
  if (metrics.derivation_count < 2 && !metrics.specificity.derivation_evidence) metrics.gaps.push('derivation evidence');
  if (metrics.visual_count < 2 && !metrics.specificity.visual_evidence) metrics.gaps.push('visual evidence');
  if (metrics.practice_total < 10) metrics.gaps.push('10+ practice questions');
  return metrics;
});

function findCritical(subjectId, needle) {
  const exact = topics.find(t => t.subject_id === subjectId && t.topic.toLowerCase() === needle.toLowerCase());
  if (exact) return exact;
  return topics.find(t => t.subject_id === subjectId && t.topic.toLowerCase().includes(needle.toLowerCase().split(' ')[0]));
}

const critical = CRITICAL.map(([subjectId, needle]) => {
  const row = findCritical(subjectId, needle);
  return { subject_id: subjectId, requested_topic: needle, found: Boolean(row), ...(row || {}) };
});

const avg = topics.length ? Number((topics.reduce((a, t) => a + t.depth_score_10, 0) / topics.length).toFixed(2)) : 0;
const derivationCoverage = topics.length ? Number((topics.filter(t => t.specificity.derivation_evidence).length / topics.length * 100).toFixed(1)) : 0;
const visualCoverage = topics.length ? Number((topics.filter(t => t.specificity.visual_evidence).length / topics.length * 100).toFixed(1)) : 0;
const exampleCoverage = topics.length ? Number((topics.filter(t => t.example_count >= 3).length / topics.length * 100).toFixed(1)) : 0;
const majorPracticeCoverage = topics.length ? Number((topics.filter(t => t.practice_total >= 12).length / topics.length * 100).toFixed(1)) : 0;

const subjectSummary = subjects.map(s => {
  const rows = topics.filter(t => String(t.subject_id) === String(s.id));
  const a = rows.length ? Number((rows.reduce((n, t) => n + t.depth_score_10, 0) / rows.length).toFixed(2)) : 0;
  return {
    id: s.id,
    name: s.name,
    topics: rows.length,
    average_depth_score_10: a,
    below_85_target: rows.filter(t => t.depth_score_10 < 8.5).length,
    examples_3plus: rows.filter(t => t.example_count >= 3).length,
    derivation_evidence: rows.filter(t => t.specificity.derivation_evidence).length,
    visual_evidence: rows.filter(t => t.specificity.visual_evidence).length,
    practice_12plus: rows.filter(t => t.practice_total >= 12).length
  };
});

const priority = [...topics].sort((a, b) => a.depth_score_10 - b.depth_score_10 || a.practice_total - b.practice_total).slice(0, 20);
const report = {
  version: 'V5.10',
  generated_at: new Date().toISOString(),
  source: {
    base: 'data/study-content.json',
    expansion: 'data/content-expansion-v5.9.1.json',
    merge_policy: 'base topics first; expansion topics appended by unique topic id'
  },
  methodology: {
    purpose: 'Automated 123-topic content-depth baseline before V5.10 content changes',
    depth_target: 8.5,
    example_target: 3,
    derivation_target_percent: 85,
    visual_target_percent: 90,
    major_practice_target: 12,
    note: 'Counts are evidence-based from the current JSON schema. A zero means no detectable evidence in the structured content; it does not claim the concept is academically absent.'
  },
  summary: {
    topic_count: topics.length,
    subject_count: subjects.length,
    average_depth_score_10: avg,
    depth_percent: Number((avg * 10).toFixed(1)),
    derivation_evidence_coverage_percent: derivationCoverage,
    visual_evidence_coverage_percent: visualCoverage,
    topics_with_3plus_examples_percent: exampleCoverage,
    topics_with_12plus_practice_percent: majorPracticeCoverage,
    topics_below_85_percent_depth_target: topics.filter(t => t.depth_score_10 < 8.5).length,
    topics_with_3plus_examples: topics.filter(t => t.example_count >= 3).length,
    topics_with_2plus_derivation_evidence: topics.filter(t => t.derivation_count >= 2).length,
    topics_with_2plus_visual_evidence: topics.filter(t => t.visual_count >= 2).length,
    topics_with_12plus_practice: topics.filter(t => t.practice_total >= 12).length,
    weak_topics_below_4: topics.filter(t => t.depth_score_10 < 4).length,
    application_or_better: topics.filter(t => t.depth_score_10 >= 6).length
  },
  critical_topics: critical,
  subjects: subjectSummary,
  priority_topics: priority,
  topics
};

fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');

const md = [
  '# V5.10 Content Depth Audit',
  '',
  `Generated: ${report.generated_at}`,
  '',
  '## Baseline',
  `- Topics: **${report.summary.topic_count}**`,
  `- Subjects: **${report.summary.subject_count}**`,
  `- Average depth: **${report.summary.average_depth_score_10}/10 (${report.summary.depth_percent}%)**`,
  `- Derivation evidence coverage: **${report.summary.derivation_evidence_coverage_percent}%**`,
  `- Visual evidence coverage: **${report.summary.visual_evidence_coverage_percent}%**`,
  `- Topics with 3+ detected examples: **${report.summary.topics_with_3plus_examples}** (${report.summary.topics_with_3plus_examples_percent}%)`,
  `- Topics with 12+ practice questions: **${report.summary.topics_with_12plus_practice}** (${report.summary.topics_with_12plus_practice_percent}%)`,
  `- Topics below 8.5/10 target: **${report.summary.topics_below_85_percent_depth_target}**`,
  '',
  '## Top 20 priority topics',
  '| # | Subject | Topic | Score | Examples | Derivations | Visuals | Practice | Gaps |',
  '|---:|---|---|---:|---:|---:|---:|---:|---|',
  ...priority.map((t, i) => `| ${i + 1} | ${t.subject_id} | ${t.topic.replace(/\|/g, '\\|')} | ${t.depth_score_10} | ${t.example_count} | ${t.derivation_count} | ${t.visual_count} | ${t.practice_total} | ${t.gaps.join(', ') || '—'} |`),
  '',
  '## Critical-topic audit',
  '| Subject | Requested topic | Found | Score | Examples | Derivations | Visuals | Practice |',
  '|---|---|---|---:|---:|---:|---:|---:|',
  ...critical.map(t => `| ${t.subject_id} | ${t.requested_topic} | ${t.found ? 'Yes' : 'No'} | ${t.depth_score_10 ?? '—'} | ${t.example_count ?? '—'} | ${t.derivation_count ?? '—'} | ${t.visual_count ?? '—'} | ${t.practice_total ?? '—'} |`),
  '',
  '> This report is the V5.10 pre-content-change baseline. It intentionally measures detectable evidence rather than assuming that a field is complete because a topic exists.'
].join('\n');
fs.writeFileSync(MD, md + '\n');

console.log(`V5.10 content-depth audit: ${topics.length} topics; avg ${avg}/10 (${report.summary.depth_percent}%); derivation evidence ${derivationCoverage}%; visual evidence ${visualCoverage}%; 3+ examples ${exampleCoverage}%; 12+ practice ${majorPracticeCoverage}%.`);
console.log(`Priority topics: ${priority.slice(0, 10).map(t => `${t.subject_id}:${t.topic}=${t.depth_score_10}`).join(' | ')}`);
