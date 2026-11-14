import { STAGE_IDS } from '../domain/progress.js';
import { evidenceGraph, validateEvidencePart } from '../domain/teaching-evidence.js';

const text = value => typeof value === 'string' && value.trim().length > 0;
const demand = (ok, message) => { if (!ok) throw new TypeError(message); };
const ids = values => Array.isArray(values) && values.length > 0 && values.every(text) && new Set(values).size === values.length;
const id = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(value);
const texts = values => Array.isArray(values) && values.length > 0 && values.every(text);
export function validateTeachingV3(curriculum, bank) {
  demand(curriculum?.curriculumVersion === 3 && bank?.meta?.version === '1.4'
    && bank.questions?.length === 150 && ids(bank.questions.map(q => q.id)), 'نسخهٔ مسیر یا بانک معتبر نیست.');
  const { lessons, units, activities } = curriculum;
  demand(Array.isArray(lessons) && JSON.stringify(lessons.map(l => l.id)) === JSON.stringify(['lesson1', 'lesson2'])
    && lessons.every(l => text(l.title) && text(l.objective) && ids(l.unitIds)), 'دو درس کامل لازم است.');
  demand(Array.isArray(units) && ids(units.map(u => u.id)) && Array.isArray(activities) && ids(activities.map(a => a.id))
    && [...units, ...activities].every(item => id(item.id)), 'شناسهٔ واحد یا فعالیت نامعتبر است.');
  const sourceIds = new Set(bank.questions.map(q => q.id));
  demand(Array.from({ length: sourceIds.size }, (_, i) => `Q${String(i + 1).padStart(3, '0')}`).every(q => sourceIds.has(q)), 'شناسه‌های بانک کامل نیستند.');
  const orderedIds = lessons.flatMap(l => l.unitIds);
  demand(JSON.stringify(orderedIds) === JSON.stringify(units.map(u => u.id)), 'ترتیب درس و واحد ناسازگار است.');
  let previous = null;
  for (const lesson of lessons) {
    demand(lesson.unitIds.length === STAGE_IDS.length, 'چهار ساختار در هر درس لازم است.');
    for (const [index, unitId] of lesson.unitIds.entries()) {
      const unit = units.find(u => u.id === unitId);
      demand(unit?.lessonId === lesson.id && unit.stageId === STAGE_IDS[index]
        && JSON.stringify(unit.prerequisites) === JSON.stringify(previous ? [previous.id] : [])
        && text(unit.objective) && texts(unit.scaffolding) && texts(unit.misconceptions) && texts(unit.evidenceCriteria)
        && Number.isFinite(unit.progressWeight) && unit.progressWeight > 0 && ids(unit.requiredActivityIds)
        && unit.exitActivityId === unit.requiredActivityIds.at(-1), 'قرارداد هدف، خروج یا پیش‌نیاز واحد ناقص است.');
      const earlier = [];
      for (const activityId of unit.requiredActivityIds) {
        const activity = activities.find(a => a.id === activityId);
        demand(activity?.unitId === unit.id && activity.lessonId === lesson.id && activity.stageId === unit.stageId
          && text(activity.title) && text(activity.cognitiveOperation) && texts(activity.instructionSteps)
          && texts(activity.hints) && text(activity.explanation) && texts(activity.rubric)
          && JSON.stringify(activity.prerequisites) === JSON.stringify(earlier), 'قرارداد فعالیت یا ترتیب آن ناقص است.');
        validateBody(activity);
        demand(activity.parts.some(p => p.type === 'reflection') && activity.parts.some(p => p.type !== 'reflection'), 'خودبازبینی به‌تنهایی شاهد خروج نیست.');
        demand(Array.isArray(activity.sourceReferences) && activity.sourceReferences.length > 0, 'منبع لازم است.');
        for (const ref of activity.sourceReferences) {
          const question = bank.questions.find(q => q.id === ref.questionId);
          demand(ref.bankVersion === bank.meta.version && question?.tabs?.includes('teach')
            && ref.originalAposStage === question.apos_stage && ['adapted', 'direct'].includes(ref.use)
            && (ref.use !== 'adapted' || text(ref.adaptationReason))
            && (ref.use !== 'direct' || ref.originalAposStage === activity.stageId), 'منبع یا دلیل اقتباس معتبر نیست.');
        }
        if (activity.id === unit.exitActivityId) {
          demand(Array.isArray(activity.exitVariants) && ids(activity.exitVariants.map(v => v.id)), 'گونهٔ خروج تازه لازم است.');
          for (const variant of activity.exitVariants) {
            validateBody(variant);
            demand(variant.parts.some(p => p.type !== 'reflection') && variant.parts.some(p => p.type === 'reflection'), 'خروج هم شاهد و هم خودبازبینی لازم دارد.');
            demand(activity.graph && variant.graph ? !sameStructure(activity.graph, variant.graph)
              : JSON.stringify(activity.parts.filter(p => p.type !== 'reflection')) !== JSON.stringify(variant.parts.filter(p => p.type !== 'reflection')),
            'تعویض نام یا چیدمان به‌تنهایی خروج تازه نیست.');
          }
        }
        earlier.push(activityId);
      }
      previous = unit;
    }
  }
  const references = units.flatMap(u => u.requiredActivityIds);
  demand(ids(references) && references.length === activities.length && activities.every(a => references.includes(a.id)), 'فعالیت بدون واحد یا تکراری وجود دارد.');
  return { curriculum, models: new Map(activities.map(a => [a.id, a])), questions: bank.questions, bankVersion: bank.meta.version };
}
function validateBody(activity) {
  demand(activity.context && ['scenario', 'vertexMeaning', 'edgeMeaning', 'goal'].every(key => text(activity.context[key]))
    && Array.isArray(activity.parts) && ids(activity.parts.map(p => p.id)), 'زمینه یا شاهد فعالیت ناقص است.');
  if (activity.graph) evidenceGraph(activity.graph);
  for (const part of activity.parts) validateEvidencePart(part, activity.graph);
}

