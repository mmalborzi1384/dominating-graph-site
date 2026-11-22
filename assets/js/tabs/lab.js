import {canonicalPlaces} from '../ui/graph-layout.js';
import {familyGraph,labPlaces,bounds} from '../domain/lab.js';
import {constructGraph} from '../domain/construct-graph.js';
import {analyzeGraph,evaluateSelection} from '../domain/evaluate.js';
import {createEditableGraphBoard} from '../ui/graph-editor.js';
import {setFeedback} from '../ui/feedback.js';
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;},fa=n=>n.toLocaleString('fa-IR');
/** A scratch workspace: no attempt, session, score or response is persisted. */
export async function initLab(questions,curriculum,repository){
 const response=await fetch(new URL('../../../content/lab.json',import.meta.url));if(!response.ok)throw Error('محتوای آزمایشگاه موجود نیست.');const config=await response.json();
 const root=document.getElementById('panel-lab');root.replaceChildren();root.classList.add('practice-activity','lab');root.append(el('h1','آزمایشگاه گراف و مدل‌سازی'),el('p','آزادانه بساز، تغییر بده و دوباره امتحان کن. راهنما رایگان است؛ پاسخ و امتیازی در این بخش ثبت نمی‌شود.','model-key'));
 const notice=el('p');notice.id='lab-notice';notice.hidden=true;notice.tabIndex=-1;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 const button=(title,fn,id)=>{const b=el('button',title,'secondary-button');b.type='button';if(id)b.id=id;b.addEventListener('click',()=>{try{fn();}catch(e){setFeedback(notice,e.message,{tone:'error'});}});return b;};
 const label=(title,control)=>{const l=el('label',title,'workbench-field');l.append(control);return l;};
 const input=(value,id)=>{const n=el('input');n.type='number';n.step=1;n.min=1;n.max=10;n.value=value;n.id=id;return n;};
 const select=(id,rows=[])=>{const n=el('select');n.id=id;options(n,rows);return n;};
 function options(control,rows){const value=control.value;control.replaceChildren(...rows.map(([value,title])=>{const o=el('option',title);o.value=value;return o;}));if(rows.some(([id])=>id===value))control.value=value;}
 const station=select('lab-station',config.stations.map(s=>[s.id,s.id==='game'?'گفت‌وگوی گروهی بدون امتیاز':s.title]));root.append(label('ایستگاه آزمایشگاه',station));
 const intro=el('section','','lab-station-intro'),workspace=el('div','','lab-workspace'),tools=el('aside','','lab-tools'),host=el('section','','lab-board-area');tools.setAttribute('aria-label','ابزارهای آزمایشگاه');root.append(intro,workspace);workspace.append(host,tools);
 const summary=el('header','','lab-model-info'),bh=el('div','','board-panel');bh.id='lab-drawing-board';bh.tabIndex=-1;
 const legend=el('p','پس از بررسی: حلقه پیوسته و «بی‌پوشش» برای رأس جاافتاده؛ حلقه خط‌چین و «حذف‌پذیر» برای انتخاب اضافی.','model-key lab-diagnostic-key');legend.hidden=true;host.append(summary,bh,legend,notice);
 let graph=familyGraph(6),places=null,source=null,selected=[],board,layoutFamily='path',editMode='select',pending=null,observations=[];
 const n=input(6,'lab-n');n.min=2;const family=select('lab-family',[['path','مسیر خیابان'],['cycle','دور'],['complete','کامل'],['star','ستاره'],['empty','مکان‌های جدا']]);
 const prepared=select('lab-prepared',config.questionIds.map(id=>[id,id+' · '+questions.find(q=>q.id===id).title_fa]));
 const targetN=input(6,'lab-target-n');targetN.min=2;const gamma=input(2,'lab-target-gamma');
 function group(title,id,open=false){const d=el('details','','lab-tool-section');d.id=id;d.open=open;d.append(el('summary',title));const body=el('div','','lab-tool-body');d.append(body);tools.append(d);return body;}
 const build=group('۱. ساخت','lab-tools-build'),change=group('۲. تغییر','lab-tools-change'),review=group('۳. بررسی','lab-tools-review',true);
 const section=(parent,title)=>{const f=el('fieldset','','lab-tool-group');f.append(el('legend',title));parent.append(f);return f;};
 function resetDiagnosis(){legend.hidden=true;setFeedback(notice,'');board?.update(selected);}
 function load(next,f='edited',q=null){graph=next;layoutFamily=f;source=q;places=null;selected=[];pending=null;refreshBoard();resetDiagnosis();}
 section(build,'شبکه سفارشی').append(label('تعداد رأس (۲ تا ۱۰)',n),label('انواع گراف',family),button('ساخت مدل',()=>load(familyGraph(Number(n.value),family.value),family.value),'lab-build'));
 section(build,'مدل آماده').append(label('انتخاب مدل',prepared),button('بارگذاری مدل آماده',()=>{const q=questions.find(q=>q.id===prepared.value);load(structuredClone(q.graph),'prepared',q);},'lab-load'));
 section(build,'رسم با n و گاما').append(label('تعداد رأس خواسته',targetN),label('گامای خواسته',gamma),button('رسم گراف',()=>{const next=constructGraph(Number(targetN.value),Number(gamma.value));load(next,'constructed');setFeedback(notice,`گراف با ${fa(next.n)} رأس و گامای ${fa(Number(gamma.value))} رسم شد. هر مؤلفه ستاره‌ای یک مرکز لازم دارد؛ مدل می‌تواند چند مؤلفه داشته باشد.`);bh.scrollIntoView({block:'center',behavior:'instant'});},'lab-draw-start'),el('p','یک نمونه با مشخصات خواسته‌شده رسم می‌شود؛ سپس رأس‌ها و یال‌هایش را تغییر بده.','model-key'));
 const mode=select('lab-edit-mode',[['select','انتخاب رأس و بررسی پوشش'],['connect','اتصال یا قطع دو رأس']]);mode.addEventListener('change',()=>{editMode=mode.value;pending=null;resetDiagnosis();});change.append(label('رفتار انتخاب',mode));
 const movement=section(change,'جابه‌جایی رأس'),mover=select('lab-move-vertex'),arrows=el('div','','lab-direction-pad');movement.append(label('رأس موردنظر',mover));
 for(const[text,dx,dy,pos]of [['بالا',0,-15,'up'],['چپ',-20,0,'left'],['راست',20,0,'right'],['پایین',0,15,'down']]){const b=button(text,()=>board.moveVertex(mover.value,dx,dy));b.dataset.direction=pos;arrows.append(b);}movement.append(arrows,el('p','رأس را بکش یا از کلیدهای جهت و دکمه‌ها استفاده کن. حرکت، یال و گاما را عوض نمی‌کند.','model-key'));
 const connections=section(change,'اتصال مکان‌ها'),from=select('lab-edge-from'),to=select('lab-edge-to'),existing=el('details','','lab-existing-edges'),edgeList=el('div','','lab-edge-chips');existing.append(el('summary','یال‌های مدل؛ حذف تکی'),edgeList);connections.append(label('از رأس',from),label('به رأس',to),button('اتصال / قطع دو رأس',()=>edge(from.value,to.value),'lab-edge-toggle'),existing);
 const answer=input(2,'lab-answer');answer.min=0;answer.max=12;const answerField=label('پاسخ عددی گاما',answer);answer.addEventListener('input',resetDiagnosis);review.append(answerField);
 const stationExtra=el('div','','lab-station-extra');review.append(stationExtra);
 const actions=el('div','','lab-result-actions');actions.append(button('بررسی پاسخ و پوشش',()=>diagnose(false),'lab-check'),button('راهنمای رایگان',()=>diagnose(true),'lab-hint'),button('نمایش انتخاب‌های کمینه · رایگان',()=>{board.update(selected);legend.hidden=true;setFeedback(notice,'انتخاب‌های کمینه: '+analyzeGraph(graph).minimumSets.map(s=>s.join('، ')).join(' | '));},'lab-solutions'),button('پاک کردن انتخاب',()=>{selected=[];pending=null;resetDiagnosis();},'lab-clear'));review.append(actions);
 const notes=el('section','','lab-observations'),noteList=el('div');notes.append(el('h3','مقایسه مدل‌ها'),button('یادداشت مدل فعلی برای مقایسه',()=>{observations.push({n:graph.n,gamma:analyzeGraph(graph).gamma,family:layoutFamily});renderNotes();},'lab-observe'),noteList,button('پاک کردن یادداشت‌ها',()=>{observations=[];renderNotes();},'lab-clear-observations'));host.append(notes);
 function renderNotes(){noteList.replaceChildren(...observations.map(row=>el('p',`${row.family} · n=${row.n} · γ=${row.gamma}`)));}
 function toggle(id){if(editMode==='connect'){if(pending===null){resetDiagnosis();pending=id;setFeedback(notice,'رأس دوم را انتخاب کن.');}else if(pending===id){pending=null;resetDiagnosis();setFeedback(notice,'اتصال لغو شد.');}else{const a=pending;pending=null;edge(a,id);}return;}selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];resetDiagnosis();}
 function edge(a,b){if(a===b)throw Error('دو رأس متفاوت انتخاب کن.');const i=graph.edges.findIndex(e=>e.includes(a)&&e.includes(b));if(i<0)graph.edges.push([a,b]);else graph.edges.splice(i,1);layoutFamily='edited';refreshBoard();resetDiagnosis();}
 function diagnose(hint){const e=evaluateSelection(graph,selected,'minimum');const diagnostic={missed:e.uncoveredVertexIds,removable:e.removableVertexIds};board.update(selected,{diagnostics:diagnostic});legend.hidden=!(e.uncoveredVertexIds.length||e.removableVertexIds.length);
 let text=!e.dominates?`پوشش کامل نیست: ${e.uncoveredVertexIds.join('، ')} بی‌پوشش است.`:!e.minimal?`احاطه‌گر است، ولی مینیمال نیست؛ ${e.removableVertexIds.join('، ')} حذف‌پذیر است.`:e.minimum?'درست است؛ پوشش کامل و تعداد مراکز کمینه است.':'انتخابت مینیمال است، اما مینیمم نیست؛ راهی با مراکز کمتر وجود دارد.';
 if(hint)text+=!e.dominates?' رأس بی‌پوشش یا یکی از همسایه‌هایش را انتخاب کن.':!e.minimal?' یکی از رأس‌های حذف‌پذیر را بردار و دوباره پوشش را بررسی کن.':e.minimum?' حذف هر مرکز را امتحان کن؛ پوشش کامل از دست می‌رود.':'به جای حذف صرف، جای مراکز را هم تغییر بده.';
 if(station.value==='gamma')text+=Number(answer.value)===e.gamma?' پاسخ عددی گاما درست است.':` پاسخ عددی درست نیست؛ گامای مدل ${fa(e.gamma)} است.`;
 const correct=e.minimum&&(station.value!=='gamma'||Number(answer.value)===e.gamma);
 setFeedback(notice,text,{tone:hint?'hint':correct?'success':'error'});}
 function renderStation(){const st=config.stations.find(s=>s.id===station.value);intro.replaceChildren(el('h2','ایستگاه فعال: '+(st.id==='game'?'گفت‌وگوی گروهی':st.title)),el('p',st.id==='game'?'نوبتی یک انتخاب پیشنهاد بدهید و پوشش و امکان حذف هر رأس را با هم بررسی کنید.':st.body));answerField.hidden=st.id!=='gamma';notes.hidden=st.id!=='formula';stationExtra.replaceChildren();
 if(st.id==='bounds'){const b=bounds(graph);stationExtra.append(el('p',`بیشترین درجه ${fa(b.delta)}؛ کران پایین ${fa(b.lower)}. یال اضافه یا حذف کن و تغییر گاما را بررسی کن.`));}
 if(st.id==='minimal')stationExtra.append(button('نمونه مینیمال غیرمینیمم',()=>{load(familyGraph(6),'path');selected=['b','d','f'];board.update(selected);},'lab-counterexample'));}
 function refreshBoard(){const active=document.activeElement,focusId=active?.id,vertexId=active?.closest?.('[data-vertex-id]')?.dataset.vertexId;const previous=bh.querySelector('svg')?.graphView?.getState();board?.destroy();const model=source?config.models[source.id]:config.model;if(!places)places=canonicalPlaces(graph,source?structuredClone(model.places):labPlaces(graph,layoutFamily));
 summary.replaceChildren(el('h3',`مدل فعلی: ${fa(graph.n)} رأس · ${fa(graph.edges.length)} یال`),el('p',model.scenario),el('p',model.vertexMeaning+' '+model.edgeMeaning));board=createEditableGraphBoard(bh,{...model,graph,places},toggle);board.update(selected);bh.querySelector('svg').graphView.restoreState(previous);
 const rows=graph.vertices.map(id=>[id,'رأس '+id]);for(const control of [mover,from,to])options(control,rows);if(from.value===to.value)to.value=graph.vertices.find(id=>id!==from.value);edgeList.replaceChildren(...graph.edges.map(([a,b])=>button(`${a} ↔ ${b} ×`,()=>{edge(a,b);document.getElementById('lab-edge-toggle').focus({preventScroll:true});})));if(!graph.edges.length)edgeList.append(el('p','یالی وجود ندارد؛ دو رأس را متصل کن.','model-key'));renderStation();
 if(active&&!active.isConnected){const next=vertexId?bh.querySelector(`.vertex-choice[data-vertex-id="${vertexId}"]`):document.getElementById(focusId);(next??bh).focus({preventScroll:true});}}
 station.addEventListener('change',()=>{selected=[];pending=null;resetDiagnosis();renderStation();});refreshBoard();
}
