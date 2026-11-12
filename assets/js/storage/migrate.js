import { validateStoredEnvelope } from './validate.js';
import { initialProgress } from '../domain/progress.js';
import { ValidationError } from '../domain/limits.js';

/** Explicit version dispatch. No best-effort repair or invented future migration. */
export function decodeStoredState(raw, curriculum, context = {}) {
  if (raw === null) return { status: 'absent', state: null, raw };
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.hasOwn(value, 'schemaVersion')) {
      throw new ValidationError('ساختار ذخیره معتبر نیست.');
    }
    if (value.schemaVersion !== 1) throw new ValidationError('نسخهٔ ذخیره پشتیبانی نمی‌شود؛ دادهٔ قبلی حفظ شد.', 'schemaVersion', 'unsupported-schema');
    if(value.curriculumVersion===1 && curriculum.curriculumVersion===2){
      return {status:'migration-required',state:migrateCurriculum(value,curriculum,context),raw};
    }
    if (![1,2].includes(value.curriculumVersion) || value.curriculumVersion !== curriculum.curriculumVersion) {
      throw new ValidationError('نسخهٔ آموزش ناسازگار است؛ مهاجرت تأییدشده‌ای وجود ندارد.', 'curriculumVersion', 'unsupported-curriculum');
    }
    return { status: 'ready', state: validateStoredEnvelope(value, curriculum, context), raw };
  } catch (error) {
    return { status: error.code?.startsWith('unsupported-') ? 'unsupported' : 'corrupt', state: null, raw,
      error: { code: error.code ?? 'invalid-json', message: error.message, path: error.path ?? '' } };
  }
}
export function migrateShellPreference(raw) {
  if (raw === null) return null;
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || Object.keys(value).length !== 2
      || !['day', 'night'].includes(value.theme)) throw new ValidationError('تنظیم قدیمی تم معتبر نیست.');
  return { theme: value.theme };
}

/** Authorized APOS redesign: validate old content first, reset ONLY old teaching progress. */
export function migrateCurriculum(value, curriculum, context) {
  if(value.curriculumVersion===curriculum.curriculumVersion)return validateStoredEnvelope(value,curriculum,context);
  if(value.curriculumVersion!==1||curriculum.curriculumVersion!==2||context.legacyCurriculum?.curriculumVersion!==1)throw new ValidationError('مسیر مهاجرت آموزش پشتیبانی نمی‌شود.');
  const previous=validateStoredEnvelope(value,context.legacyCurriculum,context);
  return validateStoredEnvelope({...previous,curriculumVersion:2,teachingProgress:initialProgress()},curriculum,context);
}