/** Validate the complete source matrix without treating an agent audit as teacher approval. */
export function validateTeachingSources(sources, bank, curriculum) {
  demand(sources?.curriculumVersion === 3 && sources.bankVersion === bank.meta.version
    && /^[a-f0-9]{64}$/.test(sources.bankSha256) && sources.humanReviewRequired === true
    && Array.isArray(sources.questions) && sources.questions.length === bank.questions.length
    && ids(sources.questions.map(row => row.questionId)) && Array.isArray(sources.adaptations)
    && ids(sources.adaptations.map(a => a.activityId)), 'ماتریس منابع معتبر نیست.');
  for (const row of sources.questions) {
    const question = bank.questions.find(q => q.id === row.questionId);
    demand(question && row.sourceStage === question.apos_stage && row.lesson === question.lesson
      && row.sourceDifficulty === question.difficulty && row.teachAllowed === question.tabs.includes('teach')
      && ['core-source', 'supplemental-candidate', 'optional-tool-reference'].includes(row.role)
      && text(row.instructionalReview?.finding) && row.instructionalReview.humanReviewRequired === true
      && /^[a-f0-9]{64}$/.test(row.instructionalReview.sourceSha256), 'ممیزی منبع یا متادیتا ناسازگار است.');
    demand(Array.isArray(row.adaptations), 'فهرست اقتباس منبع لازم است.');
    for (const reference of row.adaptations) demand(sources.adaptations.some(a => a.activityId === reference.activityId
      && a.sourceReferences.some(ref => ref.questionId === row.questionId)), 'ارجاع اقتباس شکسته است.');
  }
  for (const adaptation of sources.adaptations) {
    demand(text(adaptation.learnerTask) && text(adaptation.completionCriterion) && text(adaptation.responseEvidence)
      && Array.isArray(adaptation.sourceReferences) && adaptation.sourceReferences.length > 0, 'شرح اقتباس ناقص است.');
    for (const ref of adaptation.sourceReferences) {
      const row = sources.questions.find(q => q.questionId === ref.questionId);
      demand(row && ref.use === 'adapted' && ref.bankVersion === bank.meta.version
        && ref.originalAposStage === row.sourceStage && text(ref.adaptationReason)
        && row.adaptations.some(a => a.activityId === adaptation.activityId && a.teachingStage === adaptation.stageId), 'قرارداد اقتباس ناسازگار است.');
    }
  }
  if (curriculum) demand(curriculum.activities.every(a => sources.adaptations.some(ref => ref.activityId === a.id
    && JSON.stringify(ref.sourceReferences) === JSON.stringify(a.sourceReferences))), 'منابع محتوای فعال با ماتریس یکسان نیستند.');
  return sources;
}

/** Small, bounded isomorphism search: relabeling must not masquerade as a fresh exit graph. */
function sameStructure(a, b) {
  if (a.vertices.length !== b.vertices.length || a.edges.length !== b.edges.length || a.directed !== b.directed) return false;
  const count = (g, x, y) => g.edges.filter(([u,v]) => g.directed ? u === x && v === y : u === x && v === y || u === y && v === x).length;
  const signature = (g, v) => [g.edges.filter(e => e[0] === v).length, g.edges.filter(e => e[1] === v).length];
  const degree = (g, v) => g.directed ? JSON.stringify(signature(g,v)) : g.edges.reduce((n,e) => n + e.filter(x => x === v).length, 0);
  const mapping = new Map(), used = new Set();
  let steps = 0;
  const match = index => {
    // Conservative failure for exceptionally symmetric input, never a false fresh-exit claim.
    if (++steps > 100000) return true;
    if (index === a.vertices.length) return true;
    const x = a.vertices[index];
    for (const y of b.vertices) {
      if (used.has(y) || degree(a,x) !== degree(b,y) || count(a,x,x) !== count(b,y,y)) continue;
      if (![...mapping].every(([u,v]) => count(a,x,u) === count(b,y,v) && (!a.directed || count(a,u,x) === count(b,v,y)))) continue;
      mapping.set(x,y); used.add(y);
      if (match(index + 1)) return true;
      mapping.delete(x); used.delete(y);
    }
    return false;
  };
  return match(0);
}
