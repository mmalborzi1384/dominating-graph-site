export const STAGE_IDS = Object.freeze(['Action', 'Process', 'Object', 'Schema']);
const fields = ['completedActivityIds', 'passedStageIds', 'lastVisitedStageId'];

export function initialProgress() {
  return { completedActivityIds: [], passedStageIds: [], lastVisitedStageId: STAGE_IDS[0] };
}
export function passedPrefix(curriculum, completed) {
  const flags = new Set(completed), passed = [];
  for (const stage of curriculum.stages) {
    if (!stage.requiredActivityIds.every(id => flags.has(id))) break;
    passed.push(stage.id);
  }
  return passed;
}
export function unlockedStages(progress) {
  return STAGE_IDS.slice(0, Math.min(4, progress.passedStageIds.length + 1));
}
export const progressPercent = progress => progress.passedStageIds.length * 25;

/** Reject impossible flags, extra fields, inconsistent prefixes and locked destinations. */
export function validateProgress(progress, curriculum) {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)
      || Object.keys(progress).length !== fields.length
      || fields.some(key => !Object.hasOwn(progress, key))) throw new TypeError('ساختار پیشرفت معتبر نیست.');
  for (const key of fields.slice(0, 2)) {
    if (!Array.isArray(progress[key]) || progress[key].some(id => typeof id !== 'string')
        || new Set(progress[key]).size !== progress[key].length) throw new TypeError('پرچم‌های پیشرفت معتبر نیستند.');
  }
  const completed = new Set(progress.completedActivityIds);
  if ([...completed].some(id => !curriculum.activities.some(activity => activity.id === id))) {
    throw new TypeError('فعالیت ذخیره‌شده در این نسخهٔ آموزش وجود ندارد.');
  }
  const passed = passedPrefix(curriculum, completed);
  if (JSON.stringify(passed) !== JSON.stringify(progress.passedStageIds)
      || !unlockedStages(progress).includes(progress.lastVisitedStageId)
      || curriculum.activities.some(activity => completed.has(activity.id)
        && !unlockedStages(progress).includes(activity.stageId))) throw new TypeError('ترتیب مراحل ذخیره‌شده معتبر نیست.');
  return structuredClone(progress);
}
export function completeActivity(progress, activityId, curriculum) {
  validateProgress(progress, curriculum);
  const activity = curriculum.activities.find(item => item.id === activityId);
  if (!activity || !unlockedStages(progress).includes(activity.stageId)) throw new TypeError('این فعالیت هنوز باز نیست.');
  const completed = new Set([...progress.completedActivityIds, activityId]);
  return { ...progress,
    completedActivityIds: curriculum.activities.filter(item => completed.has(item.id)).map(item => item.id),
    passedStageIds: passedPrefix(curriculum, completed) };
}
export function visitStage(progress, stageId, curriculum) {
  validateProgress(progress, curriculum);
  if (!unlockedStages(progress).includes(stageId)) throw new TypeError('ابتدا مرحلهٔ پیش‌نیاز را کامل کنید.');
  return { ...progress, lastVisitedStageId: stageId };
}
