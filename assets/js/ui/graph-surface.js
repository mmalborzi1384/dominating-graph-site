import {createVertexSelection} from './vertex-selection.js';
let serial=0;
const NS='http://www.w3.org/2000/svg';
const make=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
/** One edge/vertex renderer for lessons, source workbenches, practice, matches and lab. */
export function paintGraph(svg,graph,places,onToggle,options={}){
 svg.replaceChildren();const marker='graph-arrow-'+(++serial),defs=make('defs'),arrow=make('marker',{id:marker,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});
 arrow.append(make('path',{d:'M0 0 10 5 0 10Z',fill:'var(--graph-line)'}));defs.append(arrow);svg.append(defs);
 const points=new Map(places.map(p=>[p.id,p])),groups=new Map(),edges=[];
 for(const edge of graph.edges){const key=JSON.stringify([...edge].sort());if(!groups.has(key))groups.set(key,[]);groups.get(key).push(edge);}
 for(const same of groups.values())same.forEach(([a,b],i)=>{const path=make('path',{class:'board-edge',fill:'none'});if(graph.directed)path.setAttribute('marker-end',`url(#${marker})`);svg.append(path);edges.push({a,b,i,count:same.length,path});});
 const selection=createVertexSelection(svg,graph,places,onToggle,options);
 function layout(){for(const{a,b,i,count,path}of edges){const p=points.get(a),q=points.get(b);let d;if(a===b)d=`M${p.x-12} ${p.y-14} C${p.x-65} ${p.y-75} ${p.x+65} ${p.y-75} ${p.x+12} ${p.y-14}`;else{const dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1,off=(i-(count-1)/2)*40*(a.localeCompare(b)<0?1:-1),cx=(p.x+q.x)/2-dy/len*off,cy=(p.y+q.y)/2+dx/len*off;const l1=Math.hypot(cx-p.x,cy-p.y)||1,l2=Math.hypot(q.x-cx,q.y-cy)||1;d=`M${p.x+(cx-p.x)/l1*24} ${p.y+(cy-p.y)/l1*24} Q${cx} ${cy} ${q.x-(q.x-cx)/l2*26} ${q.y-(q.y-cy)/l2*26}`;}path.setAttribute('d',d);}
 for(const p of places)selection.views.get(p.id).group.setAttribute('transform',`translate(${p.x} ${p.y})`);}
 layout();return{...selection,layout};
}
/** Shared view switch. 3D observes the same SVG state; it never owns a second answer. */
export function attachGraphView(svg){
 let viewport=null;if(!svg.parentElement.classList.contains('source-graph-viewport')){viewport=document.createElement('div');viewport.className='graph-surface-viewport';viewport.tabIndex=0;viewport.setAttribute('aria-label','برد گراف؛ برای مدل پرتراکم داخل برد پیمایش کن');svg.before(viewport);viewport.append(svg);}
 const bar=document.createElement('div');bar.className='graph-view-switch';bar.setAttribute('role','group');bar.setAttribute('aria-label','نمای گراف');
 const stage=document.createElement('div');stage.className='graph-three';stage.hidden=true;
 const note=document.createElement('p');note.className='model-key';note.setAttribute('role','status');
 let view=null,dead=false,loading=false,generation=0,threeMode=false,zoom=1;const buttons=[];
 const scrollport=viewport??svg.parentElement;
 const originalWidth=svg.style.width,originalMaxWidth=svg.style.maxWidth;
 const zoomBar=document.createElement('div');zoomBar.className='graph-zoom';zoomBar.setAttribute('role','group');zoomBar.setAttribute('aria-label','بزرگ‌نمایی گراف');
 const zoomButtons=[];
 function updateZoom(){const value=threeMode?(view?.getZoom()??1):zoom;zoomButtons[0].disabled=value<=.51;zoomButtons[2].disabled=value>=2.99;zoomButtons[1].textContent=`${Math.round(value*100).toLocaleString('fa-IR')}٪`;}
 function changeZoom(factor){if(threeMode){view?.zoomBy(factor);updateZoom();return;}zoom=factor===0?1:Math.max(.5,Math.min(3,zoom*factor));svg.style.width=zoom===1?originalWidth:`max(${zoom*100}%,${(parseFloat(svg.style.minWidth)||0)*zoom}px)`;svg.style.maxWidth=zoom===1?originalMaxWidth:'none';scrollport.classList.toggle('is-zoomed',zoom!==1);fit();updateZoom();}
 for(const[title,label,factor]of [['−','کاهش زوم',1/1.25],['۱۰۰٪','بازنشانی زوم',0],['+','افزایش زوم',1.25]]){const b=document.createElement('button');b.type='button';b.textContent=title;b.setAttribute('aria-label',label);b.addEventListener('click',()=>changeZoom(factor));zoomButtons.push(b);zoomBar.append(b);}
 stage.addEventListener('graphzoom',updateZoom);
 function mode(three){threeMode=three;if(viewport)viewport.hidden=three;svg.hidden=three;svg.toggleAttribute('hidden',three);stage.hidden=!three;buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(Boolean(i)===three)));view?.setVisible(three);updateZoom();}
 for(const[title,three]of [['۲بعدی',false],['۳بعدی',true]]){const b=document.createElement('button');b.type='button';b.textContent=title;b.setAttribute('aria-pressed',String(!three));buttons.push(b);b.addEventListener('click',async()=>{const request=++generation;if(!three){mode(false);note.textContent='';return;}if(loading||dead)return;loading=true;b.disabled=true;note.textContent='در حال آماده‌سازی نمای سه‌بعدی…';try{if(!view){const{createThreeView}=await import('./graph-three.js');if(dead||request!==generation)return;stage.hidden=false;view=createThreeView(stage,svg);}mode(true);note.textContent='برای چرخش، زمینه را بکش؛ دکمه‌های رأس زیر برد نیز در دسترس‌اند.';}catch{mode(false);stage.replaceChildren();note.textContent='نمای سه‌بعدی در این مرورگر در دسترس نیست؛ ابزار دوبعدی آماده است.';}finally{loading=false;b.disabled=false;}});bar.append(b);}
 const anchor=viewport??svg;bar.append(zoomBar);anchor.before(bar);anchor.after(stage,note);updateZoom();
 const fit=()=>{const m=svg.getScreenCTM();if(!m)return;const scale=Math.hypot(m.a,m.b);if(scale)for(const hit of svg.querySelectorAll('.vertex-hit'))hit.setAttribute('r',Math.max(23,22.5/scale));};const resize=new ResizeObserver(fit);resize.observe(svg);fit();
 let box=svg.getAttribute('viewBox');const geometry=new MutationObserver(()=>{const next=svg.getAttribute('viewBox');if(next===box)return;box=next;zoom=1;svg.style.width=originalWidth;svg.style.maxWidth=originalMaxWidth;scrollport.classList.remove('is-zoomed');updateZoom();});geometry.observe(svg,{attributes:true,attributeFilter:['viewBox']});
 return{destroy(){resize.disconnect();geometry.disconnect();dead=true;view?.destroy();bar.remove();stage.remove();note.remove();}};
}
