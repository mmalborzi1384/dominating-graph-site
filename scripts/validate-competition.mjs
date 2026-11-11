import fs from 'node:fs';
import {competitionPool,createCompetition,addCompetition,consumeHint,finalizeTurn,advanceTurn,competitionRanks} from '../assets/js/domain/sessions.js';
import {practiceCatalog} from '../assets/js/data/practice.js';
import {analyzeGraph} from '../assets/js/domain/evaluate.js';
import {initialProgress} from '../assets/js/domain/progress.js';
import {validateStateTransition} from '../assets/js/storage/validate.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const bank=read('../docs/question-bank.json'),c=read('../content/teaching.json'),config=read('../content/competition.json'),context={questions:bank.questions};
practiceCatalog(bank.questions,config);const pool=competitionPool(bank.questions,config);
const fresh=()=>({schemaVersion:1,curriculumVersion:1,revision:0,teachingProgress:initialProgress(),attempts:{},sessions:{},settings:{theme:'day'}});
let checks=0;const check=(v,m)=>{checks++;if(!v)throw Error(m);};const rejects=(f,m)=>{let bad=false;try{f();}catch{bad=true;}check(bad,m);};
for(let n=2;n<=10;n++){
 let state=fresh(),session=createCompetition(Array.from({length:n},(_,i)=>`گروه ${i}`),1,pool,state);state=addCompetition(state,session,c,context);
 for(let i=0;i<n;i++){const turn=state.sessions[session.id].turns[i],q=bank.questions.find(q=>q.id===turn.questionId);state=finalizeTurn(state,session.id,analyzeGraph(q.graph).minimumSets[0],c,context);rejects(()=>finalizeTurn(state,session.id,[],c,context),'No replay');state=advanceTurn(state,session.id,c,context);}
 check(state.sessions[session.id].status==='completed','All counts complete');check(competitionRanks(state.sessions[session.id],state.attempts).every(r=>r.rank===1&&r.total===15),'Shared ranks');check(JSON.stringify(state.teachingProgress)===JSON.stringify(initialProgress()),'Teaching independent');
}
for(const n of [1,11])rejects(()=>createCompetition(Array(n===2.5?2:n).fill('نام'),1,pool,fresh()),'Invalid group bound');
// Fractional UI count is rejected before constructing the names array.
for(const rounds of [0,-1,1.5,Infinity,101])rejects(()=>createCompetition(['الف','ب'],rounds,pool,fresh()),'Round bounds/capacity');
rejects(()=>createCompetition(['x'.repeat(31),'ب'],1,pool,fresh()),'Name bound');
check(createCompetition(['x'.repeat(30),'ب'],1,pool,fresh()).groups.length===2,'Name inclusive');
const p6=pool.find(i=>i.question.id==='Q087'); // P3 supplies 0/5/15, P6 below supplies 10.
for(const base of [0,5,10,15])for(let hints=0;hints<4;hints++){
 const qid=base===10?'Q070':'Q048';const chosenPool=[pool.find(i=>i.question.id===qid)];let state=fresh();const s=createCompetition(['الف','ب'],1,chosenPool,state);state=addCompetition(state,s,c,context);
 for(let h=0;h<hints;h++)state=consumeHint(state,s.id,c,context);
 const q=chosenPool[0].question;let selection=base===0?[]:base===5?q.graph.vertices:base===10?null:analyzeGraph(q.graph).minimumSets[0];
 if(base===10){const all=Array.from({length:2**q.graph.n},(_,mask)=>q.graph.vertices.filter((_,i)=>mask&(1<<i)));const {evaluateSelection}=await import('../assets/js/domain/evaluate.js');selection=all.find(a=>{let e=evaluateSelection(q.graph,a);return e.minimal&&!e.minimum;});check(!!selection,'Minimal nonminimum fixture');}
 state=JSON.parse(JSON.stringify(state));state=finalizeTurn(state,s.id,selection,c,context);const a=Object.values(state.attempts)[0];check(a.baseScore===base&&a.finalScore===Math.min(base,[15,10,5,0][hints]),'Quality caps');
 const reopened=structuredClone(state);reopened.sessions[s.id].turns[0].resultStatus='pending';reopened.sessions[s.id].turns[0].finalizedAttemptId=null;rejects(()=>validateStateTransition(state,reopened),'Spent turns immutable');
}
let state=fresh(),s=createCompetition(['الف','ب'],pool.length+1,pool,state);state=addCompetition(state,s,c,context);check(s.turns[0].questionId===s.turns[pool.length*2].questionId,'Pool cycling');check(s.turns.every((t,i)=>t.questionId===s.turns[Math.floor(i/2)*2].questionId),'Equal question per round');rejects(()=>createCompetition(['الف','ب'],1,pool,state),'No concurrent match');
console.log(`${checks} competition checks passed; ${pool.length} modeled eligible questions.`);
let hinted=fresh();const hs=createCompetition(['الف','ب'],1,pool,hinted);hinted=addCompetition(hinted,hs,c,context);for(let i=0;i<3;i++)hinted=consumeHint(hinted,hs.id,c,context);rejects(()=>consumeHint(hinted,hs.id,c,context),'No fourth hint');
const deleted=structuredClone(hinted);deleted.sessions[hs.id].turns[0].resultStatus='finalized-deleted';const advanced=advanceTurn(deleted,hs.id,c,context);check(advanced.sessions[hs.id].currentIndex===1,'Deleted turn stays spent');check(competitionRanks(deleted.sessions[hs.id],deleted.attempts).every(g=>g.total===0),'Deleted results excluded');
const crowded=fresh();for(let i=0;i<100;i++)crowded.sessions['s'+i]={};rejects(()=>createCompetition(['الف','ب'],1,pool,crowded),'100-session bound');
console.log(`Final count: ${checks} checks passed.`);

