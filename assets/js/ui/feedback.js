import { renderTextMath } from './math.js';

/** Shared inline announcements, never alert/confirm/prompt/innerHTML. */
export function setFeedback(host, text, { tone = 'info', math = false } = {}) {
  if (!['info', 'success', 'error', 'hint'].includes(tone)) throw new TypeError('نوع بازخورد معتبر نیست.');
  host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); host.setAttribute('aria-atomic', 'true');
  host.classList.add('inline-feedback'); host.dataset.tone = tone; host.hidden = !text;
  if (tone === 'success' || tone === 'error') host.dataset.correct = String(tone === 'success');
  else host.removeAttribute('data-correct');
  host.classList.remove('feedback-pulse');
  if (text && ['success','error'].includes(tone)) { void host.offsetWidth; host.classList.add('feedback-pulse'); }
  if (math) return renderTextMath(host, text);
  host.textContent = text;
  return { ok: true, errors: [] };
}

/** A confirmation lives in ordinary document flow, with explicit confirm/cancel and focus return. */
export function createInlineConfirmation({ message, confirmLabel = 'تأیید', cancelLabel = 'انصراف',
  onConfirm, onCancel = () => {}, id, confirmId, cancelId }) {
  const root = document.createElement('div'); root.className = 'inline-confirm glass-surface'; root.hidden = true;
  if (id) root.id = id;
  const copy = document.createElement('p'); copy.textContent = message;
  const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'secondary-button'; confirm.textContent = confirmLabel;
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'text-button'; cancel.textContent = cancelLabel;
  if (confirmId) confirm.id = confirmId;
  if (cancelId) cancel.id = cancelId;
  const error = document.createElement('p'); error.hidden = true;
  let trigger = null, busy = false;
  function close({ returnFocus = true } = {}) { root.hidden = true; if (returnFocus && trigger?.isConnected) trigger.focus(); }
  async function accept() {
    if (busy || root.hidden) return;
    busy = true; confirm.disabled = true; cancel.disabled = true;
    try {
      const result = await onConfirm();
      if (result !== false) close({ returnFocus: false });
    } catch {
      setFeedback(error, 'این کار انجام نشد؛ دوباره تلاش کنید.', { tone: 'error' });
    } finally { busy = false; confirm.disabled = false; cancel.disabled = false; }
  }
  function decline() { if (busy) return; close(); onCancel(); }
  confirm.addEventListener('click', accept); cancel.addEventListener('click', decline);
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); decline(); } });
  root.append(copy, confirm, cancel, error);
  return { element: root, confirmButton: confirm, cancelButton: cancel,
    open(source = document.activeElement) { trigger = source; error.hidden = true; root.hidden = false; confirm.focus(); }, close };
}

/** Diagnose exactly the requested target; minimum is not imposed on simpler requests. */
export function selectionFeedback(evaluation, target, names) {
  if (!['dominating', 'minimal', 'minimum'].includes(target)) throw new TypeError('خواسته معتبر نیست.');
  if (evaluation.satisfiesTarget) return {
    tone: 'success', message: 'درست است؛ انتخابت خواستهٔ این سؤال را برآورده می‌کند. قبولی این فعالیت حفظ می‌شود.',
    hint: target === 'dominating' ? 'برای این خواسته، پوشش تمام رأس‌ها کافی است؛ کمترین تعداد شرط سؤال نیست.'
      : target === 'minimal' ? 'حذف هر انتخاب را جداگانه امتحان کن؛ حذف‌ناپذیری شرط مینیمال بودن است.'
        : 'هر مجموعهٔ احاطه‌گر با کمترین تعداد، پذیرفته است؛ لازم نیست با یک جواب نمونه یکسان باشد.',
  };
  if (!evaluation.dominates) return { tone: 'error',
    message: `پوشش کامل نیست: ${names(evaluation.uncoveredVertexIds)} بی‌پوشش است.`,
    hint: `به ${names(evaluation.uncoveredVertexIds.slice(0, 1))} توجه کن؛ خودش یا یک همسایهٔ مستقیمش را انتخاب کن تا پوشش بگیرد.` };
  if (target === 'minimal') return { tone: 'error',
    message: `احاطه‌گر است، ولی مینیمال نیست؛ ${names(evaluation.removableVertexIds)} قابل حذف است.`,
    hint: `حذف ${names(evaluation.removableVertexIds.slice(0, 1))} را امتحان کن؛ پوشش باقی می‌ماند. سپس دوباره بررسی کن.` };
  return { tone: 'error', message: 'احاطه‌گر است، ولی مینیمم نیست؛ انتخاب کوچک‌تری وجود دارد.',
    hint: 'پوشش کامل است، ولی مجموعه‌ای با تعداد کمتر وجود دارد. به‌جای حذف صرف، جابه‌جایی ایستگاه‌ها را هم امتحان کن.' };
}
