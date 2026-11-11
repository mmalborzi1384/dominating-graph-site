import { normalizeUserText, requireValid } from './limits.js';
import { validateStoredEnvelope, validateStateTransition } from '../storage/validate.js';
import { createAttempt } from './attempts.js';
import { shuffled } from './random.js';

export function competitionPool(questions, config) {
  requireValid(config.version === 1 && JSON.stringify(config.caps) === '[15,10,5,0]', 'تنظیم مسابقه معتبر نیست.');
  requireValid(Number.isSafeInteger(config.defaultRounds) && config.defaultRounds > 0 && config.activities?.length > 0, 'مجموعهٔ سؤال مسابقه خالی است.');
  const seen = new Set();
  return config.activities.map(item => {
    const q = questions.find(q => q.id === item.questionId);
    requireValid(q?.tabs.includes('competition') && ['interactive_graph','compute_gamma'].includes(q.type)
      && !seen.has(q.id) && item.mode === 'vertex-selection' && item.target === 'minimum', 'مجوز یا نوع سؤال مسابقه معتبر نیست.');
    seen.add(q.id); return { ...item, question: q };
  });
}
export function createCompetition(names, rounds, pool, state, random = Math.random) {
  requireValid(Array.isArray(names) && names.length >= 2 && names.length <= 10, 'تعداد گروه باید ۲ تا ۱۰ باشد.');
  requireValid(Number.isSafeInteger(rounds) && rounds > 0, 'تعداد دور باید عدد صحیح مثبت باشد.');
  requireValid(pool.length > 0, 'سؤال آماده برای مسابقه نداریم.');
  const byDifficulty=[1,2,3].map(level=>pool.filter(item=>item.question.difficulty===level))
    .filter(items=>new Set(items.map(item=>item.question.id)).size>=names.length);
  requireValid(byDifficulty.length>0, 'برای این تعداد گروه، سؤال‌های متفاوت و آمادهٔ هم‌درجه کافی نداریم.');
  requireValid(!Object.values(state.sessions).some(s => s.kind === 'competition' && s.status !== 'completed'), 'ابتدا مسابقهٔ جاری را تمام کنید.');
  requireValid(Object.keys(state.sessions).length < 100 && rounds <= Math.floor((200 - Object.keys(state.attempts).length) / names.length), 'ظرفیت کافی برای نشست و تمام نوبت‌ها وجود ندارد.');
  const groups = names.map((name, order) => ({ id: crypto.randomUUID(), name: normalizeUserText(name, 'groupName'), order }));
  const turns = [];
  for (let round = 0; round < rounds; round++) {
    const candidates=shuffled(byDifficulty,random)[0];
    const chosen=shuffled(candidates,random).slice(0,groups.length);
    for (const [index,group] of groups.entries()) turns.push({id:crypto.randomUUID(),groupId:group.id,questionId:chosen[index].question.id,consumedHintLevel:0,resultStatus:'pending',finalizedAttemptId:null});
  }
  return {id:crypto.randomUUID(),kind:'competition',status:'active',groups,roundCount:rounds,
    questionIds:[...new Set(turns.map(t => t.questionId))],turns,currentIndex:0,startedAt:new Date().toISOString()};
}
function checked(previous, next, curriculum, context) {
  const result = validateStoredEnvelope(next, curriculum, context); validateStateTransition(previous, result); return result;
}
export function addCompetition(state, session, curriculum, context) {
  return checked(state, {...state,sessions:{...state.sessions,[session.id]:session}},curriculum,context);
}
function current(state, id) {
  const session = state.sessions[id], turn = session?.turns[session.currentIndex];
  requireValid(session?.kind === 'competition' && session.status === 'active' && turn, 'نوبت جاری موجود نیست.');
  return {session,turn};
}
export function consumeHint(state,id,curriculum,context) {
  const next = structuredClone(state), {turn} = current(next,id);
  requireValid(turn.resultStatus === 'pending' && turn.consumedHintLevel < 3, 'راهنمای تازه برای این نوبت نداریم.');
  turn.consumedHintLevel++; return checked(state,next,curriculum,context);
}
export function finalizeTurn(state,id,selected,curriculum,context) {
  const next = structuredClone(state), {session,turn} = current(next,id);
  requireValid(turn.resultStatus === 'pending', 'این نوبت مصرف شده و قابل تکرار نیست.');
  const question = context.questions.find(q => q.id === turn.questionId);
  const attempt = createAttempt({tab:'competition',questionId:question.id,sessionId:id,groupId:turn.groupId,
    mode:'vertex-selection',target:'minimum',response:selected,graph:question.graph,hintLevel:turn.consumedHintLevel});
  next.attempts[attempt.id] = attempt; turn.resultStatus='finalized'; turn.finalizedAttemptId=attempt.id;
  return checked(state,next,curriculum,context);
}
export function advanceTurn(state,id,curriculum,context) {
  const next = structuredClone(state), {session,turn} = current(next,id);
  requireValid(turn.resultStatus !== 'pending', 'ابتدا پاسخ این نوبت را ثبت کنید.');
  session.currentIndex++;
  if(session.currentIndex === session.turns.length) session.status='completed';
  return checked(state,next,curriculum,context);
}
export function competitionRanks(session, attempts) {
  const rows = session.groups.map(group => ({...group,total:session.turns.filter(t => t.groupId === group.id && t.resultStatus === 'finalized')
    .reduce((sum,t) => sum + (attempts[t.finalizedAttemptId]?.finalScore ?? 0),0)})).sort((a,b) => b.total-a.total || a.order-b.order);
  return rows.map(row => ({...row,rank:1+rows.filter(other => other.total>row.total).length}));
}

/** Explicit whole-match action; a restart creates fresh identities, never reopens spent turns. */
export function replaceCompetition(state, id, restart, curriculum, context) {
  const previous = state.sessions[id];
  requireValid(previous?.kind === 'competition', 'مسابقهٔ انتخاب‌شده موجود نیست.');
  requireValid(typeof restart === 'boolean', 'نوع عملیات مسابقه معتبر نیست.');
  requireValid(!restart || !Object.values(state.sessions).some(s => s.id !== id && s.kind === 'competition' && s.status !== 'completed'), 'ابتدا مسابقهٔ جاری را تمام کنید.');
  const next = structuredClone(state);
  delete next.sessions[id];
  for (const [key, attempt] of Object.entries(next.attempts)) if (attempt.sessionId === id) delete next.attempts[key];
  if (restart) {
    requireValid(previous.turns.length <= 200 - Object.keys(next.attempts).length, 'ظرفیت کافی برای شروع دوبارهٔ تمام نوبت‌ها وجود ندارد.');
    const groups = previous.groups.map(g => ({...g,id:crypto.randomUUID()}));
    const turns = previous.turns.map(t => ({id:crypto.randomUUID(),questionId:t.questionId,
      groupId:groups[previous.groups.findIndex(g => g.id === t.groupId)].id,
      consumedHintLevel:0,resultStatus:'pending',finalizedAttemptId:null}));
    const fresh = {id:crypto.randomUUID(),kind:'competition',status:'active',groups,turns,
      roundCount:previous.roundCount,questionIds:[...previous.questionIds],currentIndex:0,startedAt:new Date().toISOString()};
    next.sessions[fresh.id] = fresh;
  }
  const result = validateStoredEnvelope(next,curriculum,context);
  validateStateTransition(state,result,{removedCompetitionId:id});
  return result;
}
