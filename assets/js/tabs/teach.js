import { completeActivity, progressPercent, unlockedStages, visitStage } from '../domain/progress.js';
import { analyzeGraph, evaluateSelection } from '../domain/evaluate.js';
import { createGraphBoard } from '../ui/graph-editor.js';
import { renderTextMath } from '../ui/math.js';
import { createInlineConfirmation, setFeedback, selectionFeedback } from '../ui/feedback.js';

const fa = number => number.toLocaleString('fa-IR');
const targets = { dominating: 'یک مجموعهٔ احاطه‌گر', minimal: 'یک مجموعهٔ احاطه‌گر مینیمال', minimum: 'یک مجموعهٔ احاطه‌گر مینیمم' };
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(label, className, action) {
  const node = element('button', className, label); node.type = 'button';
  node.addEventListener('click', action); return node;
}
function download(text, name) {
  if (text === null) return;
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = element('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function initTeaching({ curriculum, models }, repository) {
  const panel = document.getElementById('panel-teach');
  const root = element('div', 'teaching');
  const header = element('header', 'teaching-heading');
  const intro = element('div');
  intro.append(element('span', 'availability', 'آموزش · چهار مرحلهٔ APOS'),
    element('h1', '', curriculum.title),
    element('p', 'model-key', 'خودارزیابی بدون نمره؛ فقط تکمیل فعالیت‌ها و مسیر ادامه ذخیره می‌شود.'));
  const progressBox = element('div', 'teaching-progress glass-surface');
  const percent = element('strong', 'progress-percent'); percent.id = 'teaching-percent';
  const meter = element('progress'); meter.max = 100; meter.setAttribute('aria-label', 'پیشرفت کل آموزش');
  const saved = element('p', 'save-state'); saved.id = 'teaching-save-state';
  progressBox.append(percent, meter, saved); header.append(intro, progressBox);
  const nav = element('nav', 'stage-navigation'); nav.setAttribute('aria-label', 'مراحل آموزش APOS');
  const stageButtons = new Map();
  for (const stage of curriculum.stages) {
    const item = element('div', 'stage-item');
    const go = button('', 'stage-button', () => navigate(stage.id));
    go.dataset.stageId = stage.id;
    const label = element('strong', '', `${fa(stage.order + 1)}. ${stage.title}`);
    const state = element('span', 'stage-state');
    go.append(label, state); item.append(go); nav.append(item);
    stageButtons.set(stage.id, { go, state });
  }
  const stageHost = element('section', 'teaching-stage'); stageHost.id = 'teaching-stage';
  const stageNotice = element('p', 'stage-notice'); stageNotice.setAttribute('role', 'status');
  stageNotice.hidden = true;
  const controls = element('div', 'stage-controls');
  const previous = button('مرحلهٔ قبل', 'secondary-button', () => step(-1)); previous.id = 'previous-stage';
  const next = button('مرحلهٔ بعد', 'primary-button', () => step(1)); next.id = 'next-stage';
  controls.append(previous, next);
  const privacy = element('p', 'teaching-privacy', 'انتخاب رأس‌ها، پاسخ‌ها، راهنماها و امتیاز آموزشی ذخیره نمی‌شوند. مراحل پاس‌شده تا «شروع از اول» باز می‌مانند.');
  const reset = element('section', 'reset-section');
  const resetOpen = button('شروع از اول', 'text-button', () => resetDialog.open(resetOpen));
  resetOpen.id = 'reset-teaching';
  const resetDialog = createInlineConfirmation({
    message: 'فقط پیشرفت آموزش صفر شود؟ مراحل دوباره از کنش آغاز می‌شوند. داده‌ها و تنظیمات بخش‌های دیگر حفظ می‌شوند.',
    confirmLabel: 'بله، پیشرفت آموزش صفر شود', id: 'reset-confirm',
    confirmId: 'confirm-reset-teaching', cancelId: 'cancel-reset-teaching',
    onConfirm() {
      currentStageId = null;
      repository.resetTeaching();
      sync(repository.snapshot()); stageHost.querySelector('h2')?.focus();
    },
  });
  reset.append(resetOpen, resetDialog.element);
  const recovery = element('section', 'teaching-recovery glass-surface'); recovery.hidden = true;
  recovery.append(element('h2', '', 'ذخیرهٔ پیشرفت نیاز به بررسی دارد'),
    element('p', 'model-key', 'کار فعلی در همین صفحه ادامه دارد. پیش از بازخوانی یا تازه‌سازی، فایل بازیابی را نگه دارید؛ ورود فایل در این فاز فعال نیست.'));
  const retry = button('تلاش دوباره برای ذخیره', 'secondary-button', () => repository.retry());
  const exportMemory = button('دریافت فایل بازیابیِ وضعیت فعلی', 'secondary-button', () => download(repository.recoveryJSON(), 'graph-learning-recovery.json'));
  const exportOriginal = button('دریافت دادهٔ قبلی بدون تغییر', 'secondary-button', () => download(repository.originalJSON(), 'graph-learning-original.json'));
  const reloadOpen = button('بازخوانی وضعیت ذخیره‌شده', 'text-button', () => reloadDialog.open(reloadOpen));
  const reloadDialog = createInlineConfirmation({
    message: 'تغییرات ذخیره‌نشدهٔ این صفحه کنار گذاشته و ذخیرهٔ مرورگر دوباره خوانده شود؟',
    confirmLabel: 'بله، بازخوانی شود',
    onConfirm() { currentStageId = null; repository.reload({ discardUnsaved: true }); },
  });
  recovery.append(retry, exportMemory, exportOriginal, reloadOpen, reloadDialog.element);
  root.append(header, nav, stageNotice, stageHost, controls, privacy, reset, recovery);
  panel.replaceChildren(root);
  let currentStageId = null, boardCleanups = [], activityStatuses = new Map();
  function navigate(id) {
    const progress = repository.snapshot().state.teachingProgress;
    if (!unlockedStages(progress).includes(id)) { showLocked(); return; }
    repository.changeProgress(value => visitStage(value, id, curriculum));
    if (location.hash !== '#teach') location.hash = '#teach';
    stageHost.querySelector('h2')?.focus();
  }
  function step(offset) {
    const index = curriculum.stages.findIndex(stage => stage.id === currentStageId);
    const stage = curriculum.stages[index + offset];
    if (stage) navigate(stage.id);
  }
  function showLocked() {
    stageNotice.textContent = 'این مرحله قفل است؛ ابتدا همهٔ خودارزیابی‌های الزامی مرحلهٔ قبل را درست بررسی کن.';
    stageNotice.hidden = false;
  }
  function stageLink() {
    const match = /^#teach\/([^/]+)$/.exec(location.hash);
    if (!match) return;
    let id;
    try { id = decodeURIComponent(match[1]); } catch { id = ''; }
    const progress = repository.snapshot().state.teachingProgress;
    if (unlockedStages(progress).includes(id)) navigate(id); else showLocked();
    history.replaceState(null, '', '#teach');
  }
  function sync(snapshot) {
    const progress = snapshot.state.teachingProgress, unlocked = unlockedStages(progress);
    percent.textContent = `${fa(progressPercent(progress))}٪`;
    meter.value = progressPercent(progress);
    saved.textContent = snapshot.warning || snapshot.dirty ? 'پیشرفت فعلی ذخیره نشده است'
      : snapshot.persisted ? 'پیشرفت در این مرورگر ذخیره است' : 'هنوز پیشرفتی در این مرورگر ذخیره نشده است';
    saved.dataset.unsaved = String(Boolean(snapshot.warning || snapshot.dirty || !snapshot.persisted));
    recovery.hidden = !snapshot.warning;
    retry.disabled = snapshot.conflict;
    exportOriginal.hidden = repository.originalJSON() === null;
    for (const stage of curriculum.stages) {
      const { go, state } = stageButtons.get(stage.id);
      go.disabled = !unlocked.includes(stage.id);
      go.setAttribute('aria-current', stage.id === progress.lastVisitedStageId ? 'step' : 'false');
      const passed = progress.passedStageIds.includes(stage.id);
      state.textContent = passed ? '✓ پاس‌شده · ۲۵٪' : unlocked.includes(stage.id) ? 'باز · خودارزیابی‌های مرحله را کامل کن'
        : `قفل · پس از ${curriculum.stages[stage.order - 1].title}`;
    }
    if (currentStageId !== progress.lastVisitedStageId) renderStage(progress.lastVisitedStageId);
    for (const [id, badge] of activityStatuses) {
      badge.textContent = progress.completedActivityIds.includes(id) ? '✓ تکمیل‌شده؛ قبولی محفوظ است' : 'الزامی · هنوز تکمیل نشده';
    }
    const index = curriculum.stages.findIndex(stage => stage.id === currentStageId);
    previous.disabled = index === 0;
    next.disabled = index === 3 || !unlocked.includes(curriculum.stages[index + 1]?.id);
    next.textContent = index === 3 ? progressPercent(progress) === 100 ? 'آموزش کامل شد · ۱۰۰٪' : 'پایان مسیر؛ خودارزیابی‌ها را کامل کن'
      : next.disabled ? 'مرحلهٔ بعد؛ پس از قبولی همهٔ فعالیت‌ها' : 'ادامه به مرحلهٔ بعد';
  }
  function renderStage(id) {
    boardCleanups.forEach(destroy => destroy()); boardCleanups = []; activityStatuses = new Map();
    currentStageId = id; stageNotice.hidden = true;
    const stage = curriculum.stages.find(item => item.id === id);
    const heading = element('h2', '', stage.title); heading.tabIndex = -1; heading.id = 'stage-heading';
    stageHost.setAttribute('aria-labelledby', heading.id);
    stageHost.replaceChildren(heading, element('p', 'stage-goal', stage.goal));
    const blocks = element('div', 'lesson-blocks');
    for (const block of stage.blocks) {
      const card = element('article', 'lesson-block glass-surface');
      const body = element('p'); renderTextMath(body, block.body);
      card.append(element('span', 'lesson-source', block.lesson), element('h3', '', block.title), body);
      blocks.append(card);
    }
    stageHost.append(blocks, element('p', 'required-note', `برای عبور، هر ${fa(stage.requiredActivityIds.length)} فعالیت زیر را درست بررسی کن. راهنما رایگان است.`));
    for (const activityId of stage.requiredActivityIds) stageHost.append(activityCard(models.get(activityId)));
  }
  function activityCard(model) {
    const { activity, question } = model, analysis = analyzeGraph(model.graph);
    const card = element('article', 'teaching-activity'); card.dataset.activityId = activity.id;
    const questionCard = element('div', 'question-card glass-surface');
    const heading = element('h3'); renderTextMath(heading, `${question.id} · ${activity.title}`);
    const badge = element('p', 'activity-completion'); activityStatuses.set(activity.id, badge);
    const prompt = element('p', 'activity-prompt'); renderTextMath(prompt, activity.prompt);
    questionCard.append(heading, badge, element('p', 'activity-context', model.scenario),
      element('p', 'model-key', `${model.vertexMeaning} ${model.edgeMeaning}`),
      element('p', 'activity-target', `خواسته: ${targets[activity.target]}`), prompt);
    const source = element('details', 'activity-source');
    const original = element('p'); renderTextMath(original, `${question.title_fa} — ${question.question_fa}`);
    source.append(element('summary', '', 'متن اصلی بانک و توضیح فعالیت'), original,
      element('p', 'model-key', model.adaptationReason)); questionCard.append(source);
    const workspace = element('div', 'board-workspace');
    const boardPanel = element('div', 'board-panel glass-surface');
    const summary = element('p', 'board-status'); summary.setAttribute('role', 'status');
    const boardHost = element('div'); boardPanel.append(summary, boardHost,
      element('p', 'board-legend', 'یکدست: انتخاب شما · هاشور: پوشش همسایه · خالی: بی‌پوشش · دور قرمز: جاافتاده پس از بررسی'));
    const feedbackPanel = element('div', 'board-feedback-panel');
    const feedback = element('p', 'teaching-feedback'); feedback.setAttribute('role', 'status');
    feedback.textContent = 'رأس‌ها را روی مدل یا با دکمه‌های زیر آن انتخاب کن، سپس بررسی کن.';
    const hintList = element('ol', 'hint-list'); hintList.setAttribute('aria-live', 'polite');
    const contextualHint = element('p', 'contextual-hint'); contextualHint.hidden = true;
    const solution = element('p', 'teaching-solution'); solution.hidden = true;
    let selected = [], checked = null, hintLevel = 0;
    const names = ids => ids.map(id => model.places.find(place => place.id === id).label).join('، ');
    const evaluate = () => evaluateSelection(model.graph, selected, activity.target);
    const board = createGraphBoard(boardHost, model, id => {
      selected = selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
      invalidate();
    }); boardCleanups.push(() => {
      board.destroy(); repository.setEditingDirty(`teaching:${activity.id}`, false);
    });
    function updateBoard() {
      repository.setEditingDirty(`teaching:${activity.id}`, selected.length > 0 || hintLevel > 0);
      const evaluation = evaluate(); board.update(selected, { missed: checked?.uncoveredVertexIds ?? [] });
      summary.textContent = `${fa(evaluation.coveredVertexIds.length)} از ${fa(model.graph.n)} رأس پوشش دارد؛ ${fa(selected.length)} رأس انتخاب‌شده`;
      hintButton.disabled = hintLevel === 3;
      hintButton.textContent = hintLevel === 3 ? 'هر سه راهنما نمایش داده شد' : `راهنمای ${fa(hintLevel + 1)} · رایگان`;
      reveal.disabled = hintLevel === 0;
    }
    function invalidate() {
      checked = null;
      setFeedback(feedback, 'انتخاب تغییر کرد؛ برای خودارزیابی دوباره بررسی کن.');
      contextualHint.hidden = true; solution.hidden = true; updateBoard();
    }
    const firstHint = evaluation => selectionFeedback(evaluation, activity.target, names).hint;
    function addHint() {
      if (hintLevel >= 3) return;
      hintLevel++;
      const item = element('li');
      const text = hintLevel === 1 ? firstHint(evaluate()) : hintLevel === 2 ? model.hints[1]
        : activity.target === 'minimum' ? `کمترین تعداد برای این مدل ${fa(analysis.gamma)} است. ${model.hints[2]}`
          : model.hints[2];
      renderTextMath(item, text); hintList.append(item); updateBoard();
    }
    const check = button('بررسی انتخاب', 'primary-button', () => {
      checked = evaluate();
      const result = selectionFeedback(checked, activity.target, names);
      setFeedback(feedback, result.message, { tone: result.tone });
      if (checked.satisfiesTarget) {
        contextualHint.hidden = true;
        repository.changeProgress(progress => completeActivity(progress, activity.id, curriculum));
      } else {
        if (hintLevel === 0) addHint();
        setFeedback(contextualHint, `راهنمای متناسب با انتخاب فعلی: ${result.hint}`, { tone: 'hint' });
      }
      updateBoard();
    }); check.dataset.action = 'check';
    const clear = button('پاک‌کردن انتخاب', 'secondary-button', () => { selected = []; invalidate(); }); clear.dataset.action = 'clear';
    const hintButton = button('', 'secondary-button', addHint); hintButton.dataset.action = 'hint';
    const reveal = button('دیدن یک پاسخ نمونه؛ پس از راهنما', 'text-button', () => {
      if (!hintLevel) return;
      const sample = analysis.minimumSets[0];
      solution.textContent = `یک پاسخ برای این خواسته: ${names(sample)}. این انتخاب احاطه‌گر، مینیمال و مینیمم است (${fa(sample.length)} رأس). دیدن پاسخ قبولی نیست؛ خودت انتخاب و بررسی کن.`;
      solution.hidden = false;
    }); reveal.dataset.action = 'reveal';
    // Hint and reveal follow feedback in reading order, directly below this question.
    feedbackPanel.append(check, clear, feedback, contextualHint, hintButton, hintList, reveal, solution);
    workspace.append(boardPanel, feedbackPanel); card.append(questionCard, workspace); updateBoard();
    return card;
  }
  repository.subscribe(sync);
  window.addEventListener('hashchange', stageLink);
  stageLink();
}
