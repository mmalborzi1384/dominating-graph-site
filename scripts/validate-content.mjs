/** No dependencies. Audits actual mounted catalogs, not just populated bank fields. */
import fs from 'node:fs';
import { practiceCatalog } from '../assets/js/data/practice.js';
import { competitionPool } from '../assets/js/domain/sessions.js';
import { validateTeaching } from '../assets/js/data/validate.js';
import { analyzeGraph } from '../assets/js/domain/evaluate.js';
const read = path => JSON.parse(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const bank=read('docs/question-bank.json'), curriculum=read('content/teaching.json');
validateTeaching(curriculum,null,bank);
const practice=practiceCatalog(bank.questions,read('content/practice.json')).filter(i=>!i.unavailable);
const competition=competitionPool(bank.questions,read('content/competition.json'));
const lab=read('content/lab.json');
const bankLab=practiceCatalog(bank.questions,read('content/bank-lab.json'),'lab');
const sets={practice:new Set(practice.map(i=>i.question.id)),competition:new Set(competition.map(i=>i.question.id)),lab:new Set([...lab.questionIds,...bankLab.filter(i=>!i.unavailable).map(i=>i.question.id)])};
const structural=[], gammaErrors=[], rows=[], metadataWarnings=[];
const counts=key=>Object.fromEntries([...new Set(bank.questions.map(q=>q[key]))].map(v=>[v,bank.questions.filter(q=>q[key]===v).length]));
const expectedCategories={A_foundations:31,B_domination:30,C_minimal_minimum:25,D_formulas_bounds:25,E_modeling:20,F_lab:19};
const expectedSahat={scientific:60,social:25,economic:20,bio:15,aesthetic:15,faith:15};
for(const [field,expected]of [['category',expectedCategories],['sahat_code',expectedSahat]])if(Object.entries(expected).some(([key,n])=>counts(field)[key]!==n))structural.push(field+' counts');
for(const [key,n]of Object.entries(counts('type')))if(bank.meta.counts.by_type[key]!==n)metadataWarnings.push(`meta.counts.by_type.${key}: stated ${bank.meta.counts.by_type[key]}, actual ${n}`);
const contexts=new Map([...practice,...bankLab.filter(i=>!i.unavailable)].map(i=>[i.question.id,i.model]));
let verifiedGamma=0;
for(const q of bank.questions){
 if(!q.id||!q.answer_fa||!q.response_mode||q.hints?.length!==3||q.hints.some(h=>!h?.trim())||!['Action','Process','Object','Schema'].includes(q.apos_stage)||![1,2,3].includes(q.difficulty)||!q.tabs?.length||q.tabs.some(t=>!['teach','practice','competition','lab'].includes(t)))structural.push(q.id);
 const reachable=Object.entries(sets).filter(([tab,ids])=>ids.has(q.id)&&q.tabs.includes(tab)).map(([tab])=>tab);
 const m=contexts.get(q.id);const modeled=!!m&&['scenario','vertexMeaning','edgeMeaning'].every(k=>m[k]?.trim());
 let gamma='not-applicable';
 if(q.graph?.gamma!=null){try{const actual=analyzeGraph(q.graph).gamma;verifiedGamma++;gamma=actual===q.graph.gamma?'verified':'mismatch';if(gamma==='mismatch')gammaErrors.push(q.id);}catch{gamma='outside-simple-engine';}}
 const figures=q.figure_ref&&!fs.existsSync(new URL('../assets/book/page-'+q.figure_ref.book_page+'.webp',import.meta.url))?'missing runtime figure':'';
 rows.push({id:q.id,reachable,mode:q.response_mode,byTab:q.response_mode_by_tab??{},modeled,figure:figures,gamma,educationalReview:'pending'});
}
const ids=new Set(rows.map(r=>r.id));
if(ids.size!==150||Array.from({length:150},(_,i)=>`Q${String(i+1).padStart(3,'0')}`).some(id=>!ids.has(id)))structural.push('IDs');
const report={bankVersion:bank.meta.version,total:rows.length,structuralErrors:structural,metadataWarnings,gammaErrors,verifiedGamma,
 reachable:rows.filter(r=>r.reachable.length).length,unreachable:rows.filter(r=>!r.reachable.length).map(r=>r.id),
 runtimeMissingContext:rows.filter(r=>!r.modeled).map(r=>r.id),sourceWithoutModeling:bank.questions.filter(q=>!q.modeling).map(q=>q.id),figureMappingsPending:rows.filter(r=>r.figure).map(r=>r.id),
 catalogs:Object.fromEntries(Object.entries(sets).map(([k,v])=>[k,v.size])),aposActivities:curriculum.activities.length,
 releaseReady:false,rows};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('../specs/001-persian-graph-learning/validation/content-reachability.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,rows:undefined},null,2));
console.log('Runtime integration audited; independent educational/user/host review remains a release gate.');
process.exitCode=structural.length||gammaErrors.length||report.unreachable.length||report.figureMappingsPending.length?1:0;
