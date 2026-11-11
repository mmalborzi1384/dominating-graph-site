import { practiceCatalog } from '../data/practice.js';
import { competitionPool, createCompetition, addCompetition, consumeHint, finalizeTurn, advanceTurn, competitionRanks } from '../domain/sessions.js';
import { createGraphBoard } from '../ui/graph-editor.js';
import { renderTextMath } from '../ui/math.js';
import { setFeedback, selectionFeedback, createInlineConfirmation } from '../ui/feedback.js';

const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;};
const fa=n=>n.toLocaleString('fa-IR');
export async function initCompetition(questions,curriculum,repository) {
  const response=await fetch(new URL('../../../content/competition.json',import.meta.url));
  if(!response.ok)throw Error('تنظیم مسابقه بارگیری نشد.');
  const config=await response.json();
  practiceCatalog(questions,config); // Same modeled-content/graph boundary as practice.
  const pool=competitionPool(questions,config),context={questions};
  const root=document.getElementById('panel-competition');root.replaceChildren();
  root.append(el('h1','مسابقهٔ گروهی؛ یک مدل، چند راه‌حل'),el('p','۲ تا ۱۰ گروه · در هر دور یک سؤال مشترک و هم‌سطح برای تمام گروه‌ها · پس از پایان مجموعه، سؤال‌ها تکرار می‌شوند.','model-key'));
  const setup=el('form','','question-card glass-surface practice-activity');
  const count=el('input');count.type='number';count.min=2;count.max=10;count.step=1;count.value=2;count.id='competition-count';
  const rounds=el('input');rounds.type='number';rounds.min=1;rounds.step=1;rounds.value=config.defaultRounds;rounds.id='competition-rounds';
  const names=el('div','','practice-filters'),setupError=el('p');
  const label=(text,control)=>{const l=el('label',text);l.append(control);return l;};
  setup.append(label('تعداد گروه',count),label('تعداد دور',rounds),names);
  function nameFields(){const old=[...names.querySelectorAll('input')].map(n=>n.value);names.replaceChildren();const n=Number(count.value);if(!Number.isInteger(n)||n<2||n>10)return;for(let i=0;i<n;i++){const input=el('input');input.value=old[i]??`گروه ${fa(i+1)}`;input.dataset.groupName=i;names.append(label(`نام گروه ${fa(i+1)} (حداکثر ۳۰ حرف)`,input));}}
  nameFields();count.addEventListener('input',nameFields);
  const button=(text,fn)=>{const b=el('button',text,'secondary-button');b.type='button';b.addEventListener('click',fn);return b;};
  const start=button('شروع مسابقه',()=>{
    try{const s=repository.snapshot();if(!safe(s))throw Error('ابتدا وضعیت ذخیره‌سازی را برطرف کنید.');
      if(Number(count.value)!==names.querySelectorAll('input').length)throw Error('تعداد گروه باید عدد صحیح ۲ تا ۱۰ باشد.');
      const session=createCompetition([...names.querySelectorAll('input')].map(n=>n.value),Number(rounds.value),pool,s.state);
      const next=addCompetition(s.state,session,curriculum,context);viewId=session.id;
      if(!repository.commit(next,s.state.revision))setFeedback(setupError,repository.snapshot().warning,{tone:'error'});
    }catch(e){setFeedback(setupError,e.message,{tone:'error'});}
  });start.id='competition-start';setup.append(start,setupError);setup.addEventListener('submit',e=>e.preventDefault());
  const status=el('p'),history=el('select');history.id='competition-history';
  const host=el('section','','practice-activity');root.append(setup,label('مسابقه‌های ذخیره‌شده',history),status,host);
  let viewId=null,selected=[],turnId=null,board;
  function managementConfirmation(restart) {
    let request;
    const key=restart?'reset':'delete';
    const confirmation=createInlineConfirmation({id:`competition-${key}-confirmation`,
      confirmId:`competition-${key}-confirm`,cancelId:`competition-${key}-cancel`,
      message:'',confirmLabel:restart?'تأیید ریست مسابقه':'تأیید حذف مسابقه',
      onConfirm:()=>{
        try {
          const saved=repository.manageCompetition(request.id,restart,request.revision);
          repository.setEditingDirty('competition',false);
          setFeedback(status,saved?(restart?'مسابقه از ابتدا شروع شد.':'مسابقه و نتایج وابسته حذف شدند.'):repository.snapshot().warning,{tone:saved?'success':'error'});
          return true;
        } catch(error) {setFeedback(status,error.message,{tone:'error'});return false;}
      }});
    root.insertBefore(confirmation.element,host);
    return {close:confirmation.close,open:(session,source)=>{
      resetConfirmation?.close();deleteConfirmation?.close();
      const snapshot=repository.snapshot();request={id:session.id,revision:snapshot.state.revision};
      const results=Object.values(snapshot.state.attempts).filter(a=>a.sessionId===session.id).length;
      confirmation.element.querySelector('p').textContent=restart
        ?`با ریست، ${fa(results)} نتیجه و همهٔ پاسخ‌ها و راهنماهای این مسابقه پاک می‌شوند؛ همان گروه‌ها، دورها و سؤال‌ها از نوبت اول با امتیاز صفر آغاز می‌شوند. تأیید می‌کنید؟`
        :`این مسابقه و ${fa(results)} نتیجهٔ وابسته به آن کامل از این مرورگر حذف می‌شوند. تأیید می‌کنید؟`;
      confirmation.open(source);
    }};
  }
  // Store close handles separately so opening either confirmation cancels the other.
  let resetConfirmation,deleteConfirmation;
  resetConfirmation=managementConfirmation(true);deleteConfirmation=managementConfirmation(false);
  const safe=s=>s.persisted&&!s.dirty&&!s.conflict&&!['corrupt','unsupported','unavailable'].includes(s.readStatus);
  history.addEventListener('change',()=>{viewId=history.value;render(repository.snapshot());});
  function act(fn){try{const s=repository.snapshot();if(!safe(s))throw Error('ذخیره‌سازی آماده نیست؛ دوباره ذخیره کنید یا با تأیید بازخوانی کنید.');const next=fn(s.state);repository.commit(next,s.state.revision);}catch(e){setFeedback(status,e.message,{tone:'error'});}}
  function render(s){
    board?.destroy();board=null;
    const sessions=Object.values(s.state.sessions).filter(x=>x.kind==='competition');
    const active=sessions.find(x=>x.status!=='completed');if(active)viewId=active.id;
    if(!viewId||!s.state.sessions[viewId])viewId=sessions.at(-1)?.id;
    const session=s.state.sessions[viewId];
    setup.hidden=!!active;start.disabled=!safe(s)||!pool.length;history.disabled=!!active||!sessions.length;
    history.replaceChildren(...sessions.map((x,i)=>{const o=el('option',`مسابقه ${fa(i+1)} · ${x.status==='completed'?'پایان‌یافته':'در جریان'}`);o.value=x.id;return o;}));if(viewId)history.value=viewId;
    setFeedback(status,s.warning||(!pool.length?'سؤال آماده برای مسابقه نداریم.':''),{tone:'error'});
    host.replaceChildren();
    if(!safe(s)){const box=el('div','','question-card glass-surface');box.append(el('p','کار فعلی موقت یا دارای تعارض است؛ تا ذخیرهٔ موفق، راهنمای تازه و ثبت پاسخ بسته‌اند.'),button('ذخیرهٔ دوباره',()=>repository.retry()));host.append(box);return;}
    if(!session)return;
    const management=el('div','','practice-actions');
    const reset=button('ریست مسابقه',event=>resetConfirmation.open(session,event.currentTarget));reset.id='competition-reset';
    const remove=button('حذف مسابقه',event=>deleteConfirmation.open(session,event.currentTarget));remove.id='competition-delete';
    management.append(reset,remove);host.append(management);
    const table=el('table','','competition-results');table.append(el('caption',session.status==='completed'?'نتیجهٔ نهایی؛ رتبه‌های برابر مشترک‌اند':'امتیازهای فعلی'));
    const head=el('tr');for(const t of ['رتبه','گروه','امتیاز'])head.append(el('th',t));table.append(head);
    for(const row of competitionRanks(session,s.state.attempts)){const tr=el('tr');for(const t of [fa(row.rank),row.name,fa(row.total)])tr.append(el('td',t));table.append(tr);}host.append(table);
    if(session.status==='completed'){host.append(el('p','مسابقه تمام شد. برای مسابقهٔ تازه از فرم بالا استفاده کنید.'));return;}
    const turn=session.turns[session.currentIndex],item=pool.find(i=>i.question.id===turn.questionId);
    if(!item){host.append(el('p','مدل این نوبت در محتوای فعلی آماده نیست؛ اطلاعات ذخیره‌شده حفظ شده است.','notice'));return;}
    if(turnId!==turn.id){selected=[];turnId=turn.id;repository.setEditingDirty('competition',false);}
    const group=session.groups.find(g=>g.id===turn.groupId),final=turn.resultStatus!=='pending';
    const card=el('article','','question-card glass-surface');card.append(el('h2',`دور ${fa(1+Math.floor(session.currentIndex/session.groups.length))} از ${fa(session.roundCount)} · ${group.name}`),el('p',`نوبت ${fa(session.currentIndex+1)} از ${fa(session.turns.length)} · سقف امتیاز ${fa(config.caps[turn.consumedHintLevel])}`));
    for(const text of [item.title,item.model.scenario,item.model.vertexMeaning,item.model.edgeMeaning,item.prompt]){const p=el('p');renderTextMath(p,text);card.append(p);}host.append(card);
    const work=el('div','','board-panel glass-surface');host.append(work);
    board=createGraphBoard(work,{...item.model,graph:item.question.graph},id=>{if(final||!safe(repository.snapshot()))return;selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];board.update(selected);repository.setEditingDirty('competition',true);});
    const attempt=s.state.attempts[turn.finalizedAttemptId];if(attempt)selected=attempt.response;
    board.update(selected,{missed:attempt?.evaluation.uncoveredVertexIds??[]});
    if(final){for(const node of work.querySelectorAll('button'))node.disabled=true;for(const node of work.querySelectorAll('.board-vertex')){node.setAttribute('aria-disabled','true');node.setAttribute('tabindex','-1');}}
    const hints=el('ol');for(const text of item.hints.slice(0,turn.consumedHintLevel)){const li=el('li');renderTextMath(li,text);hints.append(li);}host.append(hints);
    const actions=el('div','','practice-actions');
    const hint=button(`راهنمای ${fa(Math.min(3,turn.consumedHintLevel+1))} · سقف بعدی ${fa(config.caps[Math.min(3,turn.consumedHintLevel+1)])}`,()=>act(state=>consumeHint(state,session.id,curriculum,context)));
    hint.id='competition-hint';hint.disabled=final||turn.consumedHintLevel===3;
    const submit=button('ثبت نهایی پاسخ گروه',()=>act(state=>finalizeTurn(state,session.id,selected,curriculum,context)));submit.id='competition-submit';submit.disabled=final;
    const next=button('نوبت بعد / پایان مسابقه',()=>{repository.setEditingDirty('competition',false);act(state=>advanceTurn(state,session.id,curriculum,context));});next.id='competition-next';next.disabled=!final;
    actions.append(hint,submit,next);host.append(actions);
    if(final){const result=el('p');setFeedback(result,turn.resultStatus==='finalized-deleted'?'نتیجه حذف‌شده؛ این نوبت مصرف شده و قابل تکرار نیست.':`${selectionFeedback(attempt.evaluation,'minimum',ids=>ids.join('، ')).message} امتیاز پایه ${fa(attempt.baseScore)}؛ نهایی ${fa(attempt.finalScore)}.`,{tone:'success'});host.append(result);repository.setEditingDirty('competition',false);}
  }
  repository.subscribe(render);
}
