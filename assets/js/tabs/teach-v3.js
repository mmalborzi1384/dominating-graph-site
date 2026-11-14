import { completeActivity, progressPercent, unlockedUnits, visitUnit } from '../domain/progress.js';
import { assessTeachingEvidence } from '../domain/teaching-evidence.js';
import { createEvidenceInput, el, action } from '../ui/teaching-inputs.js';
import { createTeachingBoard } from '../ui/teaching-board.js';
import { renderTextMath } from '../ui/math.js';
import { setFeedback, createInlineConfirmation } from '../ui/feedback.js';
const fa=n=>n.toLocaleString('fa-IR',{maximumFractionDigits:1});
const math=(tag,text,cls='')=>{const node=el(tag,undefined,cls);renderTextMath(node,text);return node;};
const link=(text,href)=>{const a=el('a',text,'secondary-button');a.href=href;return a;};
/** One activity at a time. A fresh exit must pass before its persistent flag is
 * awarded. Evidence, prediction and explanation live only in these closures. */
export function initTeachingV3({curriculum},repository){
 const root=el('div',undefined,'teaching apos3'),panel=document.getElementById('panel-teach');panel.replaceChildren(root);
 const header=el('header',undefined,'apos3-header'),intro=el('div'),percent=el('strong'),save=el('p'),meter=el('progress'),progress=el('div',undefined,'apos3-progress glass-surface');
 percent.id='teaching-percent';save.id='teaching-save-state';meter.max=100;meter.setAttribute('aria-label','درصد تکمیل مسیر آموزش');intro.append(el('h1','از رابطه تا تصمیم'),el('p','دو درس؛ تجربه، پیش‌بینی، مقایسه و مدل‌سازی.'));progress.append(el('span','تکمیل مسیر'),percent,meter,save);header.append(intro,progress);
 const lessonNav=el('nav',undefined,'apos3-lessons');lessonNav.setAttribute('aria-label','درس‌های آموزش');
 const unitNav=el('nav',undefined,'apos3-units');unitNav.setAttribute('aria-label','ایستگاه‌های APOS درس');
 const notice=el('p');notice.id='teaching-notice';notice.setAttribute('role','status');
 const host=el('section',undefined,'apos3-workspace');host.id='teaching-stage';
 const privacy=el('p','فقط تکمیل و محل ادامه ذخیره می‌شوند؛ پاسخ‌ها و توضیح‌های موقت با ترک فعالیت کنار گذاشته می‌شوند. ۱۰۰٪ نشانهٔ تکمیل مسیر است، نه گواه تسلط.','teaching-privacy');
 let cleanups=[],currentUnit=null,currentActivity=null,currentVariant=false,pendingMode=null,rendering=false;const cursors=new Map();
 const reset=createInlineConfirmation({message:'پیشرفت فعال آموزش از ابتدا شروع شود؟ آرشیو و سوابق سایر بخش‌ها حفظ می‌شوند.',id:'reset-confirm',confirmId:'confirm-reset-teaching',cancelId:'cancel-reset-teaching',onConfirm(){clear();cursors.clear();currentUnit=null;repository.resetTeaching();sync(repository.snapshot());}});
 const resetButton=action('شروع آموزش از اول',()=>reset.open(resetButton));resetButton.id='reset-teaching';
 const recovery=el('div',undefined,'apos3-actions');recovery.append(action('تلاش دوباره برای ذخیره',()=>repository.retry()),link('پشتیبان‌گیری و بازیابی','#records'));
 root.append(header,lessonNav,unitNav,notice,recovery,host,privacy,resetButton,reset.element);
 function clear(){for(const cleanup of cleanups)cleanup();cleanups=[];}
 function focus(){const heading=host.querySelector('h2');if(heading&&location.hash.startsWith('#teach')){heading.focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'instant'});}}
 function navigate(id,activityId){const snap=repository.snapshot();if(snap.needsMigration||!unlockedUnits(snap.state.teachingProgress,curriculum).includes(id)){setFeedback(notice,'این ایستگاه پس از تکمیل خروج ایستگاه پیشین باز می‌شود.');return;}clear();if(activityId)cursors.set(id,activityId);currentUnit=null;repository.changeProgress(p=>visitUnit(p,id,curriculum));sync(repository.snapshot());focus();}
 function available(unit,p){const requested=cursors.get(unit.id),first=unit.requiredActivityIds.find(id=>!p.completedActivityIds.includes(id))??unit.requiredActivityIds.at(-1);return requested&&unit.requiredActivityIds.includes(requested)&&(p.completedActivityIds.includes(requested)||requested===first)?requested:first;}
 function renderActivity(unit,activityId,{transfer=false}={}){
  clear();currentUnit=unit.id;currentActivity=activityId;currentVariant=transfer;
  const activity=curriculum.activities.find(a=>a.id===activityId),variant=transfer?activity.exitVariants[0]:null,model=variant?{...activity,...variant,id:activity.id}:activity;
  const snap=repository.snapshot(),p=snap.state.teachingProgress,position=unit.requiredActivityIds.indexOf(activityId),done=p.completedActivityIds.includes(activityId),isExit=activityId===unit.exitActivityId;
  host.replaceChildren();host.dataset.unitId=unit.id;host.dataset.activityId=activityId;host.dataset.exitVariant=String(transfer);
  const heading=el('h2',`${unit.title}؛ ${activity.title}`);heading.tabIndex=-1;heading.id='learning-activity-heading';host.append(heading,el('p',unit.objective,'apos3-objective'));
  const steps=el('ol',undefined,'apos3-step-route');steps.setAttribute('aria-label','قدم‌های این ایستگاه');for(const id of unit.requiredActivityIds){const index=unit.requiredActivityIds.indexOf(id),item=el('li'),button=action(`${p.completedActivityIds.includes(id)?'✓':fa(index+1)} ${curriculum.activities.find(a=>a.id===id).title}`,()=>{cursors.set(unit.id,id);renderActivity(unit,id);focus();});button.disabled=!(p.completedActivityIds.includes(id)||id===available(unit,{...p,completedActivityIds:p.completedActivityIds}));button.setAttribute('aria-current',id===activityId?'step':'false');item.append(button);steps.append(item);}host.append(steps);
  const guide=el('details',undefined,'apos3-guide');guide.append(el('summary','هدف، کمک و خطاهای این ایستگاه'),el('p',unit.scaffolding.join(' ')),el('p','به این خطا توجه کن: '+unit.misconceptions.join(' ')),el('p','معیار خروج: '+unit.evidenceCriteria.join(' ')));host.append(guide);
  const card=el('article',undefined,'apos3-card glass-surface');card.dataset.activityId=activityId;
  const badge=el('p',transfer?'خروج مستقل؛ نمونهٔ تازه':done?'✓ این فعالیت قبلاً تکمیل شده؛ مرور، پیشرفت را کم نمی‌کند.':`قدم ${fa(position+1)} از ${fa(unit.requiredActivityIds.length)}`,'apos3-badge');
  card.append(badge,math('p',model.context.scenario,'apos3-scenario'));
  const key=el('dl',undefined,'apos3-model-key');for(const[label,text]of[['رأس',model.context.vertexMeaning],['رابطه',model.context.edgeMeaning],['هدف',model.context.goal]])key.append(el('dt',label),math('dd',text));card.append(key);
  if(activity.figure&&!transfer){const detail=el('details',undefined,'apos3-figure');detail.open=activity.stageId==='Action';const img=el('img');img.src=new URL('../../../'+activity.figure.path,import.meta.url).href;img.alt=activity.figure.alt;img.loading='lazy';detail.append(el('summary','نقشه و شکل کتاب'),img);card.append(detail);}
  const instructions=el('ol');for(const step of model.instructionSteps??activity.instructionSteps)instructions.append(math('li',step));card.append(instructions);
  // A model reference can be consulted; automatic graph results stay in the
  // prediction controller until its initial draft is committed.
  const drawing=el('details',undefined,'apos3-reference');drawing.append(el('summary','دیدن مدل رابطه‌های داده‌شده'));const boardHost=el('div',undefined,'apos3-board');let toggled=[];const board=createTeachingBoard(boardHost,model.graph,id=>{toggled=toggled.includes(id)?toggled.filter(v=>v!==id):[...toggled,id];board.update(toggled);});drawing.append(boardHost);cleanups.push(()=>board.destroy());
  // Drawing an expected model would give away a construction task. Its input
  // already shows the blank vertices, so only use this reference for analysis.
  if(!model.parts.some(part=>['relation','model'].includes(part.type)))card.append(drawing);
  if(activity.alternateLayout){const alt=el('details');alt.append(el('summary','چیدمان دوم؛ همان رابطه‌ها'));const box=el('div',undefined,'apos3-board');const view=createTeachingBoard(box,model.graph,id=>view.update([id]),{alternate:true});alt.append(box);card.append(alt);cleanups.push(()=>view.destroy());}
  card.append(el('p','معیار تکمیل: '+activity.rubric.join(' '),'required-note'));
  const form=el('div',undefined,'apos3-form'),inputs=new Map(),token='teaching-v3:'+activityId,feedback=el('div',undefined,'apos3-feedback'),continueHost=el('div',undefined,'apos3-actions');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');let satisfied=false,building=true;
  const changed=()=>{if(building)return;satisfied=false;continueHost.replaceChildren();repository.setEditingDirty(token,true);};
  const method=el('textarea');method.rows=2;method.maxLength=1500;method.dataset.predictionMethod='';method.setAttribute('aria-label','روش پیش‌بینی پیش از آزمایش');method.addEventListener('input',changed);
  if(model.parts.some(p=>p.type==='prediction')){const label=el('label','پیش از آزمایش، روش پیش‌بینی را با زبان خودت بنویس؛ بعداً می‌توانی نقد و اصلاحش کنی. متن خودکار تصحیح نمی‌شود.');label.append(method);form.append(label);}
  for(const part of model.parts){const input=createEvidenceInput(part,model.graph,changed,{predictionMethod:()=>method.value});inputs.set(part.id,input);form.append(input.element);cleanups.push(()=>input.destroy());}building=false;cleanups.push(()=>repository.setEditingDirty(token,false));
  const actions=el('div',undefined,'apos3-actions'),hintList=el('ol'),sample=el('div',undefined,'teaching-solution');sample.hidden=true;let hints=0;
  const getAnswers=()=>Object.fromEntries([...inputs].map(([id,input])=>[id,input.read()]));
  const predictionsReady=()=>model.parts.filter(p=>p.type==='prediction').every(p=>inputs.get(p.id).read()?.committedBeforeReveal);
  const continueButton=action(isExit&&!transfer?'حل نمونهٔ خروج تازه':'ادامه',()=>{if(!satisfied)return;
   if(isExit&&!transfer){renderActivity(unit,activityId,{transfer:true});focus();return;}
   const latest=repository.snapshot().state.teachingProgress,index=unit.requiredActivityIds.indexOf(activityId),next=unit.requiredActivityIds[index+1];
   if(next){cursors.set(unit.id,next);renderActivity(unit,next);focus();}else{const nextUnit=curriculum.units[curriculum.units.indexOf(unit)+1];if(nextUnit)navigate(nextUnit.id);else showFinish();}
  },'primary-button');continueButton.dataset.action='continue';
  const check=action('بررسی شواهد و خودبازبینی',()=>{
   const result=assessTeachingEvidence(model,getAnswers());for(const[id,input]of inputs)input.element.dataset.correct=String(!result.issues.some(issue=>issue.partId===id));feedback.replaceChildren();
   if(!result.correct){satisfied=false;continueHost.replaceChildren();feedback.append(el('p','هنوز چند شاهد نیاز به بازبینی دارد.','notice'));const issues=el('ul');for(const issue of result.issues)issues.append(el('li',issue.message));feedback.append(issues);return;}
   satisfied=true;repository.setEditingDirty(token,false);
   if(!isExit||transfer)repository.changeProgress(progress=>completeActivity(progress,activityId,curriculum));
   const after=repository.snapshot();feedback.append(el('p',isExit&&!transfer?'شواهد تمرین کامل شد. اکنون همین هدف را روی یک نمونهٔ تازه نشان بده؛ تکمیل پس از آن ثبت می‌شود.':'شواهد ساخت‌یافته مطابق معیارند و معیارهای توضیح را خودت بازبینی کردی. برای خواندن بازخورد و ادامه فرصت داری.'));
   if(!isExit||transfer)feedback.append(el('p',after.dirty||!after.persisted?'تکمیل فعلی موقت است؛ ذخیره انجام نشد. از سوابق خروجی بگیر یا ذخیره را دوباره امتحان کن.':'✓ تکمیل ثبت شد.'));
   continueHost.replaceChildren(continueButton);
  },'primary-button');check.dataset.action='check';
  const hint=action('راهنمای رایگان',()=>{if(!predictionsReady()){setFeedback(feedback,'ابتدا پیش‌بینی خودت را ثبت کن؛ بعد راهنما و اصلاح در دسترس‌اند.');return;}const list=model.hints??activity.hints;if(hints<list.length)hintList.append(math('li',list[hints++]));hint.disabled=hints>=list.length;});hint.dataset.action='hint';
  const reveal=action('دیدن نمونهٔ توضیح؛ بدون ثبت تکمیل',()=>{if(!predictionsReady()){setFeedback(feedback,'ابتدا پیش‌بینی خودت را ثبت کن.');return;}if(!hints){setFeedback(feedback,'ابتدا یک راهنما را بخوان.');return;}sample.replaceChildren(el('strong',transfer?'نمونهٔ تمرینیِ قبلی؛ پاسخ این خروج تازه نیست.':'نمونهٔ توضیح؛ تکمیل فعالیت به ساخت شواهد خودت نیاز دارد.'),math('p',activity.explanation));sample.hidden=false;});reveal.dataset.action='reveal';actions.append(check,hint,reveal);
  card.append(form,actions,hintList,sample,feedback,continueHost);
  const source=el('details',undefined,'activity-source');source.append(el('summary','منبع و تفاوت این فعالیت'));for(const ref of activity.sourceReferences)source.append(el('p',`اقتباس از ${ref.questionId}، بانک ${ref.bankVersion}: ${ref.adaptationReason}`));card.append(source);host.append(card);
  if(position>0)host.append(action('مرور قدم قبلی',()=>{cursors.set(unit.id,unit.requiredActivityIds[position-1]);renderActivity(unit,unit.requiredActivityIds[position-1]);focus();}));
 }
 function showFinish(){clear();host.replaceChildren(el('h2','مسیر هر دو درس کامل شد'),el('p','شواهد این مسیر را ساخته‌ای و توضیح‌هایت را خودت بازبینی کرده‌ای. برای ادامه، مسئله‌های تازه را در تمرین یا آزمایشگاه تجربه کن.'),link('رفتن به تمرین','#practice'),link('دیدن پیشرفت و آرشیو','#records'));const heading=host.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'instant'});}
 function sync(snapshot){if(rendering)return;rendering=true;try{
  const{state}=snapshot;recovery.hidden=!snapshot.warning&&!snapshot.dirty;setFeedback(notice,snapshot.warning||'');save.textContent=snapshot.dirty||!snapshot.persisted?'ذخیره نشده':'ذخیره شده';resetButton.disabled=snapshot.needsMigration;
  if(snapshot.needsMigration){percent.textContent='مسیر تازه';meter.value=0;lessonNav.replaceChildren();unitNav.replaceChildren();if(pendingMode!==true){clear();host.replaceChildren(el('h2','پیش از شروع مسیر تازه، پیشرفتت را حفظ کن'),el('p','پیشرفت قبلی هنوز دست‌نخورده است. در سوابق، تفاوت مسیر و آرشیو را بررسی کن؛ می‌توانی خروجی بگیری، تأیید کنی یا منصرف شوی. سایر بخش‌ها در دسترس‌اند.'),link('بررسی و تأیید در سوابق','#records'));currentUnit=null;}pendingMode=true;return;}
  const p=state.teachingProgress;if(pendingMode){currentUnit=null;pendingMode=false;}const unlocked=unlockedUnits(p,curriculum),unit=curriculum.units.find(u=>u.id===p.lastVisitedUnitId),lesson=curriculum.lessons.find(l=>l.id===unit.lessonId);
  percent.textContent=fa(progressPercent(p,curriculum))+'٪';meter.value=progressPercent(p,curriculum);
  lessonNav.replaceChildren();for(const item of curriculum.lessons){const open=unlocked.includes(item.unitIds[0]),button=action(`${item.title}؛ ${fa(progressPercent(p,curriculum,item.id))}٪${open?'':'؛ قفل تا پایان درس اول'}`,()=>navigate(item.unitIds.find(id=>!p.passedUnitIds.includes(id))??item.unitIds.at(-1)));button.disabled=!open;button.dataset.lessonId=item.id;button.setAttribute('aria-current',lesson.id===item.id?'page':'false');lessonNav.append(button);}
  unitNav.replaceChildren();for(const id of lesson.unitIds){const u=curriculum.units.find(u=>u.id===id),open=unlocked.includes(id),button=action(`${u.title} — ${p.passedUnitIds.includes(id)?'✓ تکمیل‌شده':open?'آماده':'قفل؛ پس از خروج '+curriculum.units.find(v=>v.id===u.prerequisites[0]).title}`,()=>navigate(id));button.disabled=!open;button.dataset.unitId=id;button.setAttribute('aria-current',id===unit.id?'step':'false');unitNav.append(button);}
  const activity=curriculum.activities.find(a=>a.id===currentActivity);
  if(currentUnit!==unit.id||!activity?.prerequisites.every(id=>p.completedActivityIds.includes(id)))renderActivity(unit,available(unit,p));
 }finally{rendering=false;}}
 repository.subscribe(sync);
 function deepLink(){const match=/^#teach\/([^/]+)$/.exec(location.hash);if(!match)return;let id;try{id=decodeURIComponent(match[1]);}catch{return;}navigate(id);history.replaceState(null,'','#teach');}
 window.addEventListener('hashchange',deepLink);deepLink();
}
