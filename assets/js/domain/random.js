/** Fisher–Yates; injectable RNG supports deterministic developer verification. */
export function shuffled(items, random = Math.random) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function pickRandom(items, previousId, random = Math.random) {
  const alternatives=items.filter(item => (item.question?.id ?? item.id)!==previousId);
  return shuffled(alternatives.length?alternatives:items,random)[0];
}
