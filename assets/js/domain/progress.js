export const STAGE_IDS = Object.freeze(['Action', 'Process', 'Object', 'Schema']);
const fields = ['completedActivityIds', 'passedStageIds', 'lastVisitedStageId'];

export function initialProgress(curriculum) {
  if (curriculum?.curriculumVersion === 3) return initialUnitProgress(curriculum);
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
export const progressPercent = (progress, curriculum, lessonId) => curriculum?.curriculumVersion === 3
  ? unitProgressPercent(progress, curriculum, lessonId) : progress.passedStageIds.length * 25;

/** Reject impossible flags, extra fields, inconsistent prefixes and locked destinations. */
export function validateProgress(progress, curriculum) {
  if (curriculum.curriculumVersion === 3) return validateUnitProgress(progress, curriculum);
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
  if(curriculum.curriculumVersion===2 && curriculum.activities.some(a=>completed.has(a.id)&&!a.prerequisites.every(id=>completed.has(id))))throw new TypeError('ترتیب فعالیت‌های آموزش تازه معتبر نیست.');
  const passed = passedPrefix(curriculum, completed);
  if (JSON.stringify(passed) !== JSON.stringify(progress.passedStageIds)
      || !unlockedStages(progress).includes(progress.lastVisitedStageId)
      || curriculum.activities.some(activity => completed.has(activity.id)
        && !unlockedStages(progress).includes(activity.stageId))) throw new TypeError('ترتیب مراحل ذخیره‌شده معتبر نیست.');
  return structuredClone(progress);
}
export function completeActivity(progress, activityId, curriculum) {
  if (curriculum.curriculumVersion === 3) return completeUnitActivity(progress, activityId, curriculum);
  validateProgress(progress, curriculum);
  const activity = curriculum.activities.find(item => item.id === activityId);
  if (!activity || !unlockedStages(progress).includes(activity.stageId)) throw new TypeError('این فعالیت هنوز باز نیست.');
  if(curriculum.curriculumVersion===2&&!activity.prerequisites.every(id=>progress.completedActivityIds.includes(id)))throw new TypeError('ابتدا فعالیت قبلی همین مرحله را کامل کنید.');
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

const unitFields = ['completedActivityIds', 'passedUnitIds', 'lastVisitedUnitId'];
export function initialUnitProgress(curriculum) {
  return { completedActivityIds: [], passedUnitIds: [], lastVisitedUnitId: curriculum.units[0].id };
}
export function passedUnits(curriculum, completed) {
  const flags = new Set(completed), passed = [];
  for (const unit of curriculum.units) {
    if (unit.prerequisites.every(id => passed.includes(id))
        && unit.requiredActivityIds.every(id => flags.has(id))) passed.push(unit.id);
  }
  return passed;
}
export function unlockedUnits(progress, curriculum) {
  return curriculum.units.filter(unit => unit.prerequisites.every(id => progress.passedUnitIds.includes(id))).map(unit => unit.id);
}
export function validateUnitProgress(progress, curriculum) {
  if (!progress || Array.isArray(progress) || Object.keys(progress).length !== unitFields.length
      || !unitFields.every(key => Object.hasOwn(progress, key))) throw new TypeError('ساختار پیشرفت واحدها معتبر نیست.');
  for (const key of unitFields.slice(0, 2)) {
    if (!Array.isArray(progress[key]) || new Set(progress[key]).size !== progress[key].length
        || progress[key].some(id => typeof id !== 'string')) throw new TypeError('پرچم پیشرفت واحدها معتبر نیست.');
  }
  const flags = new Set(progress.completedActivityIds), passed = passedUnits(curriculum, flags);
  const unlocked = unlockedUnits({ passedUnitIds: passed }, curriculum);
  if (JSON.stringify(passed) !== JSON.stringify(progress.passedUnitIds)
      || !unlocked.includes(progress.lastVisitedUnitId)
      || [...flags].some(id => {
        const activity = curriculum.activities.find(a => a.id === id);
        return !activity || !unlocked.includes(activity.unitId)
          || !activity.prerequisites.every(required => flags.has(required));
      })) throw new TypeError('پیش‌نیاز یا مقصد آموزش معتبر نیست.');
  return structuredClone(progress);
}
export function completeUnitActivity(progress, activityId, curriculum) {
  validateUnitProgress(progress, curriculum);
  const activity = curriculum.activities.find(a => a.id === activityId);
  if (!activity || !unlockedUnits(progress, curriculum).includes(activity.unitId)
      || !activity.prerequisites.every(id => progress.completedActivityIds.includes(id))) throw new TypeError('ابتدا فعالیت پیش‌نیاز را کامل کنید.');
  const flags = new Set([...progress.completedActivityIds, activityId]);
  return { ...progress, completedActivityIds: curriculum.activities.filter(a => flags.has(a.id)).map(a => a.id),
    passedUnitIds: passedUnits(curriculum, flags) };
}
export function visitUnit(progress, unitId, curriculum) {
  validateUnitProgress(progress, curriculum);
  if (!unlockedUnits(progress, curriculum).includes(unitId)) throw new TypeError('این واحد هنوز باز نیست.');
  return { ...progress, lastVisitedUnitId: unitId };
}
export function unitProgressPercent(progress, curriculum, lessonId) {
  validateUnitProgress(progress, curriculum);
  const units = curriculum.units.filter(unit => !lessonId || unit.lessonId === lessonId);
  const weight = units.reduce((sum, unit) => sum + unit.progressWeight, 0);
  return weight ? 100 * units.filter(unit => progress.passedUnitIds.includes(unit.id))
    .reduce((sum, unit) => sum + unit.progressWeight, 0) / weight : 0;
}
/** Union validated flags; no answer, hint or evidence can enter persistent progress. */
export function mergeProgress(local, incoming, curriculum, { fresh = false } = {}) {
  validateProgress(local, curriculum); validateProgress(incoming, curriculum);
  const flags = new Set([...local.completedActivityIds, ...incoming.completedActivityIds]);
  const completedActivityIds = curriculum.activities.filter(a => flags.has(a.id)).map(a => a.id);
  const result = curriculum.curriculumVersion === 3
    ? { completedActivityIds, passedUnitIds: passedUnits(curriculum, flags), lastVisitedUnitId: (fresh ? incoming : local).lastVisitedUnitId }
    : { completedActivityIds, passedStageIds: passedPrefix(curriculum, flags), lastVisitedStageId: (fresh ? incoming : local).lastVisitedStageId };
  return validateProgress(result, curriculum);
}
