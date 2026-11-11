import { practiceCatalog, filterPractice } from '../data/practice.js';
import { createAttempt, appendAttempt } from '../domain/attempts.js';
import { createGraphBoard } from '../ui/graph-editor.js';
import { renderTextMath } from '../ui/math.js';
import { setFeedback, selectionFeedback } from '../ui/feedback.js';
import { analyzeGraph } from '../domain/evaluate.js';

const el = (tag, text = '', className = '') => { const n = document.createElement(tag); n.textContent = text; n.className = className; return n; };
const fa = n => n.toLocaleString('fa-IR');
export async function initPractice(questions, curriculum, repository) {
  const response = await fetch(new URL('../../../content/practice.json', import.meta.url));
  if (!response.ok) throw new Error('محتوای تمرین بارگیری نشد.');
  const catalog = practiceCatalog(questions, await response.json());
  const root = document.getElementById('panel-practice'); root.replaceChildren();
  root.append(el('h1','تمرین؛ راه‌های بیشتر برای مدل‌سازی'), el('p','مستقل از آموزش · راهنمای رایگان · نتیجه فقط با ثبت نهایی ذخیره می‌شود.','model-key'));
  const filters = el('div','','practice-filters');
  function select(label, options, id) {
    const wrapper = el('label',label), control = el('select'); control.id = id;
    for (const [value, title] of options) { const option = el('option',title); option.value = value; control.append(option); }
    wrapper.append(control); filters.append(wrapper); return control;
  }
  const lesson = select('درس',[['','هر دو درس'],['lesson1','درس ۱'],['lesson2','درس ۲']],'practice-lesson');
  const category = select('موضوع',[['','همهٔ موضوع‌ها'],...Object.entries({A_foundations:'مبانی',B_domination:'احاطه‌گری',C_minimal_minimum:'مینیمال و مینیمم',D_formulas_bounds:'فرمول‌ها و کران‌ها',E_modeling:'مدل‌سازی',F_lab:'کاوش'})],'practice-category');
  const difficulty = select('دشواری',[['easy','آسان'],['hard','سخت']],'practice-difficulty');
  const picker = select('سؤال',[],'practice-question');
  const availability = el('p','','model-key'), host = el('section','','practice-activity');
  root.append(filters,availability,host);
  let destroy = () => {};
  function refresh() {
    destroy(); repository.setEditingDirty('practice',false);
    const list = filterPractice(catalog,{lesson:lesson.value, category:category.value, difficulty:difficulty.value});
    picker.replaceChildren();
    for (const item of list) {
      const option = el('option',`${item.question.id} · ${item.unavailable ? 'نیازمند تکمیل محتوا' : item.title}`);
      option.value = item.question.id; option.disabled = Boolean(item.unavailable); picker.append(option);
    }
    const ready = list.filter(item => !item.unavailable);
    availability.textContent = `${fa(ready.length)} سؤال آماده؛ ${fa(list.length-ready.length)} سؤال نیازمند تکمیل محتوا پیش از انتشار.`;
    picker.disabled = !ready.length;
    if (ready.length) { picker.value = ready[0].question.id; render(ready[0]); }
    else host.replaceChildren(el('p','برای این ترکیب سؤال آماده نداریم. درس، موضوع یا دشواری دیگری انتخاب کنید.','notice'));
  }
  for (const control of [lesson,category,difficulty]) control.addEventListener('change',refresh);
  picker.addEventListener('change',()=> { destroy(); repository.setEditingDirty('practice',false); render(catalog.find(item=>item.question.id===picker.value)); });
  function render(item) {
    if (!item || item.unavailable) return;
    const q = item.question;
    let selected = [], hintLevel = 0, finalized = null, board, unsubscribe;
    let graph = item.mode === 'graph-construction' ? {n:item.target.n,vertices:Array.from({length:item.target.n},(_,i)=>String.fromCharCode(97+i)),edges:[]} : q.graph;
    const card = el('article','','question-card glass-surface');
    const title=el('h2');renderTextMath(title,`${q.id} · ${item.title}`);
    card.append(title,el('p',`${q.lesson==='lesson1'?'درس ۱':'درس ۲'} · سطح ${fa(q.difficulty)} · ${q.apos_stage}`,'model-key'));
    for (const text of [item.model.scenario,item.model.vertexMeaning,item.model.edgeMeaning,item.prompt]) {const p=el('p');renderTextMath(p,text);card.append(p);}
    const original=el('details'),originalText=el('p');renderTextMath(originalText,q.question_fa);original.append(el('summary','متن اصلی بانک'),originalText);card.append(original);
    const work=el('div','','board-panel glass-surface'),actions=el('div','','practice-actions'),feedback=el('p'),hintList=el('ol','','hint-list');
    const answer=el('input');answer.type='number';answer.min='0';answer.max='12';answer.step='1';answer.id='practice-number';
    const text=el('textarea');text.rows=5;text.id='practice-text';
    const rubric=el('div','','question-card');rubric.hidden=true;
    const rubricBody=el('p');renderTextMath(rubricBody,item.rubric??q.answer_fa);
    const self=el('select');self.id='practice-self-assessment';
    for(const [value,label] of [['','انتخاب کن'],['yes','با معیار کامل هم‌خوان است'],['no','نیاز به اصلاح دارد']]) {const o=el('option',label);o.value=value;self.append(o);}
    rubric.append(el('p','خودارزیابی؛ پاسخ تشریحی به‌صورت ماشینی تصحیح نمی‌شود.'),rubricBody,self);
    function changed() { if(finalized)return;setFeedback(feedback,'پاسخ تغییر کرد؛ دوباره بررسی کن.');repository.setEditingDirty('practice',true); }
    function draw() {
      board?.destroy();
      const places = item.mode==='graph-construction' ? graph.vertices.map((id,i)=>({id,label:`مرکز ${fa(i+1)}`,x:300+210*Math.cos(i*2*Math.PI/graph.n),y:160+100*Math.sin(i*2*Math.PI/graph.n)})) : item.model.places;
      board=createGraphBoard(boardHost,{...item.model,graph,places,boardLabel:'مدل سؤال تمرین؛ انتخاب رأس‌ها'},id=>{if(finalized)return;selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];board.update(selected);changed();});
      board.update(selected);
    }
    const boardHost=el('div');
    if (['vertex-selection','integer','graph-construction'].includes(item.mode)) {work.append(boardHost);draw();}
    if(item.mode==='integer') {const label=el('label','عدد احاطه‌گری: ');label.append(answer);work.append(label);answer.addEventListener('input',changed);}
    if(item.mode==='self-assessed-text') {
      const label=el('label','پاسخ تو (حداکثر ۱۰۰۰ حرف): ');label.append(text);work.append(label);
      const show=button('نمایش معیار و خودارزیابی',()=>{rubric.hidden=false;});work.append(show,rubric);text.addEventListener('input',changed);self.addEventListener('change',changed);
    }
    if(item.mode==='graph-construction') {
      const edges=el('div','','edge-choices');edges.setAttribute('aria-label','ساخت مسیر مستقیم بین مراکز');
      for(let i=0;i<graph.n;i++)for(let j=i+1;j<graph.n;j++) {
        const a=graph.vertices[i],b=graph.vertices[j];
        const toggle=button(`مرکز ${fa(i+1)} ↔ ${fa(j+1)}`,()=>{
          const found=graph.edges.findIndex(e=>e[0]===a&&e[1]===b);
          if(found<0)graph.edges.push([a,b]);else graph.edges.splice(found,1);
          toggle.setAttribute('aria-pressed',String(found<0));draw();changed();
        });toggle.dataset.edge=`${a}-${b}`;toggle.setAttribute('aria-pressed','false');edges.append(toggle);
      }
      work.append(el('p','با دکمه‌ها مسیر بساز یا حذف کن. انتخاب رأس فقط برای تجربهٔ پوشش است؛ ساختار یال‌ها داوری می‌شود.'),edges);
    }
    function button(label,action) {const b=el('button',label,'secondary-button');b.type='button';b.addEventListener('click',()=>{if(!b.disabled)action();});return b;}
    function candidate() {
      if(item.mode==='integer' && answer.value.trim()==='')throw new Error('عدد پاسخ را وارد کن.');
      if(item.mode==='self-assessed-text' && !self.value)throw new Error('پاسخ را با معیار مقایسه و ارزیابی خود را انتخاب کن.');
      const graphSnapshot=item.mode==='graph-construction'?{graph,modeling:{scenario_fa:item.model.scenario,vertex_means_fa:item.model.vertexMeaning,edge_means_fa:item.model.edgeMeaning,question_in_model_fa:item.prompt}}:undefined;
      return createAttempt({questionId:q.id,mode:item.mode,target:item.target,response:item.mode==='vertex-selection'?selected:item.mode==='integer'?Number(answer.value):item.mode==='self-assessed-text'?text.value:graph,
        graph,graphSnapshot,hintLevel,selfAssessed:self.value==='yes',points:q.scoring.points});
    }
    function preview() {
      try {
        const a=candidate();
        if(item.mode==='vertex-selection') board.update(selected,{missed:a.evaluation.uncoveredVertexIds});
        const explanation=explain(a);
        setFeedback(feedback,`${explanation} ${a.evaluation.satisfiesTarget?'پاسخ با خواسته هم‌خوان است.':'پاسخ هنوز خواسته را برآورده نمی‌کند.'} امتیاز: ${fa(a.finalScore)}. ${item.mode==='self-assessed-text'?'نتیجه بر پایهٔ خودارزیابی توست.':''} برای ذخیره «ثبت نهایی» را بزن.`,{tone:a.evaluation.satisfiesTarget?'success':'error'});
      } catch(error){setFeedback(feedback,error.message,{tone:'error'});}
    }
    function explain(a) {
      if(item.mode==='vertex-selection') return selectionFeedback(a.evaluation,item.target,ids=>ids.map(id=>item.model.places.find(p=>p.id===id).label).join('، ')).message;
      if(item.mode==='graph-construction') return `تعداد رأس ${fa(a.evaluation.n)}؛ گامای واقعی ${fa(a.evaluation.gamma)}؛ تعداد انتخاب‌های کمینه ${fa(analyzeGraph(graph).minimumSets.length)}. ${item.prompt}`;
      if(item.mode==='integer') return `عدد احاطه‌گری واقعی این مدل ${fa(a.evaluation.expectedValue)} است.`;
      return 'پاسخ با معیار نمایش‌داده‌شده توسط خودت مقایسه شده است.';
    }
    const check=button('بررسی بدون ثبت',preview);check.id='practice-check';
    const hint=button('راهنمای ۱ · رایگان',()=>{if(hintLevel===3)return;const li=el('li');renderTextMath(li,item.hints[hintLevel++]);hintList.append(li);hint.textContent=hintLevel===3?'سه راهنما نمایش داده شد':`راهنمای ${fa(hintLevel+1)} · رایگان`;hint.disabled=hintLevel===3;repository.setEditingDirty('practice',true);});hint.id='practice-hint';
    const submit=button('ثبت نهایی پاسخ',()=>{
      try {
        const a=candidate(),snapshot=repository.snapshot();
        const next=appendAttempt(snapshot.state,a,curriculum,{questions});
        repository.commit(next,snapshot.state.revision);
        if(!repository.snapshot().state.attempts[a.id])throw new Error(repository.snapshot().warning||'ثبت پاسخ انجام نشد.');
        finalized=a;
        for(const control of work.querySelectorAll('button,input,textarea,select'))control.disabled=true;
        for(const vertex of work.querySelectorAll('.board-vertex')){vertex.setAttribute('aria-disabled','true');vertex.setAttribute('tabindex','-1');}
        check.disabled=true;hint.disabled=true;submit.disabled=true;
        repository.setEditingDirty('practice',false);status();
      } catch(error){setFeedback(feedback,error.message,{tone:'error'});}
    });submit.id='practice-submit';submit.className='primary-button';
    const retry=button('تلاش تازه روی همین سؤال',()=>{destroy();repository.setEditingDirty('practice',false);render(item);});retry.id='practice-retry';
    function status(){if(finalized){const s=repository.snapshot();setFeedback(feedback,`${explain(finalized)} امتیاز نهایی: ${fa(finalized.finalScore)} · ${s.dirty||s.warning?'در حافظهٔ موقت؛ ذخیره نشده است.':'ذخیره شد.'} ${item.mode==='self-assessed-text'?'خودارزیابی تشریحی؛ ۱۰ برای هم‌خوانی با معیار و صفر برای نیاز به اصلاح.':''}`,{tone:s.dirty||s.warning?'error':'success'});}}
    const saveAgain=button('ذخیرهٔ دوبارهٔ کار موقت',()=>{repository.retry();status();});
    unsubscribe=repository.subscribe(s=>{saveAgain.hidden=!s.warning;status();});
    actions.append(check,hint,submit,retry,saveAgain);
    host.replaceChildren(card,work,actions,feedback,hintList);
    destroy=()=>{board?.destroy();unsubscribe?.();};
  }
  refresh();
}
