import {canonicalPlaces} from '../ui/graph-layout.js';
import {familyGraph,labPlaces,bounds} from '../domain/lab.js';
import {constructGraph} from '../domain/construct-graph.js';
import {analyzeGraph,evaluateSelection} from '../domain/evaluate.js';
import {createEditableGraphBoard} from '../ui/graph-editor.js';
import {setFeedback,selectionFeedback} from '../ui/feedback.js';
const el=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;},fa=n=>n.toLocaleString('fa-IR');
/** A scratch workspace: no attempt, session, score or response is persisted. */
export async function initLab(questions,curriculum,repository){
 const response=await fetch(new URL('../../../content/lab.json',import.meta.url));if(!response.ok)throw Error('محتوای آزمایشگاه موجود نیست.');const config=await response.json();
 const root=document.getElementById('panel-lab');root.replaceChildren();root.classList.add('practice-activity','lab');root.append(el('h1','آزمایشگاه گراف و مدل‌سازی'),el('p','آزادانه بساز، تغییر بده و دوباره امتحان کن. راهنما رایگان است؛ پاسخ و امتیازی در این بخش ثبت نمی‌شود.','model-key'));
 const notice=el('p');notice.id='lab-notice';notice.setAttribute('role','status');
 const button=(title,fn,id)=>{const b=el('button',title,'secondary-button');b.type='button';if(id)b.id=id;b.addEventListener('click',()=>{try{fn();}catch(e){setFeedback(notice,e.message,{tone:'error'});}});return b;};
 const label=(title,control)=>{const l=el('label',title,'workbench-field');l.append(control);return l;};
 const input=(value,id)=>{const n=el('input');n.type='number';n.step=1;n.min=1;n.max=10;n.value=value;n.id=id;return n;};
 const select=(id,rows)=>{const n=el('select');n.id=id;for(const[value,title]of rows){const o=el('option',title);o.value=value;n.append(o);}return n;};
 const station=select('lab-station',config.stations.map(s=>[s.id,s.id==='game'?'گفت‌وگوی گروهی بدون امتیاز':s.title]));root.append(label('ایستگاه آزمایشگاه',station));
 const intro=el('section','','lab-station-intro question-card glass-surface'),tools=el('div','','lab-tools'),host=el('section','','lab-workspace');root.append(intro,tools,notice,host);
 let graph=familyGraph(6),places=null,source=null,selected=[],board,layoutFamily='path',editMode='select',pending=null,observations=[];
 const n=input(6,'lab-n');n.min=2;const family=select('lab-family',[['path','مسیر خیابان'],['cycle','دور'],['complete','کامل'],['star','ستاره'],['empty','مکان‌های جدا']]);
 const prepared=select('lab-prepared',config.questionIds.map(id=>[id,id+' · '+questions.find(q=>q.id===id).title_fa]));
 const targetN=input(6,'lab-target-n');targetN.min=2;const gamma=input(2,'lab-target-gamma');
 const section=title=>{const f=el('fieldset','','question-card glass-surface lab-tool-group');f.append(el('legend',title));tools.append(f);return f;};
 function load(next,f='edited',q=null){graph=next;layoutFamily=f;source=q;places=null;selected=[];pending=null;render();}
 section('۱. ساخت شبکهٔ سفارشی').append(label('تعداد رأس (۲ تا ۱۰)',n),label('انواع گراف',family),button('ساخت مدل',()=>load(familyGraph(Number(n.value),family.value),family.value),'lab-build'));
 section('۲. مدل‌های آماده').append(label('انتخاب مدل',prepared),button('بارگذاری مدل آماده',()=>{const q=questions.find(q=>q.id===prepared.value);load(structuredClone(q.graph),'prepared',q);},'lab-load'));
 section('۳. رسم با n و گاما').append(label('تعداد رأس خواسته',targetN),label('گامای خواسته',gamma),button('رسم گراف',()=>{const next=constructGraph(Number(targetN.value),Number(gamma.value));load(next,'constructed');setFeedback(notice,`گراف با ${fa(next.n)} رأس و گامای ${fa(Number(gamma.value))} رسم شد. هر مؤلفهٔ ستاره‌ای یک مرکز لازم دارد؛ مدل می‌تواند چند مؤلفه داشته باشد.`);document.getElementById('lab-drawing-board').scrollIntoView({block:'center',behavior:'instant'});},'lab-draw-start'),el('p','یک نمونه با مشخصات خواسته‌شده رسم می‌شود؛ سپس می‌توانی رأس‌ها و یال‌هایش را تغییر بدهی.','model-key'));
 const answer=input(2,'lab-answer');answer.min=0;answer.max=12;
 function toggle(id){if(editMode==='connect'){if(pending===null){pending=id;setFeedback(notice,'رأس دوم را انتخاب کن.');}else if(pending===id){pending=null;setFeedback(notice,'اتصال لغو شد.');}else{edge(pending,id);pending=null;render();}return;}selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];board.update(selected);}
 function edge(a,b){if(a===b)throw Error('دو رأس متفاوت انتخاب کن.');const i=graph.edges.findIndex(e=>e.includes(a)&&e.includes(b));if(i<0)graph.edges.push([a,b]);else graph.edges.splice(i,1);layoutFamily='edited';}
 function check(){const e=evaluateSelection(graph,selected,'minimum');board.update(selected,{missed:e.uncoveredVertexIds});setFeedback(notice,selectionFeedback(e,'minimum',ids=>ids.join('، ')).message+` احاطه‌گر: ${e.dominates?'بله':'خیر'}؛ مینیمال: ${e.minimal?'بله':'خیر'}؛ مینیمم: ${e.minimum?'بله':'خیر'}.`+(station.value==='gamma'?` عدد واردشده ${Number(answer.value)===e.gamma?'درست است.':`درست نیست؛ گامای مدل ${fa(e.gamma)} است.`}`:''),{tone:e.minimum?'success':'error'});}
 function render(){board?.destroy();host.replaceChildren();const st=config.stations.find(s=>s.id===station.value);intro.replaceChildren(el('h2','ایستگاه فعال: '+(st.id==='game'?'گفت‌وگوی گروهی':st.title)),el('p',st.id==='game'?'نوبتی یک انتخاب پیشنهاد بدهید، پوشش و امکان حذف هر رأس را با هم بررسی کنید. مسابقه و رتبه‌بندی در تب مسابقه است.':st.body));
 const model=source?config.models[source.id]:config.model;if(!places)places=canonicalPlaces(graph,source?structuredClone(model.places):labPlaces(graph,layoutFamily));
 host.append(el('h3',`مدل فعلی: ${fa(graph.n)} رأس · ${fa(graph.edges.length)} یال`),el('p',model.scenario),el('p',model.vertexMeaning+' '+model.edgeMeaning));
 const bh=el('div','','board-panel glass-surface');bh.id='lab-drawing-board';bh.tabIndex=-1;host.append(bh);board=createEditableGraphBoard(bh,{...model,graph,places},toggle);board.update(selected);
 const mode=select('lab-edit-mode',[['select','انتخاب رأس و بررسی پوشش'],['connect','اتصال یا قطع دو رأس']]);mode.value=editMode;mode.addEventListener('change',()=>{editMode=mode.value;pending=null;});host.append(label('رفتار انتخاب',mode));
 const movement=el('section','','lab-movement question-card glass-surface'),mover=select('lab-move-vertex',graph.vertices.map(id=>[id,'رأس '+id])),arrows=el('div','','lab-direction-pad');movement.append(el('h3','جابه‌جایی رأس'),label('رأس موردنظر',mover));
 for(const[text,dx,dy,pos]of [['بالا',0,-15,'up'],['چپ',-20,0,'left'],['راست',20,0,'right'],['پایین',0,15,'down']]){const b=button(text,()=>board.moveVertex(mover.value,dx,dy));b.dataset.direction=pos;arrows.append(b);}movement.append(arrows,el('p','رأس را بکش یا از کلیدهای جهت و دکمه‌ها استفاده کن. حرکت، یال و گاما را عوض نمی‌کند.','model-key'));host.append(movement);
 const connections=el('section','','lab-connections question-card glass-surface'),from=select('lab-edge-from',graph.vertices.map(id=>[id,id])),to=select('lab-edge-to',graph.vertices.map(id=>[id,id]));to.value=graph.vertices[1];connections.append(el('h3','اتصال مکان‌ها'),label('از رأس',from),label('به رأس',to),button('اتصال / قطع دو رأس',()=>{edge(from.value,to.value);render();},'lab-edge-toggle'));
 const existing=el('details');existing.append(el('summary','یال‌های مدل؛ حذف تکی'));for(const[a,b]of graph.edges)existing.append(button(`${a} ↔ ${b} ×`,()=>{edge(a,b);render();}));connections.append(existing);host.append(connections);
 if(st.id==='gamma')host.append(label('پاسخ عددی گاما',answer));
 if(st.id==='bounds'){const b=bounds(graph);host.append(el('p',`بیشترین درجه ${fa(b.delta)}؛ کران پایین ${fa(b.lower)}. یال اضافه یا حذف کن و تغییر گاما را بررسی کن.`));}
 if(st.id==='minimal')host.append(button('نمونهٔ مینیمال غیرمینیمم',()=>{load(familyGraph(6),'path');selected=['b','d','f'];board.update(selected);},'lab-counterexample'));
 if(st.id==='formula'){const notes=el('section','','lab-observations question-card glass-surface');notes.append(el('h3','مقایسهٔ مدل‌ها'),button('یادداشت مدل فعلی برای مقایسه',()=>{observations.push({n:graph.n,gamma:analyzeGraph(graph).gamma,family:layoutFamily});render();},'lab-observe'));for(const row of observations)notes.append(el('p',`${row.family} · n=${row.n} · γ=${row.gamma}`));notes.append(button('پاک کردن یادداشت‌ها',()=>{observations=[];render();},'lab-clear-observations'));host.append(notes);}
 const actions=el('div','','lab-result-actions');actions.append(button('بررسی پاسخ و پوشش',check,'lab-check'),button('راهنمای رایگان',()=>{const e=evaluateSelection(graph,selected,'minimum');setFeedback(notice,!e.dominates?`رأس‌های ${e.uncoveredVertexIds.join('، ')} بی‌پوشش‌اند؛ خودشان یا همسایه‌شان را انتخاب کن.`:!e.minimal?`حذف رأس ${e.removableVertexIds[0]} را امتحان کن؛ پوشش باقی می‌ماند.`:e.minimum?'انتخابت مینیمم است؛ پوشش کامل و تعداد مراکز کمینه است.':'انتخابت مینیمال است، اما راهی با مراکز کمتر وجود دارد.');},'lab-hint'),button('نمایش انتخاب‌های کمینه · رایگان',()=>setFeedback(notice,analyzeGraph(graph).minimumSets.map(s=>s.join('، ')).join(' | ')),'lab-solutions'),button('پاک کردن انتخاب',()=>{selected=[];board.update(selected);},'lab-clear'));host.append(actions);
 }
 station.addEventListener('change',()=>{selected=[];render();});render();
}
