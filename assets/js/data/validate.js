import { teachingInstance, teachingWitness, assessTeaching } from '../domain/teaching.js';
import { STAGE_IDS } from '../domain/progress.js';
import { analyzeGraph } from '../domain/evaluate.js';
const text = value => typeof value === 'string' && value.trim().length > 0;
const requireValue = (ok, message) => { if (!ok) throw new TypeError(message); };

/** Phase-3 boundary: validate the teaching references, not release-readiness of all 150. */
export function validateTeaching(curriculum, overrides, bank) {
  if(curriculum?.curriculumVersion===2)return validateTeachingV2(curriculum,bank);

  requireValue(bank?.questions?.length === 150, 'بانک باید ۱۵۰ سؤال داشته باشد.');
  const questions = new Map(bank.questions.map(question => [question.id, question]));
  requireValue(questions.size === 150 && Array.from({ length: 150 }, (_, i) =>
    questions.has(`Q${String(i + 1).padStart(3, '0')}`)).every(Boolean), 'شناسه‌های بانک معتبر نیستند.');
  requireValue(curriculum?.curriculumVersion === 1 && curriculum.stages?.length === 4
    && overrides?.curriculumVersion === 1 && overrides.bankVersion === bank.meta.version,
  'نسخه یا تعداد مراحل آموزش معتبر نیست.');
  requireValue(Array.isArray(curriculum.activities) && curriculum.activities.length > 0
    && new Set(curriculum.activities.map(activity => activity.id)).size === curriculum.activities.length,
  'فعالیت‌های آموزش باید شناسهٔ یکتا داشته باشند.');
  curriculum.stages.forEach((stage, index) => {
    requireValue(stage.id === STAGE_IDS[index] && stage.order === index
      && stage.prerequisite === (index ? STAGE_IDS[index - 1] : null)
      && text(stage.title) && text(stage.goal) && stage.blocks?.length > 0
      && stage.blocks.every(block => text(block.title) && text(block.body) && text(block.lesson))
      && stage.requiredActivityIds?.length > 0
      && new Set(stage.requiredActivityIds).size === stage.requiredActivityIds.length,
    'ترتیب یا محتوای مراحل APOS معتبر نیست.');
    requireValue(stage.requiredActivityIds.every(id => curriculum.activities.some(activity =>
      activity.id === id && activity.stageId === stage.id)), 'پیش‌نیاز فعالیت مرحله پیدا نشد.');
  });
  const models = new Map();
  for (const activity of curriculum.activities) {
    const question = questions.get(activity.questionId), extra = overrides.questions?.[activity.questionId];
    const stage = curriculum.stages.find(item => item.id === activity.stageId);
    requireValue(stage && stage.requiredActivityIds.includes(activity.id) && text(activity.id)
      && text(activity.title) && text(activity.prompt) && ['dominating', 'minimal', 'minimum'].includes(activity.target)
      && question?.tabs?.includes('teach') && question.apos_stage === activity.stageId,
    'مجوز یا نگاشت سؤال به مرحله معتبر نیست.');
    requireValue(extra && text(extra.adaptationReason) && ['ready-for-user-review', 'approved'].includes(extra.review?.status)
      && text(extra.review.basis) && ['scenario', 'vertexMeaning', 'edgeMeaning'].every(key => text(extra[key]))
      && extra.hints?.length === 3 && extra.hints.every(text), 'زمینه یا راهنماهای سؤال آماده نیستند.');
    const analysis = analyzeGraph(question.graph);
    requireValue(analysis.gamma === question.graph.gamma, 'گامای بانک با گراف ناسازگار است.');
    requireValue(extra.places?.length === question.graph.n
      && new Set(extra.places.map(place => place.id)).size === question.graph.n
      && extra.places.every(place => question.graph.vertices.includes(place.id) && text(place.label)
        && Number.isFinite(place.x) && place.x >= 40 && place.x <= 560
        && Number.isFinite(place.y) && place.y >= 45 && place.y <= 275), 'چیدمان سؤال معتبر نیست.');
    models.set(activity.id, { ...extra, graph: question.graph, question, activity });
  }
  const teachingPools = new Map();
  for (const activity of curriculum.activities) {
    const original=questions.get(activity.questionId);
    const candidates=(curriculum.randomQuestionIds ?? [activity.questionId]).map(id=>questions.get(id))
      .filter(q=>q?.tabs.includes('teach') && q.apos_stage===activity.stageId && q.difficulty===original.difficulty);
    requireValue(candidates.length>0,'مجموعهٔ تصادفی این فعالیت خالی است.');
    teachingPools.set(activity.id,candidates.map(question=>{
      const extra=overrides.questions[question.id];
      requireValue(extra && text(extra.adaptationReason) && text(extra.review?.basis)
        && ['ready-for-user-review','approved'].includes(extra.review?.status)
        && ['scenario','vertexMeaning','edgeMeaning'].every(key=>text(extra[key]))
        && extra.hints?.length===3 && extra.hints.every(text),'زمینهٔ سؤال تصادفی آماده نیست.');
      requireValue(analyzeGraph(question.graph).gamma===question.graph.gamma
        && extra.places?.length===question.graph.n && new Set(extra.places.map(p=>p.id)).size===question.graph.n
        && extra.places.every(p=>question.graph.vertices.includes(p.id)&&text(p.label)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=40&&p.x<=560&&p.y>=45&&p.y<=275),'مدل تصادفی معتبر نیست.');
      return {...extra,graph:question.graph,question,activity:{...activity,title:question.title_fa,
        prompt:'با انتخاب رأس‌ها، خواستهٔ این فعالیت را در مدل زیر برآورده کن.'}};
    }));
  }
  return { curriculum, models, teachingPools, questions: bank.questions, bankVersion: bank.meta.version };
}

