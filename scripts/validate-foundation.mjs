// Lightweight boundary/transaction fixtures, no runner, browser driver or dependencies.
import { readFileSync } from 'node:fs';
import { normalizeUserText } from '../assets/js/domain/limits.js';
import { validateStoredEnvelope } from '../assets/js/storage/validate.js';
import { decodeStoredState } from '../assets/js/storage/migrate.js';
import { createRepository, storageKey } from '../assets/js/storage/repository.js';
import { initialProgress } from '../assets/js/domain/progress.js';
import { evaluateSelection } from '../assets/js/domain/evaluate.js';
import { scoreSelection } from '../assets/js/domain/scoring.js';
import { splitMathText } from '../assets/js/ui/math.js';
import { selectionFeedback } from '../assets/js/ui/feedback.js';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const curriculum = read('../content/teaching.json'), bank = read('../docs/question-bank.json');
const context = { questions: bank.questions, bankVersion: bank.meta.version, activityIds: ['lab:draw'] };
const clone = structuredClone;
let checks = 0;
function expect(ok, message) { checks++; if (!ok) throw Error(message); }
function rejects(action, message) { let rejected = false; try { action(); } catch { rejected = true; } expect(rejected, message); }
const fresh = () => ({ schemaVersion: 1, curriculumVersion: 1, revision: 0,
  teachingProgress: initialProgress(), attempts: {}, sessions: {}, settings: { theme: 'day' } });
const textAttempt = (id = 'a1') => ({ id, tab: 'practice', questionId: 'Q001', responseMode: 'self-assessed-text',
  response: 'استدلال دانش‌آموز', target: 'rubric', evaluation: { satisfiesTarget: true, selfAssessed: true },
  recordedAt: '2026-11-11T00:00:00Z', hintLevel: 0, baseScore: 10, finalScore: 10 });
const simpleSession = (id = 's1') => ({ id, kind: 'practice', status: 'active', questionIds: ['Q001'],
  startedAt: '2026-11-11T00:00:00.000Z', currentIndex: 0 });
function valid(state) { return validateStoredEnvelope(state, curriculum, context); }
function bad(change, message, seed = fresh()) { const state = clone(seed); change(state); rejects(() => valid(state), message); }
expect(valid(fresh()).revision === 0, 'Valid empty envelope');
for (const kind of ['groupName', 'label', 'textResponse']) {
  const max = { groupName: 30, label: 50, textResponse: 1000 }[kind];
  expect([...normalizeUserText('😀'.repeat(max), kind)].length === max, `${kind} Unicode inclusive limit`);
  rejects(() => normalizeUserText('😀'.repeat(max + 1), kind), `${kind} refuses overflow`);
}
expect(normalizeUserText('  نام  ', 'groupName') === 'نام', 'Trim names');
expect(normalizeUserText('  پاسخ  ', 'textResponse') === '  پاسخ  ', 'Do not trim answers');
expect(normalizeUserText('e\u0301'.repeat(30), 'groupName') === 'é'.repeat(30), 'Count after NFC');
rejects(() => normalizeUserText('   ', 'label'), 'Nonempty labels');
rejects(() => normalizeUserText('<img src=x onerror=alert(1)>', 'textResponse'), 'No executable markup');
for (const mutate of [s => s.schemaVersion = 2, s => s.curriculumVersion = 2, s => s.revision = -1,
  s => s.revision = 0.5, s => s.settings.theme = 'other', s => s.settings.macros = {},
  s => s.unknown = {}, s => s.teachingProgress.answers = [], s => s.attempts = [],
  s => s.sessions = [], s => s.settings.theme = Infinity]) bad(mutate, 'Strict envelope/versions/types');
const poison = JSON.parse(JSON.stringify(fresh()).replace('"theme":"day"', '"theme":"day","__proto__":{}'));
rejects(() => valid(poison), 'Dangerous object keys');
const state = fresh(); state.attempts.a1 = textAttempt(); state.sessions.s1 = simpleSession();
expect(valid(state).attempts.a1.evaluation.selfAssessed, 'Full text/session schema');
for (const mutate of [s => s.attempts.a1.tab = 'teach', s => s.attempts.a1.id = 'wrong',
  s => s.attempts.a1.questionId = 'Q151', s => s.attempts.a1.unknown = 1,
  s => s.attempts.a1.recordedAt = '2026-02-30T00:00:00Z', s => s.attempts.a1.hintLevel = 4,
  s => s.attempts.a1.response = 'x'.repeat(1001), s => s.attempts.a1.baseScore = 15,
  s => s.attempts.a1.evaluation.selfAssessed = false, s => s.attempts.a1.sessionId = 'missing',
  s => s.sessions.s1.kind = 'teach', s => s.sessions.s1.status = 'unknown',
  s => s.sessions.s1.currentIndex = 2, s => s.sessions.s1.questionIds = ['Q000']]) bad(mutate, 'Invalid record/session rejected', state);
