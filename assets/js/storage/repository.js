import { initialProgress, validateProgress } from '../domain/progress.js';
import { validateStoredEnvelope, validateStateTransition } from './validate.js';
import { decodeStoredState, migrateShellPreference } from './migrate.js';
import { requireValid } from '../domain/limits.js';
import { replaceCompetition } from '../domain/sessions.js';
import { removeLabResult } from '../domain/lab.js';

export const basePath = new URL('../../../', import.meta.url).pathname;
export const storageKey = `graph-learning:v1:${basePath}`;
const legacyKey = `graph-learning:shell:v1:${basePath}`;
const browserStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: key => window.localStorage.removeItem(key),
};
const errorInfo = error => ({ code: error.code ?? 'invalid-data', message: error.message, path: error.path ?? '' });

/** Atomic, versioned repository. Controllers supply a complete candidate + expected revision.
 * A failed write retains valid unsaved memory; a rejected candidate never changes memory. */
export function createRepository(curriculum, storage = browserStorage, context = {}) {
  const fresh = () => ({ schemaVersion: 1, revision: 0, curriculumVersion: curriculum.curriculumVersion,
    teachingProgress: initialProgress(), attempts: {}, sessions: {},
    settings: { theme: globalThis.document?.documentElement.dataset.theme === 'night' ? 'night' : 'day' } });
  let state = fresh(), baseline = null, legacyRaw = null;
  let readStatus = 'absent', dirty = false, conflict = false, warning = '', persisted = false;
  let lastResult = { status: 'absent' }, unsavedReset = false;
  const listeners = new Set(), editing = new Set();
  const blocked = () => ['corrupt', 'unsupported', 'unavailable'].includes(readStatus);
  const snapshot = () => ({ state: structuredClone(state), warning, dirty, conflict, persisted,
    readStatus, editing: editing.size > 0, lastResult: structuredClone(lastResult) });
  function notify() {
    // One consumer's rendering exception must not turn a successful write into a quota error.
    for (const listener of listeners) listener(snapshot());
  }
  function read() {
    try {
      const raw = storage.getItem(storageKey);
      baseline = raw;
      const decoded = decodeStoredState(raw, curriculum, context);
      readStatus = decoded.status;
      if (decoded.state) { state = decoded.state; persisted = true; }
      else if (decoded.status === 'absent') {
        const next = fresh();
        legacyRaw = storage.getItem(legacyKey);
        const settings = migrateShellPreference(legacyRaw);
        if (settings) next.settings = settings;
        state = next; persisted = false;
      } else {
        // Keep any in-memory work and the exact raw input for recovery; never overwrite it.
        persisted = false;
        warning = 'ذخیرهٔ قبلی خراب یا نسخهٔ آن ناسازگار است؛ بدون تغییر حفظ شد. کار فعلی موقت است؛ فایل بازیابی بگیرید.';
        lastResult = { status: decoded.status, error: decoded.error };
        return snapshot();
      }
      dirty = false; conflict = false; warning = ''; unsavedReset = false; editing.clear();
      lastResult = { status: readStatus };
    } catch (error) {
      // Parse errors in the legacy setting are corrupt data; storage access errors are unavailable.
      readStatus = error instanceof SyntaxError || error.code === 'invalid-data' ? 'corrupt' : 'unavailable';
      persisted = false;
      warning = 'ذخیرهٔ قبلی خوانده نشد؛ داده‌ها را تغییر نمی‌دهیم. کار فعلی موقت است؛ فایل بازیابی بگیرید.';
      lastResult = { status: readStatus, error: errorInfo(error) };
    }
    return snapshot();
  }
  function prepare(next, expectedRevision, allowTeachingReset = false, removedCompetitionId = null) {
    try {
      requireValid(expectedRevision === state.revision && next.revision === expectedRevision,
        'نسخهٔ خوانده‌شده قدیمی است؛ ابتدا وضعیت ذخیره را بازخوانی کنید.', 'revision', 'revision-conflict');
      const normalized = validateStoredEnvelope(next, curriculum, context);
      validateStateTransition(state, normalized, { allowTeachingReset, removedCompetitionId });
      requireValid(state.revision < Number.MAX_SAFE_INTEGER, 'شمار نسخه به حد مجاز رسیده است.', 'revision');
      const candidate = { ...normalized, revision: expectedRevision + 1 };
      // Serialize before touching either live state or persistent storage.
      return { ok: true, candidate, serialized: JSON.stringify(candidate) };
    } catch (error) { return { ok: false, status: error.code === 'revision-conflict' ? 'conflict' : 'invalid', error: errorInfo(error) }; }
  }
  function commit(next = state, expectedRevision = state.revision, { allowTeachingReset = false, removedCompetitionId = null } = {}) {
    const prepared = prepare(next, expectedRevision, allowTeachingReset, removedCompetitionId);
    if (!prepared.ok) {
      lastResult = { status: prepared.status, error: prepared.error };
      // A malformed proposal cannot poison valid current memory or its recovery download.
      warning = prepared.error.message; notify(); return false;
    }
    // Keep only validated memory on quota/denied/conflict; revision stays at the last successful write.
    state = { ...prepared.candidate, revision: expectedRevision };
    dirty = true; unsavedReset ||= allowTeachingReset;
    if (blocked() || conflict) {
      lastResult = { status: conflict ? 'conflict' : readStatus }; notify(); return false;
    }
    try {
      // Compare exact raw data as well as expected revision, catching deletions/same-revision edits.
      if (storage.getItem(storageKey) !== baseline) {
        conflict = true;
        warning = 'ذخیره در صفحهٔ دیگری تغییر کرده است. نوشتن متوقف شد؛ فایل بازیابی بگیرید یا با تأیید، ذخیره را بازخوانی کنید.';
        lastResult = { status: 'conflict' };
      } else {
        storage.setItem(storageKey, prepared.serialized);
        state = prepared.candidate; baseline = prepared.serialized;
        dirty = false; persisted = true; readStatus = 'ready'; warning = ''; unsavedReset = false;
        lastResult = { status: 'saved', revision: state.revision };
        if (legacyRaw !== null) {
          try { if (storage.getItem(legacyKey) === legacyRaw) storage.removeItem(legacyKey); } catch { /* New envelope is durable. */ }
          legacyRaw = null;
        }
      }
    } catch (error) {
      persisted = false;
      warning = 'تغییرات فعلی ذخیره نشدند؛ با بستن یا تازه‌سازی ممکن است از دست بروند. فضای مرورگر را بررسی کنید؛ دوباره ذخیره کنید یا فایل بازیابی بگیرید.';
      lastResult = { status: 'unsaved', error: { code: error.name === 'QuotaExceededError' ? 'quota' : 'storage-unavailable', message: warning } };
    }
    notify(); return !dirty && !conflict;
  }
  function storageChanged(event) {
    if (event.key !== storageKey && event.key !== null) return;
    if (event.storageArea && storage === browserStorage) {
      try { if (event.storageArea !== window.localStorage) return; } catch { /* Read handles unavailable storage. */ }
    }
    // Ignore delayed/no-op notifications already represented by our baseline.
    try { if (storage.getItem(storageKey) === baseline) return; } catch { /* Report through read/commit. */ }
    if (dirty || editing.size || blocked() || conflict) {
      conflict = true;
      warning = 'ذخیره در صفحهٔ دیگری تغییر کرده است؛ کار فعلی حفظ شد و نوشتن متوقف است. پیش از بازخوانی، فایل بازیابی بگیرید.';
      lastResult = { status: 'conflict' };
    } else read();
    notify();
  }
  read();
  if (readStatus === 'absent') commit(state, state.revision);
  globalThis.window?.addEventListener('storage', storageChanged);
  return {
    snapshot,
    subscribe(listener) { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener); },
    prepare(next, expectedRevision) {
      const result = prepare(next, expectedRevision);
      return result.ok ? { ok: true, nextState: { ...result.candidate, revision: expectedRevision }, expectedRevision } : result;
    },
    commit(next, expectedRevision) { return commit(next ?? null, expectedRevision ?? NaN); },
    changeProgress(transition) {
      const next = validateProgress(transition(structuredClone(state.teachingProgress)), curriculum);
      if (JSON.stringify(next) === JSON.stringify(state.teachingProgress)) return !dirty && !blocked() && !conflict;
      return commit({ ...state, teachingProgress: next }, state.revision);
    },
    resetTeaching() {
      return commit({ ...state, teachingProgress: initialProgress() }, state.revision, { allowTeachingReset: true });
    },
    manageCompetition(id, restart, expectedRevision) {
      requireValid(expectedRevision === state.revision && !dirty && !conflict && !blocked(), 'وضعیت ذخیره تغییر کرده است؛ عملیات را دوباره بررسی و تأیید کنید.', 'revision', 'revision-conflict');
      const next = replaceCompetition(state,id,restart,curriculum,context);
      return commit(next,expectedRevision,{removedCompetitionId:id});
    },
    deleteLabResult(id, expectedRevision) {
      requireValid(expectedRevision===state.revision && !dirty && !conflict && !blocked(), 'وضعیت ذخیره تغییر کرده است؛ حذف را دوباره بررسی و تأیید کنید.', 'revision', 'revision-conflict');
      return commit(removeLabResult(state,id,curriculum,context),expectedRevision);
    },
    setTheme(theme) { return commit({ ...state, settings: { theme } }, state.revision); },
    setEditingDirty(token, value) {
      requireValid(typeof token === 'string' && token.length > 0, 'شناسهٔ فرم معتبر نیست.');
      if (value) editing.add(token); else editing.delete(token);
    },
    retry() {
      if (readStatus === 'unavailable') {
        try {
          // A transient read failure can recover only if the original raw baseline still matches.
          if (storage.getItem(storageKey) === baseline) readStatus = baseline === null ? 'absent' : 'ready';
          else { conflict = true; warning = 'ذخیره تغییر کرده است؛ ابتدا فایل بازیابی بگیرید و ذخیره را بازخوانی کنید.'; }
        } catch { /* Remain unavailable, retaining unsaved memory. */ }
      }
      return commit(state, state.revision, { allowTeachingReset: unsavedReset });
    },
    reload({ discardUnsaved = false } = {}) {
      if ((dirty || editing.size || conflict) && !discardUnsaved) {
        return { ...snapshot(), lastResult: { status: 'confirmation-required' } };
      }
      const result = read(); notify(); return result;
    },
    recoveryJSON() {
      const valid = validateStoredEnvelope(state, curriculum, context);
      return JSON.stringify({ format: 'persian-graph-learning-backup', schemaVersion: 1,
        curriculumVersion: curriculum.curriculumVersion, bankVersion: context.bankVersion ?? '1.1', exportedAt: new Date().toISOString(),
        data: { teachingProgress: valid.teachingProgress, attempts: valid.attempts,
          sessions: valid.sessions, settings: valid.settings } }, null, 2);
    },
    originalJSON() { return baseline; },
    dispose() { globalThis.window?.removeEventListener?.('storage', storageChanged); listeners.clear(); editing.clear(); },
  };
}
