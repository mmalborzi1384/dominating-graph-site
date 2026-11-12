// Dependency-free local verification of the APOS content and persistence boundary.
import { readFileSync } from 'node:fs';
import { validateTeaching } from '../assets/js/data/validate.js';
import { initialProgress, completeActivity, visitStage, validateProgress, progressPercent, unlockedStages } from '../assets/js/domain/progress.js';
import { createRepository, storageKey } from '../assets/js/storage/repository.js';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const { curriculum, models } = validateTeaching(read('../content/teaching-v1.json'),
  read('../content/question-overrides.json'), read('../docs/question-bank.json'));
let checks = 0;
const expect = (ok, message) => { checks++; if (!ok) throw Error(message); };
const rejects = (action, message) => { let rejected = false; try { action(); } catch { rejected = true; } expect(rejected, message); };
let p = initialProgress();
expect(progressPercent(p) === 0 && unlockedStages(p).join() === 'Action', 'Fresh progress');
rejects(() => visitStage(p, 'Schema', curriculum), 'Locked navigation');
rejects(() => completeActivity(p, curriculum.stages[3].requiredActivityIds[0], curriculum), 'Locked completion');
for (const stage of curriculum.stages) {
  for (const id of stage.requiredActivityIds) {
    p = completeActivity(p, id, curriculum);
    const restored = validateProgress(JSON.parse(JSON.stringify(p)), curriculum);
    expect(restored.completedActivityIds.includes(id), 'Partial flag resume');
    expect(Object.keys(restored).length === 3, 'Progress allowlist');
  }
  expect(progressPercent(p) === 25 * (stage.order + 1), 'Sequential 25% increment');
}
expect(progressPercent(visitStage(p, 'Action', curriculum)) === 100, 'Backward navigation preserves pass');
expect(JSON.stringify(completeActivity(p, curriculum.activities[0].id, curriculum)) === JSON.stringify(p), 'Repeat completion is monotonic');
rejects(() => validateProgress({ ...p, selected: ['a'] }, curriculum), 'No answer field');
rejects(() => validateProgress({ ...initialProgress(), passedStageIds: ['Action'] }, curriculum), 'No fabricated pass');
rejects(() => validateProgress({ ...initialProgress(), completedActivityIds: [curriculum.activities.at(-1).id] }, curriculum), 'No later-stage flags');

const events = new Map();
globalThis.window = { addEventListener(type, listener) { events.set(type, listener); } };
globalThis.document = { documentElement: { dataset: { theme: 'day' } } };
const values = new Map(); let denied = false, writes = 0;
const storage = { getItem: key => values.get(key) ?? null,
  setItem(key, value) { if (denied) throw Error('quota'); writes++; values.set(key, value); },
  removeItem: key => values.delete(key) };
const repository = createRepository(curriculum, storage);
for (const stage of curriculum.stages) {
  repository.changeProgress(value => visitStage(value, stage.id, curriculum));
  for (const id of stage.requiredActivityIds) repository.changeProgress(value => completeActivity(value, id, curriculum));
  expect(progressPercent(JSON.parse(values.get(storageKey)).teachingProgress) === 25 * (stage.order + 1), 'Durable stage progress');
}
const raw = JSON.parse(values.get(storageKey));
expect(Object.keys(raw.teachingProgress).sort().join() === ['completedActivityIds','lastVisitedStageId','passedStageIds'].join(), 'Only completion/navigation stored');
expect(Object.keys(raw.attempts).length === 0 && Object.keys(raw.sessions).length === 0, 'No teaching attempts/sessions');
const restored = createRepository(curriculum, storage);
expect(progressPercent(restored.snapshot().state.teachingProgress) === 100, 'New repository resumes');
raw.attempts.keep = { id: 'keep', tab: 'practice', questionId: 'Q001', recordedAt: '2026-11-11T00:00:00.000Z', responseMode: 'self-assessed-text', target: 'rubric', response: 'unrelated', evaluation: { satisfiesTarget: true, selfAssessed: true }, hintLevel: 0, baseScore: 10, finalScore: 10 };
raw.sessions.keep = { id: 'keep', kind: 'practice', status: 'completed', startedAt: '2026-11-11T00:00:00.000Z', questionIds: ['Q001'], currentIndex: 1 };
raw.settings.theme = 'night'; values.set(storageKey, JSON.stringify(raw));
const reset = createRepository(curriculum, storage);
reset.resetTeaching();
const afterReset = JSON.parse(values.get(storageKey));
expect(progressPercent(afterReset.teachingProgress) === 0 && afterReset.attempts.keep.response === 'unrelated'
  && afterReset.sessions.keep.status === 'completed' && afterReset.settings.theme === 'night', 'Reset only teaching');
const old = values.get(storageKey); denied = true;
reset.changeProgress(value => completeActivity(value, curriculum.activities[0].id, curriculum));
expect(values.get(storageKey) === old && reset.snapshot().dirty && reset.snapshot().warning.length > 0, 'Quota preserves old raw and unsaved memory');
expect(JSON.parse(reset.recoveryJSON()).data.teachingProgress.completedActivityIds.length === 1, 'Unsaved recovery contains flags');
denied = false; expect(reset.retry(), 'Retry succeeds');
const beforeConflict = values.get(storageKey);
const other = JSON.parse(beforeConflict); other.revision++; values.set(storageKey, JSON.stringify(other));
reset.setTheme('day');
expect(reset.snapshot().conflict && values.get(storageKey) === JSON.stringify(other), 'Revision conflict never overwrites');
for (const bad of ['{bad', JSON.stringify({ ...raw, schemaVersion: 99 }), JSON.stringify({ ...raw, curriculumVersion: 99 })]) {
  values.set(storageKey, bad); const broken = createRepository(curriculum, storage), count = writes;
  broken.changeProgress(value => completeActivity(value, curriculum.activities[0].id, curriculum));
  expect(values.get(storageKey) === bad && writes === count && Boolean(broken.snapshot().warning), 'Corrupt/unsupported raw preserved');
}
const unavailable = createRepository(curriculum, { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } });
unavailable.changeProgress(value => completeActivity(value, curriculum.activities[0].id, curriculum));
expect(unavailable.snapshot().dirty && unavailable.snapshot().warning, 'Denied storage allows unsaved progress');
// Conservative migration of the phase-1 shell theme: delete only after a durable envelope.
values.clear();
const legacyKey = storageKey.replace('graph-learning:v1:', 'graph-learning:shell:v1:');
values.set(legacyKey, JSON.stringify({ version: 1, theme: 'night' }));
const migrated = createRepository(curriculum, storage);
expect(migrated.snapshot().state.settings.theme === 'night' && !values.has(legacyKey)
  && JSON.parse(values.get(storageKey)).settings.theme === 'night', 'Legacy theme migrates after successful commit');
values.clear(); values.set(legacyKey, JSON.stringify({ version: 1, theme: 'night' })); denied = true;
createRepository(curriculum, storage);
expect(values.has(legacyKey) && !values.has(storageKey), 'Failed migration preserves legacy theme');
denied = false;
console.log(`${models.size} modeled activities / 4 APOS stages; ${checks} content, progress and storage checks passed.`);
console.log('Human educational review and real-host checks remain pending; this is not a 150-question release audit.');
