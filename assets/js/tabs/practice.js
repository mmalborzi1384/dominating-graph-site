import { createWorkbench } from '../ui/model-workbench.js';
import { animateNumber } from '../ui/motion.js';
import { practiceCatalog, filterPractice } from '../data/practice.js';
import { createAttempt, appendAttempt } from '../domain/attempts.js';
import { createGraphBoard } from '../ui/graph-editor.js';
import { renderTextMath } from '../ui/math.js';
import { setFeedback, selectionFeedback } from '../ui/feedback.js';
import { analyzeGraph } from '../domain/evaluate.js';
import { pickRandom } from '../domain/random.js';

const el = (tag, text = '', className = '') => { const n = document.createElement(tag); n.textContent = text; n.className = className; return n; };
const fa = n => n.toLocaleString('fa-IR');
export async function initPractice(questions, curriculum, repository, {tab = 'practice', mount = null, source = 'practice.json'} = {}) {
  const response = await fetch(new URL('../../../content/'+source, import.meta.url));
  if (!response.ok) throw new Error('محتوای تمرین بارگیری نشد.');
  const catalog = practiceCatalog(questions, await response.json(), tab).filter(item=>!mount||!item.unavailable);
  const root = mount ?? document.getElementById('panel-practice'); root.replaceChildren();
  root.append(el(mount?'h2':'h1',mount?'کاوش‌های بانک؛ رسم، تحلیل و تجربه':'تمرین؛ راه‌های بیشتر برای مدل‌سازی'), el('p','مستقل از آموزش · راهنمای رایگان · نتیجه فقط با ثبت نهایی ذخیره می‌شود.','model-key'));
  const filters = el('div','','practice-filters');
  function select(label, options, id) {
    const wrapper = el('label',label), control = el('select'); control.id = mount?'bank-'+id:id;
    for (const [value, title] of options) { const option = el('option',title); option.value = value; control.append(option); }
    wrapper.append(control); filters.append(wrapper); return control;
  }
  const lesson = select('درس',[['','هر دو درس'],['lesson1','درس ۱'],['lesson2','درس ۲']],'practice-lesson');
  const category = select('موضوع',[['','همهٔ موضوع‌ها'],...Object.entries({A_foundations:'مبانی',B_domination:'احاطه‌گری',C_minimal_minimum:'مینیمال و مینیمم',D_formulas_bounds:'فرمول‌ها و کران‌ها',E_modeling:'مدل‌سازی',F_lab:'کاوش'})],'practice-category');
  const difficulty = select('دشواری',[['easy','آسان'],['hard','سخت']],'practice-difficulty');
  const picker = select('سؤال',[],'practice-question');
  const availability = el('p','','model-key'), host = el('section','','practice-activity');
  const redraw=el('button','سؤال تصادفی بعدی','secondary-button');redraw.type='button';redraw.id='practice-random-next';redraw.hidden=true;
  root.append(filters,redraw,availability,host);
  let destroy = () => {};
  let randomLevel=null,lastRandomId=null;
  const currentList=()=>filterPractice(catalog,{lesson:lesson.value,category:category.value,difficulty:difficulty.value});
  function drawRandom(){
    destroy();repository.setEditingDirty('practice',false);
    const candidates=currentList().filter(i=>!i.unavailable&&i.question.difficulty===randomLevel);
    const item=pickRandom(candidates,lastRandomId);
    if(!item){host.replaceChildren(el('p','سؤال آماده برای این درجه و فیلتر نداریم.','notice'));return;}
    lastRandomId=item.question.id;render(item);
    availability.textContent=`درجهٔ ${fa(randomLevel)} · ${fa(candidates.length)} سؤال آماده${candidates.length===1?'؛ فقط همین سؤال آماده است.':''}`;
  }
  redraw.addEventListener('click',drawRandom);
  function refresh() {
    destroy(); repository.setEditingDirty('practice',false);
    const list = filterPractice(catalog,{lesson:lesson.value, category:category.value, difficulty:difficulty.value});
    picker.replaceChildren();
    randomLevel=null;lastRandomId=null;redraw.hidden=true;
    for(const level of difficulty.value==='easy'?[1]:[2,3]){
      const option=el('option',`تمرین با سؤال‌های تصادفی · درجهٔ ${fa(level)}`);option.value=`random:${level}`;
      option.disabled=!list.some(i=>!i.unavailable&&i.question.difficulty===level);picker.append(option);
    }
    for (const item of list) {
      const option = el('option',`${item.question.id} · ${item.unavailable ? 'نیازمند تکمیل محتوا' : item.title}`);
      option.value = item.question.id; option.disabled = Boolean(item.unavailable); picker.append(option);
    }
    const ready = list.filter(item => !item.unavailable);
    availability.textContent = `${fa(ready.length)} سؤال در این فیلتر · ${fa(catalog.length)} سؤال متصل در این بخش`;
    picker.disabled = !ready.length;
    if (ready.length) { picker.value = ready[0].question.id; render(ready[0]); }
    else host.replaceChildren(el('p','برای این ترکیب سؤال آماده نداریم. درس، موضوع یا دشواری دیگری انتخاب کنید.','notice'));
  }
  for (const control of [lesson,category,difficulty]) control.addEventListener('change',refresh);
  picker.addEventListener('change',()=> {
    randomLevel=picker.value.startsWith('random:')?Number(picker.value.split(':')[1]):null;redraw.hidden=randomLevel===null;
    if(randomLevel!==null){lastRandomId=null;drawRandom();return;}
    destroy();repository.setEditingDirty('practice',false);render(catalog.find(item=>item.question.id===picker.value));
  });
  function render(item) {
    if (!item || item.unavailable) return;
    const q = item.question;
    let selected = [], hintLevel = 0, finalized = null, board, unsubscribe;
    let graph = item.mode === 'graph-construction' ? {n:item.target.n,vertices:Array.from({length:item.target.n},(_,i)=>String.fromCharCode(97+i)),edges:[]} : q.graph;
    const card = el('article','','question-card glass-surface');
    const scoreBox=el('p','','live-score'),score=el('output','۰');let lastScore=0;
    scoreBox.append(document.createTextNode('امتیاز پاسخ: '),score);scoreBox.hidden=true;
    card.dataset.questionId=q.id;card.dataset.bankTab=tab;card.dataset.difficulty=q.difficulty;
    const title=el(mount?'h3':'h2');renderTextMath(title,`${q.id} · ${item.title}`);
    card.append(title,el('p',`${q.lesson==='lesson1'?'درس ۱':'درس ۲'} · سطح ${fa(q.difficulty)} · ${q.apos_stage}`,'model-key'));
    for (const text of [item.model.scenario,item.model.vertexMeaning,item.model.edgeMeaning,item.prompt]) {const p=el('p');renderTextMath(p,text);card.append(p);}
    const workbench = createWorkbench(card,q,item,()=>repository.setEditingDirty(tab+'-bank',true));

    const work=el('div','','board-panel glass-surface practice-response'),actions=el('div','','practice-actions'),feedback=el('p'),hintList=el('ol','','hint-list');
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
      const label=el('label','پاسخ تو (متن و خلاصهٔ مدل، مجموعاً حداکثر ۱۰۰۰ حرف): ');label.append(text);work.append(label);
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
      return createAttempt({questionId:q.id,mode:item.mode,target:item.target,tab,response:item.mode==='vertex-selection'?selected:item.mode==='integer'?Number(answer.value):item.mode==='self-assessed-text'?text.value + workbench.summary():graph,
        graph,graphSnapshot,hintLevel,selfAssessed:self.value==='yes',points:q.scoring.points});
    }
    function preview() {
      try {
        const a=candidate();
        if(item.mode==='vertex-selection') board.update(selected,{missed:a.evaluation.uncoveredVertexIds});
        const explanation=explain(a);
        showScore(a.finalScore);
        setFeedback(feedback,`${explanation} ${a.evaluation.satisfiesTarget?'پاسخ با خواسته هم‌خوان است.':'پاسخ هنوز خواسته را برآورده نمی‌کند.'} ${item.mode==='self-assessed-text'?'نتیجه بر پایهٔ خودارزیابی توست.':''} برای ذخیره «ثبت نهایی» را بزن.`,{tone:a.evaluation.satisfiesTarget?'success':'error'});
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
        finalized=a;workbench.lock?.();
        for(const control of work.querySelectorAll('button,input,textarea,select'))control.disabled=true;
        for(const vertex of work.querySelectorAll('.board-vertex')){vertex.setAttribute('aria-disabled','true');vertex.setAttribute('tabindex','-1');}
        check.disabled=true;hint.disabled=true;submit.disabled=true;
        repository.setEditingDirty('practice',false);status();
      } catch(error){setFeedback(feedback,error.message,{tone:'error'});}
    });submit.id='practice-submit';submit.className='primary-button';
    const retry=button('تلاش تازه روی همین سؤال',()=>{destroy();repository.setEditingDirty('practice',false);render(item);});retry.id='practice-retry';
    function showScore(value){if(!scoreBox.isConnected)card.append(scoreBox);scoreBox.hidden=false;animateNumber(score,value,lastScore);lastScore=value;}
    function status(){if(finalized){showScore(finalized.finalScore);const s=repository.snapshot();setFeedback(feedback,`${explain(finalized)} ${s.dirty||s.warning?'در حافظهٔ موقت؛ ذخیره نشده است.':'ذخیره شد.'} ${item.mode==='self-assessed-text'?'خودارزیابی تشریحی؛ ۱۰ برای هم‌خوانی با معیار و صفر برای نیاز به اصلاح.':''}`,{tone:s.dirty||s.warning||!finalized.evaluation.satisfiesTarget?'error':'success'});}}
    const saveAgain=button('ذخیرهٔ دوبارهٔ کار موقت',()=>{repository.retry();status();});
    unsubscribe=repository.subscribe(s=>{saveAgain.hidden=!s.warning;status();});
    actions.append(check,hint,submit,retry,saveAgain);
    host.replaceChildren(card,work,actions,feedback,hintList);if(mount)for(const n of host.querySelectorAll('[id]'))n.id='bank-'+n.id;
    destroy=()=>{board?.destroy();workbench.destroy();unsubscribe?.();repository.setEditingDirty(tab+'-bank',false);};
  }
  refresh();if(mount)for(const n of root.querySelectorAll('[id]'))if(!n.id.startsWith('bank-'))n.id='bank-'+n.id;
}
