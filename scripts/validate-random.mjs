import fs from 'node:fs';
import {shuffled,pickRandom} from '../assets/js/domain/random.js';
import {validateTeaching} from '../assets/js/data/validate.js';
import {competitionPool,createCompetition} from '../assets/js/domain/sessions.js';
import {practiceCatalog,filterPractice} from '../assets/js/data/practice.js';
import {initialProgress} from '../assets/js/domain/progress.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const bank=read('../docs/question-bank.json'),curriculum=read('../content/teaching.json');
validateTeaching(curriculum,null,bank);
const config=read('../content/competition.json'),pool=competitionPool(bank.questions,config);
practiceCatalog(bank.questions,config);
let checks=0;const check=(ok,msg)=>{checks++;if(!ok)throw Error(msg);};
check(shuffled([1,2,3],()=>0).join()!==shuffled([1,2,3],()=>.99999).join(),'RNG controls order');
check(pickRandom([])===undefined,'Empty pool');check(pickRandom([{id:'a'}],'a').id==='a','Singleton fallback');check(pickRandom([{id:'a'},{id:'b'}],'a').id==='b','Avoid current');
for(const stage of curriculum.stages){check(stage.variants.length>1,'Teaching chain has alternatives');for(const v of stage.variants){check(pickRandom(stage.variants,v.id).id!==v.id,'Switch whole chain without repeats');check(stage.requiredActivityIds.every(id=>curriculum.activities.some(a=>a.id===id&&a.stageId===stage.id)),'Cognitive goals remain fixed across variants');}}
const state={schemaVersion:1,curriculumVersion:1,revision:0,teachingProgress:initialProgress(),attempts:{},sessions:{},settings:{theme:'day'}};
for(let count=2;count<=10;count++){const s=createCompetition(Array(count).fill('گروه'),3,pool,state);for(let r=0;r<3;r++){const turns=s.turns.slice(r*count,(r+1)*count);check(new Set(turns.map(t=>t.questionId)).size===count,'Distinct per round');check(new Set(turns.map(t=>bank.questions.find(q=>q.id===t.questionId).difficulty)).size===1,'Exact equal difficulty');}check(JSON.stringify(JSON.parse(JSON.stringify(s)).turns)===JSON.stringify(s.turns),'Assignments survive serialization');}
let rejected=false;try{createCompetition(['الف','ب'],1,pool.slice(0,1),state);}catch{rejected=true;}check(rejected,'Insufficient ready pool rejects start');
const practice=practiceCatalog(bank.questions,read('../content/practice.json'));
for(const level of [1,2,3]){const candidates=filterPractice(practice,{difficulty:level===1?'easy':'hard'}).filter(i=>!i.unavailable&&i.question.difficulty===level);check(!!pickRandom(candidates),'Practice all exact levels available');check(candidates.every(i=>i.question.difficulty===level),'Practice exact difficulty');}
console.log(`${checks} random-selection checks passed.`);