// Whole-match reset/delete must be explicit, scoped and durable through the repository.
const {replaceCompetition}=await import('../assets/js/domain/sessions.js');
const {createRepository,storageKey}=await import('../assets/js/storage/repository.js');
const {createAttempt}=await import('../assets/js/domain/attempts.js');
let seed=fresh();const match=createCompetition(['الف','ب'],1,pool,seed);seed=addCompetition(seed,match,c,context);
seed=consumeHint(seed,match.id,c,context);seed=finalizeTurn(seed,match.id,[],c,context);
const practice=createAttempt({questionId:'Q001',mode:'self-assessed-text',target:'rubric',response:'ناحیه رأس است.',selfAssessed:true});seed.attempts[practice.id]=practice;
const past=structuredClone(seed.sessions[match.id]);past.id='other-match';past.status='completed';past.currentIndex=past.turns.length;past.turns=past.turns.map(t=>({...t,id:crypto.randomUUID(),resultStatus:'finalized-deleted',finalizedAttemptId:null}));seed.sessions[past.id]=past;
const reset=replaceCompetition(seed,match.id,true,c,context),freshMatch=Object.values(reset.sessions).find(s=>s.id!==past.id);
check(!reset.sessions[match.id]&&freshMatch.id!==match.id,'Reset fresh session identity');
check(freshMatch.currentIndex===0&&freshMatch.status==='active'&&freshMatch.turns.every(t=>t.resultStatus==='pending'&&t.consumedHintLevel===0),'Reset clears results and hints');
check(freshMatch.turns.every((t,i)=>t.id!==match.turns[i].id&&t.questionId===match.turns[i].questionId),'New turns preserve questions');
check(freshMatch.groups.every((g,i)=>g.name===match.groups[i].name),'Reset preserves names');
check(JSON.stringify(reset.sessions[past.id])===JSON.stringify(seed.sessions[past.id])&&JSON.stringify(reset.attempts[practice.id])===JSON.stringify(practice),'Other records unchanged');
check(JSON.stringify(reset.teachingProgress)===JSON.stringify(seed.teachingProgress),'Progress unchanged');
rejects(()=>validateStateTransition(seed,reset),'Generic commit cannot reopen/delete spent session');
const removed=replaceCompetition(seed,match.id,false,c,context);check(!removed.sessions[match.id]&&!Object.values(removed.attempts).some(a=>a.sessionId===match.id),'Delete removes complete match and results');
rejects(()=>replaceCompetition(seed,'missing',false,c,context),'Missing session rejected');
let raw=JSON.stringify(seed),fail=false,writes=0;const storage={getItem:key=>key===storageKey?raw:null,setItem:(key,value)=>{if(fail)throw Object.assign(Error('quota'),{name:'QuotaExceededError'});raw=value;writes++;},removeItem:()=>{}};
const repo=createRepository(c,storage,context);const before=raw;
rejects(()=>repo.manageCompetition(match.id,false,seed.revision+1),'Stale confirmation rejected');check(raw===before&&writes===0,'Rejected action does not write');
fail=true;check(!repo.manageCompetition(match.id,true,seed.revision)&&raw===before,'Quota preserves original persisted match');
fail=false;check(repo.retry()&&writes===1,'Retry atomically saves reset');
const restarted=Object.values(repo.snapshot().state.sessions).find(s=>s.id!==past.id);check(repo.manageCompetition(restarted.id,false,repo.snapshot().state.revision)&&writes===2,'Explicit deletion one write');
check(Object.keys(JSON.parse(raw).sessions).join()===past.id&&JSON.parse(raw).attempts[practice.id],'Reloaded delete preserves other data');repo.dispose();
console.log(`Reset/delete total: ${checks} checks passed.`);
