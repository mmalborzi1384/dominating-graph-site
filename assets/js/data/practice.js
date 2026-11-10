import { analyzeGraph } from '../domain/evaluate.js';
export function practiceCatalog(questions, config) {
  if (config.version !== 1 || !Array.isArray(config.activities)) throw new Error('نسخهٔ محتوای تمرین معتبر نیست.');
  const entries = new Map();
  for (const activity of config.activities) {
    const question = questions.find(q => q.id === activity.questionId);
    if (!question?.tabs.includes('practice') || entries.has(question.id)) throw new Error('مجوز یا شناسهٔ تمرین معتبر نیست.');
    if (!['vertex-selection','integer','graph-construction','self-assessed-text'].includes(activity.mode)
      || !activity.prompt || !activity.model?.scenario || !activity.model.vertexMeaning || !activity.model.edgeMeaning
      || activity.hints?.length !== 3 || activity.hints.some(h => typeof h !== 'string' || !h.trim())) throw new Error('زمینه یا راهنمای تمرین کامل نیست.');
    if (activity.mode === 'vertex-selection' && !['dominating','minimal','minimum'].includes(activity.target)
      || activity.mode === 'integer' && activity.target !== 'gamma'
      || activity.mode === 'self-assessed-text' && activity.target !== 'rubric') throw new Error('خواستهٔ تمرین با نوع پاسخ سازگار نیست.');
    if (activity.mode === 'graph-construction' && (!Number.isInteger(activity.target?.n) || activity.target.n < 2 || activity.target.n > 10
      || !Number.isInteger(activity.target.gamma) || activity.target.gamma < 1 || activity.target.gamma > activity.target.n)) throw new Error('خواستهٔ ساخت گراف معتبر نیست.');
    if (['vertex-selection','integer'].includes(activity.mode)) {
      if (analyzeGraph(question.graph).gamma !== question.graph.gamma || !activity.model.places) throw new Error('مدل گراف معتبر نیست.');
    }
    if (activity.mode === 'self-assessed-text' && !activity.rubric) throw new Error('معیار خودارزیابی وجود ندارد.');
    entries.set(question.id, { ...activity, question });
  }
  return questions.filter(q => q.tabs.includes('practice')).map(question => entries.get(question.id)
    ?? { question, unavailable: true });
}
export function filterPractice(catalog, { lesson = '', category = '', difficulty = 'easy' } = {}) {
  return catalog.filter(({ question: q }) => (!lesson || q.lesson === lesson) && (!category || q.category === category)
    && (difficulty === 'easy' ? q.difficulty === 1 : [2,3].includes(q.difficulty)));
}
