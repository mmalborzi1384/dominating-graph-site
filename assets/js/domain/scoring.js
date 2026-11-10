export function qualityScore(evaluation) {
  if (!evaluation.dominates) return 0;
  if (evaluation.minimum) return 15;
  return evaluation.minimal ? 10 : 5;
}

export function hintCap(mode, hintLevel) {
  if (!['practice', 'competition'].includes(mode)
      || !Number.isInteger(hintLevel) || hintLevel < 0 || hintLevel > 3) {
    throw new TypeError('قاعدهٔ امتیاز یا سطح راهنما نامعتبر است.');
  }
  return mode === 'practice' ? 15 : [15, 10, 5, 0][hintLevel];
}

export function scoreSelection(evaluation, mode = 'practice', hintLevel = 0) {
  const base = qualityScore(evaluation), cap = hintCap(mode, hintLevel);
  return { base, cap, final: Math.min(base, cap) };
}
