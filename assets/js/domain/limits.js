/** Shared by local writes and future import validation; never truncate or evict. */
export const LIMITS = Object.freeze({ groupName: 30, label: 50, textResponse: 1000,
  attempts: 200, sessions: 100, importBytes: 5 * 1024 * 1024 });
export class ValidationError extends TypeError {
  constructor(message, path = '', code = 'invalid-data') {
    super(path ? `${message} (${path})` : message);
    this.name = 'ValidationError'; this.path = path; this.code = code;
  }
}
export function requireValid(condition, message, path = '', code = 'invalid-data') {
  if (!condition) throw new ValidationError(message, path, code);
}
export function normalizeUserText(value, kind, path = kind) {
  requireValid(typeof value === 'string' && ['groupName', 'label', 'textResponse'].includes(kind), 'متن معتبر نیست.', path);
  let normalized = value.normalize('NFC');
  if (kind !== 'textResponse') normalized = normalized.trim();
  requireValid((kind === 'textResponse' || normalized.length > 0)
    && [...normalized].length <= LIMITS[kind], `حد مجاز این متن ${LIMITS[kind]} حرف است.`, path, 'text-limit');
  // Saved/imported content is data, not HTML/URL/TeX configuration.
  requireValid(!/<\/?[a-z!][^>]*>/i.test(normalized) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(normalized),
    'کد اجرایی یا نویسهٔ کنترلی در متن مجاز نیست.', path);
  return normalized;
}
export function validateCapacity(attempts, sessions) {
  requireValid(Object.keys(attempts).length <= LIMITS.attempts,
    'حداکثر ۲۰۰ نتیجه قابل نگهداری است؛ ابتدا خروجی بگیرید یا اطلاعات منتخب را حذف کنید.', 'attempts', 'capacity');
  requireValid(Object.keys(sessions).length <= LIMITS.sessions,
    'حداکثر ۱۰۰ نشست قابل نگهداری است؛ ابتدا خروجی بگیرید یا اطلاعات منتخب را حذف کنید.', 'sessions', 'capacity');
}