const full = fresh();
for (let i = 0; i < 200; i++) full.attempts[`a${i}`] = textAttempt(`a${i}`);
for (let i = 0; i < 100; i++) full.sessions[`s${i}`] = simpleSession(`s${i}`);
expect(Object.keys(valid(full).attempts).length === 200 && Object.keys(valid(full).sessions).length === 100, 'Exactly 200/100 accepted');
bad(s => s.attempts.overflow = textAttempt('overflow'), '201 rejected', full);
bad(s => s.sessions.overflow = simpleSession('overflow'), '101 rejected', full);
const one = fresh(), two = fresh();
for (let i = 0; i < 110; i++) one.attempts[`left${i}`] = textAttempt(`left${i}`);
for (let i = 0; i < 110; i++) two.attempts[`right${i}`] = textAttempt(`right${i}`);
valid(one); valid(two);
rejects(() => valid({ ...one, attempts: { ...one.attempts, ...two.attempts } }), 'Post-merge capacity validated with the same boundary');
const source = bank.questions.find(q => q.id === 'Q048');
const evaluation = evaluateSelection(source.graph, ['b', 'e'], 'minimum');
const score = scoreSelection(evaluation, 'competition', 1);
const match = fresh();
match.attempts.result = { id: 'result', tab: 'competition', questionId: source.id, sessionId: 'match', groupId: 'g1',
  recordedAt: '2026-11-11T00:00:00Z', responseMode: 'vertex-selection', response: ['b', 'e'], target: 'minimum',
  evaluation, hintLevel: 1, baseScore: score.base, finalScore: score.final };
match.sessions.match = { id: 'match', kind: 'competition', status: 'active', questionIds: ['Q048'],
  startedAt: '2026-11-11T00:00:00Z', currentIndex: 1, roundCount: 1,
  groups: [{ id: 'g1', name: '  یک  ', order: 0 }, { id: 'g2', name: 'دو', order: 1 }], turns: [
    { id: 't1', groupId: 'g1', questionId: 'Q048', consumedHintLevel: 1, resultStatus: 'finalized', finalizedAttemptId: 'result' },
    { id: 't2', groupId: 'g2', questionId: 'Q048', consumedHintLevel: 0, resultStatus: 'pending', finalizedAttemptId: null }] };
expect(valid(match).sessions.match.groups[0].name === 'یک', 'Groups normalized on a copy');
expect(match.sessions.match.groups[0].name === '  یک  ', 'Input not mutated');
for (const mutate of [s => s.attempts.result.finalScore = 15, s => s.attempts.result.response = ['a'],
  s => s.attempts.result.evaluation.gamma = 3, s => s.attempts.result.groupId = 'g2',
  s => s.sessions.match.turns[0].finalizedAttemptId = 'missing', s => s.sessions.match.turns[1].finalizedAttemptId = 'result',
  s => s.sessions.match.turns[0].resultStatus = 'unknown', s => s.sessions.match.turns[0].questionId = 'Q049',
  s => s.sessions.match.groups[0].name = 'x'.repeat(31), s => s.sessions.match.groups.pop(),
  s => s.sessions.match.groups[0].order = 1, s => s.sessions.match.turns[0].response = ['a'],
  s => s.sessions.match.status = 'completed']) bad(mutate, 'Turn/group/score integrity', match);
const tenGroups = clone(match);
tenGroups.sessions.match.groups = Array.from({ length: 10 }, (_, i) => ({ id: `g${i + 1}`, name: 'ن'.repeat(30), order: i }));
tenGroups.sessions.match.turns = tenGroups.sessions.match.groups.map((group, i) => i === 0 ? clone(match.sessions.match.turns[0])
  : ({ id: `t${i + 1}`, groupId: group.id, questionId: 'Q048', consumedHintLevel: 0, resultStatus: 'pending', finalizedAttemptId: null }));
expect(valid(tenGroups).sessions.match.groups.length === 10, 'Ten groups and 30-character names accepted');
bad(s => s.sessions.match.groups.push({ id: 'g11', name: 'یازده', order: 10 }), 'Eleven groups rejected', tenGroups);
const deleted = clone(match); delete deleted.attempts.result;
deleted.sessions.match.turns[0].resultStatus = 'finalized-deleted'; deleted.sessions.match.turns[0].finalizedAttemptId = null;
expect(valid(deleted).sessions.match.turns[0].resultStatus === 'finalized-deleted', 'Deleted result has spent marker and null reference');
bad(s => s.sessions.match.turns[0].finalizedAttemptId = 'result', 'Deleted marker cannot retain result pointer', deleted);
const custom = fresh();
const graph = { n: 2, vertices: ['a', 'b'], edges: [['a', 'b']] };
const snap = { graph, label: 'x'.repeat(50), modeling: { scenario_fa: 'دو ساختمان به هم متصل‌اند.',
  vertex_means_fa: 'ساختمان', edge_means_fa: 'ارتباط مستقیم', question_in_model_fa: 'یک ساختمان رابط انتخاب کن.' },
  places: [{ id: 'a', label: 'الف', x: 0, y: 0 }, { id: 'b', label: 'ب', x: 1, y: 1 }] };
