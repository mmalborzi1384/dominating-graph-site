import { evaluateSelection, analyzeGraph } from './evaluate.js';
import { normalizeGraph } from './graph.js';
import { scoreSelection } from './scoring.js';
import { normalizeUserText, requireValid } from './limits.js';
import { validateStoredEnvelope } from '../storage/validate.js';

export function createAttempt({ questionId, activityId, tab = 'practice', mode, target, response,
  graph, graphSnapshot, hintLevel = 0, selfAssessed, points = 15, sessionId, groupId, durationMs }) {
  requireValid(['practice', 'competition', 'lab'].includes(tab), 'آموزش سابقهٔ پاسخ ندارد.');
  requireValid(Number.isInteger(hintLevel) && hintLevel >= 0 && hintLevel <= 3, 'سطح راهنما معتبر نیست.');
  requireValid(tab !== 'competition' || mode === 'vertex-selection', 'مسابقه به پاسخ انتخاب رأس نیاز دارد.');
  let evaluation, baseScore, finalScore;
  if (mode === 'vertex-selection') {
    evaluation = evaluateSelection(graph, response, target);
    const score = scoreSelection(evaluation, tab === 'competition' ? 'competition' : 'practice', hintLevel);
    baseScore = score.base; finalScore = score.final;
  } else if (mode === 'integer') {
    requireValid(Number.isSafeInteger(response) && response >= 0 && response <= 12, 'پاسخ باید عدد صحیح صفر تا ۱۲ باشد.');
    const expectedValue = analyzeGraph(graph).gamma;
    evaluation = { satisfiesTarget: response === expectedValue, expectedValue };
    baseScore = evaluation.satisfiesTarget ? points : 0; finalScore = baseScore;
  } else if (mode === 'self-assessed-text') {
    response = normalizeUserText(response, 'textResponse');
    requireValid(response.trim().length > 0 && typeof selfAssessed === 'boolean', 'پاسخ و ارزیابی خود را وارد کنید.');
    evaluation = { satisfiesTarget: selfAssessed, selfAssessed: true };
    baseScore = selfAssessed ? 10 : 0; finalScore = baseScore;
  } else if (mode === 'graph-construction') {
    response = normalizeGraph(response);
    const analysis = analyzeGraph(response);
    evaluation = { n: response.n, gamma: analysis.gamma, satisfiesTarget: response.n === target.n
      && analysis.gamma === target.gamma && analysis.minimumSets.length >= (target.minimumSetCountMin ?? 1)
      && analysis.minimumSets.length <= (target.minimumSetCountMax ?? Infinity) };
    baseScore = evaluation.satisfiesTarget ? 15 : 0; finalScore = baseScore;
  } else throw new TypeError('نوع پاسخ پشتیبانی نمی‌شود.');
  return { id: crypto.randomUUID(), tab, ...(questionId ? { questionId } : {}), ...(activityId ? { activityId } : {}),
    ...(sessionId ? { sessionId } : {}), ...(groupId ? { groupId } : {}), ...(durationMs !== undefined ? { durationMs } : {}),
    recordedAt: new Date().toISOString(), responseMode: mode, response: structuredClone(response), target: structuredClone(target),
    evaluation, hintLevel, baseScore, finalScore, ...(graphSnapshot ? { graphSnapshot: structuredClone(graphSnapshot) } : {}) };
}
export function appendAttempt(state, attempt, curriculum, context) {
  requireValid(!Object.hasOwn(state.attempts, attempt.id), 'این پاسخ قبلاً نهایی شده است.');
  return validateStoredEnvelope({ ...state, attempts: { ...state.attempts, [attempt.id]: attempt } }, curriculum, context);
}
