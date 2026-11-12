import {readFileSync} from 'node:fs';
import {practiceCatalog,filterPractice} from '../assets/js/data/practice.js';
import {createAttempt,appendAttempt} from '../assets/js/domain/attempts.js';
import {initialProgress} from '../assets/js/domain/progress.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const questions=read('../docs/question-bank.json').questions,curriculum=read('../content/teaching-v1.json');
const catalog=practiceCatalog(questions,read('../content/practice.json'));
const context={questions};
let count=0;const check=(v,m)=>{count++;if(!v)throw Error(m)};
const rejects=(fn,m)=>{let failed=false;try{fn()}catch{failed=true}check(failed,m)};
const fresh=()=>({schemaVersion:1,curriculumVersion:1,revision:0,teachingProgress:initialProgress(),attempts:{},sessions:{},settings:{theme:'day'}});
check(catalog.every(i=>i.question.tabs.includes('practice')),'Allowed tab only');
for(const difficulty of ['easy','hard'])for(const lesson of ['','lesson1','lesson2']){
 const list=filterPractice(catalog,{difficulty,lesson});check(list.every(i=>(difficulty==='easy'?i.question.difficulty===1:[2,3].includes(i.question.difficulty))&&(!lesson||i.question.lesson===lesson)),'Filter boundary');
}
check(catalog.length===126&&catalog.every(i=>!i.unavailable),'All 126 practice-permitted items connected');
const q=questions.find(q=>q.id==='Q048');
for(let hintLevel=0;hintLevel<=3;hintLevel++){
 const attempt=createAttempt({questionId:q.id,mode:'vertex-selection',target:'minimum',response:['b','e'],graph:q.graph,hintLevel});
 check(attempt.finalScore===15&&attempt.hintLevel===hintLevel,'Free practice hints');
 const state=appendAttempt(fresh(),attempt,curriculum,context);
 check(JSON.stringify(state.teachingProgress)===JSON.stringify(initialProgress()),'Practice never unlocks teaching');
 rejects(()=>appendAttempt(state,attempt,curriculum,context),'One finalization per ID');
}
const low=createAttempt({questionId:q.id,mode:'vertex-selection',target:'dominating',response:q.graph.vertices,graph:q.graph});check(low.finalScore===5&&low.evaluation.satisfiesTarget,'Target distinct from quality');
const p6=questions.find(q=>q.id==='Q067').graph;
check(createAttempt({questionId:'Q067',mode:'vertex-selection',target:'minimal',response:['b','d','f'],graph:p6}).finalScore===10,'Minimal nonminimum earns ten');
check(createAttempt({questionId:q.id,mode:'vertex-selection',target:'minimum',response:[],graph:q.graph}).finalScore===0,'Uncovered response earns zero');
const integer=createAttempt({questionId:q.id,mode:'integer',target:'gamma',response:2,graph:q.graph,points:q.scoring.points});check(appendAttempt(fresh(),integer,curriculum,context).attempts[integer.id].finalScore===15,'Integer gamma');
rejects(()=>createAttempt({questionId:q.id,mode:'integer',target:'gamma',response:2.5,graph:q.graph}),'Reject fraction');
for(const accepted of [true,false]){
 const a=createAttempt({questionId:'Q001',mode:'self-assessed-text',target:'rubric',response:'ناحیه رأس و پل یال است.',selfAssessed:accepted,hintLevel:3});
 check(a.finalScore===(accepted?10:0)&&appendAttempt(fresh(),a,curriculum,context).attempts[a.id].evaluation.selfAssessed,'Explicit rubric self-assessment');
}
rejects(()=>createAttempt({questionId:'Q001',mode:'self-assessed-text',target:'rubric',response:'x'.repeat(1001),selfAssessed:true}),'Text boundary');
rejects(()=>createAttempt({tab:'teach',mode:'self-assessed-text',response:'x'}),'No teaching attempts');
const item=catalog.find(i=>i.question.id==='Q075'),graph={n:6,vertices:['a','b','c','d','e','f'],edges:[['a','b'],['b','c'],['c','d'],['d','e'],['e','f'],['f','a']]};
const graphSnapshot={graph,modeling:{scenario_fa:item.model.scenario,vertex_means_fa:item.model.vertexMeaning,edge_means_fa:item.model.edgeMeaning,question_in_model_fa:item.prompt}};
const drawn=createAttempt({questionId:'Q075',mode:'graph-construction',target:item.target,response:graph,graphSnapshot});
check(drawn.finalScore===15&&appendAttempt(fresh(),drawn,curriculum,context).attempts[drawn.id].evaluation.satisfiesTarget,'Construction n/gamma/multiple optimums');
const unique=catalog.find(i=>i.question.id==='Q074');
const nonunique=createAttempt({questionId:'Q074',mode:'graph-construction',target:unique.target,response:graph,graphSnapshot});
check(nonunique.finalScore===0&&appendAttempt(fresh(),nonunique,curriculum,context).attempts[nonunique.id].finalScore===0,'Gamma alone does not establish uniqueness');
const uniqueGraph=questions.find(q=>q.id==='Q074').graph;
const correctUnique=createAttempt({questionId:'Q074',mode:'graph-construction',target:unique.target,response:uniqueGraph,
 graphSnapshot:{...graphSnapshot,graph:{n:uniqueGraph.n,vertices:uniqueGraph.vertices,edges:uniqueGraph.edges}}});
check(correctUnique.finalScore===15&&appendAttempt(fresh(),correctUnique,curriculum,context).attempts[correctUnique.id].evaluation.satisfiesTarget,'Unique minimum checked exactly');
for(const id of ['Q014','Q055','Q114'])check(!catalog.find(i=>i.question.id===id)||catalog.find(i=>i.question.id===id).mode==='self-assessed-text','Unsupported source cannot enter practice evaluator');
const full=fresh();for(let i=0;i<200;i++){const a={...low,id:`a${i}`};full.attempts[a.id]=a;}
rejects(()=>appendAttempt(full,{...low,id:'overflow'},curriculum,context),'No 201st record');
check(createAttempt({questionId:q.id,mode:'vertex-selection',target:'minimum',response:[],graph:q.graph}).id!==low.id,'Retry identity');
console.log(`${count} practice content/filter/assessment/record checks passed; ${catalog.filter(i=>!i.unavailable).length} ready source-backed questions.`);
