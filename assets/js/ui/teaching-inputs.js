import { createTeachingBoard } from './teaching-board.js';
import { commitTeachingPrediction, assessEvidencePart } from '../domain/teaching-evidence.js';
import { evaluateSelection } from '../domain/evaluate.js';
import { renderTextMath } from './math.js';
let evidenceSerial=0;
export const el=(tag,text,className='')=>{const node=document.createElement(tag);node.className=className;if(text!==undefined){if(tag==='option')node.textContent=text;else renderTextMath(node,text);}if(['input','textarea','select'].includes(tag))node.autocomplete='off';return node;};
export function action(text,run,className='secondary-button'){const node=el('button',text,className);node.type='button';node.addEventListener('click',run);return node;}
const group=()=>el('div',undefined,'apos3-actions');
const parseNumber=value=>{const normalized=value.replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));return /^-?\d+$/.test(normalized)?Number(normalized):null;};
function select(label,options,change){const field=el('label',label,'apos3-field'),input=el('select');input.setAttribute('aria-label',label);const placeholder=el('option','انتخاب کن');placeholder.value='';input.append(placeholder);for(const [value,text]of options){const option=el('option',text);option.value=value;input.append(option);}input.addEventListener('change',()=>change(input.value));field.append(input);return{field,input};}
function subsets(vertices,size){if(size<0)return[];let rows=[[]];for(let k=0;k<size;k++)rows=rows.flatMap(row=>vertices.slice(row.length?vertices.indexOf(row.at(-1))+1:0).map(id=>[...row,id]));return rows;}
/** All learner evidence is owned by this controller's closure, never storage. */
export function createEvidenceInput(part,graph,onChange=()=>{},{predictionDraft=false,predictionMethod=()=>''}={}){
 const host=el('section',undefined,'apos3-evidence');host.dataset.partId=part.id;host.dataset.evidenceType=part.type;
 const title=el('h3',part.label);title.id=`apos3-evidence-title-${++evidenceSerial}`;host.append(title);let value,cleanups=[];
 const change=next=>{value=structuredClone(next);onChange();};
 const child=(p,g=graph,cb=onChange)=>{const input=createEvidenceInput(p,g,cb);cleanups.push(()=>input.destroy());return input;};
 function vertexSet(label,g,changed,coverage=false){let selected=[];const box=el('div',undefined,'apos3-board'),caption=el('p','هنوز رأسی انتخاب نشده','apos3-selection');caption.dir='ltr';const board=createTeachingBoard(box,g,id=>{selected=selected.includes(id)?selected.filter(v=>v!==id):[...selected,id];board.update(selected);caption.textContent=selected.length?`{${selected.join(', ')}}`:'∅';changed([...selected]);},{coverage});cleanups.push(()=>board.destroy());host.append(el('p',label),box,caption);return()=>[...selected];}
 function table(centers,g,changed){const box=el('div',undefined,'apos3-table'),rows={};
  for(const vertex of g.vertices){const {field}=select(`پوشش ${vertex}`,[["none","بی‌پوشش"],...centers.map(id=>[id,`${id}؛ مرکز پوشاننده`])],v=>{if(v==='')delete rows[vertex];else rows[vertex]=v==='none'?null:v;changed({...rows});});box.append(field);}host.append(box);return box;
 }
 function graphBuilder(expected,changed,{mutableCount=false}={}){
  let current={vertices:[...expected.vertices],edges:[],directed:expected.directed,multigraph:expected.multigraph},pending=null;
  const box=el('div',undefined,'apos3-board'),list=el('ul',undefined,'apos3-edge-list'),status=el('p','ابتدا دو سر رابطه را به ترتیب انتخاب کن.');status.setAttribute('role','status');let board;
  function draw(){const focused=document.activeElement,focusId=box.contains(focused)?focused.dataset.vertexId:null,svgFocus=focused?.matches('.board-vertex'),edgeFocus=list.contains(focused)?Number(focused.dataset.edgeIndex):null;board?.destroy();board=createTeachingBoard(box,current,id=>{if(pending===null){pending=id;board.update([id]);status.textContent=`سر اول: ${id}؛ اکنون سر دوم را انتخاب کن.`;}else{const edge=[pending,id];pending=null;const key=e=>JSON.stringify(current.directed?e:[...e].sort());if(edge[0]===edge[1]&&!expected.edges.some(e=>e[0]===e[1]))status.textContent='در قرارداد این مدل طوقه نداریم.';else if(!current.multigraph&&current.edges.some(e=>key(e)===key(edge)))status.textContent='این رابطه قبلاً ساخته شده است.';else{current.edges.push(edge);status.textContent='رابطه اضافه شد.';changed(structuredClone(current));}draw();}});list.replaceChildren();current.edges.forEach((edge,index)=>{const row=el('li'),remove=action(`حذف ${edge.join(current.directed?' → ':' ↔ ')}${current.multigraph?` (${index+1})`:''}`,()=>{current.edges.splice(index,1);changed(structuredClone(current));draw();});remove.dataset.edgeIndex=index;row.append(remove);list.append(row);});if(focusId)box.querySelector(`${svgFocus?'.board-vertex':'.vertex-choice'}[data-vertex-id="${CSS.escape(focusId)}"]`)?.focus({preventScroll:true});else if(edgeFocus!==null)(list.querySelector(`[data-edge-index="${Math.min(edgeFocus,current.edges.length-1)}"]`)??box.querySelector('.vertex-choice'))?.focus({preventScroll:true});}
  if(mutableCount){const label=el('label','تعداد رأس مدل نقض (۲ تا ۹)'),count=el('input');count.type='number';count.min=2;count.max=9;count.value=current.vertices.length;count.setAttribute('aria-label','تعداد رأس مدل نقض');count.addEventListener('change',()=>{const n=Number(count.value);if(!Number.isInteger(n)||n<2||n>9)return;current.vertices=Array.from({length:n},(_,i)=>String.fromCharCode(97+i));current.edges=[];pending=null;changed(structuredClone(current));draw();});label.append(count);host.append(label);}
  const controls=group();controls.append(action('لغو سر اول',()=>{pending=null;board.update([]);status.textContent='سر اول را انتخاب کن.';}),action('پاک‌کردن رابطه‌ها',()=>{current.edges=[];pending=null;changed(structuredClone(current));draw();}));host.append(box,status,controls,list);draw();cleanups.push(()=>board?.destroy());return()=>structuredClone(current);
 }
 if(part.type==='number'){
  const input=el('input');input.type='text';input.inputMode='numeric';input.maxLength=6;input.setAttribute('aria-labelledby',title.id);input.addEventListener('input',()=>change(parseNumber(input.value)));host.append(input);
 }else if(part.type==='choice'||part.type==='classification'){
  const opts=part.type==='choice'?part.options.map(o=>[o.value,o.label]):[['true','بله'],['false','نه']];
  const {field}=select('پاسخ به '+part.label,opts,v=>change(v===''?undefined:part.type==='classification'?v==='true':v));host.append(field);
 }else if(part.type==='relation'||part.type==='model'){
  const read=graphBuilder(part.expected,change);value=read();
 }else if(part.type==='neighborhood'){
  value=[];vertexSet('با لمس رأس‌ها یا دکمه‌های زیر شکل، اعضای مجموعه را انتخاب کن.',graph,change);
 }else if(part.type==='route'){
  let route=[];const box=el('div',undefined,'apos3-board'),text=el('p','هنوز مسیری نساخته‌ای');text.dir='ltr';
  const board=createTeachingBoard(box,graph,id=>{route.push(id);value=[...route];text.textContent=route.join(' → ');board.update([id]);onChange();});cleanups.push(()=>board.destroy());
  host.append(box,text,action('برگشت یک گام',()=>{route.pop();value=[...route];text.textContent=route.join(' → ')||'∅';board.update(route.length?[route.at(-1)]:[]);onChange();}));value=[];
 }else if(part.type==='coverageTable'){
  host.append(el('p',`مراکز ثابت این جدول: {${part.selected.join(', ')}}`));const boardHost=el('div',undefined,'apos3-board');let active=[];const board=createTeachingBoard(boardHost,graph,id=>{active=active.includes(id)?active.filter(v=>v!==id):[...active,id];board.update(active);},{coverage:!predictionDraft});host.append(boardHost,el('p',predictionDraft?'پیش‌بینی کن؛ نتیجهٔ پوشش پس از ثبت در ابزار آزمایش باز می‌شود.':'ابزار آزمایش آزاد است؛ انتخاب آن، مراکز ثابت جدول بالا را عوض نمی‌کند.','model-key'));cleanups.push(()=>board.destroy());table(part.selected,graph,change);value={};
 }else if(part.type==='deletionTable'){
  const rows={};value={};for(const center of part.selected){const detail=el('details'),summary=el('summary',`حذف ${center} از انتخاب اولیه`);detail.append(summary);const nested=child({id:`delete-${center}`,type:'neighborhood',label:'تمام رأس‌های بی‌پوشش پس از همین حذف را انتخاب کن.',vertexId:graph.vertices[0],closed:false},graph,()=>{rows[center]=nested.read();change(rows);});
   // These sets are learner predictions, not neighborhood evaluations.
   detail.append(nested.element);host.append(detail);rows[center]=[];
  }value=structuredClone(rows);
 }else if(part.type==='dominatingSet'){
  let selected=[],rows={};value={selected,rows};let tableHost;
  vertexSet('مراکز دلخواهت را انتخاب کن؛ سپس جدول پوشش را کامل کن.',graph,next=>{selected=next;rows={};tableHost?.remove();tableHost=table(selected,graph,nextRows=>{rows=nextRows;change({selected,rows});});change({selected,rows});},true);
  tableHost=table(selected,graph,next=>{rows=next;change({selected,rows});});
 }else if(part.type==='minimumArgument'){
  let upper=[],lower={};value={upperWitness:upper,lowerBound:lower};const lowerHost=el('div',undefined,'apos3-lower-bound');let method='',lowerDispose=()=>{};
  const changed=()=>change({upperWitness:upper,lowerBound:lower});
  const renderLower=()=>{lowerDispose();const dispose=[];lower={method};lowerHost.replaceChildren();
   if(method==='capacity')for(const[key,label]of[['vertexCount','تعداد همهٔ رأس‌ها'],['maxClosedSize','بیشترین تعداد رأس تحت پوشش یک مرکز (Δ+۱)'],['bound','حد پایین حاصل با سقف تقسیم']]){const field=el('label',label),input=el('input');input.type='text';input.inputMode='numeric';input.setAttribute('aria-label',label);input.addEventListener('input',()=>{lower[key]=parseNumber(input.value);changed();});field.append(input);lowerHost.append(field);}
   if(method==='packing'){const input=createEvidenceInput({id:'packing',type:'neighborhood',label:'رأس‌هایی برگزین که هیچ مرکز نتواند دو موردشان را هم‌زمان بپوشاند.',vertexId:graph.vertices[0],closed:false},graph,()=>{lower.vertices=input.read();changed();});lower.vertices=[];lowerHost.append(input.element);dispose.push(()=>input.destroy());}
   if(method==='subset-witnesses'){const rows=subsets(graph.vertices,upper.length-1);lower.rows=rows.map(selected=>({selected,uncoveredWitness:''}));lowerHost.append(el('p',upper.length?`برای تک‌تک انتخاب‌های ${upper.length-1} عضوی یک رأس بی‌پوشش بده؛ از یکنوایی پوشش، اندازه‌های کوچک‌تر هم رد می‌شوند.`:'ابتدا انتخاب بالا را بساز.'));
    for(const[index,selected]of rows.entries()){const{field}=select(`انتخاب {${selected.join(', ')||'∅'}}: کدام رأس بی‌پوشش است؟`,graph.vertices.map(v=>[v,v]),v=>{lower.rows[index].uncoveredWitness=v;changed();});lowerHost.append(field);}}
   lowerDispose=()=>dispose.forEach(fn=>fn());changed();
  };
  vertexSet('شاهد بالا: مراکزی انتخاب کن که همهٔ رأس‌ها را بپوشانند.',graph,next=>{upper=next;if(method==='subset-witnesses')renderLower();else changed();},true);
  const names={capacity:'کران ظرفیت: هر مرکز حداکثر چند رأس را می‌پوشاند؟',packing:'رأس‌های دور: هیچ مرکز دو مورد را هم‌زمان نمی‌پوشاند', 'subset-witnesses':'رد همهٔ انتخاب‌های یک اندازه کوچک‌تر با رأس بی‌پوشش'};
  const{field}=select('روش دلیل حد پایین',part.lowerBoundMethods.map(m=>[m,names[m]]),v=>{method=v;renderLower();});host.append(field,lowerHost);cleanups.push(()=>lowerDispose());
 }else if(part.type==='minimumFamily'){
  const inputs=Array.from({length:part.count},(_,i)=>child({id:`proof-${i}`,type:'minimumArgument',label:`کمینهٔ ${i+1}؛ مجموعه‌ها باید متمایز باشند.`,lowerBoundMethods:part.lowerBoundMethods},graph,()=>change(inputs.map(input=>input.read()))));host.append(...inputs.map(i=>i.element));value=inputs.map(i=>i.read());
 }else if(part.type==='counterexample'){
  let counterGraph={...graph,directed:false,multigraph:false,edges:[]},selected=[],smaller=[],route=[];const fields=el('div');
  const update=()=>change(part.claim==='regular-implies-complete'?{graph:counterGraph}:part.claim==='minimal-implies-minimum'?{graph:counterGraph,selected,smallerWitness:smaller}:{graph:counterGraph,route});
  const redraw=()=>{fields.replaceChildren();const choices=[];
   if(part.claim==='minimal-implies-minimum'){
    const first=createEvidenceInput({id:'selected',type:'neighborhood',label:'مجموعهٔ مینیمال پیشنهادی',vertexId:counterGraph.vertices[0],closed:false},counterGraph,()=>{selected=first.read();update();});
    const second=createEvidenceInput({id:'smaller',type:'neighborhood',label:'یک مجموعهٔ پوشانندهٔ کوچک‌تر',vertexId:counterGraph.vertices[0],closed:false},counterGraph,()=>{smaller=second.read();update();});choices.push(first,second);
   }else if(part.claim==='reachable-implies-adjacent'){
    const input=createEvidenceInput({id:'counter-route',type:'route',label:'مسیر شاهد؛ دو سرش نباید یال مستقیم داشته باشند.',start:counterGraph.vertices[0],end:counterGraph.vertices.at(-1)},counterGraph,()=>{route=input.read();update();});choices.push(input);
   }
   fields.append(...choices.map(i=>i.element));return()=>choices.forEach(i=>i.destroy());
  };
  let dispose=()=>{};graphBuilder(counterGraph,next=>{counterGraph=next;selected=[];smaller=[];route=[];dispose();dispose=redraw();update();},{mutableCount:true});host.append(fields);dispose=redraw();cleanups.push(()=>dispose());update();
 }else if(part.type==='reflection'){
  const copy=el('label','توضیح، روش یا بازنگری خودت؛ فقط در همین نشست می‌ماند.'),text=el('textarea');text.rows=3;text.maxLength=3000;text.setAttribute('aria-label','توضیح و بازنگری موقت');text.addEventListener('input',onChange);copy.append(text);host.append(copy);value=Object.fromEntries(part.criteria.map(c=>[c.id,false]));for(const criterion of part.criteria){const label=el('label',undefined,'apos3-review-item'),check=el('input');check.type='checkbox';check.dataset.criterionId=criterion.id;check.addEventListener('change',()=>{value[criterion.id]=check.checked;onChange();});label.append(check,el('span',criterion.label));host.append(label);}
 }else if(part.type==='prediction'){
  let committed=null;const nested=createEvidenceInput(part.part,graph,()=>{if(committed)committed.revised=nested.read();onChange();},{predictionDraft:true});cleanups.push(()=>nested.destroy());const status=el('p');status.setAttribute('role','status');const experiment=el('div',undefined,'apos3-experiment');experiment.hidden=true;
  const commit=action('ثبت پیش‌بینی و بازکردن آزمایش',()=>{try{const method=predictionMethod().trim();if(!method)throw Error('پیش از آزمایش، روش پیش‌بینی را در کادر بالای فعالیت بنویس؛ درستی متن خودکار سنجیده نمی‌شود.');committed=commitTeachingPrediction(part,graph,nested.read());commit.disabled=true;status.textContent='روش اولیهٔ تو: '+method+' — پیش‌بینی اولیه در همین نشست ثبت شد؛ حالا آزمایش کن و پاسخ بالا را در صورت نیاز اصلاح کن.';experiment.hidden=false;onChange();}catch(error){status.textContent=error.message;}});
  commit.dataset.action='commit-prediction';
  experiment.append(action('آزمایش و مقایسه با پیش‌بینی',()=>{const p=part.part;let result='';if(p.type==='number')result=String(p.expected);else if(p.type==='choice')result=p.options.find(o=>o.value===p.expected).label;else if(p.type==='neighborhood'){const neighbors=graph.vertices.filter(v=>v!==p.vertexId&&graph.edges.some(e=>e.includes(v)&&e.includes(p.vertexId)));result=`{${[...(p.closed?[p.vertexId]:[]),...neighbors].join(', ')}}`;}else if(p.type==='coverageTable')result=graph.vertices.map(v=>`${v}: ${p.selected.filter(c=>c===v||graph.edges.some(e=>e.includes(c)&&e.includes(v))).join(' یا ')||'بی‌پوشش'}`).join('؛ ');else if(p.type==='deletionTable')result=p.selected.map(v=>`حذف ${v}: {${evaluateSelection(graph,p.selected.filter(c=>c!==v),'dominating').uncoveredVertexIds.join(', ')||'∅'}}`).join('؛ ');else result=assessEvidencePart(p,graph,nested.read())?'توالی فعلی با رابطه‌ها سازگار است.':'توالی فعلی را گام‌به‌گام با یال‌های مدل مقایسه کن.';output.textContent='نتیجهٔ ابزار: '+result;}));const output=el('p');output.setAttribute('role','status');experiment.append(output);host.append(nested.element,commit,status,experiment);
  return{element:host,read:()=>committed?structuredClone({...committed,revised:nested.read()}):undefined,destroy:()=>cleanups.forEach(fn=>fn())};
 }
 return{element:host,read:()=>structuredClone(value),destroy:()=>cleanups.forEach(fn=>fn())};
}
