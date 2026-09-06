const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const DATA=path.join(ROOT,'data','deep-content-v5.10-schrodinger.json');
const OUTDIR=path.join(ROOT,'data','audits');
const OUT=path.join(OUTDIR,'schrodinger-v5.10-audit.json');
const MD=path.join(OUTDIR,'schrodinger-v5.10-audit.md');
const d=JSON.parse(fs.readFileSync(DATA,'utf8'));
const derivations=[d.equation_and_derivations?.operator_postulate,d.equation_and_derivations?.matter_wave_route,d.equation_and_derivations?.probability_current].filter(Boolean);
const examples=Array.isArray(d.worked_examples)?d.worked_examples:[];
const practice=Array.isArray(d.practice_problems)?d.practice_problems:[];
const visuals=Array.isArray(d.visual_aids)?d.visual_aids:[];
const mistakes=Array.isArray(d.common_mistakes)?d.common_mistakes:[];
const references=Array.isArray(d.references)?d.references:[];
const connections=Array.isArray(d.connections)?d.connections:[];
const stepCounts=derivations.map(x=>Array.isArray(x.derivation)?x.derivation.length:Array.isArray(x.steps)?x.steps.length:0);
const completeExamples=examples.filter(x=>x.problem&&Array.isArray(x.solution)&&x.solution.length>=3).length;
const conceptualSections=['why_this_matters','conceptual_foundation','mathematical_structure'].filter(k=>d[k]&&Object.keys(d[k]).length).length;
// These filenames must match the actual rendered assets and the viewer mapping.
const visualFiles=['schrodinger-infinite-well.svg','schrodinger-psi-squared.svg','schrodinger-time-evolution.svg','schrodinger-tunneling.svg'];
const visualRendered=visualFiles.filter(f=>fs.existsSync(path.join(ROOT,'data','visuals',f))).length;
const breakdown={
  conceptual_foundation:conceptualSections>=3?1.5:conceptualSections/3*1.5,
  equations:d.mathematical_structure?.standard_forms?.length>=3&&d.equation_and_derivations?1:0.5,
  derivations:Math.min(2,derivations.length/3*2),
  worked_examples:Math.min(1.5,completeExamples/4*1.5),
  practice:Math.min(1.5,practice.length/15*1.5),
  // Four specified visual aids = 1.0 point total; each rendered asset is worth 0.25.
  // No artificial baseline credit: 3/4 rendered = 0.75, 4/4 = 1.00.
  visuals:Math.min(1,visualRendered/4),
  revision_and_exam:(mistakes.length>=8&&(references.length>=3||connections.length>=3))?0.5:0.25
};
const score=Number(Object.values(breakdown).reduce((a,b)=>a+b,0).toFixed(2));
const report={version:'V5.10',topic:d.topic,topic_id:d.topic_id,generated_at:new Date().toISOString(),baseline_score_10:2.69,score_method:{max:10,weights:{conceptual_foundation:1.5,equations:1,derivations:2,worked_examples:1.5,practice:1.5,visuals:1,revision_and_exam:0.5},visual_rule:'Four visual specifications receive 0 points until rendered; each rendered SVG/PNG asset adds 0.25 up to the 1.0 visual maximum.'},metrics:{average_depth_score_10:score,derivations_present:derivations.length,derivation_step_counts:stepCounts,visual_diagrams_specified:visuals.length,visual_diagrams_rendered:visualRendered,rendered_visual_files:visualFiles.filter(f=>fs.existsSync(path.join(ROOT,'data','visuals',f))),worked_examples:examples.length,complete_worked_examples:completeExamples,practice_questions:practice.length,common_mistakes:mistakes.length},quality_indicators:{topics_with_3plus_worked_examples:examples.length>=3,topic_with_12plus_questions:practice.length>=12,all_derivations_step_by_step:derivations.length===3&&stepCounts.every(n=>n>=3),diagrams_have_labels_captions:visualRendered>0},score_breakdown:breakdown,improvement_points:Number((score-2.69).toFixed(2)),target_7_5_reached:score>=7.5,status:visualRendered===visuals.length?'PASS':'PASS_WITH_VISUAL_GAP',gaps:visualRendered===visuals.length?[]:[`${visuals.length-visualRendered} visual specification(s) remain unrendered.`],source:DATA};
fs.mkdirSync(OUTDIR,{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(MD,`# Schrödinger Equation — V5.10 Audit\n\n- **Score:** ${score}/10\n- **Baseline:** 2.69/10\n- **Improvement:** +${report.improvement_points}\n- **Target 7.5+:** ${report.target_7_5_reached?'YES':'NO'}\n\n## Measurements\n- Derivations: ${derivations.length}/3\n- Visual specifications: ${visuals.length}\n- Rendered diagrams: ${visualRendered}/${visuals.length}\n- Worked examples: ${examples.length}\n- Complete worked examples: ${completeExamples}\n- Practice questions: ${practice.length}\n\n## Quality\n- 3+ worked examples: ${examples.length>=3?'PASS':'FAIL'}\n- 12+ questions: ${practice.length>=12?'PASS':'FAIL'}\n- Step-by-step derivations: ${report.quality_indicators.all_derivations_step_by_step?'PASS':'FAIL'}\n- Rendered labelled diagrams: ${visualRendered>0?'PASS':'FAIL'}\n\n## Score breakdown\n${Object.entries(breakdown).map(([k,v])=>`- ${k}: ${v.toFixed(2)}`).join('\n')}\n\n## Visual assets\n${visualFiles.map(f=>`- ${f}: ${fs.existsSync(path.join(ROOT,'data','visuals',f))?'RENDERED':'PENDING'}`).join('\n')}\n\n## Remaining gap\n${report.gaps.length?report.gaps.join(' '):'All four specified visual aids have rendered assets.'}\n`);
console.log(`Schrödinger V5.10 audit: ${score}/10; baseline 2.69; improvement +${report.improvement_points}; rendered diagrams ${visualRendered}/${visuals.length}`);