custom.attempts.draw = { id: 'draw', tab: 'lab', activityId: 'lab:draw', recordedAt: '2026-11-11T00:00:00Z',
  responseMode: 'graph-construction', response: graph, target: { n: 2, gamma: 1 }, graphSnapshot: snap,
  evaluation: { satisfiesTarget: true, n: 2, gamma: 1 }, hintLevel: 0, baseScore: 15, finalScore: 15 };
expect(valid(custom).attempts.draw.graphSnapshot.label.length === 50, 'Model snapshot label at limit');
bad(s => s.attempts.draw.graphSnapshot.label += 'x', 'Label 51 rejected', custom);
bad(s => s.attempts.draw.graphSnapshot.places[0].x = -1, 'Invalid normalized layout', custom);
bad(s => s.attempts.draw.activityId = 'unregistered', 'Unknown custom activity', custom);
bad(s => s.attempts.draw.graphSnapshot.modeling.scenario_fa = '', 'Custom graph requires model context', custom);
const prepared12 = fresh();
const cycle12 = bank.questions.find(question => question.id === 'Q132').graph;
prepared12.attempts.p12 = { id: 'p12', tab: 'lab', questionId: 'Q132', recordedAt: '2026-11-11T00:00:00Z',
  responseMode: 'vertex-selection', response: ['a', 'd', 'g', 'j'], target: 'minimum',
  evaluation: evaluateSelection(cycle12, ['a', 'd', 'g', 'j'], 'minimum'), hintLevel: 0, baseScore: 15, finalScore: 15 };
expect(valid(prepared12).attempts.p12.evaluation.gamma === 4, 'Prepared 12-vertex source graph accepted');
const custom11 = clone(custom);
const vertices11 = Array.from({ length: 11 }, (_, i) => `v${i}`);
custom11.attempts.draw.graphSnapshot.graph = { n: 11, vertices: vertices11, edges: [] };
rejects(() => valid(custom11), 'Custom graphs do not exceed ten vertices');
const numeric = fresh(); numeric.attempts.n1 = { id: 'n1', tab: 'practice', questionId: 'Q048',
  recordedAt: '2026-11-11T00:00:00.000Z', responseMode: 'integer', response: 2, target: 'gamma',
  evaluation: { satisfiesTarget: true, expectedValue: 2 }, hintLevel: 3, baseScore: 15, finalScore: 15 };
