import { validateStoredEnvelope, validateStateTransition, safeData, fields, timestamp, same } from './validate.js';
import { passedPrefix, unlockedStages } from '../domain/progress.js';
import { LIMITS, requireValid as check } from '../domain/limits.js';
export const BACKUP_FORMAT = 'persian-graph-learning-backup';
export function exportBackup(state, curriculum, context) {
  const valid = validateStoredEnvelope(state,curriculum,context);
  return JSON.stringify({format:BACKUP_FORMAT,schemaVersion:1,curriculumVersion:1,bankVersion:context.bankVersion,
    exportedAt:new Date().toISOString(),data:{teachingProgress:valid.teachingProgress,attempts:valid.attempts,sessions:valid.sessions,settings:valid.settings}},null,2);
}
export function parseBackup(text, curriculum, context) {
  check(typeof text === 'string' && new TextEncoder().encode(text).length <= LIMITS.importBytes,'حداکثر حجم فایل ۵ مگابایت است.');
  let file; try { file=JSON.parse(text); } catch { throw Error('فایل JSON معتبر نیست.'); }
  safeData(file);
  fields(file,['format','schemaVersion','curriculumVersion','bankVersion','exportedAt','data'],[],'backup');
  check(file.format===BACKUP_FORMAT && file.schemaVersion===1 && file.curriculumVersion===1,'ساختار یا نسخهٔ آموزش فایل سازگار نیست.');
  check(file.bankVersion===context.bankVersion && file.bankVersion==='1.2',file.bankVersion==='1.1'
    ? 'بک‌آپ بانک ۱٫۱ مستقیماً وارد نمی‌شود؛ پاسخ‌های مرجع در ۱٫۲ تغییر کرده‌اند. فایل اصلی را برای مهاجرت بازبینی‌شده نگه دارید.' : 'نسخهٔ بانک سؤال فایل پشتیبانی نمی‌شود.');
  timestamp(file.exportedAt,'exportedAt');
  fields(file.data,['teachingProgress','attempts','sessions','settings'],[],'data');
  return validateStoredEnvelope({schemaVersion:1,curriculumVersion:1,revision:0,...file.data},curriculum,context);
}
/** Same identity and schedule may advance, never rewind. Deletion wins only for a matching turn. */
export function mergeBackup(local, incoming, curriculum, context, {fresh=false}={}) {
  local=validateStoredEnvelope(local,curriculum,context); incoming=validateStoredEnvelope(incoming,curriculum,context);
  const next=structuredClone(local), suppressed=new Set();
  let deduplicated=0;
  for (const [id,session] of Object.entries(incoming.sessions)) {
    const current=next.sessions[id];
    if (!current) { next.sessions[id]=structuredClone(session); continue; }
    const identity=s=>Object.fromEntries(Object.entries(s).filter(([key])=>!['status','currentIndex','turns'].includes(key)));
    check(same(identity(current),identity(session)),'شناسهٔ نشست یکسان با محتوای متفاوت؛ ورود لغو شد.');
    check((current.turns??[]).length===(session.turns??[]).length,'برنامهٔ نوبت‌ها ناسازگار است.');
    for(let i=0;i<(current.turns??[]).length;i++) {
      const a=current.turns[i], b=session.turns[i];
      check(a.id===b.id && a.groupId===b.groupId && a.questionId===b.questionId,'هویت نوبت‌ها ناسازگار است.');
      if(a.resultStatus==='finalized-deleted'||b.resultStatus==='finalized-deleted') {
        if(a.finalizedAttemptId) suppressed.add(a.finalizedAttemptId);
        if(b.finalizedAttemptId) suppressed.add(b.finalizedAttemptId);
        a.resultStatus='finalized-deleted';a.finalizedAttemptId=null;
      } else if(a.resultStatus==='finalized'&&b.resultStatus==='finalized') check(a.finalizedAttemptId===b.finalizedAttemptId,'دو نتیجهٔ متفاوت برای یک نوبت؛ ورود لغو شد.');
      else if(b.resultStatus==='finalized') { a.resultStatus=b.resultStatus;a.finalizedAttemptId=b.finalizedAttemptId; }
      a.consumedHintLevel=Math.max(a.consumedHintLevel,b.consumedHintLevel);
    }
    current.currentIndex=Math.max(current.currentIndex,session.currentIndex);
    const order=['configured','active','completed'];current.status=order[Math.max(order.indexOf(current.status),order.indexOf(session.status))];
  }
  for(const [id,attempt] of Object.entries(incoming.attempts)) {
    // Conflicting stable content is still forbidden, even if a deletion suppresses it.
    if(next.attempts[id]) { check(same(next.attempts[id],attempt),'شناسهٔ نتیجه یکسان با محتوای متفاوت؛ ورود لغو شد.');deduplicated++; }
    else next.attempts[id]=structuredClone(attempt);
  }
  // A standalone imported tombstone must also suppress the older local result.
  for(const session of Object.values(next.sessions)) for(const turn of session.turns??[]) if(turn.resultStatus==='finalized-deleted') {
    const previous=[local.sessions[session.id],incoming.sessions[session.id]];
    for(const s of previous) { const t=s?.turns?.find(t=>t.id===turn.id);if(t?.finalizedAttemptId)suppressed.add(t.finalizedAttemptId); }
  }
  for(const id of suppressed) delete next.attempts[id];
  for(const kind of ['competition','lab']) check(Object.values(next.sessions).filter(s=>s.kind===kind&&s.status!=='completed').length<=1,
    'دو نشست فعال ناسازگار وجود دارد؛ ابتدا نشست فعلی را تمام کنید و دوباره فایل را بررسی کنید.');
  const flags=new Set([...local.teachingProgress.completedActivityIds,...incoming.teachingProgress.completedActivityIds]);
  const progress={completedActivityIds:curriculum.activities.filter(a=>flags.has(a.id)).map(a=>a.id),passedStageIds:passedPrefix(curriculum,flags),lastVisitedStageId:local.teachingProgress.lastVisitedStageId};
  if(fresh && unlockedStages(progress).includes(incoming.teachingProgress.lastVisitedStageId)) progress.lastVisitedStageId=incoming.teachingProgress.lastVisitedStageId;
  next.teachingProgress=progress;if(fresh)next.settings=incoming.settings;
  const candidate=validateStoredEnvelope(next,curriculum,context);validateStateTransition(local,candidate);
  return {candidate,preview:{added:Object.keys(candidate.attempts).filter(id=>!local.attempts[id]).length,deduplicated,suppressed:suppressed.size,
    addedSessions:Object.keys(candidate.sessions).filter(id=>!local.sessions[id]).length,
    before:local.teachingProgress.passedStageIds.length*25,after:progress.passedStageIds.length*25,
    restoresProgress:progress.completedActivityIds.some(id=>!local.teachingProgress.completedActivityIds.includes(id)),fresh}};
}
