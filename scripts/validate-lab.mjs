import fs from 'node:fs';
import {familyGraph,bounds,graphSnapshot,startLabSession,submitLabTurn,expireLabSession} from '../assets/js/domain/lab.js';
import {analyzeGraph,evaluateSelection} from '../assets/js/domain/evaluate.js';
import {initialProgress} from '../assets/js/domain/progress.js';
import {createAttempt,appendAttempt} from '../assets/js/domain/attempts.js';
import {validateStoredEnvelope} from '../assets/js/storage/validate.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),config=read('../content/lab.json'),bank=read('../docs/question-bank.json'),c=read('../content/teaching.json'),context={questions:bank.questions};
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
console.log(`${count} lab checks passed.`);