expect(valid(numeric).attempts.n1.finalScore === 15, 'Integer exact gamma and free hints');
bad(s => s.attempts.n1.evaluation.expectedValue = 1, 'Forged expected gamma rejected', numeric);
for (const [raw, expected] of [[null, 'absent'], ['{bad', 'corrupt'], [JSON.stringify({ ...fresh(), schemaVersion: 2 }), 'unsupported'],
  [JSON.stringify({ ...fresh(), curriculumVersion: 2 }), 'unsupported'], [JSON.stringify(fresh()), 'ready']]) {
  expect(decodeStoredState(raw, curriculum, context).status === expected, `Explicit decode ${expected}`);
}
// Transaction fixtures: no partial writes, no overwrite of foreign revisions or poisoned memory.
const listeners = new Set();
globalThis.window = { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
globalThis.document = { documentElement: { dataset: { theme: 'day' } } };
const values = new Map(); let writes = 0, denied = false;
const storage = { getItem: key => values.get(key) ?? null, removeItem: key => values.delete(key),
  setItem(key, value) { if (denied) throw Object.assign(Error('quota'), { name: 'QuotaExceededError' }); writes++; values.set(key, value); } };
values.set(storageKey, JSON.stringify(match));
const repository = createRepository(curriculum, storage, context);
expect(repository.snapshot().readStatus === 'ready', 'Repository read status ready');
const next = repository.snapshot().state; next.settings.theme = 'night'; const before = writes;
expect(repository.commit(next, next.revision) && writes === before + 1 && repository.snapshot().state.revision === 1, 'One atomic write increments revision');
expect(!repository.commit(repository.snapshot().state), 'Generic commits require explicit expected revision');
const proposal = repository.snapshot().state;
const prepared = repository.prepare(proposal, proposal.revision);
expect(prepared.ok && prepared.nextState.revision === proposal.revision && writes === before + 1, 'Prepare validates without writing');
const oldRaw = values.get(storageKey), oldMemory = JSON.stringify(repository.snapshot().state);
const invalid = repository.snapshot().state; invalid.attempts.result.finalScore = 15;
expect(!repository.commit(invalid, invalid.revision) && values.get(storageKey) === oldRaw
  && JSON.stringify(repository.snapshot().state) === oldMemory, 'Invalid candidate changes neither memory nor storage');
const stale = repository.snapshot().state;
expect(!repository.commit(stale, stale.revision - 1) && values.get(storageKey) === oldRaw, 'Expected revision enforced');
const tombstone = clone(deleted); tombstone.revision = repository.snapshot().state.revision;
expect(repository.commit(tombstone, tombstone.revision), 'Atomic result deletion and spent marker');
const replay = clone(match); replay.revision = repository.snapshot().state.revision;
expect(!repository.commit(replay, replay.revision), 'Spent turn cannot be resurrected');
denied = true; const persisted = values.get(storageKey), rev = repository.snapshot().state.revision;
expect(!repository.setTheme('night') && repository.snapshot().dirty && repository.snapshot().state.revision === rev
  && values.get(storageKey) === persisted && repository.snapshot().lastResult.error.code === 'quota', 'Quota preserves raw/revision and valid unsaved work');
expect(JSON.parse(repository.recoveryJSON()).data.sessions.match.turns[0].resultStatus === 'finalized-deleted', 'Recovery carries deletion marker');
expect(repository.reload().lastResult.status === 'confirmation-required' && repository.snapshot().dirty, 'Dirty reload needs explicit confirmation');
denied = false; expect(repository.retry(), 'Quota retry');
const remote = JSON.parse(values.get(storageKey)); remote.revision++; remote.settings.theme = 'day';
values.set(storageKey, JSON.stringify(remote));
for (const listener of listeners) listener({ key: storageKey });
expect(repository.snapshot().state.revision === remote.revision && !repository.snapshot().conflict, 'Clean cross-page update refreshes');
repository.setEditingDirty('draft', true); remote.revision++; values.set(storageKey, JSON.stringify(remote));
for (const listener of listeners) listener({ key: storageKey });
expect(repository.snapshot().conflict && !repository.setTheme('night'), 'Dirty form pauses cross-page writes');
repository.reload({ discardUnsaved: true });
expect(!repository.snapshot().conflict && !repository.snapshot().editing, 'Confirmed reload reconciles');
const disposedBefore = listeners.size; repository.dispose(); expect(listeners.size === disposedBefore - 1, 'Listener cleanup');
for (const raw of ['{bad', JSON.stringify({ ...fresh(), schemaVersion: 99 })]) {
  values.set(storageKey, raw); const broken = createRepository(curriculum, storage, context), count = writes;
  expect(!broken.setTheme('night') && values.get(storageKey) === raw && writes === count && broken.originalJSON() === raw, 'Corrupt/unsupported original preserved'); broken.dispose();
}
const deniedStorage = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
const unavailable = createRepository(curriculum, deniedStorage, context);
expect(unavailable.snapshot().readStatus === 'unavailable' && !unavailable.setTheme('night'), 'Unavailable storage explicit');
expect(JSON.parse(unavailable.recoveryJSON()).data.settings.theme === 'night', 'Unavailable storage recovery');
expect(JSON.parse(unavailable.recoveryJSON()).bankVersion === bank.meta.version, 'Recovery identifies the supplied source bank');
unavailable.dispose();
for (const [input, expectedMath] of [['متن $x+1$ پایان', 1], ['$$x\ny$$', 1], [String.raw`قیمت \$5 و $x$`, 1], ['بدون $پایان', 0]]) {
  expect(splitMathText(input).filter(part => part.type === 'math').length === expectedMath, 'Math delimiters and fallback text');
}
expect(splitMathText('پیش از $x').some(segment => segment.type === 'invalid-math'), 'Unclosed math has explicit fallback token');
const graphP3 = bank.questions.find(q => q.id === 'Q087').graph;
const weaker = evaluateSelection(graphP3, ['a', 'b', 'c'], 'dominating');
expect(selectionFeedback(weaker, 'dominating', ids => ids.join()).tone === 'success', 'Shared feedback respects weaker target');
const notMinimal = evaluateSelection(graphP3, ['a', 'b', 'c'], 'minimal');
expect(selectionFeedback(notMinimal, 'minimal', ids => ids.join()).message.includes('قابل حذف'), 'Shared removable feedback');
console.log(`${checks} foundation boundary/transaction/math/feedback checks passed; no application tabs were started.`);
