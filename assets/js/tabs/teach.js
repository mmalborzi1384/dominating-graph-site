import { completeActivity, progressPercent, unlockedStages, visitStage } from '../domain/progress.js';
import { teachingInstance, assessTeaching, availableTeachingActivity, followingTeachingActivity } from '../domain/teaching.js';
import { pickRandom } from '../domain/random.js';
import { createGraphBoard } from '../ui/graph-editor.js';
import { renderTextMath } from '../ui/math.js';
import { setFeedback, createInlineConfirmation } from '../ui/feedback.js';
const fa=n=>n.toLocaleString('fa-IR');
const el=(tag,text,cls='')=>{const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const math=(tag,text,cls='')=>{const node=el(tag,undefined,cls);renderTextMath(node,text);return node;};
const button=(text,action,cls='secondary-button')=>{const node=el('button',text,cls);node.type='button';node.addEventListener('click',action);return node;};
function download(text,name){if(text===null)return;const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function initTeaching({curriculum},repository){
  const panel=document.getElementById('panel-teach'),root=el('div',undefined,'teaching'),header=el('header',undefined,'teaching-heading'),intro=el('div'),progress=el('div',undefined,'teaching-progress glass-surface'),percent=el('strong',undefined,'progress-percent'),meter=el('progress'),save=el('p',undefined,'save-state');
  percent.id='teaching-percent';save.id='teaching-save-state';meter.max=100;meter.setAttribute('aria-label','پیشرفت آموزش تازه');progress.append(percent,meter,save);intro.append(el('h1',curriculum.title),el('p','تجربه کن، پیش‌بینی کن، مفهوم را بشناس و مدل بساز.'));header.append(intro,progress);
  const nav=el('nav',undefined,'stage-navigation');nav.setAttribute('aria-label','ساختارهای APOS');const stageButtons=new Map();
  for(const stage of curriculum.stages){const b=button(stage.title,()=>navigate(stage.id),'stage-button');b.dataset.stageId=stage.id;nav.append(b);stageButtons.set(stage.id,b);}
  const notice=el('p');notice.id='teaching-notice';const host=el('section');host.id='teaching-stage';const controls=el('div',undefined,'stage-controls');
  const previous=button('مرحلهٔ قبل',()=>step(-1)),next=button('مرحلهٔ بعد',()=>step(1),'primary-button');previous.id='previous-stage';next.id='next-stage';controls.append(previous,next);
  const reset=createInlineConfirmation({message:'فقط پیشرفت آموزش تازه صفر شود؟ نتایج سایر تب‌ها حفظ می‌شوند.',id:'reset-confirm',confirmId:'confirm-reset-teaching',cancelId:'cancel-reset-teaching',onConfirm(){clearStage();variants.clear();cursors.clear();repository.resetTeaching();}});
  const resetButton=button('شروع از اول',()=>reset.open(resetButton),'text-button');resetButton.id='reset-teaching';
  const recovery=el('section',undefined,'teaching-recovery glass-surface');
  const recoveryCopy=el('p');recovery.append(recoveryCopy,button('خروجی بازیابی',()=>download(repository.recoveryJSON(),'graph-learning-backup.json')),button('خروجی خام ذخیره',()=>download(repository.originalJSON(),'graph-learning-original.json')),button('تلاش دوباره برای ذخیره',()=>repository.retry()));
  root.append(header,nav,notice,recovery,host,controls,el('p','فقط تکمیل فعالیت و محل ادامه ذخیره می‌شود؛ پاسخ، امتیاز و راهنما در آموزش ثبت نمی‌شود.','teaching-privacy'),resetButton,reset.element);panel.replaceChildren(root);
  let current=null,cleanups=[],cardStates=[],advancing=false,flowGeneration=0,activityHost=null,stepCount=null,flowStatus=null;const variants=new Map(),cursors=new Map(),animations=new Set();
  function clearStage(){flowGeneration++;advancing=false;for(const animation of animations)animation.cancel();animations.clear();root.classList.remove('is-advancing');for(const stop of cleanups)stop();cleanups=[];cardStates=[];current=null;}
  function navigate(id){if(advancing)return;const p=repository.snapshot().state.teachingProgress;if(!unlockedStages(p).includes(id)){setFeedback(notice,'این مرحله قفل است؛ فعالیت‌های مرحلهٔ قبل را کامل کن.');return;}const before=current;cursors.set(id,availableTeachingActivity(curriculum,p,id));repository.changeProgress(p=>visitStage(p,id,curriculum));if(before===id){renderStage(id);sync(repository.snapshot());}if(location.hash!=='#teach')location.hash='#teach';host.querySelector('h2')?.focus();}
  function step(offset){const stage=curriculum.stages[curriculum.stages.findIndex(s=>s.id===current)+offset];if(stage)navigate(stage.id);}
  function drawStatic(parent,model,places=model.places,graph=model.graph){const wrap=el('div',undefined,'board-panel glass-surface');const board=createGraphBoard(wrap,{graph,places},()=>{});wrap.querySelector('.vertex-buttons').remove();for(const g of wrap.querySelectorAll('.board-vertex')){g.setAttribute('role','img');g.setAttribute('tabindex','-1');g.setAttribute('aria-label',places.find(p=>p.id===g.dataset.vertexId).label);}parent.append(wrap);cleanups.push(()=>board.destroy());}
  function renderStage(id){
    clearStage();current=id;const stage=curriculum.stages.find(s=>s.id===id);if(!variants.has(id)){const prior=curriculum.stages[stage.order-1],inherited=prior&&variants.get(prior.id);variants.set(id,stage.id!=='Schema'&&inherited?stage.variants.find(v=>v.id===inherited.id)??pickRandom(stage.variants):pickRandom(stage.variants));}const variant=variants.get(id);
    host.dataset.variantId=variant.id;const title=el('h2',stage.title);title.tabIndex=-1;title.id='stage-heading';host.setAttribute('aria-labelledby',title.id);
    const redraw=button('مسئلهٔ دیگر',()=>{variants.set(id,pickRandom(stage.variants,variant.id));renderStage(id);sync(repository.snapshot());});redraw.id='teaching-random-chain';
    const toolbar=el('div',undefined,'teaching-toolbar');
    const help=el('details',undefined,'context-help'),helpTitle=el('summary','ⓘ');helpTitle.setAttribute('aria-label','دربارهٔ مسئلهٔ دیگر');helpTitle.title='دربارهٔ مسئلهٔ دیگر';
    const helpCopy=el('p','دو گونهٔ هم‌هدف برای هر مرحله داریم. مسئلهٔ دیگر، نمونهٔ متفاوت همین فعالیت‌ها را می‌آورد؛ پاسخ‌های موقت پاک می‌شوند و تکمیل فعالیت‌ها باقی می‌ماند.');
    help.append(helpTitle,helpCopy);help.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')help.open=true;});help.addEventListener('pointerleave',()=>{if(!help.contains(document.activeElement))help.open=false;});help.addEventListener('keydown',event=>{if(event.key==='Escape'){help.open=false;helpTitle.focus();}});toolbar.append(redraw,help);
    host.replaceChildren(title,el('p',`هدف: ${stage.goal}`,'stage-goal'),el('p',stage.bridge,'stage-bridge'),el('p',variant.scenario,'apos-scenario'),toolbar);
    const lessons=el('div',undefined,'lesson-blocks');for(const block of stage.blocks){const card=el('details',undefined,'lesson-block glass-surface');card.append(el('summary',block.title),math('p',block.body),el('small',block.lesson));if(stage.id==='Object'&&lessons.childElementCount===0)card.open=true;lessons.append(card);}if(stage.id!=='Object')host.append(lessons);
    if(stage.id==='Object'){const reference=el('details',undefined,'learning-reference');reference.append(el('summary','مرجع مفاهیم این بخش'),lessons);host.append(reference);}
    const stepHeader=el('div',undefined,'learning-step-header');stepCount=el('strong');stepCount.id='learning-step-count';
    const track=document.createElementNS('http://www.w3.org/2000/svg','svg');track.setAttribute('viewBox','0 0 360 48');track.setAttribute('aria-hidden','true');track.classList.add('learning-track');
    const p=repository.snapshot().state.teachingProgress;let selected=cursors.get(id);if(!selected&&stage.id==='Schema'&&p.passedStageIds.length===4)selected='finished';
    if(selected!=='finished')selected=availableTeachingActivity(curriculum,p,id,selected);
    if(selected==='finished'&&p.passedStageIds.length!==4)selected=availableTeachingActivity(curriculum,p,id);
    cursors.set(id,selected);const index=selected==='finished'?2:stage.requiredActivityIds.indexOf(selected);
    stage.requiredActivityIds.forEach((activityId,i)=>{const done=p.completedActivityIds.includes(activityId),x=310-i*130;if(i<2){const line=document.createElementNS(track.namespaceURI,'path');line.setAttribute('d',`M${x-17},24 H${x-113}`);line.setAttribute('pathLength','1');line.classList.add('learning-link');if(done)line.classList.add('is-done');track.append(line);}const node=document.createElementNS(track.namespaceURI,'circle');node.setAttribute('cx',x);node.setAttribute('cy','24');node.setAttribute('r','17');node.classList.add('learning-node');if(done)node.classList.add('is-done');if(i===index)node.classList.add('is-current');track.append(node);const text=document.createElementNS(track.namespaceURI,'text');text.setAttribute('x',x);text.setAttribute('y','30');text.classList.add('learning-node-label');if(done)text.classList.add('is-done');text.textContent=done?'✓':fa(i+1);track.append(text);});
    stepCount.textContent=selected==='finished'?'مسیر کامل شد':`قدم ${fa(index+1)} از ${fa(stage.requiredActivityIds.length)}`;stepHeader.append(stepCount,track);flowStatus=el('p');flowStatus.id='learning-flow-status';flowStatus.setAttribute('role','status');flowStatus.setAttribute('aria-live','polite');
    activityHost=el('div',undefined,'learning-card-host');activityHost.id='learning-card-host';host.append(stepHeader,flowStatus,activityHost);
    if(selected==='finished'){const finish=el('article',undefined,'learning-finish glass-surface'),finishTitle=el('h3','مسیرت را ساختی!');finishTitle.tabIndex=-1;finishTitle.id='learning-finish-heading';finish.append(el('span','✓','learning-finish-mark'),finishTitle,el('p','دوازده فعالیت را پشت سر گذاشتی؛ حالا تجربه، تحلیل، تعریف و مدل‌سازی را به هم وصل کرده‌ای.'),button('مرور از کنش',()=>navigate('Action')));const practice=el('a','رفتن به تمرین');practice.href='#practice';finish.append(practice);activityHost.append(finish);return;}
    const activity=curriculum.activities.find(a=>a.id===selected);activityHost.append(activityCard(teachingInstance(activity,variant)));
    const review=el('div',undefined,'learning-review-controls');const back=button('قدم قبلی',()=>showActivity(id,stage.requiredActivityIds[index-1]));back.id='learning-prev';back.hidden=index===0;const ahead=button('قدم بعدی',()=>showActivity(id,stage.requiredActivityIds[index+1]));ahead.id='learning-next';ahead.hidden=!p.completedActivityIds.includes(selected)||index===stage.requiredActivityIds.length-1;review.append(back,ahead);host.append(review);

  }
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const milliseconds=name=>reduced()?0:Math.max(0,parseFloat(getComputedStyle(root).getPropertyValue(name))||0);
  const pause=duration=>duration?new Promise(resolve=>setTimeout(resolve,duration)):Promise.resolve();
  async function animateCard(node,enter){
    const duration=milliseconds(enter?'--learning-enter':'--learning-exit');if(!duration||!node?.animate)return;
    const frames=enter?[{transform:'translateX(-12px)',clipPath:'inset(0 100% 0 0)'},{transform:'translateX(0)',clipPath:'inset(0 0 0 0)'}]:[{transform:'translateX(0)',clipPath:'inset(0 0 0 0)'},{transform:'translateX(12px)',clipPath:'inset(0 0 0 100%)'}];
    const animation=node.animate(frames,{duration,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});animations.add(animation);try{await animation.finished;}catch{/* Navigation can cancel a finite transition. */}finally{animations.delete(animation);animation.cancel();}
  }
  function focusActivity(){const title=activityHost.querySelector('h3');if(!title||location.hash.split('/')[0]!=='#teach')return;title.focus({preventScroll:true});(stepCount?.closest('.learning-step-header')??activityHost).scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});}
  function showActivity(stageId,activityId){if(advancing)return;const p=repository.snapshot().state.teachingProgress;if(availableTeachingActivity(curriculum,p,stageId,activityId)!==activityId)return;cursors.set(stageId,activityId);renderStage(stageId);sync(repository.snapshot());focusActivity();}
  async function advanceActivity(model){
    if(advancing)return;advancing=true;const generation=++flowGeneration,nextStep=followingTeachingActivity(curriculum,model.stageId,model.id),oldCard=activityHost.firstElementChild;
    root.classList.add('is-advancing');flowStatus.textContent=nextStep?'✓ حل شد؛ قدم بعدی در راه است…':'✓ آخرین قدم هم کامل شد!';
    repository.changeProgress(p=>{const completed=completeActivity(p,model.id,curriculum);return nextStep?visitStage(completed,nextStep.stageId,curriculum):completed;});
    sync(repository.snapshot());
    if(!repository.snapshot().state.teachingProgress.completedActivityIds.includes(model.id)){advancing=false;root.classList.remove('is-advancing');sync(repository.snapshot());return;}
    if(stepCount)stepCount.textContent='✓ قدم کامل شد';const position=curriculum.stages.find(s=>s.id===model.stageId).requiredActivityIds.indexOf(model.id),node=host.querySelectorAll('.learning-node')[position],label=host.querySelectorAll('.learning-node-label')[position];node?.classList.add('is-done','is-celebrating');if(label){label.classList.add('is-done');label.textContent='✓';}host.querySelectorAll('.learning-link')[position]?.classList.add('is-bridging');if(location.hash.split('/')[0]==='#teach')stepCount.closest('.learning-step-header').scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
    await pause(milliseconds('--learning-celebrate'));if(generation!==flowGeneration)return;
    await animateCard(oldCard,false);if(generation!==flowGeneration)return;
    const latest=repository.snapshot().state.teachingProgress;if(nextStep)cursors.set(nextStep.stageId,nextStep.activityId);else cursors.set('Schema','finished');
    renderStage(latest.lastVisitedStageId);sync(repository.snapshot());focusActivity();await animateCard(activityHost.firstElementChild,true);
  }
  function activityCard(model){
    const card=el('article',undefined,'teaching-activity glass-surface');card.dataset.activityId=model.id;const badge=el('p',undefined,'activity-status');const fields=el('fieldset',undefined,'apos-answer');fields.append(el('legend','پاسخ خودت را بساز'));const feedback=el('p'),hintHost=el('ol'),solution=math('p',model.solution,'teaching-solution');solution.hidden=true;
    const answers={},token=`teaching:${model.id}`;let hintLevel=0;
    const changed=()=>{setFeedback(feedback,'پاسخ تغییر کرد؛ دوباره بررسی کن.');solution.hidden=true;repository.setEditingDirty(token,true);};
    const partHosts=new Map();
    const cardTitle=el('h3',model.title);cardTitle.tabIndex=-1;cardTitle.id='learning-activity-heading';card.append(cardTitle,badge,el('p',`هدف: ${model.learningObjective}`),el('p',`نوع فعالیت: ${model.cognitiveOperation} · درجهٔ ${fa(model.difficulty)}`,'model-key'),math('p',model.prompt),el('p',`معیار قبولی: ${model.rubric}`,'required-note'));
    if(['Process','Object'].includes(model.stageId)&&model.id!=='apos2-p2'){
      drawStatic(card,model);
      if(model.id==='apos2-o2'){card.append(el('p','همان رابطه با چیدمان دیگر:'));drawStatic(card,model,model.places.map(p=>({...p,x:600-p.x})));card.append(el('p','مدل مسیر بستهٔ پیک‌ها؛ راهِ مکان آخر به اول اضافه شده است:'));drawStatic(card,model,model.places,{...model.graph,edges:[...model.graph.edges,[model.graph.vertices.at(-1),model.graph.vertices[0]]]});}
    }
    function showList(part,container){const list=el('p');list.className='apos-current';list.setAttribute('aria-live','polite');container.append(list);return()=>{const value=answers[part.id]??[];list.textContent=part.type==='edges'?`راه‌های فعلی: ${value.map(e=>e.map(v=>model.places.find(p=>p.id===v).label).join(' ↔ ')).join('؛ ')||'هنوز راهی ساخته نشده'}`:`ترتیب فعلی: ${value.map(v=>model.places.find(p=>p.id===v).label).join(' ← ')||'هنوز انتخابی نشده'}`;};}
    for(const part of model.parts){const section=el('div',undefined,'apos-part');section.dataset.partId=part.id;partHosts.set(part.id,section);const label=el('label',part.label);label.id=`${model.id}-${part.id}-label`;section.setAttribute('role','group');section.setAttribute('aria-labelledby',label.id);section.append(label);
      if(part.type==='number'||part.type==='choice'){
        const input=el(part.type==='number'?'input':'select');input.id=`${model.id}-${part.id}`;input.dataset.partInput=part.id;label.htmlFor=input.id;
        if(part.type==='number'){input.type='text';input.inputMode='numeric';input.maxLength=2;input.setAttribute('aria-label',part.label);}else{const placeholder=el('option','انتخاب کن');placeholder.value='';input.append(placeholder);for(const o of part.options){const option=el('option',o.label);option.value=o.value;input.append(option);}}
        input.addEventListener('input',()=>{answers[part.id]=input.value;changed();});input.addEventListener('change',()=>{answers[part.id]=input.value;changed();});section.append(input);
      }else if(part.type==='vertices'){
        answers[part.id]=[];const group=el('div',undefined,'apos-choices');for(const place of model.places){const item=el('label'),check=el('input');check.type='checkbox';check.dataset.vertex=place.id;check.addEventListener('change',()=>{answers[part.id]=check.checked?[...answers[part.id],place.id]:answers[part.id].filter(v=>v!==place.id);changed();});item.append(check,document.createTextNode(place.label));group.append(item);}section.append(group);
      }else{
        answers[part.id]=[];const boardHost=el('div',undefined,'board-panel glass-surface');let board=null,pending=null,display=()=>{};
        const mark=()=>{for(const g of boardHost.querySelectorAll('[data-vertex-id]')){const active=part.type==='route'?answers[part.id].at(-1)===g.dataset.vertexId:pending===g.dataset.vertexId;g.classList.toggle('is-selected',active);g.setAttribute('aria-pressed',String(active));}};
        function redraw(){board?.destroy();const graph=part.type==='edges'?{...model.graph,edges:answers[part.id]}:model.graph;
          board=createGraphBoard(boardHost,{...model,graph},hit);if(part.type==='centers')board.update(answers[part.id]);else mark();}
        function hit(vertex){
          if(fields.disabled)return;
          if(part.type==='edges'){
            if(pending===null)pending=vertex;else if(pending===vertex)pending=null;else{const pair=[pending,vertex].sort(),key=JSON.stringify(pair);answers[part.id]=answers[part.id].some(e=>JSON.stringify([...e].sort())===key)?answers[part.id].filter(e=>JSON.stringify([...e].sort())!==key):[...answers[part.id],pair];pending=null;changed();}
            redraw();boardHost.querySelector(`button[data-vertex-id="${vertex}"]`)?.focus({preventScroll:true});
          }else if(part.type==='route'){answers[part.id].push(vertex);changed();mark();}
          else{answers[part.id]=answers[part.id].includes(vertex)?answers[part.id].filter(v=>v!==vertex):[...answers[part.id],vertex];changed();board.update(answers[part.id]);}
          display();}
        section.append(boardHost);redraw();cleanups.push(()=>board.destroy());
        if(part.type==='edges'||part.type==='route'){display=showList(part,section);section.append(button(part.type==='route'?'برگشت یک گام':'برداشتن آخرین راه',()=>{answers[part.id].pop();pending=null;changed();redraw();display();}),button('پاک‌کردن این پاسخ',()=>{answers[part.id]=[];pending=null;changed();redraw();display();}));display();}
      }
      fields.append(section);
    }
    const showHint=()=>{if(hintLevel>=3)return;repository.setEditingDirty(token,true);hintHost.append(math('li',model.hints[hintLevel++]));reveal.disabled=false;hint.disabled=hintLevel>=3;hint.textContent=hintLevel>=3?'هر سه راهنما نمایش داده شد':'راهنمای بعدی؛ رایگان';};
    const check=button('بررسی پاسخ',()=>{const result=assessTeaching(model,answers);for(const [id,partHost]of partHosts)partHost.dataset.correct=String(!result.issues.some(i=>i.partId===id));if(result.correct){if(advancing)return;setFeedback(feedback,'درست است؛ تمام بخش‌های این فعالیت مطابق معیارند.',{tone:'success'});repository.setEditingDirty(token,false);advanceActivity(model).catch(()=>{advancing=false;root.classList.remove('is-advancing');sync(repository.snapshot());setFeedback(notice,'تعویض قدم انجام نشد؛ می‌توانی دوباره بررسی کنی.',{tone:'error'});});}else{setFeedback(feedback,result.issues.map(i=>i.message).join(' '),{tone:'error'});if(!hintLevel)showHint();}},'primary-button');check.dataset.action='check';
    const hint=button('راهنما؛ رایگان',showHint);hint.dataset.action='hint';const reveal=button('پاسخ نمونه؛ پس از راهنما',()=>{if(hintLevel)solution.hidden=false;},'text-button');reveal.dataset.action='reveal';reveal.disabled=true;
    fields.append(check,feedback,hint,hintHost,reveal,solution);card.append(fields);cardStates.push({id:model.id,model,fields,badge});cleanups.push(()=>repository.setEditingDirty(token,false));return card;
  }
  function sync(snapshot){const {state}=snapshot,p=state.teachingProgress,unlocked=unlockedStages(p);percent.textContent=`${fa(progressPercent(p))}٪`;meter.value=progressPercent(p);save.textContent=snapshot.dirty||!snapshot.persisted?'ذخیره نشده':'ذخیره شده';
    recovery.hidden=!snapshot.warning;recoveryCopy.textContent=snapshot.warning;
    for(const stage of curriculum.stages){const b=stageButtons.get(stage.id);b.hidden=!unlocked.includes(stage.id);b.disabled=advancing||!unlocked.includes(stage.id);const short={Action:'کنش',Process:'فرایند',Object:'شیء',Schema:'طرحواره'}[stage.id],stateLabel=p.passedStageIds.includes(stage.id)?'✓ تکمیل‌شده':unlocked.includes(stage.id)?'آماده':'قفل';b.replaceChildren(el('strong',`${fa(stage.order+1)}. ${short}`),el('span',stateLabel,'stage-state'));b.title=stage.goal;b.setAttribute('aria-label',`${stage.title}؛ ${stateLabel}`);b.setAttribute('aria-current',stage.id===p.lastVisitedStageId?'step':'false');}
    if(current!==p.lastVisitedStageId&&!advancing)renderStage(p.lastVisitedStageId);
    if(!advancing&&cardStates[0]&&!cardStates[0].model.prerequisites.every(id=>p.completedActivityIds.includes(id))){cursors.delete(current);renderStage(p.lastVisitedStageId);}
    for(const c of cardStates){const done=p.completedActivityIds.includes(c.id),available=c.model.prerequisites.every(id=>p.completedActivityIds.includes(id));c.fields.disabled=advancing||!available;c.badge.textContent=done?'✓ تکمیل‌شده':available?'آمادهٔ پاسخ':'قفل؛ پس از فعالیت قبلی';}
    const index=curriculum.stages.findIndex(s=>s.id===current);previous.disabled=advancing||index===0;previous.hidden=index===0;next.disabled=advancing||index===3||!unlocked.includes(curriculum.stages[index+1]?.id);next.hidden=index===3||!unlocked.includes(curriculum.stages[index+1]?.id);resetButton.disabled=advancing;host.querySelector('#teaching-random-chain').disabled=advancing;host.querySelectorAll('.learning-review-controls button').forEach(b=>b.disabled=advancing);next.textContent=index===3?'پایان مسیر آموزش':'ادامه به مرحلهٔ بعد';
  }
  repository.subscribe(sync);
  const deepLink=()=>{const match=/^#teach\/([^/]+)$/.exec(location.hash);if(!match)return;let id='';try{id=decodeURIComponent(match[1]);}catch{/* invalid hash */}navigate(id);history.replaceState(null,'','#teach');};window.addEventListener('hashchange',deepLink);deepLink();
}
