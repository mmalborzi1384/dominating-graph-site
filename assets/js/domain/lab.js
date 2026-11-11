import {normalizeGraph} from './graph.js';
import {analyzeGraph} from './evaluate.js';
import {requireValid} from './limits.js';
import {createAttempt} from './attempts.js';
import {validateStoredEnvelope,validateStateTransition} from '../storage/validate.js';
import {shuffled} from './random.js';
export function familyGraph(n,family='path') {
 requireValid(Number.isInteger(n)&&n>=2&&n<=10,'تعداد رأس باید عدد صحیح ۲ تا ۱۰ باشد.');
 requireValid(['path','cycle','complete','star','empty'].includes(family),'خانواده معتبر نیست.');
 requireValid(family!=='cycle'||n>=3,'دور حداقل ۳ رأس دارد.');
 const vertices=Array.from({length:n},(_,i)=>String.fromCharCode(97+i)),edges=[];
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(family==='complete'||family==='star'&&i===0||['path','cycle'].includes(family)&&j===i+1||family==='cycle'&&i===0&&j===n-1)edges.push([vertices[i],vertices[j]]);
 return normalizeGraph({n,vertices,edges});
}
export function graphSnapshot(graph,model,places) {
 return {graph:normalizeGraph(graph),modeling:{scenario_fa:model.scenario,vertex_means_fa:model.vertexMeaning,edge_means_fa:model.edgeMeaning,question_in_model_fa:'انتخاب مراکز برای پوشش همهٔ مکان‌ها با ارتباط مستقیم'},...(places?{places:places.map(p=>({...p,x:(p.x-40)/520,y:(p.y-45)/230}))}:{})};
}
/** Layout expresses the family without changing its topology. */
export function labPlaces(graph,family) {
 return graph.vertices.map((id,i)=>{
  let x,y;
  if(family==='star'&&i===0){x=300;y=160;}
  else if(family==='star'){const angle=(i-1)*2*Math.PI/(graph.n-1);x=300+220*Math.cos(angle);y=160+105*Math.sin(angle);}
  else if(['path','empty'].includes(family)){
   const columns=Math.min(5,graph.n),row=Math.floor(i/columns),col=row%2?columns-1-i%columns:i%columns;
   x=columns===1?300:60+480*col/(columns-1);y=graph.n<=5?160:90+140*row;
  }else{const angle=i*2*Math.PI/graph.n;x=300+220*Math.cos(angle);y=160+105*Math.sin(angle);}
  return {id,label:`محل ${(i+1).toLocaleString('fa-IR')}`,x,y};
 });
}
function checked(before,next,curriculum,context){const result=validateStoredEnvelope(next,curriculum,context);validateStateTransition(before,result);return result;}
export function startLabSession(state,questions,kind,groups,curriculum,context,now=Date.now()) {
 requireValid(['challenge','game'].includes(kind),'نوع فعالیت معتبر نیست.');
 requireValid(!Object.values(state.sessions).some(s=>s.kind==='lab'&&s.status==='active'),'ابتدا فعالیت جاری آزمایشگاه را تمام کنید.');
 requireValid(questions.length>=5,'پنج مدل آماده لازم است.');
 const chosen=shuffled(questions).slice(0,kind==='challenge'?5:2);
 const teams=kind==='game'?[{id:crypto.randomUUID(),name:groups[0],order:0},{id:crypto.randomUUID(),name:groups[1],order:1}]:[];
 requireValid(kind!=='game'||groups.length===2,'بازی دو گروه دارد.');
 requireValid(Object.keys(state.attempts).length+chosen.length<=200,'ظرفیت کافی برای همهٔ پاسخ‌ها نداریم.');
 const session={id:crypto.randomUUID(),kind:'lab',status:'active',startedAt:new Date(now).toISOString(),questionIds:chosen.map(q=>q.id),groups:teams,
 currentIndex:0,turns:chosen.map((q,i)=>({id:crypto.randomUUID(),questionId:q.id,groupId:teams[i]?.id??null,consumedHintLevel:0,resultStatus:'pending',finalizedAttemptId:null})),...(kind==='challenge'?{deadlineAt:now+180000}:{})};
 return checked(state,{...state,sessions:{...state.sessions,[session.id]:session}},curriculum,context);
}
export function expireLabSession(state,id,curriculum,context,now=Date.now()) {
 const next=structuredClone(state),s=next.sessions[id];requireValid(s?.kind==='lab'&&s.status==='active'&&s.deadlineAt!==undefined&&now>=s.deadlineAt,'مهلت هنوز تمام نشده است.');
 s.status='completed';s.currentIndex=s.turns.length;return checked(state,next,curriculum,context);
}
export function submitLabTurn(state,id,response,curriculum,context,now=Date.now()) {
 const next=structuredClone(state),s=next.sessions[id],t=s?.turns[s.currentIndex];
 requireValid(s?.kind==='lab'&&s.status==='active'&&t?.resultStatus==='pending','این نوبت قابل ثبت نیست.');
 requireValid(s.deadlineAt===undefined||now<s.deadlineAt,'زمان چالش تمام شده است.');
 const q=context.questions.find(q=>q.id===t.questionId);
 const attempt=createAttempt({tab:'lab',questionId:q.id,sessionId:id,...(t.groupId?{groupId:t.groupId}:{}),mode:'vertex-selection',target:'minimum',response,graph:q.graph});
 next.attempts[attempt.id]=attempt;t.resultStatus='finalized';t.finalizedAttemptId=attempt.id;s.currentIndex++;if(s.currentIndex===s.turns.length)s.status='completed';
 return checked(state,next,curriculum,context);
}
export function bounds(graph){const g=normalizeGraph(graph),degrees=g.vertices.map(v=>g.edges.filter(e=>e.includes(v)).length),delta=Math.max(...degrees);return {delta,lower:Math.ceil(g.n/(delta+1)),gamma:analyzeGraph(g).gamma};}

/** Remove only one lab result; session turns stay spent and cannot be replayed. */
export function removeLabResult(state,id,curriculum,context) {
 requireValid(state.attempts[id]?.tab==='lab','نتیجهٔ آزمایشگاه پیدا نشد.');
 const next=structuredClone(state);delete next.attempts[id];
 for(const session of Object.values(next.sessions))for(const turn of session.turns??[]){
  if(turn.finalizedAttemptId===id){turn.resultStatus='finalized-deleted';turn.finalizedAttemptId=null;}
 }
 return checked(state,next,curriculum,context);
}
