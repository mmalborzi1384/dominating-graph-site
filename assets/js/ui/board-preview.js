import { analyzeGraph, evaluateSelection } from '../domain/evaluate.js';
import { hintCap, scoreSelection } from '../domain/scoring.js';
import { createGraphBoard } from './graph-editor.js';

const fa = value => value.toLocaleString('fa-IR');
export async function initBoardPreview() {
  const panel = document.getElementById('panel-teach');
  const response = await fetch(new URL('../../../content/board-preview.json', import.meta.url));
  if (!response.ok) throw new Error('Board content unavailable');
  const model = await response.json();
  const analysis = analyzeGraph(model.graph);
  if (!['dominating', 'minimal', 'minimum'].includes(model.target)) throw new TypeError('Invalid target');
  const section = document.createElement('section');
  section.className = 'board-review'; section.setAttribute('aria-labelledby', 'board-heading');
  // Static markup only: every external model field is inserted with textContent.
  section.innerHTML = `
    <header class="board-heading-row"><div><span class="availability">نمونهٔ برد برای بازبینی</span>
      <h1 id="board-heading"></h1></div><span class="board-stage-note">انتخاب کنید، پوشش را ببینید.</span></header>
    <div class="question-card glass-surface"><p id="board-scenario"></p>
      <p class="model-key" id="board-model-key"></p></div>
    <div class="board-options">
      <label>خواستهٔ سؤال<select id="board-target"><option value="dominating">یک مجموعهٔ احاطه‌گر</option><option value="minimal">یک مجموعهٔ احاطه‌گر مینیمال</option><option value="minimum">یک مجموعهٔ احاطه‌گر مینیمم</option></select></label>
      <label>قاعدهٔ راهنما<select id="board-mode"><option value="practice">تمرین؛ راهنمای رایگان</option><option value="competition">مسابقه؛ راهنمای با سقف امتیاز</option></select></label>
    </div>
    <div class="board-workspace"><div class="board-panel glass-surface">
      <div class="board-status"><span id="coverage-summary" role="status" aria-live="polite"></span><span id="selection-summary"></span></div>
      <div id="graph-board"></div>
      <div class="board-legend"><span><i class="legend-mark selected-mark"></i>ایستگاه؛ رنگ ثابت</span><span><i class="legend-mark covered-mark"></i>هاشور رنگ ایستگاه</span><span><i class="legend-mark uncovered-mark"></i>بی‌پوشش</span></div>
    </div><aside class="board-feedback-panel">
      <div class="score-summary"><p>امتیاز پاسخ</p><p class="score-number" id="board-score">—</p><p id="score-rule"></p></div>
      <button type="button" class="primary-button" id="check-selection">بررسی انتخاب</button>
      <button type="button" class="secondary-button" id="clear-selection">پاک‌کردن انتخاب</button>
      <p id="board-feedback" role="status" aria-live="polite">مکان‌های دلخواه را روی نقشه یا از دکمه‌های زیر آن انتخاب کنید.</p>
      <button type="button" class="secondary-button" id="next-hint"></button>
      <ol id="board-hints" class="hint-list" aria-live="polite"></ol>
      <button type="button" class="text-button" id="show-solution" disabled>نمایش یک پاسخ مینیمم</button>
      <p id="board-solution" hidden></p>
    </aside></div>
    <details class="scoring-card glass-surface"><summary>فرق درستی پاسخ و امتیاز چیست؟</summary>
      <p>خواستهٔ سؤال تعیین می‌کند پاسخ درست است یا نه. امتیاز، کیفیت مجموعهٔ انتخاب‌شده را نشان می‌دهد:</p>
      <dl class="scoring-scale"><div><dt>نادرست؛ غیر احاطه‌گر</dt><dd>۰</dd></div><div><dt>احاطه‌گر غیرمینیمال</dt><dd>۵</dd></div><div><dt>مینیمالِ غیرمینیمم</dt><dd>۱۰</dd></div><div><dt>مینیمم</dt><dd>۱۵</dd></div></dl>
      <p>مینیمال یعنی حذف هیچ ایستگاهی ممکن نیست؛ مینیمم یعنی کمترین تعداد در میان همهٔ انتخاب‌ها. در تمرین، راهنما امتیاز را کم نمی‌کند. در مسابقه، سقف پس از راهنمای اول ۱۰، دوم ۵ و سوم صفر است.</p>
    </details>
    <p class="preview-note">این برد فقط نمونهٔ بازبینی است؛ پاسخ، راهنما و امتیاز آن ذخیره نمی‌شود و هنوز بخشی از مسیر APOS یا مسابقهٔ گروهی نیست.</p>`;
  const find = id => section.querySelector(`#${id}`);
  find('board-heading').textContent = model.title;
  find('board-scenario').textContent = model.scenario;
  find('board-model-key').textContent = `${model.vertexMeaning} ${model.edgeMeaning}`;
  const placeNames = ids => ids.map(id => model.places.find(place => place.id === id).label).join('، ');
  let selected = [], hintLevel = 0, lastEvaluation = null;
  const target = find('board-target'), mode = find('board-mode');
  target.value = model.target;
  const evaluate = () => evaluateSelection(model.graph, selected, target.value);
  const board = createGraphBoard(find('graph-board'), model, id => {
    selected = selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
    invalidate();
  });
  function update() {
    const result = evaluate();
    board.update(selected, { missed: lastEvaluation?.uncoveredVertexIds ?? [] });
    find('coverage-summary').textContent = `${fa(result.coveredVertexIds.length)} از ${fa(model.graph.n)} مکان تحت پوشش`;
    find('selection-summary').textContent = `${fa(selected.length)} ایستگاه انتخاب‌شده`;
    find('score-rule').textContent = mode.value === 'practice' ? 'راهنما رایگان است؛ سقف ۱۵ امتیاز'
      : `سقف فعلی: ${fa(hintCap(mode.value, hintLevel))} امتیاز`;
    const next = hintLevel + 1;
    find('next-hint').disabled = hintLevel === 3;
    find('next-hint').textContent = hintLevel === 3 ? 'راهنمای نهایی نمایش داده شد'
      : `راهنمای ${fa(next)} · ${mode.value === 'practice' ? 'رایگان' : `سقف ${fa(hintCap(mode.value, next))}`}`;
    find('show-solution').textContent = mode.value === 'competition'
      ? 'نمایش پاسخ مینیمم · سقف ۰' : 'نمایش یک پاسخ مینیمم · رایگان';
    if (lastEvaluation) {
      const score = scoreSelection(lastEvaluation, mode.value, hintLevel);
      find('board-score').textContent = fa(score.final);
      find('board-score').setAttribute('aria-label', `${fa(score.final)} امتیاز؛ پایه ${fa(score.base)}`);
    } else {
      find('board-score').textContent = '—';
      find('board-score').removeAttribute('aria-label');
    }
  }
  function invalidate() {
    lastEvaluation = null;
    find('board-feedback').textContent = 'انتخاب یا خواسته تغییر کرد؛ دوباره بررسی کنید.';
    find('board-feedback').removeAttribute('data-correct');
    find('board-solution').hidden = true;
    update();
  }
  find('check-selection').addEventListener('click', () => {
    lastEvaluation = evaluate();
    const e = lastEvaluation;
    const quality = e.minimum ? 'مینیمم' : e.minimal ? 'مینیمالِ غیرمینیمم' : 'احاطه‌گر غیرمینیمال';
    find('board-feedback').textContent = e.satisfiesTarget ? `پاسخ برای خواستهٔ سؤال درست است. مجموعهٔ شما ${quality} است.`
      : e.diagnostic === 'uncovered' ? `هنوز ${placeNames(e.uncoveredVertexIds)} بی‌پوشش است. ایستگاهی در خود مکان یا همسایهٔ مستقیمش انتخاب کنید.`
      : e.diagnostic === 'removable' ? `مجموعه احاطه‌گر است، اما مینیمال نیست؛ حذف تکیِ ${placeNames(e.removableVertexIds)} پوشش را حفظ می‌کند.`
      : 'مجموعه احاطه‌گر است، اما مینیمم نیست؛ می‌توان با تعداد ایستگاه‌های کمتری همهٔ محله را پوشش داد.';
    find('board-feedback').dataset.correct = String(e.satisfiesTarget);
    update();
  });
  find('clear-selection').addEventListener('click', () => { selected = []; invalidate(); });
  target.addEventListener('change', invalidate);
  mode.addEventListener('change', () => { update(); });
  find('next-hint').addEventListener('click', () => {
    if (hintLevel >= 3) return;
    hintLevel++;
    const e = evaluate(), item = document.createElement('li');
    if (hintLevel === 1) {
      item.textContent = !e.dominates ? `به پوشش ${placeNames(e.uncoveredVertexIds.slice(0, 1))} توجه کنید؛ خودش یا همسایه‌اش باید ایستگاه باشد.`
        : target.value === 'minimal' && !e.minimal ? `حذف ایستگاه ${placeNames(e.removableVertexIds.slice(0, 1))} را امتحان کنید؛ پوشش باقی می‌ماند.`
        : target.value === 'minimum' && !e.minimum ? 'همهٔ محله پوشش دارد؛ حالا امکان پوشش با ایستگاه‌های کمتر را بررسی کنید.'
        : 'پوشش برای خواستهٔ فعلی کامل است؛ برای مینیمال، حذف تک‌تک ایستگاه‌ها را بررسی کنید.';
    } else if (hintLevel === 2) {
      const vertex = analysis.minimumSets[0].find(id => !selected.includes(id)) ?? analysis.minimumSets[0][0];
      item.textContent = `${placeNames([vertex])} در یک انتخاب مینیمم قرار دارد. همسایه‌هایش را بررسی کنید.`;
    } else item.textContent = `کمترین تعداد ایستگاه برای پوشش این محله ${fa(analysis.gamma)} است.`;
    find('board-hints').append(item);
    find('show-solution').disabled = false;
    update();
  });
  find('show-solution').addEventListener('click', () => {
    find('board-solution').textContent = `یک پاسخ مینیمم: ${placeNames(analysis.minimumSets[0])}؛ ${fa(analysis.gamma)} ایستگاه. دیدن پاسخ، انتخاب شما را تغییر نمی‌دهد.`;
    find('board-solution').hidden = false;
    // A full solution consumes the revealing hint tier, so it cannot evade a match cap.
    if (hintLevel < 3) { hintLevel = 3; }
    update();
  });
  update();
  panel.querySelector('.panel-layout').hidden = true;
  panel.append(section);
}
