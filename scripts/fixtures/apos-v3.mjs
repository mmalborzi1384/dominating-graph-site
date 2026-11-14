// Technical fixture only: never loaded by the application or counted as authored curriculum.
const graph=(vertices,edges)=>({vertices:[...vertices],edges,directed:false,multigraph:false});
const p3=graph('abc',[['a','b'],['b','c']]),p5=graph('abcde',[['a','b'],['b','c'],['c','d'],['d','e']]);
const part=(type,props={})=>({id:type,label:type,type,...props});
const review=part('reflection',{criteria:[{id:'reason',label:'دلیل را با معیار مقایسه کردم'},{id:'limits',label:'فرض‌ها را بازبینی کردم'}]});
const modelContext={scenario:'شبکهٔ خدمات محله',vertexMeaning:'تقاطع',edgeMeaning:'خیابان مستقیم',goal:'پوشش خدمات'};
// Deliberately unequal activity counts: the implementation must derive them from data.
export function foundationCurriculum() {
  const curriculum = { curriculumVersion: 3, lessons: [], units: [], activities: [] };
  let previous = null;
  for (const lessonId of ['lesson1', 'lesson2']) {
    const lesson = { id: lessonId, title: lessonId, objective: 'ساخت مفهوم', unitIds: [] };
    for (const [index, stageId] of ['Action','Process','Object','Schema'].entries()) {
      const unitId = `${lessonId}-${stageId}`, activityIds = [];
      for (let i = 0; i < index % 2 + 2; i++) {
        const id = `${unitId}-${i}`;
        curriculum.activities.push({ id, unitId, lessonId, stageId, title: 'نمونهٔ آزمون زیرساخت، نه محتوای آموزشی',
          cognitiveOperation: 'محاسبه و بازبینی', instructionSteps: ['بررسی کن'], hints: ['رابطه را بخوان'],
          explanation: 'این داده فقط fixture است.', rubric: ['محاسبه و خودبازبینی'], prerequisites: [...activityIds],
          context: modelContext, graph: p3, parts: [part('number', { expected: 1 }), review],
          sourceReferences: [{ questionId: 'Q046', bankVersion: '1.4', originalAposStage: 'Process', use: 'adapted', adaptationReason: 'نمونهٔ فنی برای آزمون قرارداد' }],
          exitVariants: [{ id: `${id}-fresh`, context: modelContext, graph: p5, parts: [part('number', { expected: 2 }), review] }] });
        activityIds.push(id);
      }
      curriculum.units.push({ id: unitId, lessonId, stageId, objective: 'ساخت و بررسی', prerequisites: previous ? [previous] : [],
        scaffolding: ['راهنمای اختیاری'], misconceptions: ['کمینه با مینیمال فرق دارد'], evidenceCriteria: ['شاهد کامل'],
        requiredActivityIds: activityIds, exitActivityId: activityIds.at(-1), progressWeight: 1 });
      lesson.unitIds.push(unitId); previous = unitId;
    }
    curriculum.lessons.push(lesson);
  }
  return curriculum;
}
