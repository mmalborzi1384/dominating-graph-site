import { scoreSelection } from './scoring.js';
export function recordScore(attempt, questions) {
  if (attempt.finalScore !== undefined) return attempt.finalScore;
  if (attempt.responseMode === 'vertex-selection') return scoreSelection(attempt.evaluation,attempt.tab==='competition'?'competition':'practice',attempt.hintLevel).final;
  if (!attempt.evaluation.satisfiesTarget) return 0;
  if (attempt.responseMode === 'self-assessed-text') return 10;
  return attempt.responseMode === 'integer' ? questions.find(q=>q.id===attempt.questionId)?.scoring?.points ?? 15 : 15;
}
/** Derived only; never persisted, and never a personality assessment. */
export function summarizeRecords(state, questions) {
  const catalog = new Map(questions.map(q => [q.id, q]));
  const attempts = Object.values(state.attempts), unique = new Set(attempts.map(a => a.questionId).filter(Boolean));
  const aggregate = rows => ({ count: rows.length, correct: rows.filter(a => a.evaluation.satisfiesTarget).length,
    score: rows.reduce((sum, a) => sum + recordScore(a,questions), 0), hints: rows.reduce((sum, a) => sum + a.hintLevel, 0) });
  const breakdown = key => [...new Set(questions.map(q => q[key]).filter(Boolean))].map(value => ({ value,
    ...aggregate(attempts.filter(a => catalog.get(a.questionId)?.[key] === value)) }));
  return { ...aggregate(attempts), unique: unique.size,
    tabs: ['practice','competition','lab'].map(tab => ({ tab, ...aggregate(attempts.filter(a => a.tab === tab)) })),
    lessons: breakdown('lesson'), apos: breakdown('apos_stage'),
    sahat: [...new Set(questions.map(q => q.sahat_code))].filter(Boolean).map(code => {
      const pool = questions.filter(q => q.sahat_code === code), count = pool.filter(q => unique.has(q.id)).length;
      return { code, label: pool[0].sahat, count, total: pool.length, percent: count / pool.length * 100 };
    }) };
}
export function deleteResults(state, ids) {
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some(id => !Object.hasOwn(state.attempts,id))) throw Error('نتیجهٔ انتخاب‌شده دیگر موجود نیست؛ دوباره انتخاب کنید.');
  const next = structuredClone(state), selected = new Set(ids);
  for (const id of ids) delete next.attempts[id];
  for (const session of Object.values(next.sessions)) for (const turn of session.turns ?? []) {
    if (selected.has(turn.finalizedAttemptId)) { turn.resultStatus = 'finalized-deleted'; turn.finalizedAttemptId = null; }
  }
  return next;
}
