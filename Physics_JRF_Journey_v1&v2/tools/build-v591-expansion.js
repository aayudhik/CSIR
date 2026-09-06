const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'data','content-expansion-v5.9.1.json');
const CATALOG=[
['QM','Quantum Mechanics','Time-dependent perturbation theory','c₍f₎⁽¹⁾(t)=−(i/ℏ)∫V₍fi₎(t′)eⁱωfi t′dt′'],
['QM','Quantum Mechanics','Selection rules and transition rates','Γ=(2π/ℏ)|V₍fi₎|²ρ(Ef)'],
['QM','Quantum Mechanics','Variational principle','Evar=⟨ψ|H|ψ⟩/⟨ψ|ψ⟩≥E0'],
['QM','Quantum Mechanics','WKB approximation','∫p(x)dx=(n+1/2)πℏ'],
['QM','Quantum Mechanics','Adiabatic theorem and Berry phase','γ=i∮⟨n(R)|∇R n(R)⟩·dR'],
['QM','Quantum Mechanics','Identical particles and exchange symmetry','Ψ±(1,2)=[ψa(1)ψb(2)±ψb(1)ψa(2)]/√2'],
['QM','Quantum Mechanics','Scattering theory and Born approximation','fB(q)=−(m/2πℏ²)∫e⁻ⁱq·rV(r)d³r'],
['QM','Quantum Mechanics','Density matrix and mixed states','ρ=Σpi|ψi⟩⟨ψi|; ⟨A⟩=Tr(ρA)'],
['EM','Electromagnetic Theory','Boundary-value problems and Green functions','∇²G(r,r′)=−δ(r−r′)/ε0'],
['EM','Electromagnetic Theory','Multipole expansion','Φ=q/(4πε0r)+(p·r̂)/(4πε0r²)+…'],
['EM','Electromagnetic Theory','Vector potential and gauge transformations','B=∇×A; A→A+∇χ'],
['EM','Electromagnetic Theory','Retarded potentials and radiation','tr=t−R/c'],
['EM','Electromagnetic Theory','Electric dipole radiation','P∝p0²ω⁴/(ε0c³)'],
['EM','Electromagnetic Theory','Poynting theorem and electromagnetic energy','∂u/∂t+∇·S+J·E=0'],
['CP','Condensed Matter Physics','Reciprocal lattice and Bragg diffraction','G·R=2πn; k′−k=G'],
['CP','Condensed Matter Physics','Structure factor and X-ray scattering','F(G)=ΣjfjeⁱG·rj'],
['CP','Condensed Matter Physics','Bloch theorem and band gaps','ψnk(r)=eⁱk·runk(r)'],
['CP','Condensed Matter Physics','Density of states','g(E)∝√E in 3D parabolic bands'],
['CP','Condensed Matter Physics','Nearly free electron model','ΔEgap≈2|VG|'],
['CP','Condensed Matter Physics','Magnetism and magnetic ordering','χ=C/T'],
['TS','Thermodynamics & Statistical Physics','Grand canonical ensemble','Ξ=ΣN,i exp[−β(Ei,N−μN)]'],
['TS','Thermodynamics & Statistical Physics','Fermi-Dirac and Bose-Einstein gases','nF=1/(eβ(E−μ)+1); nB=1/(eβ(E−μ)−1)'],
['TS','Thermodynamics & Statistical Physics','Thermodynamic fluctuations and response','⟨(ΔE)²⟩=kBT²CV'],
['TS','Thermodynamics & Statistical Physics','Boltzmann equation and transport','∂f/∂t+v·∇rf+(F/m)·∇vf=(∂f/∂t)coll'],
['TS','Thermodynamics & Statistical Physics','Phase transitions and critical phenomena','M∼|t|β; χ∼|t|−γ; ξ∼|t|−ν'],
['EE','Electronics & Experimental Methods','Semiconductor physics and p-n junctions','I=Is(e^(qV/kBT)−1)'],
['EE','Electronics & Experimental Methods','BJT and FET amplifiers','Av≈−gmRC'],
['EE','Electronics & Experimental Methods','Operational amplifiers','V−=V+ and I+=I−=0 for ideal negative feedback'],
['EE','Electronics & Experimental Methods','Digital logic and sequential circuits','Qnext=D for a D flip-flop'],
['EE','Electronics & Experimental Methods','Measurement uncertainty and error analysis','uy²=Σ(∂y/∂xi)²ui²']
];
function makeTopic([sid,subject,topic,formula],i){
 const id=`${sid}-${String(i+1).padStart(2,'0')}`;
 const derivation=`Start from the governing model for ${topic}, state assumptions, derive the central relation ${formula}, and check a limiting case.`;
 const example=`For ${topic}, use the relation ${formula} after stating the physical assumptions. Verify dimensions, signs and the relevant limiting case before accepting the result.`;
 const questions=[];
 const stems=[
  [`Which is the best first step when solving a ${topic} problem?`,['State the physical model and assumptions','Ignore the assumptions','Memorize an answer','Skip the governing equation'],'Model selection controls validity.','Easy','Concept'],
  [`The central quantitative checkpoint for ${topic} is:`,[formula,'An unrelated identity','A dimensionally inconsistent expression','No equation'],'The displayed relation is the main quantitative checkpoint.','Moderate','Formula'],
  [`A strong derivation for ${topic} should include:`,['The governing equation, assumptions and intermediate logic','Only the final answer','Only numerical substitution','No limiting case'],'A reproducible derivation makes assumptions and intermediate logic explicit.','Moderate','Derivation'],
  [`If the approximation used in ${topic} fails, what should you do?`,['Use a more general model or justify a new approximation','Apply the same result anyway','Ignore the failure','Assume the error cancels'],'A formula is valid only within its stated model or a justified approximation.','Hard','Reasoning'],
  [`Which action best demonstrates mastery of ${topic}?`,['Re-derive the key result and apply it to a new situation','Recall the formula without context','Avoid quantitative checks','Memorize one solved example'],'Transfer to a new situation is stronger evidence of mastery than recall alone.','Hard','Transfer']
 ];
 for(let j=0;j<stems.length;j++){const [q,options,ex,difficulty,type]=stems[j];const qid=`${id}-B${j+1}`;questions.push({qid,topic_id:id,subject_id:sid,subject,topic,difficulty,type,question:q,options,answer:0,explanation:ex,source:'V5.9.1 deep content expansion',pyq_ref:null});}
 return {id,subject_id:sid,subject,topic,sequence:100+i,level:'Advanced',overview:`${topic}: an exam-focused treatment connecting physical meaning, derivation, limiting cases and CSIR-NET Part B/C applications.`,learning_objectives:[`Explain the physical meaning of ${topic}.`,`Derive or justify ${formula}.`,`Apply the relation to quantitative and conceptual problems.`,`Identify assumptions, limiting cases and common exam traps.`],syllabus_points:[topic,formula,'Derivation and assumptions','Limiting cases and exam traps','Part B/C practice and PYQ mapping'],concepts:[`Physical meaning of ${topic}`,`Assumptions behind ${formula}`,`Derivation logic for ${topic}`,'Limiting cases, dimensions and symmetry','Exam pattern recognition'],formula_focus:formula,worked_example:example,common_mistakes:['Applying the result outside its assumptions.','Dropping signs, factors or normalization constants.','Skipping dimensional and limiting-case checks.'],practice:questions.map(q=>({q:q.question,options:q.options,answer:q.answer,explanation:q.explanation})),revision:{quick_notes:[topic,formula,derivation],flashcards:[['What is the central relation?',formula],['What must be checked?', 'Assumptions, dimensions, signs and limiting cases']]},resources:['Standard graduate-level physics text','Official CSIR-HRDG/NTA archive for PYQs'],version:'V5.9.1',core_notes:[`Start from the physical model and define variables before using ${formula}.`,`For ${topic}, the derivation should be reproducible rather than memorized.`,`Use dimensional analysis and limiting cases before trusting a result.`],key_concepts:[`What ${topic} describes`,`Why ${formula} is valid`,`How the result is derived`,`When the approximation fails`],formula_sheet:[formula,'State assumptions before substitution.','Check dimensions, signs and limiting cases.'],worked_example_detail:{problem:example,solution:`Derive the stated relation from the governing model, substitute defined quantities, then verify dimensions and limiting behavior.`},pyq_mapping:{status:'topic-mapped',instruction:`Locate official PYQs on ${topic} in the CSIR-HRDG/NTA archive; copyrighted paper text is not reproduced.`},revision_v5_4:{one_minute:`${topic}: know the model, assumptions, central relation, derivation trigger and limiting case.`,formula_triggers:[formula,'State assumptions before use','Check limiting cases']},questions:questions};
}
const topics=CATALOG.map(makeTopic);
const questions=topics.flatMap(t=>t.questions);
topics.forEach(t=>delete t.questions);
const subjects=[...new Map(topics.map(t=>[t.subject_id,{id:t.subject_id,name:t.subject}])).values()];
const output={version:'V5.9.1',title:'Physics JRF Journey — Deep Content Expansion',generated_at:new Date().toISOString(),subjects,topics,questions,question_count:questions.length};
fs.writeFileSync(OUT,JSON.stringify(output,null,2)+'\n');
console.log(`V5.9.1 expansion generated: ${topics.length} topics; ${questions.length} questions`);
