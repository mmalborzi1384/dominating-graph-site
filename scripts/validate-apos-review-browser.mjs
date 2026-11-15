import { answersFor } from './fixtures/apos-authored.mjs';
// Cross-cutting phase-4 review on a static Pages-style subpath. Temporary Chrome profile only.
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),profile=await mkdtemp(join(tmpdir(),'apos-browser-'));
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/dominating-graph-site/, ''));if(!path.startsWith(root+'/')&&path!==root)throw Error();const file=path===root?join(path,'index.html'):path;res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin=`http://127.0.0.1:${server.address().port}/dominating-graph-site/`;
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
let ws,checks=0,failures=[],errors=[],pending=new Map(),seq=0;
const check=(value,msg)=>{checks++;if(!value){failures.push(msg);console.error('FAIL:',msg);}};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let port;for(let i=0;i<150;i++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}
 assert.ok(port,'Chrome debugging ready');
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+':'+(m.params.exceptionDetails.exception?.description??''));});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const run=async(expression)=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:origin});
 for(let i=0;i<200;i++){if(await run('Boolean(window.graphRepository && document.getElementById("records-export") && document.getElementById("lab-bank")?.querySelector(".practice-filters"))'))break;await pause(50);}
 const curriculum=JSON.parse(await readFile(join(root,'content/teaching.json'),'utf8'));
 check(await run('document.documentElement.dir==="rtl" && document.fonts.check("16px Vazirmatn") && Boolean(window.katex)'), 'Local RTL/font/KaTeX assets load under Pages subpath');
 // Completed flags are a navigation fixture, not evidence of learner achievement.
 await run(`(async()=>{window.qaCurriculum=await(await fetch('content/teaching.json')).json();const {completeActivity,initialProgress}=await import('./assets/js/domain/progress.js');let p=initialProgress(qaCurriculum);for(const a of qaCurriculum.activities)p=completeActivity(p,a.id,qaCurriculum);window.graphRepository.changeProgress(()=>p);window.qaShow=async id=>{const a=qaCurriculum.activities.find(a=>a.id===id),u=qaCurriculum.units.find(u=>u.id===a.unitId);location.hash='#teach/'+u.id;await new Promise(r=>setTimeout(r,30));document.querySelectorAll('.apos3-step-route button')[u.requiredActivityIds.indexOf(id)].click();await new Promise(r=>setTimeout(r,0));};})()`);
 const show=async id=>run(`qaShow(${JSON.stringify(id)})`);
 await run(await readFile(new URL('./fixtures/apos-browser-fill.js.txt',import.meta.url),'utf8'));
 const key=async(key,code=key)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:({Enter:13,' ':32,Escape:27})[key],text:key==='Enter'?'\r':key===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:({Enter:13,' ':32,Escape:27})[key]});};
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const{writeFile}=await import('node:fs/promises');await writeFile(`/tmp/apos4-${name}.png`,Buffer.from(r.data,'base64'));};
 // Real keyboard events: repeated edges must not throw focus back to the page.
 await show('L1-A1');
 await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] .vertex-choice[data-vertex-id=x]').focus()`);await key('Enter','Enter');
 await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] .vertex-choice[data-vertex-id=w]').focus()`);await key('Enter','Enter');
 check(await run(`document.activeElement.matches('.apos3-evidence[data-part-id=bridges] .vertex-choice[data-vertex-id=w]')`),'Graph construction retains keyboard focus after adding an edge');
 check(await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] .apos3-edge-list').children.length===1`),'Keyboard creates a real bridge');
 await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] .board-vertex[data-vertex-id=x]').focus()`);await key(' ','Space');
 await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] .board-vertex[data-vertex-id=w]').focus()`);await key(' ','Space');
 check(await run(`document.activeElement.matches('.apos3-evidence[data-part-id=bridges] .board-vertex[data-vertex-id=w]')`),'SVG keyboard focus also survives reconstruction');
 check(await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] .apos3-edge-list').children.length===2`),'Parallel bridge preserved using keyboard');
 // Resize the SAME board; no navigating/recreating the input or losing evidence.
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});await pause(70);
 check(await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] svg').viewBox.baseVal.width===340`),'Existing teaching graph switches to compact geometry after resize');
 check(await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] .apos3-edge-list').children.length===2`),'Resize preserves constructed parallel edges');
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await pause(70);
 check(await run(`document.querySelector('.apos3-evidence[data-part-id=bridges] svg').viewBox.baseVal.width===600`),'Existing teaching graph restores desktop geometry');
 await show('L1-O1');check(await run(`document.querySelectorAll('.apos3-card > details .teaching-graph').length===2`),'Comparison task exposes both layouts of the same graph');
 await show('L1-O2');check(await run(`document.querySelectorAll('.apos3-card > details .teaching-graph').length===1`),'Transformation shows the source graph while keeping construction answer separate');
 // Expose every disclosure and inspect all 32 actual cards in all four combinations.
 for(const theme of ['day','night'])for(const width of [360,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===360});
  await run(`window.graphRepository.setTheme('${theme}')`);
  const ratios=await run(`(()=>{const lum=rgb=>{const c=rgb.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};const e=document.createElement('span');e.style.backgroundColor='var(--surface)';document.body.append(e);const ratios=['ink','muted','heading','error'].map(token=>{e.style.color='var(--'+token+')';const style=getComputedStyle(e),a=lum(style.color),b=lum(style.backgroundColor);return{token,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});e.remove();return ratios;})()`);check(ratios.every(r=>r.ratio>=4.5),`Text token contrast ${theme}/${width} `+JSON.stringify(ratios));
  for(const a of curriculum.activities){
   await show(a.id);check(await run(`document.documentElement.dataset.theme==='${theme}'`),`Actual theme ${a.id}/${theme}/${width}`);await run(`document.querySelectorAll('.apos3-workspace details').forEach(d=>d.open=true)`);
   const audit=await run(`(()=>{const card=document.querySelector('.apos3-card');return{overflow:document.documentElement.scrollWidth>innerWidth+1,badMath:card.querySelectorAll('.math-fallback-note,.katex-error').length,unlabeled:[...card.querySelectorAll('input,textarea,select')].filter(e=>!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.labels?.length).length,math:[...card.querySelectorAll('.math')].every(e=>e.dir==='ltr'),small:[...card.querySelectorAll('button')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).some(e=>e.getBoundingClientRect().height<43),center:[...card.querySelectorAll('.vertex-number')].every(e=>e.getAttribute('x')==='0'&&e.getAttribute('y')==='0'&&getComputedStyle(e).textAnchor==='middle'&&getComputedStyle(e).dominantBaseline==='central')};})()`);
   check(!audit.overflow,`No overflow ${a.id}/${theme}/${width}`);check(!audit.badMath&&audit.math,`LTR KaTeX ${a.id}/${theme}/${width}`);check(!audit.unlabeled,`Named form controls ${a.id}/${theme}/${width}`);check(!audit.small&&audit.center,`Target size/center labels ${a.id}/${theme}/${width}`);
   if(['L1-A1','L1-O2','L2-O3','L2-S4'].includes(a.id)){
    await run(`document.querySelector('.apos3-card').scrollIntoView({block:'start',behavior:'instant'})`);await pause(900);await shot(`${a.id}-${theme}-${width}`);
   }
   if(a.exitVariants){
    await run(`fillActivity(${JSON.stringify(a)},${JSON.stringify(answersFor(a))});document.querySelector('[data-action=check]').click();document.querySelector('[data-action=continue]').click();document.querySelectorAll('.apos3-workspace details').forEach(d=>d.open=true);`);
    check(await run(`document.querySelector('.apos3-workspace').dataset.exitVariant==='true'`),`Fresh exit shown ${a.id}/${theme}/${width}`);
    check(await run(`document.documentElement.scrollWidth<=innerWidth+1&&!document.querySelector('.apos3-card .math-fallback-note,.apos3-card .katex-error')&&document.documentElement.dataset.theme==='${theme}'`),`Fresh exit layout/math/theme ${a.id}/${theme}/${width}`);
   }
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 // Light proof that a feedback correction is presented/focused without erasing a past pass.
 await show('L1-A1');await run(`document.querySelector('[data-action=check]').click()`);
 check(await run(`document.activeElement.closest('.apos3-evidence')?.dataset.partId==='mapping'`),'Invalid response focuses first evidence needing correction');
 check(await run(`window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.length===32`),'Wrong review does not revoke existing completion');
 await show('L1-P1');
 check(await run(`![...document.querySelectorAll('.apos3-evidence .board-vertex')].some(e=>e.getAttribute('aria-label').includes('بی‌پوشش'))`),'Selection-only prediction does not announce a coverage result');
 // Real touch input on the SVG, with no synthetic click from page JS.
 await send('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await run(`document.querySelector('.apos3-evidence .board-vertex').scrollIntoView({block:'center',behavior:'instant'})`);await pause(100);
 const point=await run(`(()=>{const r=document.querySelector('.apos3-evidence .board-vertex circle').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:2,radiusY:2,force:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(70);
 check(await run(`document.querySelector('.apos3-evidence .board-vertex').getAttribute('aria-pressed')==='true'`),'Touch selects an actual teaching vertex');
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(100);
 check(await run(`document.documentElement.dataset.motion==='off'`),'System reduced-motion overrides motion preference');
 check(await run(`document.getAnimations().every(a=>a.playState!=='running'||a.effect?.getComputedTiming().duration<=1)`),'Reduced-motion stops decorative movement');
 await send('Emulation.setEmulatedMedia',{features:[]});
 // Shared listboxes: hit-test overlap with actual lower actions in both opening directions.
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 for(const tab of ['practice','lab']){
  await run(`location.hash='#${tab}'`);await pause(100);
  await run(`(()=>{const panel=document.getElementById('panel-${tab}'),q=panel.querySelector('.practice-filters label:last-of-type select');q.value='Q001';if(![...q.options].some(o=>o.value==='Q001'))q.value=[...q.options].find(o=>/^Q/.test(o.value)).value;q.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause(70);
  const selector=`#panel-${tab} .practice-response .select-field .glass-select-trigger`;
  await run(`document.querySelector('#panel-${tab} .practice-response > button').click()`);await pause(30);
  for(const direction of ['down','up']){await send('Emulation.setDeviceMetricsOverride',{width:1280,height:direction==='up'?400:900,deviceScaleFactor:1,mobile:false});
   await run(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});b.scrollIntoView({block:'center',behavior:'instant'});scrollBy({top:b.getBoundingClientRect().top-${direction==='down'?200:280},behavior:'instant'});b.click();})()`);await pause(70);
   const status=await run(`(()=>{const b=document.querySelector(${JSON.stringify(selector)}),w=b.closest('.select-field'),menu=w.querySelector('.glass-select-menu'),options=[...menu.querySelectorAll('[role=option]')];return{up:w.classList.contains('opens-up'),visible:!menu.hidden,onTop:options.every(o=>{const r=o.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return y<0||y>innerHeight||o.contains(document.elementFromPoint(x,y));})};})()`);
   console.log('Listbox',tab,direction,status);check(status.visible&&status.up===(direction==='up')&&status.onTop,`${tab} ${direction} listbox paints over lower buttons`);
   await run(`document.querySelector(${JSON.stringify(selector)}).focus()`);await key('Escape','Escape');
   check(await run(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-expanded')==='false'&&document.activeElement===document.querySelector(${JSON.stringify(selector)})`),`${tab} Escape closes/restores focus`);
  }
 }
 // Drag regression against actual existing source workbench; mouse crosses other labels.
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await run(`location.hash='#lab'`);await pause(60);
 const graph=await run(`(()=>{const s=document.querySelector('#panel-lab .source-workbench'),mode=s.querySelectorAll('.workbench-tools select')[1];mode.value='move';mode.dispatchEvent(new Event('change',{bubbles:true}));const svg=s.querySelector('svg.source-graph');svg.scrollIntoView({block:'center',behavior:'instant'});window.getSelection().removeAllRanges();return svg?true:false;})()`);
 check(graph,'Lab movable source graph available');await pause(100);
 const drag=await run(`(()=>{const svg=document.querySelector('#panel-lab svg.source-graph'),g=[...svg.querySelectorAll('.board-vertex')],a=g[0].querySelector('circle').getBoundingClientRect(),b=g.at(-1).querySelector('circle').getBoundingClientRect();return{before:g[0].getAttribute('transform'),x:a.x+a.width/2,y:a.y+a.height/2,toX:b.x+b.width/2+40,toY:b.y+b.height/2+25};})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:drag.x,y:drag.y,button:'left',clickCount:1});
 for(let i=1;i<=8;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:drag.x+(drag.toX-drag.x)*i/8,y:drag.y+(drag.toY-drag.y)*i/8,buttons:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:drag.toX,y:drag.toY,button:'left',clickCount:1});
 check(await run(`window.getSelection().toString()===''`),'Dragging source graph never selects surrounding vertex text');
 check(await run(`document.querySelector('#panel-lab svg.source-graph .board-vertex').getAttribute('transform')!==${JSON.stringify(drag.before)}`),'Source graph vertex really moves');
 for(const tab of ['teach','practice','competition','records','lab']){await run(`location.hash='#${tab}'`);await pause(50);check(await run(`!document.getElementById('panel-${tab}').hidden`),'Five-tab navigation '+tab);}
 check(errors.length===0,'No Runtime exceptions: '+errors.join('\n'));
 console.log(JSON.stringify({checks,failures,errors,screenshots:'/tmp/apos4-*.png',physicalTouchDevice:false},null,2));
 assert.equal(failures.length,0,'Cross-cutting checks failed');
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
