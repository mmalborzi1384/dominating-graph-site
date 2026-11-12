import { summarizeRecords, recordScore } from '../domain/coverage.js';
import { createProgressRing } from '../ui/motion.js';
import { progressPercent } from '../domain/progress.js';
import { exportBackup, parseBackup, mergeBackup } from '../storage/transfer.js';
import { LIMITS } from '../domain/limits.js';
import { renderTextMath, renderFormula } from '../ui/math.js';
import { setFeedback, createInlineConfirmation } from '../ui/feedback.js';
const fa=n=>n.toLocaleString('fa-IR',{maximumFractionDigits:1});
function el(tag,text,className='') { const e=document.createElement(tag);e.className=className;if(text!==undefined)e.textContent=text;return e; }
function btn(text,id,action) { const b=el('button',text,'secondary-button');b.type='button';b.id=id;b.addEventListener('click',action);return b; }
function download(text,name) {const url=URL.createObjectURL(new Blob([text],{type:'application/json;charset=utf-8'})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export async function initRecords({questions,curriculum,bankVersion,legacyCurriculum},repository) {
  const response=await fetch(new URL('../../../content/records.json',import.meta.url));if(!response.ok)throw Error('محتوای سوابق بارگیری نشد.');const copy=await response.json(),context={questions,bankVersion,legacyCurriculum};
  const root=document.getElementById('panel-records'),heading=el('h1',copy.title),intro=el('p',copy.intro),notice=el('p'),progress=el('section',undefined,'records-card glass-surface'),summary=el('section',undefined,'records-card glass-surface'),coverage=el('section',undefined,'records-card glass-surface'),history=el('section',undefined,'records-card glass-surface'),transfer=el('section',undefined,'records-card glass-surface');
  root.replaceChildren(heading,intro,notice,progress,summary,coverage,history,transfer);
  const selected=new Set();let pending=null,selectionRevision=null,filter='all',requestId=0;
  const status=el('p');status.id='records-feedback';
  const reportError=error=>setFeedback(status,error.message??'عملیات انجام نشد.',{tone:'error'});
  const savedMessage=ok=>setFeedback(status,ok?'تغییرات ذخیره شد.':repository.snapshot().warning||'ذخیره نشد؛ کار فعلی را خروجی بگیرید.',{tone:ok?'success':'error'});
  const table=el('div',undefined,'records-list');table.id='records-list';
  const filterSelect=el('select');filterSelect.id='records-filter';filterSelect.setAttribute('aria-label','فیلتر بخش سوابق');
  for(const [value,label] of Object.entries({all:'همهٔ بخش‌ها',...copy.tabs})){const o=el('option',label);o.value=value;filterSelect.append(o);}
  filterSelect.addEventListener('change',()=>{filter=filterSelect.value;render(repository.snapshot());});
  const impact=el('p');impact.id='records-delete-impact';
  let deleteIds=[],deleteRevision;
  const deletion=createInlineConfirmation({message:'فقط نتایج انتخاب‌شده حذف شوند؟ پیشرفت آموزش ثابت می‌ماند. نوبت بازی و مسابقه مصرف‌شده می‌ماند و پاسخ و امتیاز آن حذف می‌شود.',id:'records-delete-confirmation',confirmId:'records-delete-confirm',cancelId:'records-delete-cancel',onConfirm(){try {const ok=repository.deleteResults(deleteIds,deleteRevision);selected.clear();savedMessage(ok);}catch(error){reportError(error);} }});
  const deleteButton=btn('حذف نتایج انتخاب‌شده','records-delete',()=>{
    deleteIds=[...selected];deleteRevision=selectionRevision;
    const snapshot=repository.snapshot();if(deleteRevision!==snapshot.state.revision){reportError(Error('ذخیره تغییر کرده است؛ نتایج را دوباره انتخاب کنید.'));return;}
    const count=Object.values(snapshot.state.sessions).flatMap(s=>s.turns??[]).filter(t=>deleteIds.includes(t.finalizedAttemptId)).length;
    impact.textContent=`${fa(deleteIds.length)} نتیجه حذف می‌شود؛ ${fa(count)} نوبت به «حذف‌شده» تبدیل می‌شود. امتیاز و پوشش دوباره محاسبه می‌شوند.`;deletion.open(deleteButton);
  });
  history.append(el('h2','نتایج ثبت‌شده'),filterSelect,deleteButton,impact,deletion.element,table);
  const reset=createInlineConfirmation({message:'فقط پیشرفت آموزش صفر شود؟ سایر نتایج و نشست‌ها حفظ می‌شوند.',id:'records-reset-confirmation',confirmId:'records-reset-confirm',onConfirm(){savedMessage(repository.resetTeaching());}});
  const resetButton=btn('شروع آموزش از اول','records-reset',()=>reset.open(resetButton));
  const ringLabel=el('strong'),progressRing=createProgressRing(ringLabel);
  const progressCopy=el('div');progress.append(el('h2','پیشرفت آموزش APOS'),progressCopy,resetButton,reset.element);
  const importPreview=el('div');importPreview.id='records-import-preview';
  function clearImport(){pending=null;repository.setEditingDirty('records-import',false);importPreview.replaceChildren();importDialog.close({returnFocus:false});}
  const importDialog=createInlineConfirmation({message:'این ادغام کامل در ذخیرهٔ مرورگر ثبت شود؟',id:'records-import-confirmation',confirmId:'records-import-confirm',cancelId:'records-import-cancel',onCancel:clearImport,onConfirm(){
    try {if(!pending)throw Error('ابتدا فایل را دوباره بررسی کنید.');const snap=repository.snapshot();if(snap.conflict||snap.state.revision!==pending.revision)throw Error('ذخیره پس از پیش‌نمایش تغییر کرده است؛ فایل را دوباره بررسی کنید.');
      const ok=repository.commit(pending.candidate,pending.revision);clearImport();savedMessage(ok);
    }catch(error){clearImport();reportError(error);}
  }});
  const fileInput=el('input');fileInput.type='file';fileInput.accept='.json,application/json';fileInput.id='records-import-file';
  const fileLabel=el('label','ورود فایل پشتیبان JSON (حداکثر ۵ مگابایت)');fileLabel.htmlFor=fileInput.id;
  fileInput.addEventListener('change',async()=>{
    const id=++requestId;clearImport();const file=fileInput.files[0];if(!file)return;
    try {if(file.size>LIMITS.importBytes)throw Error('حداکثر حجم فایل ۵ مگابایت است.');const text=await file.text();if(id!==requestId)return;
      const incoming=parseBackup(text,curriculum,context),snap=repository.snapshot();if(snap.needsMigration||snap.conflict||snap.dirty||!['ready','absent'].includes(snap.readStatus))throw Error('ابتدا وضعیت ذخیره را با خروجی بازیابی و بازخوانی یا تلاش دوباره حل کنید.');
      const fresh=snap.state.revision<=1&&!Object.keys(snap.state.attempts).length&&!Object.keys(snap.state.sessions).length&&!snap.state.teachingProgress.completedActivityIds.length;
      const oldCurriculum=JSON.parse(text).curriculumVersion===1&&curriculum.curriculumVersion===2;const result=mergeBackup(snap.state,incoming,curriculum,context,{fresh});pending={...result,revision:snap.state.revision};const p=result.preview;
      importPreview.replaceChildren(el('h3','پیش‌نمایش ورود؛ هنوز ذخیره نشده'),el('p',oldCurriculum?'این فایل آموزش قدیمی دارد؛ هیچ پیشرفت قدیمی منتقل نمی‌شود. سوابق سایر تب‌ها حفظ و پیشرفت آموزش تازهٔ موجود کم نمی‌شود.':''),el('p',`${fa(p.added)} نتیجه و ${fa(p.addedSessions)} نشست افزوده؛ ${fa(p.deduplicated)} نتیجهٔ تکراری؛ ${fa(p.suppressed)} نتیجهٔ قدیمی به‌علت علامت حذف بازگردانده نمی‌شود.`),el('p',`پیشرفت: ${fa(p.before)}٪ ← ${fa(p.after)}٪. ${p.restoresProgress?'این فایل تکمیل فعالیت‌ها را بازمی‌گرداند؛ حتی اگر قبلاً ریست شده باشند.':''}`),el('p',fresh?'مرورگر تازه: تم، سطح حرکت و محل ادامه از فایل گرفته می‌شوند.':'تم، سطح حرکت و محل ادامهٔ فعلی حفظ می‌شوند.'));
      repository.setEditingDirty('records-import',true);importDialog.open(fileInput);setFeedback(status,'فایل معتبر است؛ پیش‌نمایش را بررسی و تأیید یا لغو کنید.');
    }catch(error){reportError(error);}finally {fileInput.value='';}
  });
  const exportButton=btn('خروجی JSON از وضعیت فعلی','records-export',()=>{try{download(exportBackup(repository.snapshot().state,curriculum,context),'graph-learning-backup.json');}catch(error){reportError(error);}});
  const original=btn('خروجی خام ذخیرهٔ قبلی برای بازیابی','records-export-original',()=>{const raw=repository.originalJSON();if(raw!==null)download(raw,'graph-learning-original.json');});
  const retry=btn('تلاش دوباره برای ذخیره','records-retry',()=>savedMessage(repository.retry()));
  const reloadDialog=createInlineConfirmation({message:'وضعیت ذخیره دوباره خوانده شود؟ ابتدا کار ذخیره‌نشده را خروجی بگیرید؛ کار موقت کنار گذاشته می‌شود.',id:'records-reload-confirmation',confirmId:'records-reload-confirm',onConfirm(){clearImport();repository.reload({discardUnsaved:true});}});
  const reload=btn('بازخوانی ذخیره','records-reload',()=>reloadDialog.open(reload));
  transfer.append(el('h2','پشتیبان‌گیری و ورود فایل'),el('p',copy.transferNote),exportButton,original,retry,reload,reloadDialog.element,fileLabel,fileInput,importPreview,importDialog.element,status);
  function render(snapshot) {
    const {state}=snapshot,report=summarizeRecords(state,questions);setFeedback(notice,snapshot.warning||(snapshot.dirty?'کار فعلی ذخیره نشده؛ خروجی شامل همین کار موقت است.':''),{tone:'error'});
    exportButton.textContent=snapshot.dirty?'خروجی JSON از کار ذخیره‌نشده':'خروجی JSON از وضعیت فعلی';original.hidden=!snapshot.warning||repository.originalJSON()===null;retry.hidden=!snapshot.dirty;retry.disabled=snapshot.conflict;
    if(selectionRevision!==state.revision){selected.clear();selectionRevision=state.revision;deletion.close({returnFocus:false});impact.textContent='';}
    deleteButton.disabled=!selected.size||snapshot.dirty||snapshot.conflict;
    const meter=el('progress');meter.className='sr-only';progressRing.update(progressPercent(state.teachingProgress));meter.max=100;meter.value=progressPercent(state.teachingProgress);meter.setAttribute('aria-label','پیشرفت آموزش');
    const stages=el('ul');for(const stage of curriculum.stages)stages.append(el('li',`${stage.title}: ${state.teachingProgress.passedStageIds.includes(stage.id)?'پاس‌شده':'پاس نشده'}`));
    const link=el('a','ادامهٔ آموزش');link.href='#teach';progressCopy.replaceChildren(progressRing.element,el('p',`${fa(meter.value)}٪ · ${fa(state.teachingProgress.completedActivityIds.length)} فعالیت تکمیل‌شده؛ پاسخ و امتیاز آموزشی ثبت نمی‌شود.`),meter,stages,link);
    summary.replaceChildren(el('h2','تحلیل فعالیت‌ها'),el('p',`${fa(report.count)} تلاش · ${fa(report.unique)} سؤال یکتا · ${fa(report.score)} امتیاز · ${fa(report.correct)} پاسخ مطابق خواسته · ${fa(report.hints)} راهنمای مصرف‌شده`));
    const grid=el('div',undefined,'records-grid');for(const t of report.tabs)grid.append(el('p',`${copy.tabs[t.tab]}: ${fa(t.count)} تلاش، ${fa(t.correct)} مطابق خواسته، ${fa(t.score)} امتیاز، ${fa(t.hints)} راهنما`));summary.append(grid);
    for(const [title,rows] of [['به تفکیک درس',report.lessons],['به تفکیک APOS سؤال',report.apos]]){const details=el('details');details.append(el('summary',title));for(const row of rows)details.append(el('p',`${row.value} · ${fa(row.count)} تلاش · ${fa(row.correct)} مطابق خواسته · ${fa(row.score)} امتیاز`));summary.append(details);}
    summary.append(el('p','پاسخ‌های تشریحی با برچسب خودارزیابی مشخص‌اند؛ مدل‌های سفارشیِ بدون سؤال در تفکیک درس و APOS نمی‌آیند.'));
    coverage.replaceChildren(el('h2','پوشش شش ساحت'),el('p',copy.coverageNote));const cards=el('div',undefined,'records-grid');
    for(const tag of report.sahat){const card=el('article',undefined,'records-coverage');const m=el('progress');m.max=tag.total;m.value=tag.count;m.setAttribute('aria-label',tag.label);card.append(el('h3',tag.label),el('p',`${fa(tag.count)} از ${fa(tag.total)} سؤال · ${fa(tag.percent)}٪`),m);cards.append(card);}coverage.append(cards);
    table.replaceChildren();const attempts=Object.values(state.attempts).filter(a=>filter==='all'||a.tab===filter).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt));
    if(!attempts.length)table.append(el('p',copy.noData));
    for(const a of attempts){const row=el('article',undefined,'records-row'),label=el('label'),check=el('input');check.type='checkbox';check.dataset.attemptId=a.id;check.checked=selected.has(a.id);check.addEventListener('change',()=>{check.checked?selected.add(a.id):selected.delete(a.id);deleteButton.disabled=!selected.size||snapshot.dirty||snapshot.conflict;});
      const q=questions.find(q=>q.id===a.questionId),session=state.sessions[a.sessionId],group=session?.groups?.find(g=>g.id===a.groupId);const title=el('span');renderTextMath(title,`${copy.tabs[a.tab]} · ${q?`${q.id} — ${q.title_fa}`:copy.activities[a.activityId]??'فعالیت سفارشی'}${group?` · ${group.name}`:''}`);label.append(check,title);
      const time=el('time',new Date(a.recordedAt).toLocaleString('fa-IR'));time.dateTime=a.recordedAt;
      const metrics=el('p',undefined,'records-metrics');for(const text of [a.evaluation.satisfiesTarget?'مطابق خواسته':'نیاز به بازبینی',`امتیاز ${fa(recordScore(a,questions))}`,`راهنما ${fa(a.hintLevel)}`,...(a.evaluation.selfAssessed?['خودارزیابی تشریحی']:[])])metrics.append(el('span',text));row.append(label,metrics,time);
      const details=el('details');details.append(el('summary','پاسخ ثبت‌شده و نوع بررسی'));let answer=Array.isArray(a.response)?a.response.join('، '):typeof a.response==='object'?`${fa(a.response.n)} رأس، ${fa(a.response.edges.length)} یال`:String(a.response);const answerNode=el('p',answer);if(Array.isArray(a.response)){answerNode.dir='ltr';answerNode.className='records-selection';}const target=el('p',`نوع پاسخ: ${copy.modes[a.responseMode]} · خواسته: `);if(typeof a.target==='object'){const math=el('span');renderFormula(math,`n=${a.target.n},\\quad \\gamma=${a.target.gamma}`);target.append(math);}else target.append(document.createTextNode(copy.targets[a.target]));details.append(answerNode,target);row.append(details);table.append(row);
    }
    for(const s of Object.values(state.sessions))for(const t of s.turns??[])if(t.resultStatus==='finalized-deleted'&&(filter==='all'||s.kind===filter)){table.append(el('p',`${copy.tabs[s.kind]} · ${t.questionId} · ${s.groups?.find(g=>g.id===t.groupId)?.name??'نوبت چالش'} · حذف‌شده؛ نوبت مصرف‌شده و غیرقابل تکرار`,'records-deleted'));}
  }
  repository.subscribe(render);
}
