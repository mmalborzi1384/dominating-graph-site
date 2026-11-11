import {familyGraph,graphSnapshot,bounds,startLabSession,submitLabTurn,expireLabSession,labPlaces} from '../domain/lab.js';
import {createAttempt,appendAttempt} from '../domain/attempts.js';
import {analyzeGraph,evaluateSelection} from '../domain/evaluate.js';
import {topologyKey} from '../domain/graph.js';
import {createEditableGraphBoard,createGraphBoard} from '../ui/graph-editor.js';
import {setFeedback,selectionFeedback,createInlineConfirmation} from '../ui/feedback.js';
import {renderTextMath} from '../ui/math.js';
import {competitionRanks} from '../domain/sessions.js';
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;},fa=n=>n.toLocaleString('fa-IR');
export async function initLab(questions,curriculum,repository){
 const response=await fetch(new URL('../../../content/lab.json',import.meta.url));if(!response.ok)throw Error('محتوای آزمایشگاه موجود نیست.');const config=await response.json();
 if(config.version!==1||config.stations.length!==5||config.challengeCount!==5||config.challengeSeconds!==180)throw Error('تنظیم آزمایشگاه معتبر نیست.');
 const pool=config.questionIds.map(id=>questions.find(q=>q.id===id));if(pool.some(q=>!q?.tabs.includes('lab')||!config.models[q.id]||analyzeGraph(q.graph).gamma!==q.graph.gamma))throw Error('مدل آزمایشگاه معتبر نیست.');
 const root=document.getElementById('panel-lab');root.replaceChildren();root.classList.add('practice-activity','lab');
 root.append(el('h1','آزمایشگاه گراف و مدل‌سازی'));
 const station=el('select');station.id='lab-station';for(const s of config.stations){const o=el('option',s.title);o.value=s.id;station.append(o);}const stationLabel=el('label','ایستگاه آزمایشگاه');stationLabel.append(station);root.append(stationLabel);
 const body=el('p'),tools=el('div','','lab-tools'),host=el('section','','lab-workspace'),notice=el('p');notice.id='lab-notice';root.append(body,tools,notice,host);
 const button=(text,fn,id)=>{const b=el('button',text,'secondary-button');b.type='button';if(id)b.id=id;b.addEventListener('click',()=>{try{fn();}catch(e){setFeedback(notice,e.message.replace(/ \(.*\)$/,''),{tone:'error'});}});return b;};
 const stationTitle=el('h2'),stationHelp=el('p','','model-key');
 const stationIntro=el('section','','lab-station-intro question-card glass-surface');
 stationIntro.append(stationTitle,body,stationHelp,button('رفتن به فعالیت اختصاصی این ایستگاه',()=>{
  const heading=document.getElementById('lab-station-activity');heading?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});heading?.focus({preventScroll:true});
 },'lab-jump-activity'));root.insertBefore(stationIntro,tools);
 const input=(value,id)=>{const n=el('input');n.type='number';n.value=value;n.step=1;n.id=id;return n;};
 const label=(text,n)=>{const l=el('label',text);l.append(n);return l;};
 let graph=familyGraph(6),source=null,selected=[],places,board,baseline=analyzeGraph(graph).gamma,lastAttempt=null,editMode='select',edgeStart=null,layoutFamily='path',observations=[];
 const n=input(6,'lab-n');n.min=2;n.max=10;const family=el('select');family.id='lab-family';for(const [id,title]of [['path','مسیر خیابان'],['cycle','مسیر حلقوی'],['complete','ارتباط همهٔ مکان‌ها'],['star','مرکز و شعبه‌ها'],['empty','مکان‌های جدا']]){const o=el('option',title);o.value=id;family.append(o);}
 const targetN=input(6,'lab-target-n');targetN.min=2;targetN.max=10;const gamma=input(2,'lab-target-gamma');gamma.min=1;gamma.max=10;const answer=input(2,'lab-answer');const prepared=el('select');prepared.id='lab-prepared';for(const q of pool){const o=el('option',q.id+' · '+q.title_fa);o.value=q.id;prepared.append(o);}
 const create=()=>{graph=familyGraph(Number(n.value),family.value);layoutFamily=family.value;targetN.value=graph.n;source=null;selected=[];edgeStart=null;places=null;baseline=analyzeGraph(graph).gamma;lastAttempt=null;render();};
 const section=(title)=>{const group=el('fieldset','','question-card glass-surface lab-tool-group');group.append(el('legend',title));tools.append(group);return group;};
 const buildGroup=section('۱. ساخت شبکهٔ سفارشی');
 buildGroup.append(label('تعداد مکان‌ها (۲ تا ۱۰)',n),label('شکل شبکه',family),button('ساخت مدل',create,'lab-build'),el('p','تغییر تنظیمات با زدن «ساخت مدل» روی برد اعمال می‌شود.','model-key'));
 const preparedGroup=section('۲. مدل‌های آماده');
 preparedGroup.append(label('انتخاب مدل (تا ۱۲ رأس)',prepared),button('بارگذاری مدل آماده',()=>{
   source=pool.find(q=>q.id===prepared.value);graph={n:source.graph.n,vertices:[...source.graph.vertices],edges:source.graph.edges.map(e=>[...e])};
   layoutFamily='prepared';selected=[];edgeStart=null;places=null;baseline=analyzeGraph(graph).gamma;lastAttempt=null;render();
 },'lab-load'),el('p','مدل آماده مستقل از تنظیمات سازنده بارگذاری می‌شود.','model-key'));
 const drawGroup=section('۳. رسم با n و گاما');
 drawGroup.append(label('تعداد رأس خواسته',targetN),label('گامای خواسته',gamma),button('بررسی و ثبت رسم',()=>{
   const target={n:Number(targetN.value),gamma:Number(gamma.value)};
   if(!Number.isInteger(target.n)||target.n<2||target.n>10||!Number.isInteger(target.gamma)||target.gamma<1||target.gamma>target.n)throw Error('برای رسم، ۲ تا ۱۰ رأس و گامای صحیح ۱ تا تعداد رأس لازم است.');
   if(graph.n>10)throw Error('مدل فعلی '+fa(graph.n)+' رأس دارد. ثبت رسم سفارشی فقط برای ۲ تا ۱۰ رأس است؛ یک مدل سفارشی بسازید. مدل آماده همچنان قابل بررسی است.');
   const a=createAttempt({tab:'lab',activityId:'lab:draw',mode:'graph-construction',target,response:graph,graphSnapshot:graphSnapshot(graph,source?config.models[source.id]:config.model)});
   save(a);setFeedback(notice,`رأس‌های واقعی ${fa(a.evaluation.n)}؛ گامای واقعی ${fa(a.evaluation.gamma)}؛ خواسته ${fa(target.n)} رأس و گامای ${fa(target.gamma)}. ${a.evaluation.satisfiesTarget?'خواسته برقرار است.':'خواسته برقرار نیست.'} ${repository.snapshot().dirty?'ذخیره نشده؛ کار موقت است.':'نتیجه ثبت شد.'}`);
 },'lab-draw-submit'),el('p','ابتدا با ابزار اتصال، گراف هدف را بساز؛ این بخش گرافِ پاسخ را برایت حدس نمی‌زند.','model-key'));
 answer.addEventListener('input',()=>{lastAttempt=null;});

 const context={questions};
 const savedResults=el('details','','lab-saved-results question-card glass-surface');savedResults.id='lab-saved-results';
 const savedSummary=el('summary'),savedList=el('div');savedResults.append(savedSummary,el('p','«ثبت نتیجه» پاسخ و امتیاز را فقط در همین مرورگر نگه می‌دارد. حذفِ زیر، فقط نتیجهٔ انتخاب‌شده را پاک می‌کند؛ پیشرفت آموزش حفظ می‌شود.','model-key'),savedList);root.append(savedResults);
 let deletionRequest;
 const deleteConfirmation=createInlineConfirmation({id:'lab-delete-confirmation',confirmId:'lab-delete-confirm',cancelId:'lab-delete-cancel',
 message:'این نتیجهٔ آزمایشگاه حذف شود؟ اگر مربوط به بازی یا چالش باشد، نوبت مصرف‌شده باقی می‌ماند و قابل تکرار نیست.',confirmLabel:'تأیید حذف این نتیجه',
 onConfirm:()=>{
  try{const saved=repository.deleteLabResult(deletionRequest.id,deletionRequest.revision);if(lastAttempt===deletionRequest.id)lastAttempt=null;
   render();setFeedback(notice,saved?'نتیجهٔ انتخاب‌شده حذف شد.':repository.snapshot().warning,{tone:saved?'success':'error'});return true;
  }catch(error){setFeedback(notice,error.message.replace(/ \(.*\)$/,''),{tone:'error'});return false;}
 }});savedResults.append(deleteConfirmation.element);
 function renderSaved(){const snapshot=repository.snapshot(),results=Object.values(snapshot.state.attempts).filter(a=>a.tab==='lab');savedSummary.textContent=`نتایج ثبت‌شدهٔ آزمایشگاه (${fa(results.length)}) · مشاهده و حذف`;
  savedList.replaceChildren();if(!results.length)savedList.append(el('p','نتیجهٔ ذخیره‌شده‌ای نداریم.'));
  const activityNames={'lab:gamma':'محاسبهٔ گاما','lab:formula':'کشف فرمول','lab:bounds':'کران‌ها و اثر یال','lab:minimal':'مینیمال و مینیمم','lab:draw':'رسم با n و گاما'};
  for(const [index,a]of results.entries()){const row=el('div','','lab-saved-row');row.append(el('p',`${fa(index+1)}. ${a.questionId??activityNames[a.activityId]??'فعالیت آزمایشگاه'} · امتیاز ${fa(a.finalScore??0)} · ${new Date(a.recordedAt).toLocaleString('fa-IR')}`));
   const remove=button('حذف این نتیجه',()=>{deletionRequest={id:a.id,revision:repository.snapshot().state.revision};deleteConfirmation.open(remove);});remove.dataset.deleteLabResult=a.id;remove.disabled=!safe();row.append(remove);savedList.append(row);}
  const spent=Object.values(snapshot.state.sessions).filter(s=>s.kind==='lab').flatMap(s=>s.turns??[]).filter(t=>t.resultStatus==='finalized-deleted');
  if(spent.length)savedList.append(el('p',`${fa(spent.length)} نتیجهٔ بازی/چالش حذف‌شده است؛ نوبت‌ها مصرف‌شده‌اند و قابل تکرار نیستند.`,'model-key'));
 }
 const safe=()=>{const s=repository.snapshot();return s.persisted&&!s.dirty&&!s.conflict&&!['corrupt','unsupported','unavailable'].includes(s.readStatus);};
 function save(a){if(!safe())throw Error('ابتدا ذخیره‌سازی را برطرف کنید.');const s=repository.snapshot();repository.commit(appendAttempt(s.state,a,curriculum,context),s.state.revision);setFeedback(notice,repository.snapshot().dirty?'نتیجه موقت است؛ هنوز ذخیره نشده.':`ثبت شد؛ امتیاز ${fa(a.finalScore)}؛ ${a.evaluation.satisfiesTarget?'خواسته برقرار است.':'خواسته برقرار نیست.'}`);lastAttempt=a.id;}
 const active=()=>Object.values(repository.snapshot().state.sessions).find(s=>s.kind==='lab'&&s.status==='active');
 const group1=el('input'),group2=el('input');group1.value='گروه ۱';group2.value='گروه ۲';group1.id='lab-group-1';group2.id='lab-group-2';
 function start(kind){if(!safe())throw Error('ذخیره‌سازی آماده نیست.');const s=repository.snapshot();repository.commit(startLabSession(s.state,pool,kind,[group1.value,group2.value],curriculum,context),s.state.revision);selected=[];render();}
 const gameControls=el('div','','practice-actions');gameControls.append(label('نام گروه اول',group1),label('نام گروه دوم',group2),button('شروع بازی دو گروهی',()=>start('game'),'lab-game-start'));
 const challenge=button('شروع چالش: پنج گراف در سه دقیقه',()=>start('challenge'),'lab-challenge-start');root.insertBefore(challenge,host);
 station.addEventListener('change',()=>{selected=[];lastAttempt=null;render();});
 function toggleEdge(a,b){if(a===b)throw Error('دو رأس متفاوت انتخاب کن؛ حلقه مجاز نیست.');const index=graph.edges.findIndex(e=>e.includes(a)&&e.includes(b));if(index<0)graph.edges.push([a,b]);else graph.edges.splice(index,1);layoutFamily='edited';lastAttempt=null;}
 function render(){board?.destroy();board=null;host.replaceChildren();const st=config.stations.find(s=>s.id===station.value);body.textContent=st.body;stationTitle.textContent='ایستگاه فعال: '+st.title;stationHelp.textContent=st.focus_fa;host.dataset.station=st.id;tools.hidden=st.id==='game';gameControls.hidden=st.id!=='game';host.append(gameControls);
 const session=active();station.disabled=!!session;if(session){tools.hidden=true;gameControls.hidden=true;renderSession(session);return;}
 const past=Object.values(repository.snapshot().state.sessions).filter(s=>s.kind==='lab'&&s.status==='completed').at(-1);
 if(past){const attempts=past.turns.map(t=>repository.snapshot().state.attempts[t.finalizedAttemptId]).filter(Boolean);host.append(el('p',`آخرین فعالیت: ${fa(attempts.length)} پاسخ ثبت‌شده از ${fa(past.turns.length)}؛ مجموع امتیاز ${fa(attempts.reduce((sum,a)=>sum+a.finalScore,0))}.`));}
 if(st.id==='game'){const heading=el('h3','فعالیت اختصاصی: بازی دو گروهی');heading.id='lab-station-activity';heading.tabIndex=-1;host.insertBefore(heading,gameControls);const sessions=Object.values(repository.snapshot().state.sessions).filter(s=>s.kind==='lab'&&s.groups?.length);const s=sessions.at(-1);if(s)for(const row of competitionRanks(s,repository.snapshot().state.attempts))host.append(el('p',`رتبه ${fa(row.rank)} · ${row.name} · ${fa(row.total)}`));return;}
 if(!places)places=source?structuredClone(config.models[source.id].places):labPlaces(graph,layoutFamily);
 const model=source?config.models[source.id]:config.model;host.append(el('p',`مدل فعلی: ${fa(graph.n)} رأس · ${fa(graph.edges.length)} یال`,'lab-model-summary'),el('p',model.scenario),el('p',model.vertexMeaning+' '+model.edgeMeaning));
 const bh=el('div','','board-panel glass-surface');host.append(bh);board=createEditableGraphBoard(bh,{...model,graph,places},id=>{
   if(editMode==='connect'){if(edgeStart===null){edgeStart=id;setFeedback(notice,'رأس '+fa(graph.vertices.indexOf(id)+1)+' انتخاب شد؛ رأس دوم را روی برد یا با دکمهٔ آن انتخاب کن.');}else if(edgeStart===id){edgeStart=null;setFeedback(notice,'انتخاب اتصال لغو شد.');}else{toggleEdge(edgeStart,id);edgeStart=null;render();}return;}
   selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];board.update(selected);lastAttempt=null;
 },()=>{});board.update(selected);
 const mover=el('select');mover.id='lab-move-vertex';for(const [i,v] of graph.vertices.entries()){const o=el('option',`رأس ${fa(i+1)} · ${places.find(p=>p.id===v).label}`);o.value=v;mover.append(o);}
 const movement=el('section','','lab-movement question-card glass-surface');movement.append(el('h3','جابه‌جایی رأس'),label('رأس موردنظر',mover));
 const arrows=el('div','','lab-direction-pad');arrows.setAttribute('aria-label','جهت جابه‌جایی');
 for(const [text,dx,dy,pos]of [['بالا',0,-15,'up'],['چپ',-20,0,'left'],['راست',20,0,'right'],['پایین',0,15,'down']]){const b=button(text,()=>board.moveVertex(mover.value,dx,dy));b.dataset.direction=pos;arrows.append(b);}movement.append(arrows,el('p','رأس را بکش یا با کلیدهای جهت‌دار و این دکمه‌ها جابه‌جا کن. حرکت، یال و گاما را تغییر نمی‌دهد.','model-key'));host.append(movement);
 const connections=el('section','','lab-connections question-card glass-surface');connections.append(el('h3','اتصال مکان‌ها'));
 const mode=el('select');mode.id='lab-edit-mode';for(const [value,title]of [['select','انتخاب مراکز برای پاسخ'],['connect','اتصال / قطع با انتخاب دو رأس روی برد']]){const o=el('option',title);o.value=value;mode.append(o);}mode.value=editMode;mode.addEventListener('change',()=>{editMode=mode.value;edgeStart=null;setFeedback(notice,editMode==='connect'?'دو رأس را به‌ترتیب روی برد یا دکمه‌های رأس انتخاب کن؛ انتخاب دوبارهٔ رأس اول، اتصال را لغو می‌کند.':'حالت انتخاب مراکز برای پاسخ فعال است.');});
 const from=el('select'),to=el('select');from.id='lab-edge-from';to.id='lab-edge-to';
 for(const [i,v]of graph.vertices.entries())for(const control of [from,to]){const o=el('option',`رأس ${fa(i+1)} · ${places.find(p=>p.id===v).label}`);o.value=v;control.append(o);}to.value=graph.vertices[1];
 const pair=el('div','','lab-edge-pair');pair.append(label('از رأس',from),label('به رأس',to),button('اتصال / قطع دو رأس',()=>{toggleEdge(from.value,to.value);render();},'lab-edge-toggle'));
 const existing=el('details','','lab-existing-edges');existing.append(el('summary',`مسیرهای موجود (${fa(graph.edges.length)}) · برای حذف باز کن`));const chips=el('div','','lab-edge-chips');for(const [a,b]of graph.edges){const remove=button(`${fa(graph.vertices.indexOf(a)+1)} ↔ ${fa(graph.vertices.indexOf(b)+1)} ×`,()=>{toggleEdge(a,b);render();});remove.dataset.edge=a+'-'+b;remove.setAttribute('aria-label',`حذف مسیر بین رأس ${fa(graph.vertices.indexOf(a)+1)} و ${fa(graph.vertices.indexOf(b)+1)}`);chips.append(remove);}existing.append(chips);
 connections.append(label('کارِ کلیک روی رأس',mode),pair,el('p','هر اتصال مستقیم یک یال بدون جهت است. اتصال یک رأس به خودش مجاز نیست.','model-key'),existing);host.insertBefore(connections,bh);
 const report=el('p'),b=bounds(graph);renderTextMath(report,`گامای پیش از ویرایش: $${baseline}$؛ اکنون: $${b.gamma}$؛ $\\Delta=${b.delta}$؛ کران پایین $\\lceil n/(\\Delta+1)\\rceil=${b.lower}$.`);
 const taskHeading=el('h3','فعالیت اختصاصی: '+st.title);taskHeading.id='lab-station-activity';taskHeading.tabIndex=-1;host.append(taskHeading,report);
 if(st.id==='gamma')host.append(button('بررسی پاسخ عددی گاما',()=>{if(!answer.value.trim()||!Number.isInteger(Number(answer.value)))throw Error('گاما را به‌صورت عدد صحیح وارد کنید.');setFeedback(notice,`گامای واقعی ${fa(analyzeGraph(graph).gamma)} است؛ ${Number(answer.value)===analyzeGraph(graph).gamma?'پاسخ درست است.':'پاسخ نیاز به اصلاح دارد.'}`);},'lab-gamma-check'));
 if(st.id==='formula'){
  const notes=el('section','','lab-observations question-card glass-surface');notes.id='lab-observations';
  const explanation=el('p','هر یادداشت یک نمونه برای مقایسهٔ خانواده، تعداد رأس‌ها (n) و کمترین تعداد مرکز پوشش‌دهنده (گاما) است. با ساخت نمونه‌های مختلف الگو را بررسی کن؛ این فهرست فقط در همین صفحه می‌ماند و با تازه‌سازی پاک می‌شود.');
  const formula=el('p');renderTextMath(formula,'مسیر: $\\gamma(P_n)=\\lceil n/3\\rceil$، دور: $\\gamma(C_n)=\\lceil n/3\\rceil$، کامل و ستاره: $\\gamma=1$. مشاهدهٔ چند نمونه اثبات کلی نیست؛ بعد از ویرایش یال، فرمول خانواده لزوماً برقرار نمی‌ماند.');
  notes.append(el('h3','یادداشت‌های مقایسهٔ خانواده‌ها'),explanation,formula,button('یادداشت مدل فعلی برای مقایسه',()=>{
   const names={path:'مسیر',cycle:'دور',complete:'کامل',star:'ستاره',empty:'مکان‌های جدا'};
   if(!names[layoutFamily])throw Error('برای مقایسهٔ فرمول‌ها، از سازنده یک خانوادهٔ مشخص بسازید.');
   const row={family:layoutFamily,label:names[layoutFamily],n:graph.n,gamma:analyzeGraph(graph).gamma};
   if(observations.some(o=>o.family===row.family&&o.n===row.n&&o.gamma===row.gamma)){setFeedback(notice,'این نمونه از قبل در فهرست یادداشت‌هاست؛ تعداد رأس یا خانواده را تغییر بده و یک مدل تازه بساز.');return;}
   observations.push(row);render();
  },'lab-observe'));
  if(!observations.length)notes.append(el('p','هنوز نمونه‌ای یادداشت نشده است.','model-key'));
  const list=el('ul','','lab-observation-list');
  for(const [index,row]of observations.entries()){
   const item=el('li');item.dataset.observation='true';const text=el('p');renderTextMath(text,`${row.label} · تعداد رأس‌ها $n=${row.n}$ · کمترین مراکز $\\gamma=${row.gamma}$`);
   const remove=button('حذف این یادداشت',()=>{observations.splice(index,1);render();});remove.dataset.removeObservation=index;item.append(text,remove);list.append(item);
  }
  notes.append(list);const clear=button('پاک کردن همهٔ یادداشت‌ها',()=>{observations=[];render();},'lab-clear-observations');clear.disabled=!observations.length;notes.append(clear);host.append(notes);
 }
 if(st.id==='minimal')host.append(button('نمونهٔ مینیمالِ غیرمینیمم',()=>{graph=familyGraph(6);layoutFamily='path';n.value=6;family.value='path';targetN.value=6;baseline=analyzeGraph(graph).gamma;source=null;places=null;selected=['b','d','f'];render();},'lab-counterexample'));
 if(st.id==='gamma')host.append(label('پاسخ عددی گاما',answer));
 host.append(button('بررسی انتخاب و آزمون حذف',()=>{const e=evaluateSelection(graph,selected,'minimum');board.update(selected,{missed:e.uncoveredVertexIds});setFeedback(notice,`${selectionFeedback(e,'minimum',ids=>ids.join('، ')).message} احاطه‌گر: ${e.dominates?'بله':'خیر'}؛ مینیمال: ${e.minimal?'بله':'خیر'}؛ مینیمم: ${e.minimum?'بله':'خیر'}؛ قابل حذف: ${e.removableVertexIds.join('، ')||'هیچ‌کدام'}.`);},'lab-check'),button('نمایش همهٔ انتخاب‌های کمینه',()=>setFeedback(notice,analyzeGraph(graph).minimumSets.map(s=>s.join('، ')).join(' | ')),'lab-solutions'),button('ثبت نتیجهٔ فعالیت',()=>{if(lastAttempt)throw Error('این نتیجه ثبت شده؛ پاسخ یا مدل را برای تلاش تازه تغییر دهید.');const unchanged=source&&topologyKey(graph)===topologyKey(source.graph);if(!unchanged&&graph.n>10)throw Error('این مدل ویرایش‌شده '+fa(graph.n)+' رأس دارد؛ ثبت مدل سفارشی حداکثر ۱۰ رأس است. برای بررسی مدل آماده، آن را دوباره بارگذاری کنید.');const mode=st.id==='gamma'?'integer':'vertex-selection';if(mode==='integer'&&!answer.value.trim())throw Error('پاسخ عددی گاما را وارد کنید.');save(createAttempt({tab:'lab',...(unchanged?{questionId:source.id}:{activityId:'lab:'+st.id,graphSnapshot:graphSnapshot(graph,model,places)}),mode,target:mode==='integer'?'gamma':'minimum',response:mode==='integer'?Number(answer.value):selected,graph,points:unchanged?source.scoring.points:15}));},'lab-save'),el('p','ثبت نتیجه، پاسخ و امتیاز را در همین مرورگر ذخیره می‌کند. برای مشاهده یا حذف، بخش «نتایج ثبت‌شدهٔ آزمایشگاه» پایین همین تب را باز کن.','model-key'),button('دیدن نتایج ثبت‌شده و حذف',()=>{savedResults.open=true;savedResults.scrollIntoView({block:'start',behavior:'instant'});savedSummary.focus();},'lab-show-results'));
 }
 function renderSession(s){const heading=el('h3',s.deadlineAt?'فعالیت جاری: چالش زمان‌دار':'فعالیت جاری: بازی دو گروهی');heading.id='lab-station-activity';heading.tabIndex=-1;host.append(heading);const timer=el('p');timer.id='lab-timer';host.append(timer);const t=s.turns[s.currentIndex],q=questions.find(q=>q.id===t.questionId),model=config.models[q.id];host.append(el('h2',`${s.deadlineAt?'چالش زمان‌دار':'بازی دو گروهی'} · نوبت ${fa(s.currentIndex+1)} از ${fa(s.turns.length)} ${s.groups?.find(g=>g.id===t.groupId)?.name??''}`),el('p',model.scenario),el('p',model.vertexMeaning+' '+model.edgeMeaning));
 host.append(el('p','کمترین مجموعهٔ مکان‌های خدمت‌رسان را انتخاب کن تا همهٔ مکان‌ها پوشش بگیرند؛ فقط یک ثبت نهایی در هر نوبت مجاز است.'));const bh=el('div','','board-panel glass-surface');host.append(bh);board=createGraphBoard(bh,{...model,graph:q.graph},id=>{selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];board.update(selected);});board.update(selected);
 const submit=button('ثبت پاسخ و نوبت بعد',()=>{if(!safe())throw Error('ذخیره‌سازی آماده نیست.');const snapshot=repository.snapshot();const next=submitLabTurn(snapshot.state,s.id,selected,curriculum,context);repository.commit(next,snapshot.state.revision);selected=[];render();},'lab-turn-submit');host.append(submit);
 if(!safe())submit.disabled=true;
 }
 function tick(){const s=active(),node=document.getElementById('lab-timer');if(s?.deadlineAt){const left=Math.max(0,Math.ceil((s.deadlineAt-Date.now())/1000));if(node)node.textContent=`زمان باقی‌مانده: ${fa(left)} ثانیه`;
 if(!left){const submit=document.getElementById('lab-turn-submit');if(submit)submit.disabled=true;if(safe()){const snap=repository.snapshot();repository.commit(expireLabSession(snap.state,s.id,curriculum,context),snap.state.revision);setFeedback(notice,'زمان تمام شد؛ فقط پاسخ‌های نهایی‌شده در نتیجه باقی می‌مانند.');render();}}}}
 setInterval(tick,500);document.addEventListener('visibilitychange',tick);repository.subscribe(()=>{renderSaved();challenge.disabled=!safe()||!!active();if(active()){selected=[];render();tick();}});render();tick();
}
