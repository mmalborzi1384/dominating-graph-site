import { validateProgress } from '../domain/progress.js';
import { normalizeGraph, selectionMask, topologyKey } from '../domain/graph.js';
import { analyzeGraph, evaluateSelection } from '../domain/evaluate.js';
import { scoreSelection } from '../domain/scoring.js';
import { normalizeUserText, requireValid as check, validateCapacity, LAB_ACTIVITY_IDS } from '../domain/limits.js';

const tabs = ['practice', 'competition', 'lab'];
const targets = ['dominating', 'minimal', 'minimum'];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
export function fields(value, required, optional, path) {
  check(isObject(value), 'ساختار شیء معتبر نیست.', path);
  check(required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => [...required, ...optional].includes(key)), 'فیلد الزامی غایب یا فیلد ناشناخته است.', path);
}
export function safeData(value, path = '', depth = 0, budget = { count: 0 }) {
  check(depth <= 30 && ++budget.count <= 150000, 'ساختار ذخیره بیش از حد بزرگ یا تو در تو است.', path);
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return;
  if (typeof value === 'number') { check(Number.isFinite(value), 'عدد باید متناهی باشد.', path); return; }
  if (Array.isArray(value)) { for (const item of value) safeData(item, path, depth + 1, budget); return; }
  check(isObject(value), 'فقط دادهٔ JSON مجاز است.', path);
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    check(!['__proto__', 'constructor', 'prototype'].includes(key) && Object.hasOwn(descriptor, 'value'), 'کلید یا ویژگی اجرایی مجاز نیست.', path);
    safeData(descriptor.value, `${path}.${key}`, depth + 1, budget);
  }
}
function id(value, path) {
  check(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(value)
    && !['__proto__', 'constructor', 'prototype'].includes(value), 'شناسه معتبر نیست.', path);
}
function questionId(value, path) { check(/^Q(?:00[1-9]|0[1-9]\d|1[0-4]\d|150)$/.test(value), 'شناسهٔ سؤال در بانک نیست.', path); }
function integer(value, min, max, path) { check(Number.isSafeInteger(value) && value >= min && value <= max, 'عدد صحیح خارج از بازه است.', path); }
export function timestamp(value, path) {
  const match = typeof value === 'string' && /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d{1,3}))?Z$/.exec(value);
  check(match && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`,
  'زمان باید ISO-8601 معتبر و UTC باشد.', path);
}
function ids(values, path) {
  check(Array.isArray(values) && new Set(values).size === values.length, 'فهرست شناسه باید یکتا باشد.', path);
  values.forEach(value => id(value, path));
}
export function same(a, b) {
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((item, i) => same(item, b[i]));
  if (isObject(a)) return isObject(b) && Object.keys(a).length === Object.keys(b).length
    && Object.keys(a).every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
  return a === b;
}
function graph(value, path, max = 12) {
  fields(value, ['n', 'vertices', 'edges'], ['directed', 'multigraph', 'gamma'], path);
  for (const key of ['directed', 'multigraph']) if (Object.hasOwn(value, key)) check(value[key] === false, 'گراف ارزیابی باید ساده و بدون جهت باشد.', path);
  value.vertices?.forEach(vertex => id(vertex, `${path}.vertices`));
  const result = normalizeGraph(value); integer(result.n, 2, max, path);
  if (Object.hasOwn(value, 'gamma')) check(value.gamma === analyzeGraph(result).gamma, 'گاما با گراف سازگار نیست.', path);
  return result;
}
function snapshot(value, path, max) {
  fields(value, ['graph', 'modeling'], ['places', 'label'], path);
  const result = graph(value.graph, `${path}.graph`, max);
  fields(value.modeling, ['scenario_fa', 'vertex_means_fa', 'edge_means_fa', 'question_in_model_fa'], [], `${path}.modeling`);
  for (const key of Object.keys(value.modeling)) {
    value.modeling[key] = normalizeUserText(value.modeling[key], 'textResponse', `${path}.modeling.${key}`);
    check(value.modeling[key].trim().length > 0, 'زمینهٔ مدل‌سازی نباید خالی باشد.', path);
  }
  if (Object.hasOwn(value, 'label')) value.label = normalizeUserText(value.label, 'label', `${path}.label`);
  if (Object.hasOwn(value, 'places')) {
    check(Array.isArray(value.places) && value.places.length === result.n, 'چیدمان کامل نیست.', path);
    const seen = new Set();
    for (const place of value.places) {
      fields(place, ['id', 'label', 'x', 'y'], [], `${path}.places`);
      check(result.vertices.includes(place.id) && !seen.has(place.id), 'رأس چیدمان تکراری یا ناشناخته است.', path); seen.add(place.id);
      place.label = normalizeUserText(place.label, 'label', `${path}.places.label`);
      check(Number.isFinite(place.x) && Number.isFinite(place.y) && place.x >= 0 && place.x <= 1
        && place.y >= 0 && place.y <= 1, 'مختصات باید در بازهٔ صفر تا یک باشد.', path);
    }
  }
  return result;
}
function catalogQuestion(value, context) {
  return context.questions?.find(question => question.id === value);
}
function validateAttempt(attempt, key, context) {
  const path = `attempts.${key}`;
  fields(attempt, ['id', 'tab', 'recordedAt', 'responseMode', 'response', 'target', 'evaluation', 'hintLevel'],
    ['sessionId', 'questionId', 'activityId', 'baseScore', 'finalScore', 'groupId', 'graphSnapshot', 'durationMs'], path);
  id(key, path); check(attempt.id === key && tabs.includes(attempt.tab), 'شناسه یا بخش نتیجه معتبر نیست؛ آموزش نتیجهٔ ذخیره‌شونده ندارد.', path);
  timestamp(attempt.recordedAt, path); integer(attempt.hintLevel, 0, 3, path);
  if (attempt.sessionId !== undefined) id(attempt.sessionId, path);
  if (attempt.groupId !== undefined) id(attempt.groupId, path);
  check(attempt.questionId !== undefined || attempt.activityId !== undefined, 'سؤال یا فعالیت باید مشخص باشد.', path);
  let source;
  if (attempt.questionId !== undefined) {
    questionId(attempt.questionId, path); source = catalogQuestion(attempt.questionId, context);
    if (context.questions) check(source?.tabs?.includes(attempt.tab), 'سؤال مجوز این بخش را ندارد.', path);
  }
  if (attempt.activityId !== undefined) {
    id(attempt.activityId, path);
    check(attempt.tab === 'lab' && (context.activityIds ?? LAB_ACTIVITY_IDS).includes(attempt.activityId), 'فعالیت آزمایشگاه ثبت نشده است.', path);
  }
  if (attempt.durationMs !== undefined) check(Number.isFinite(attempt.durationMs) && attempt.durationMs >= 0, 'مدت معتبر نیست.', path);
  let model = source?.graph;
  if (attempt.graphSnapshot !== undefined) model = snapshot(attempt.graphSnapshot, `${path}.graphSnapshot`, attempt.questionId ? 12 : 10);
  if (!attempt.questionId) check(model, 'فعالیت سفارشی باید مدل کامل داشته باشد.', path);
  const evaluation = attempt.evaluation;
  let base, final;
  if (attempt.responseMode === 'vertex-selection') {
    check(targets.includes(attempt.target) && model, 'خواسته یا گراف انتخاب رأس موجود نیست.', path);
    ids(attempt.response, path); selectionMask(model, attempt.response);
    const expected = evaluateSelection(model, attempt.response, attempt.target);
    fields(evaluation, Object.keys(expected), [], `${path}.evaluation`);
    check(same(evaluation, expected), 'ارزیابی ذخیره‌شده با پاسخ سازگار نیست.', path);
    const score = scoreSelection(expected, attempt.tab === 'competition' ? 'competition' : 'practice', attempt.hintLevel);
    base = score.base; final = score.final;
  } else if (attempt.responseMode === 'integer') {
    check(attempt.target === 'gamma', 'خواستهٔ عددی معتبر نیست.', path); integer(attempt.response, 0, 12, path);
    fields(evaluation, ['satisfiesTarget', 'expectedValue'], [], `${path}.evaluation`);
    integer(evaluation.expectedValue, 1, 12, path);
    check(model && evaluation.expectedValue === analyzeGraph(model).gamma, 'گامای مرجع معتبر نیست.', path);
    check(evaluation.satisfiesTarget === (attempt.response === evaluation.expectedValue), 'درستی پاسخ عددی ناسازگار است.', path);
    base = evaluation.satisfiesTarget ? source?.scoring?.points ?? 15 : 0; final = base;
    check(attempt.tab !== 'competition', 'مسابقه از انتخاب رأس برای جدول کیفیت استفاده می‌کند.', path);
  } else if (attempt.responseMode === 'self-assessed-text') {
    check(attempt.tab !== 'competition' && attempt.target === 'rubric', 'داوری تشریحی در این بخش مجاز نیست.', path);
    attempt.response = normalizeUserText(attempt.response, 'textResponse', `${path}.response`);
    fields(evaluation, ['satisfiesTarget', 'selfAssessed'], [], `${path}.evaluation`);
    check(typeof evaluation.satisfiesTarget === 'boolean' && evaluation.selfAssessed === true, 'خودارزیابی باید صریح باشد.', path);
    base = evaluation.satisfiesTarget ? 10 : 0; final = base;
  } else if (attempt.responseMode === 'graph-construction') {
    check(attempt.tab !== 'competition', 'ساخت گراف در مسابقه مجاز نیست.', path);
    fields(attempt.target, ['n', 'gamma'], ['minimumSetCountMin', 'minimumSetCountMax'], `${path}.target`);
    if (attempt.target.minimumSetCountMin !== undefined) integer(attempt.target.minimumSetCountMin, 1, 1024, path);
    if (attempt.target.minimumSetCountMax !== undefined) integer(attempt.target.minimumSetCountMax, attempt.target.minimumSetCountMin ?? 1, 1024, path);
    integer(attempt.target.n, 2, 10, path); integer(attempt.target.gamma, 1, attempt.target.n, path);
    const response = graph(attempt.response, `${path}.response`, 10);
    check(model && topologyKey(response) === topologyKey(normalizeGraph(model)), 'مدل پاسخ با تصویر ذخیره‌شده ناسازگار است.', path);
    fields(evaluation, ['satisfiesTarget', 'n', 'gamma'], [], `${path}.evaluation`);
    check(evaluation.n === response.n && evaluation.gamma === analyzeGraph(response).gamma
      && evaluation.satisfiesTarget === (response.n === attempt.target.n && evaluation.gamma === attempt.target.gamma
        && analyzeGraph(response).minimumSets.length >= (attempt.target.minimumSetCountMin ?? 1)
        && analyzeGraph(response).minimumSets.length <= (attempt.target.minimumSetCountMax ?? Infinity)), 'نتیجهٔ ساخت گراف ناسازگار است.', path);
    base = evaluation.satisfiesTarget ? 15 : 0; final = base;
  } else check(false, 'نوع پاسخ شناخته‌شده نیست.', path);
  check([0, 5, 10, 15].includes(base), 'امتیاز مرجع معتبر نیست.', path);
  check((attempt.baseScore === undefined) === (attempt.finalScore === undefined), 'امتیاز پایه و نهایی باید با هم بیایند.', path);
  if (attempt.baseScore !== undefined) check(attempt.baseScore === base && attempt.finalScore === final, 'امتیاز ذخیره‌شده ناسازگار است.', path);
}
function validateSession(session, key, state, context, usedAttempts) {
  const path = `sessions.${key}`;
  fields(session, ['id', 'kind', 'status', 'questionIds', 'startedAt', 'currentIndex'],
    ['deadlineAt', 'groups', 'roundCount', 'turns', 'graphDraft'], path);
  id(key, path); check(session.id === key && tabs.includes(session.kind)
    && ['configured', 'active', 'completed'].includes(session.status), 'نشست معتبر نیست.', path);
  timestamp(session.startedAt, path);
  if (session.deadlineAt !== undefined) {
    check(Number.isSafeInteger(session.deadlineAt) && session.deadlineAt >= Date.parse(session.startedAt), 'مهلت باید زمان مطلق معتبر باشد.', path);
  }
  check(Array.isArray(session.questionIds), 'فهرست سؤال معتبر نیست.', path);
  for (const qid of session.questionIds) {
    questionId(qid, path);
    if (context.questions) check(catalogQuestion(qid, context)?.tabs?.includes(session.kind), 'مجوز سؤال نشست معتبر نیست.', path);
  }
  check(session.status === 'configured' || session.questionIds.length > 0 || session.graphDraft !== undefined, 'نشست فعال باید سؤال یا مدل داشته باشد.', path);
  const groups = session.groups ?? [];
  check(Array.isArray(groups), 'گروه‌ها معتبر نیستند.', path);
  if (session.kind === 'competition') integer(groups.length, 2, 10, path);
  else if (groups.length) check(session.kind === 'lab' && groups.length === 2, 'بازی آزمایشگاه دقیقاً دو گروه دارد.', path);
  const groupIds = new Set();
  groups.forEach((group, index) => {
    fields(group, ['id', 'name', 'order'], [], `${path}.groups`); id(group.id, path);
    check(!groupIds.has(group.id) && group.order === index, 'ترتیب یا شناسهٔ گروه تکراری است.', path); groupIds.add(group.id);
    group.name = normalizeUserText(group.name, 'groupName', `${path}.groups.name`);
  });
  if (session.roundCount !== undefined) integer(session.roundCount, 1, Number.MAX_SAFE_INTEGER, path);
  check(session.kind !== 'competition' || session.roundCount !== undefined, 'تعداد دور مشخص نیست.', path);
  const turns = session.turns ?? [];
  check(Array.isArray(turns) && (session.kind !== 'competition' || Object.hasOwn(session, 'turns')), 'نوبت‌ها معتبر نیستند.', path);
  if (session.kind === 'competition' && session.status !== 'configured') check(turns.length === groups.length * session.roundCount, 'تعداد نوبت‌های گروه‌ها برابر نیست.', path);
  const turnIds = new Set(), perGroup = new Map(groups.map(group => [group.id, 0]));
  for (const turn of turns) {
    fields(turn, ['id', 'groupId', 'questionId', 'consumedHintLevel', 'resultStatus', 'finalizedAttemptId'], [], `${path}.turns`);
    id(turn.id, path); questionId(turn.questionId, path); integer(turn.consumedHintLevel, 0, 3, path);
    check(!turnIds.has(turn.id) && session.questionIds.includes(turn.questionId), 'شناسهٔ نوبت یا سؤال آن معتبر نیست.', path); turnIds.add(turn.id);
    check(groups.length ? groupIds.has(turn.groupId) : turn.groupId === null, 'گروه نوبت معتبر نیست.', path);
    if (groups.length) perGroup.set(turn.groupId, perGroup.get(turn.groupId) + 1);
    check(['pending', 'finalized', 'finalized-deleted'].includes(turn.resultStatus), 'وضعیت نتیجهٔ نوبت معتبر نیست.', path);
    if (turn.resultStatus === 'finalized') {
      id(turn.finalizedAttemptId, path);
      const attempt = state.attempts[turn.finalizedAttemptId];
      check(attempt && !usedAttempts.has(attempt.id) && attempt.sessionId === key
        && attempt.tab === session.kind && attempt.questionId === turn.questionId
        && (attempt.groupId ?? null) === turn.groupId && attempt.hintLevel === turn.consumedHintLevel,
      'ارجاع نتیجهٔ نهایی شکسته یا ناسازگار است.', path);
      usedAttempts.add(attempt.id);
    } else check(turn.finalizedAttemptId === null, 'نوبت بدون نتیجه باید ارجاع null داشته باشد.', path);
  }
  if (session.kind === 'competition' && session.status !== 'configured') check([...perGroup.values()].every(count => count === session.roundCount), 'نوبت‌های گروه‌ها برابر نیستند.', path);
  if (session.status === 'completed') check(turns.every(turn => turn.resultStatus !== 'pending')
    || session.kind === 'lab' && session.deadlineAt !== undefined && session.deadlineAt <= Date.now() && session.currentIndex === turns.length,
    'نشست پایان‌یافته نوبت باز دارد.', path);
  integer(session.currentIndex, 0, turns.length || session.questionIds.length, path);
  if (session.graphDraft !== undefined) snapshot(session.graphDraft, `${path}.graphDraft`, 10);
}

/** Strict common boundary for local commits and future pre/post-merge imports. Returns a normalized copy. */
export function validateStoredEnvelope(value, curriculum, context = {}) {
  safeData(value);
  fields(value, ['schemaVersion', 'revision', 'curriculumVersion', 'teachingProgress', 'attempts', 'sessions', 'settings'], [], 'state');
  check(value.schemaVersion === 1, 'نسخهٔ ساختار ذخیره پشتیبانی نمی‌شود.', 'schemaVersion', 'unsupported-schema');
  check(value.curriculumVersion === curriculum.curriculumVersion && [1,2].includes(value.curriculumVersion),
    'نسخهٔ آموزش پشتیبانی نمی‌شود.', 'curriculumVersion', 'unsupported-curriculum');
  integer(value.revision, 0, Number.MAX_SAFE_INTEGER, 'revision');
  validateProgress(value.teachingProgress, curriculum);
  fields(value.settings, ['theme'], [], 'settings'); check(['day', 'night'].includes(value.settings.theme), 'تم معتبر نیست.', 'settings.theme');
  check(isObject(value.attempts) && isObject(value.sessions), 'رکوردها و نشست‌ها باید نگاشت باشند.', 'state');
  validateCapacity(value.attempts, value.sessions);
  const result = structuredClone(value);
  for (const [key, attempt] of Object.entries(result.attempts)) validateAttempt(attempt, key, context);
  const used = new Set();
  for (const [key, session] of Object.entries(result.sessions)) validateSession(session, key, result, context, used);
  for (const attempt of Object.values(result.attempts)) {
    if (attempt.sessionId !== undefined) {
      const session = result.sessions[attempt.sessionId];
      check(session && session.kind === attempt.tab && (!attempt.questionId || session.questionIds.includes(attempt.questionId)), 'ارجاع نشست نتیجه شکسته است.', `attempts.${attempt.id}`);
      if (session.kind === 'competition' || session.turns?.length || session.deadlineAt !== undefined) check(used.has(attempt.id), 'نتیجه به نوبت نهایی متصل نیست.', `attempts.${attempt.id}`);
      if (attempt.groupId !== undefined) check(session.groups?.some(group => group.id === attempt.groupId), 'گروه نتیجه در نشست نیست.', `attempts.${attempt.id}`);
    } else check(attempt.groupId === undefined && attempt.tab !== 'competition', 'مسابقه باید نشست و نوبت داشته باشد.', `attempts.${attempt.id}`);
  }
  return result;
}

/** Enforce immutability/spent turns across ordinary commits, independent of UI controllers. */
export function validateStateTransition(previous, next, { allowTeachingReset = false, removedCompetitionId = null } = {}) {
  if (removedCompetitionId !== null) {
    check(previous.sessions[removedCompetitionId]?.kind === 'competition' && !next.sessions[removedCompetitionId], 'حذف صریح باید به یک مسابقهٔ موجود محدود باشد.', 'sessions');
    check(!Object.values(next.attempts).some(a => a.sessionId === removedCompetitionId), 'نتایج وابسته به مسابقه باید همراه آن حذف شوند.', 'attempts');
  }
  if (!allowTeachingReset) check(previous.teachingProgress.completedActivityIds.every(id => next.teachingProgress.completedActivityIds.includes(id)), 'کاهش پیشرفت فقط با ریست صریح مجاز است.', 'teachingProgress');
  for (const [id, attempt] of Object.entries(previous.attempts)) {
    if (next.attempts[id]) check(same(attempt, next.attempts[id]), 'نتیجهٔ نهایی قابل ویرایش نیست.', `attempts.${id}`);
  }
  for (const [id, session] of Object.entries(previous.sessions)) {
    const later = next.sessions[id];
    if (id === removedCompetitionId) continue;
    // Only the scoped whole-competition action above may remove a session here.
    check(later, 'نشست دارای وضعیت مصرف‌شده نباید بی‌علامت حذف شود.', `sessions.${id}`);
    check(session.kind === later.kind && (session.status !== 'completed' || later.status === 'completed'), 'نشست پایان‌یافته قابل بازگشایی نیست.', `sessions.${id}`);
    for (const turn of session.turns ?? []) {
      const replacement = later.turns?.find(item => item.id === turn.id);
      check(replacement && turn.questionId === replacement.questionId && turn.groupId === replacement.groupId
        && replacement.consumedHintLevel >= turn.consumedHintLevel, 'هویت نوبت یا راهنمای مصرف‌شده قابل بازنشانی نیست.', `sessions.${id}.turns`);
      if (turn.resultStatus !== 'pending') check(replacement.resultStatus === turn.resultStatus
        || turn.resultStatus === 'finalized' && replacement.resultStatus === 'finalized-deleted', 'نوبت مصرف‌شده قابل تکرار نیست.', `sessions.${id}.turns`);
      if (turn.resultStatus === 'finalized' && replacement.resultStatus === 'finalized') check(replacement.finalizedAttemptId === turn.finalizedAttemptId, 'ارجاع نتیجهٔ نهایی قابل تعویض نیست.', `sessions.${id}.turns`);
    }
  }
}