function validateTeachingV2(curriculum, bank) {
  requireValue(bank?.meta?.version==='1.2'&&bank.questions?.length===150&&new Set(bank.questions.map(q=>q.id)).size===150&&Array.from({length:150},(_,i)=>`Q${String(i+1).padStart(3,'0')}`).every(id=>bank.questions.some(q=>q.id===id)),'بانک مرجع معتبر نیست.');
  requireValue(curriculum.stages?.length===4&&curriculum.activities?.length===12&&new Set(curriculum.activities.map(a=>a.id)).size===12,'چهار مرحله و دوازده فعالیت لازم است.');
  const models=new Map();
  curriculum.stages.forEach((stage,index)=>{
    requireValue(stage.id===STAGE_IDS[index]&&stage.order===index&&stage.prerequisite===(index?STAGE_IDS[index-1]:null)&&text(stage.title)&&text(stage.goal)&&text(stage.bridge)&&stage.blocks?.length&&stage.blocks.every(b=>text(b.title)&&text(b.body)&&text(b.lesson)),'ساختار مرحله معتبر نیست.');
    requireValue(stage.requiredActivityIds?.length===3&&new Set(stage.requiredActivityIds).size===3&&stage.variants?.length>=1,'فعالیت یا گونهٔ مرحله کامل نیست.');
    requireValue(new Set(stage.variants.map(v=>v.id)).size===stage.variants.length,'شناسهٔ گونه تکراری است.');
    for(const variant of stage.variants)requireValue(text(variant.scenario)&&variant.names?.length===6&&variant.names.every(text)&&variant.permutation?.length===6&&new Set(variant.permutation).size===6&&variant.permutation.every(n=>Number.isInteger(n)&&n>=0&&n<6),'گونهٔ مدل معتبر نیست.');
    for(const id of stage.requiredActivityIds){const a=curriculum.activities.find(a=>a.id===id);
      requireValue(a?.stageId===stage.id&&a.chainId===stage.id&&text(a.learningObjective)&&text(a.cognitiveOperation)&&text(a.prompt)&&text(a.rubric)&&text(a.solution)&&a.hints?.length===3&&a.hints.every(text)&&[1,2,3].includes(a.difficulty)&&a.parts?.length&&new Set(a.parts.map(p=>p.id)).size===a.parts.length,'قرارداد فعالیت کامل نیست.');
      requireValue(a.sourceReferences?.length&&a.sourceReferences.every(r=>r.kind==='authored'&&text(r.basis))&&!a.questionId&&a.reviewStatus==='ready-for-user-review','منبع فعالیت تألیفی روشن نیست.');
      requireValue(a.prerequisites.length===stage.requiredActivityIds.indexOf(id)&&a.prerequisites.every((p,i)=>p===stage.requiredActivityIds[i]),'ترتیب فعالیت معتبر نیست.');
      requireValue(a.parts.every(p=>text(p.label)&&['number','choice','edges','route','vertices','centers'].includes(p.type)&&(!(p.type==='choice')||p.options?.some(o=>o.value===p.expected)&&new Set(p.options.map(o=>o.value)).size===p.options.length)),'نوع پاسخ معتبر نیست.');
      for(const variant of stage.variants){const model=teachingInstance(a,variant);requireValue(assessTeaching(model,teachingWitness(model)).correct,'پاسخنامهٔ فعالیت ناسازگار است.');}
      models.set(id,teachingInstance(a,stage.variants[0]));
    }
  });
  const action=curriculum.stages[0],actionActivities=curriculum.activities.filter(a=>a.stageId==='Action');
  requireValue(!/G=|\\gamma|\\sum|مینیمم|مینیمال|احاطه|رأس|یال/.test([action.goal,action.bridge,...action.blocks.map(b=>b.body),...actionActivities.flatMap(a=>[a.prompt,a.rubric,a.solution,...a.hints])].join(' ')),'آموزش رسمی نباید به Action نشت کند.');
  return {curriculum,models,questions:bank.questions,bankVersion:bank.meta.version};
}
