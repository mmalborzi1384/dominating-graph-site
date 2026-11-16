import {paintGraph,attachGraphView} from './graph-surface.js';
import {canonicalPlaces,spaceLayout} from './graph-layout.js';
import { analyzeGraph } from '../domain/evaluate.js';
const node=(tag,text,cls='')=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;n.className=cls;return n;};
const field=(title,control)=>{const label=node('label',undefined,'workbench-field');label.append(document.createTextNode(title),control);return label;};
/** General source-model workbench. Directed/parallel/large models never enter the simple evaluator. */
export function createWorkbench(host,q,item,onChange){
 const container=node('section',undefined,'source-workbench');host.append(container);
 if(item.figurePage){const figure=node('details',undefined,'book-figure'),caption=node('summary',`شکل اصلی کتاب · صفحهٔ ${item.figurePage.toLocaleString('fa-IR')}`),image=node('img');image.src=new URL(`../../book/page-${item.figurePage}.webp`,import.meta.url).href;image.alt=`صفحهٔ ${item.figurePage} کتاب؛ شکل ${q.figure_ref.figure}، همراه صورت و برچسب‌های اصلی`;image.loading='lazy';image.width=1110;image.height=1500;figure.append(caption,image);container.append(figure);}
 if(item.mode!=='self-assessed-text')return{summary:()=>'',destroy(){}};
 const instructions=node('p',item.assessmentPolicy??'پاسخ و استدلالت را با معیار کتاب مقایسه کن.','assessment-policy');container.append(instructions);
 const mode=item.sourceModeByTab?.[host.dataset.bankTab]??item.sourceMode??q.response_mode;
 if(mode==='board'){
  const grid=node('div',undefined,'queen-board'),status=node('p','یک خانه را برای وزیر انتخاب کن.');grid.setAttribute('role','group');grid.setAttribute('aria-label','صفحهٔ شطرنج؛ انتخاب محل وزیر');let queen=null;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){const b=node('button','');b.type='button';b.setAttribute('aria-label',`سطر ${r+1} ستون ${c+1}`);b.dataset.dark=(r+c)%2;b.addEventListener('click',()=>{queen=[r,c];for(const [i,cell]of [...grid.children].entries()){const y=Math.floor(i/8),x=i%8,covered=y===r||x===c||Math.abs(y-r)===Math.abs(x-c);cell.classList.toggle('queen-covered',covered);cell.textContent=y===r&&x===c?'♛':'';cell.setAttribute('aria-pressed',String(y===r&&x===c));}status.textContent=`وزیر در سطر ${r+1}، ستون ${c+1}؛ خانه‌های هم‌سطر، هم‌ستون و قطرها پوشش دارند.`;onChange();});grid.append(b);}const coords=node('div',undefined,'workbench-tools'),row=node('input'),column=node('input');for(const [input,label]of [[row,'سطر وزیر (۱ تا ۸)'],[column,'ستون وزیر (۱ تا ۸)']]){input.type='number';input.min=1;input.max=8;input.value=1;input.addEventListener('change',()=>{if([row,column].every(n=>Number.isInteger(Number(n.value))&&Number(n.value)>=1&&Number(n.value)<=8))grid.children[(Number(row.value)-1)*8+Number(column.value)-1].click();});coords.append(field(label,input));}container.append(coords,grid,status);return{summary:()=>queen?`\nوزیر: سطر ${queen[0]+1} ستون ${queen[1]+1}`:'',destroy(){}};
 }
 const useGraph=q.graph||['draw','multigraph_draw','interactive_graph','runtime_library','lab_activity'].includes(mode);
 if(!useGraph)return{summary:()=>'',destroy(){}};
 const isDraw=['draw','multigraph_draw'].includes(mode),original=q.graph;
 let graph=original?structuredClone(original):{n:6,vertices:['a','b','c','d','e','f'],edges:[['a','b'],['b','c'],['c','d'],['d','e'],['e','f']]};
 if(isDraw)graph.edges=[];
 let selection=null;
 let positions=[],selected=[],pending=null,drag=null,moved=false,locked=false,entering=true;
 const tools=node('div',undefined,'workbench-tools'),count=node('input'),family=node('select'),action=node('select');count.type='number';count.min=1;count.max=16;count.value=graph.n;count.setAttribute('aria-label','تعداد رأس مدل (۱ تا ۱۶؛ ابزار منبع)');
 for(const [value,title]of [['path','خیابان مستقیم'],['cycle','مکان‌های دور میدان'],['complete','ارتباط همه با هم'],['star','مرکز و شعبه‌ها'],['empty','مکان‌های بدون مسیر']]){const o=node('option',title);o.value=value;family.append(o);}family.setAttribute('aria-label','خانوادهٔ مدل');
 for(const [value,title]of [['select','انتخاب مراکز / تجربهٔ پوشش'],['edge','ساخت / حذف یال با دو رأس'],['move','جابه‌جایی رأس']]){const o=node('option',title);o.value=value;action.append(o);}action.value=isDraw?'edge':'select';action.setAttribute('aria-label','حالت ابزار مدل');
 const button=(text,fn)=>{const b=node('button',text,'secondary-button');b.type='button';b.addEventListener('click',fn);return b;};
 const status=node('p',undefined,'workbench-status');status.setAttribute('role','status');
 tools.append(field('تعداد رأس',count),field('انواع گراف',family),button('ساخت مدل خانواده',()=>{const n=Number(count.value);if(!Number.isInteger(n)||n<1||n>16){status.textContent='تعداد صحیح ۱ تا ۱۶ وارد کن.';return;}if(family.value==='cycle'&&n<3){status.textContent='دور ساده دست‌کم سه رأس دارد؛ برای n=1 و n=2 دور ساده تعریف نمی‌کنیم.';return;}graph={n,vertices:Array.from({length:n},(_,i)=>String.fromCharCode(97+i)),edges:[]};for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(family.value==='complete'||family.value==='path'&&j===i+1||family.value==='cycle'&&(j===i+1||i===0&&j===n-1)||family.value==='star'&&i===0)graph.edges.push([graph.vertices[i],graph.vertices[j]]);positions=[];selected=[];entering=true;render();onChange();}),field('رفتار انتخاب',action));
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 480 340');svg.classList.add('source-graph');svg.setAttribute('role','group');svg.setAttribute('aria-label','کارگاه مدل سؤال؛ دکمه‌های رأس جایگزین لمس شکل‌اند');
 const viewport=node('div',undefined,'source-graph-viewport');viewport.tabIndex=0;viewport.setAttribute('role','group');viewport.setAttribute('aria-label','برد مدل؛ برای مدل پرتراکم داخل برد به چپ و راست برو');viewport.append(svg);
 const scrollNote=node('p','در مدل پرتراکم، برای دیدن همهٔ رأس‌ها داخل برد به چپ و راست برو.','model-key');scrollNote.hidden=true;
 // Only the transparent target grows; visible beads and mathematical coverage stay unchanged.
 function fitTargets(){
  const matrix=svg.getScreenCTM();if(!matrix)return;
  const scale=Math.hypot(matrix.a,matrix.b);if(!scale)return;
  const radius=Math.max(23,22.5/scale);
  for(const hit of svg.querySelectorAll('.vertex-hit'))hit.setAttribute('r',radius);
  scrollNote.hidden=viewport.scrollWidth<=viewport.clientWidth+1;
 }
 const sizeObserver=new ResizeObserver(fitTargets);sizeObserver.observe(viewport);
 const choices=node('div',undefined,'vertex-buttons'),edgeList=node('details'),edgeSummary=node('summary','یال‌های مدل؛ حذف تکی');edgeList.append(edgeSummary);
 function hit(id){if(locked)return;if(moved){moved=false;return;}if(action.value==='edge'){if(pending===null){pending=id;status.textContent=`رأس ${id} انتخاب شد؛ رأس دوم را بزن.`;return;}const a=pending;pending=null;const index=graph.edges.findIndex(e=>e[0]===a&&e[1]===id||!graph.directed&&e[0]===id&&e[1]===a);if(a===id&&!graph.multigraph){status.textContent='برای طوقه باید مدل چندگراف باشد؛ دو رأس متفاوت انتخاب کن.';return;}if(graph.multigraph)graph.edges.push([a,id]);else if(index>=0)graph.edges.splice(index,1);else graph.edges.push([a,id]);render();onChange();}else if(action.value==='select'){selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];selection.update(selected);onChange();}}
 function render(){
  const initial=canonicalPlaces(graph,graph.vertices.map((id,i)=>({id,label:`مکان ${id}`,x:240+175*Math.cos(2*Math.PI*i/graph.n-Math.PI/2),y:170+120*Math.sin(2*Math.PI*i/graph.n-Math.PI/2)})),{width:480,height:340});
  const spaced=spaceLayout(initial,480,340);
  if(positions.length!==graph.n)positions=spaced.places;
  svg.setAttribute('viewBox',`0 0 ${spaced.width} ${spaced.height}`);
  // Dense models scroll within the board rather than overlapping their initial touch targets.
  svg.style.minWidth=`${Math.max(226,Math.ceil(spaced.width*.8))}px`;
  edgeList.replaceChildren(edgeSummary);
  graph.edges.forEach(([a,b],i)=>edgeList.append(button(`${a} ${graph.directed?'→':'↔'} ${b} · حذف`,()=>{graph.edges.splice(i,1);render();onChange();})));
  selection=paintGraph(svg,graph,positions.map(p=>({...p,label:`مکان ${p.id}`})),hit,{numberFor:id=>id,coverage:!graph.directed&&!graph.multigraph});
  choices.replaceChildren(...selection.buttons.children);
  for(const p of positions){const {group}=selection.views.get(p.id);group.setAttribute('transform',`translate(${p.x} ${p.y})`);group.dataset.sourceId=p.id;group.querySelector('.vertex-label').remove();if(!entering)group.querySelector('.vertex-paint').style.animation='none';
   group.addEventListener('keydown',e=>{if(locked||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();p.x=Math.max(50,Math.min(svg.viewBox.baseVal.width-50,p.x+({ArrowRight:15,ArrowLeft:-15}[e.key]??0)));p.y=Math.max(50,Math.min(svg.viewBox.baseVal.height-50,p.y+({ArrowDown:15,ArrowUp:-15}[e.key]??0)));render();svg.querySelector(`[data-source-id="${p.id}"]`).focus();onChange();});
  }selection.update(selected);fitTargets();
  entering=false;const degrees=graph.vertices.map(id=>`${id}: ${graph.edges.reduce((n,e)=>n+(e[0]===id?1:0)+(e[1]===id?1:0),0)}`).join('، ');status.textContent=`${graph.n} رأس؛ ${graph.edges.length} یال. درجه‌ها: ${degrees}${graph.directed?' (مجموع ورودی و خروجی)':''}`;
 }
 svg.graphCanMove=()=>!locked&&action.value==='move';
 svg.graphMove=(id,x,y)=>{if(locked||action.value!=='move')return;const p=positions.find(p=>p.id===id);p.x=Math.max(50,Math.min(svg.viewBox.baseVal.width-50,x));p.y=Math.max(50,Math.min(svg.viewBox.baseVal.height-50,y));render();onChange();};
 const syncInteraction=()=>{svg.dataset.interaction=action.value;pending=null;moved=false;};
 action.addEventListener('change',syncInteraction);syncInteraction();
 svg.addEventListener('pointerdown',e=>{
  if(locked||action.value!=='move'||!e.isPrimary||e.button!==0)return;
  const n=e.target.closest('[data-source-id]');if(!n)return;
  e.preventDefault();drag={id:n.dataset.sourceId,pointerId:e.pointerId};
  svg.setPointerCapture(e.pointerId);moved=false;
 });
 svg.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();
  const matrix=svg.getScreenCTM();if(!matrix)return;
  const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
  const p=positions.find(p=>p.id===drag.id);
  p.x=Math.max(50,Math.min(svg.viewBox.baseVal.width-50,point.x));p.y=Math.max(50,Math.min(svg.viewBox.baseVal.height-50,point.y));
  moved=true;render();
 });
 const endDrag=e=>{if(!drag||e.pointerId!==drag.pointerId)return;const changed=moved;drag=null;
  if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
  if(changed)onChange();
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(type,endDrag);

 container.append(tools,node('p','در حالت یال، دو مکان را بزن. برای یال موازی این کار را تکرار کن؛ حذف هر نسخه از فهرست یال‌هاست. جابه‌جایی با حالت حرکت یا کلیدهای جهت‌دار انجام می‌شود.','model-key'),scrollNote,viewport,choices,edgeList,status);
 container.append(button('تحلیل مدل فعلی',()=>{try{const a=analyzeGraph(graph);status.textContent=`گامای مدل فعلی ${a.gamma}؛ ${a.minimumSets.length} مجموعهٔ کمینه. نمونه‌ها: ${a.minimumSets.map(s=>s.join(',')).slice(0,12).join(' | ')}`;}catch{status.textContent=graph.n===1?'گراف تک‌مکانی با یک مرکز پوشش می‌گیرد.':'این مدل جهت‌دار، چندیالی یا بیش از ۱۲ رأس است؛ درجه/مسیر را بررسی کن و پاسخ کامل را با معیار منبع مقایسه کن. به موتور احاطه‌گری ساده فرستاده نمی‌شود.';}}));
 if(q.id==='Q146'){const jump=button('گفت‌وگوی دو گروهی روی برد',()=>{const s=document.getElementById('lab-station');s.value='game';s.dispatchEvent(new Event('change',{bubbles:true}));s.scrollIntoView({block:'start'});});container.append(jump);}
 render();const graphView=attachGraphView(svg);return{summary:()=>`\nمدل کارگاه: ${JSON.stringify({V:graph.vertices,E:graph.edges,D:selected,directed:!!graph.directed,multigraph:!!graph.multigraph})}`,lock(){locked=true;tools.inert=true;choices.inert=true;edgeList.inert=true;for(const n of svg.querySelectorAll('[role=button]')){n.setAttribute('tabindex','-1');n.setAttribute('aria-disabled','true');}},destroy(){drag=null;sizeObserver.disconnect();graphView.destroy();}};
}
