import fs from 'node:fs';
import {familyGraph,bounds,graphSnapshot,startLabSession,submitLabTurn,expireLabSession} from '../assets/js/domain/lab.js';
import {analyzeGraph,evaluateSelection} from '../assets/js/domain/evaluate.js';
import {initialProgress} from '../assets/js/domain/progress.js';
import {createAttempt,appendAttempt} from '../assets/js/domain/attempts.js';
import {validateStoredEnvelope} from '../assets/js/storage/validate.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),config=read('../content/lab.json'),bank=read('../docs/question-bank.json'),c=read('../content/teaching-v1.json'),context={questions:bank.questions};
const fresh=()=>({schemaVersion:1,curriculumVersion:1,revision:0,teachingProgress:initialProgress(),attempts:{},sessions:{},settings:{theme:'day'}});
let count=0;const check=(v,m)=>{count++;if(!v)throw Error(m);},rejects=(f,m)=>{let bad=false;try{f();}catch{bad=true;}check(bad,m);};
check(config.stations.length===5,'Five stations');
for(let n=2;n<=10;n++)for(const family of ['path','complete','star','empty',...(n>=3?['cycle']:[])]){const graph=familyGraph(n,family),a=analyzeGraph(graph);const expected=['path','cycle'].includes(family)?Math.ceil(n/3):family==='empty'?n:1;check(a.gamma===expected,'Family gamma');check(bounds(graph).lower<=a.gamma,'Lower bound');}
for(const n of [1,11,2.5,NaN])rejects(()=>familyGraph(n),'Custom bounds');
const p6=familyGraph(6),e=evaluateSelection(p6,['b','d','f']);check(e.minimal&&!e.minimum,'Minimal not minimum');check(analyzeGraph(familyGraph(4,'cycle')).minimumSets.length>1,'All optimums');
let state=fresh();const a=createAttempt({tab:'lab',activityId:'lab:gamma',mode:'integer',target:'gamma',response:2,graph:p6,graphSnapshot:graphSnapshot(p6,config.model)});state=appendAttempt(state,a,c,context);check(!state.attempts[a.id].questionId,'Custom no source coverage');
const pool=config.questionIds.map(id=>bank.questions.find(q=>q.id===id));for(const kind of ['game','challenge']){let state=startLabSession(fresh(),pool,kind,['الف','ب'],c,context),s=Object.values(state.sessions)[0];check(kind==='challenge'?s.turns.length===5&&s.deadlineAt-Date.parse(s.startedAt)===180000:s.groups.length===2&&s.turns.length===2,'Session setup');
for(let i=0;i<s.turns.length;i++){const q=bank.questions.find(q=>q.id===state.sessions[s.id].turns[i].questionId);state=submitLabTurn(state,s.id,analyzeGraph(q.graph).minimumSets[0],c,context);}
check(state.sessions[s.id].status==='completed','Session completion');rejects(()=>submitLabTurn(state,s.id,[],c,context),'No replay');check(Object.values(state.attempts).every(a=>a.tab==='lab'&&a.finalScore===15),'Lab scores and isolation');}
let expired=startLabSession(fresh(),pool,'challenge',[],c,context,Date.now()-180001),s=Object.values(expired.sessions)[0];expired=JSON.parse(JSON.stringify(expired));rejects(()=>submitLabTurn(expired,s.id,[],c,context),'Deadline after reload');expired=expireLabSession(expired,s.id,c,context);check(expired.sessions[s.id].status==='completed'&&Object.keys(expired.attempts).length===0,'No invented timeout results');validateStoredEnvelope(expired,c,context);rejects(()=>submitLabTurn(expired,s.id,[],c,context),'Expired no replay');
for(let n=2;n<=10;n++)for(const family of ['path','star','empty','complete',...(n>=3?['cycle']:[])]){
 const g=familyGraph(n,family),degree=v=>g.edges.filter(e=>e.includes(v)).length;
 const expected=family==='empty'?0:family==='complete'?n*(n-1)/2:family==='cycle'?n:n-1;
 check(g.edges.length===expected,'Exact edge count');
 if(family==='star')check(degree('a')===n-1&&g.vertices.slice(1).every(v=>degree(v)===1),'Star center/leaves');
 if(family==='cycle')check(g.vertices.every(v=>degree(v)===2),'Cycle regularity');
 if(family==='path')check(degree(g.vertices[0])===1&&degree(g.vertices.at(-1))===1&&g.vertices.slice(1,-1).every(v=>degree(v)===2),'Path endpoints/interior');
}
const {labPlaces}=await import('../assets/js/domain/lab.js');
for(const n of [2,6,10])for(const f of ['path','star','complete','empty']){const g=familyGraph(n,f),positions=labPlaces(g,f);check(positions.every(p=>p.x>=40&&p.x<=560&&p.y>=45&&p.y<=275),'Position bounds');check(positions.every((p,i)=>positions.slice(i+1).every(q=>Math.hypot((p.x-q.x)/2,p.y-q.y)>=46)),'Mobile circles do not overlap');}
console.log(`${count} lab checks passed.`);

const {removeLabResult}=await import('../assets/js/domain/lab.js');
const {createRepository,storageKey}=await import('../assets/js/storage/repository.js');
const practice=createAttempt({tab:'practice',questionId:'Q001',mode:'self-assessed-text',target:'rubric',response:'ناحیه رأس است.',selfAssessed:true});
const mixed=appendAttempt(state,practice,c,context),removed=removeLabResult(mixed,a.id,c,context);
check(!removed.attempts[a.id]&&JSON.stringify(removed.attempts[practice.id])===JSON.stringify(practice),'Remove only chosen lab result');check(JSON.stringify(removed.teachingProgress)===JSON.stringify(mixed.teachingProgress),'Delete preserves progress');
rejects(()=>removeLabResult(mixed,practice.id,c,context),'Cannot delete practice through lab action');rejects(()=>removeLabResult(mixed,'absent',c,context),'Missing result rejected');
let game=startLabSession(fresh(),pool,'game',['الف','ب'],c,context),session=Object.values(game.sessions)[0];for(let i=0;i<2;i++)game=submitLabTurn(game,session.id,[],c,context);
const first=game.sessions[session.id].turns[0].finalizedAttemptId,deletedGame=removeLabResult(game,first,c,context);
check(deletedGame.sessions[session.id].turns[0].resultStatus==='finalized-deleted'&&deletedGame.sessions[session.id].turns[0].finalizedAttemptId===null,'Deleted game result keeps spent marker');rejects(()=>submitLabTurn(deletedGame,session.id,[],c,context),'Deletion cannot grant replay');
let raw=JSON.stringify(mixed),fail=false,writes=0;const storage={getItem:key=>key===storageKey?raw:null,setItem:(key,value)=>{if(fail)throw Error('denied');raw=value;writes++;},removeItem:()=>{}};
const repo=createRepository(c,storage,context);rejects(()=>repo.deleteLabResult(a.id,99),'Stale deletion confirmation rejected');check(writes===0,'Rejected delete no writes');const before=raw;fail=true;check(!repo.deleteLabResult(a.id,0)&&raw===before,'Failed delete preserves disk');fail=false;check(repo.retry()&&writes===1&&!JSON.parse(raw).attempts[a.id],'Retry deletes once');repo.dispose();
console.log(`Lab review total: ${count} checks passed.`);
