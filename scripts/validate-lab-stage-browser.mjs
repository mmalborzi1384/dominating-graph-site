// Browser acceptance: visual-only world and zoom must never change graph answers.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..'),profile=await mkdtemp(join(tmpdir(),'world-test-'));
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/dominating-graph-site/,''));if(!path.startsWith(root+'/')&&path!==root)throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.woff2':'font/woff2'})[extname(path)]??'application/octet-stream');res.end(await readFile(path===root?join(root,'index.html'):path));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,serial=0,checks=0;const pending=new Map(),errors=[];
const check=(ok,label)=>{checks++;assert.ok(ok,label);};
try{
 let port;for(let i=0;i<150;i++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/dominating-graph-site/index.html#lab`});
 for(let i=0;i<200;i++){if(await run(`Boolean(window.graphRepository&&document.querySelector('#lab-bank .practice-filters'))`))break;await pause(50);}
 const key=async key=>{const code=key===' '?'Space':key,windowsVirtualKeyCode=key===' '?32:key==='Enter'?13:key==='Escape'?27:0,text=key==='Enter'?'\r':key===' '?' ':undefined;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,text});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode});await pause(100);};
 const click=selector=>run(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const choose=(selector,value)=>run(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});n.value=${JSON.stringify(value)};n.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 const build=async(family='path',n=6)=>{await choose('#lab-family',family);await run(`document.querySelector('#lab-n').value=${n}`);await click('#lab-build');await pause(100);};
 const selectIds=async ids=>{await click('#lab-clear');for(const id of ids)await click(`#lab-drawing-board .vertex-choice[data-vertex-id="${id}"]`);};
 await run(`window.beforeState=JSON.stringify(graphRepository.snapshot());window.toolNodes=[...document.querySelectorAll('.lab-tool-section')];window.noticeNode=document.getElementById('lab-notice');`);
 const measurements=[];
 for(const width of [320,390,768,1280])for(const theme of ['day','night']){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<640});await run(`graphRepository.setTheme('${theme}')`);await pause(200);
  await build();
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'page fits '+width+theme);
  check(await run(`toolNodes.every((node,i)=>node===document.querySelectorAll('.lab-tool-section')[i])`),'same details DOM');
  check(await run(`!document.querySelector('#lab-drawing-board .vertex-diagnostic')`),'no diagnosis before request');
  await selectIds(['b']);await click('#lab-check');
  check(await run(`document.querySelectorAll('#lab-drawing-board [data-diagnostic=missed]').length===3`),'P6 uncovered d e f');
  check(await run(`document.querySelector('#lab-notice').textContent.includes('بی‌پوشش')`),'explanation near board');
  check(await run(`noticeNode===document.getElementById('lab-notice')&&noticeNode.getAttribute('aria-live')==='polite'`),'one persistent live result');
  await selectIds(['b','e']);
  check(await run(`!document.querySelector('#lab-drawing-board .vertex-diagnostic')&&document.getElementById('lab-notice').hidden`),'edit clears stale diagnosis');
  await click('#lab-check');check(await run(`document.getElementById('lab-notice').dataset.correct==='true'`),'minimum accepted');
  await selectIds(['a','b','c','d','e','f']);await click('#lab-hint');
  check(await run(`document.querySelectorAll('#lab-drawing-board .is-removable').length===6`),'removable markers');
  check(await run(`[...document.querySelectorAll('#lab-drawing-board .is-removable')].every(n=>n.classList.contains('is-selected')&&n.getAttribute('aria-label').includes('حذف‌پذیر'))`),'owner selection unchanged and names descriptive');
  await selectIds(['b','d','f']);await click('#lab-check');
  check(await run(`!document.querySelector('#lab-drawing-board .vertex-diagnostic')&&document.getElementById('lab-notice').textContent.includes('مینیمال')`),'minimal nonminimum not marked removable');
  await click('#lab-clear');await click('#lab-hint');check(await run(`document.querySelectorAll('#lab-drawing-board [data-diagnostic=missed]').length===6`),'empty selection diagnosed');
  await selectIds(['b','d']);await click('#lab-check');
  check(await run(`document.querySelector('#lab-drawing-board [data-vertex-id=c]').dataset.ownerIds==='b,d'&&document.querySelectorAll('#lab-drawing-board [data-vertex-id=c] .vertex-coverage [data-owner-id]').length===2`),'multiple-owner hatch intact');
  await click('#lab-clear');await choose('#lab-family','star');await click('#lab-build');await selectIds(['a']);await click('#lab-check');
  check(await run(`document.querySelectorAll('#lab-drawing-board .is-covered:not(.is-selected)').length===5`),'single-owner coverage');
  const sizes=await run(`(()=>{document.querySelectorAll('.lab-tool-section').forEach(d=>d.open=true);return [...document.querySelectorAll('.lab-tool-body button')].filter(b=>b.getBoundingClientRect().width).map(b=>({h:b.getBoundingClientRect().height,w:b.getBoundingClientRect().width}));})()`);
  check(sizes.every(r=>r.h>=44&&r.w>=44),'44px actions '+width+theme);
  const ratio=await run(`(()=>{const rgb=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number),lum=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),s=getComputedStyle(document.querySelector('#lab-tools-review')),bg=getComputedStyle(document.querySelector('.lab-tool-section')).backgroundColor;const a=lum(rgb(s.color)),b=lum(rgb(bg));return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);})()`);
  check(ratio>=4.5,'opaque text contrast');measurements.push({width,theme,ratio});
  if([390,1280].includes(width)){
   await build();await selectIds(['b']);await click('#lab-check');await run(`document.querySelector('#lab-tools-change').open=false;document.querySelector('#lab-tools-build').open=false;document.querySelector('#lab-drawing-board').scrollIntoView({block:'start',behavior:'instant'})`);await pause(400);
   const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/lab-stage-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 // All stations retain the board, tools, open state, values and typed answer.
 await run(`window.originalSvg=document.querySelector('#lab-drawing-board svg');document.querySelector('#lab-target-n').value=9;document.querySelector('#lab-tools-change').open=true;`);
 const stations=await run(`[...document.querySelector('#lab-station').options].map(o=>o.value)`);
 for(const id of stations){await choose('#lab-station',id);check(await run(`document.querySelector('#lab-drawing-board svg')===originalSvg&&document.querySelector('#lab-tools-change').open&&document.querySelector('#lab-target-n').value==='9'`),'station retains tool and board '+id);await click('#lab-check');}
 await choose('#lab-station','gamma');await run(`document.getElementById('lab-answer').value=1;document.getElementById('lab-answer').dispatchEvent(new Event('input'))`);check(await run(`!document.querySelector('.vertex-diagnostic')`),'numeric edit clears diagnosis');
 await choose('#lab-station','formula');await click('#lab-observe');await build('cycle',6);await click('#lab-observe');check(await run(`document.querySelectorAll('.lab-observations > div > p').length===2`),'notes survive board load');
 await choose('#lab-station','minimal');await click('#lab-counterexample');await click('#lab-check');check(await run(`document.getElementById('lab-notice').textContent.includes('مینیمال')`),'counterexample remains functional');
 // n/gamma genuinely constructs the requested graph and invalid input retains it.
 await run(`document.getElementById('lab-target-n').value=8;document.getElementById('lab-target-gamma').value=3`);await click('#lab-draw-start');
 check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex').length===8`),'construct n');
 await click('#lab-solutions');check(await run(`document.getElementById('lab-notice').textContent.split(': ')[1].split(' | ').every(s=>s.split('، ').length===3)`),'constructed gamma');
 await run(`window.validSvg=document.querySelector('#lab-drawing-board svg');document.getElementById('lab-target-gamma').value=9`);await click('#lab-draw-start');check(await run(`document.querySelector('#lab-drawing-board svg')===validSvg&&document.getElementById('lab-notice').dataset.tone==='error'`),'invalid construction retains model');
 const preparedModels=await run(`(async()=>{const bank=await(await fetch('./docs/question-bank.json')).json();return [...document.querySelector('#lab-prepared').options].map(o=>({id:o.value,graph:bank.questions.find(q=>q.id===o.value).graph}));})()`);
 for(const {id,graph} of preparedModels){await choose('#lab-prepared',id);await click('#lab-load');check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex').length===${graph.n}&&document.querySelectorAll('#lab-drawing-board .board-edge').length===${graph.edges.length}&&document.getElementById('lab-notice').hidden&&!document.querySelector('#lab-drawing-board .vertex-diagnostic')`),'prepared model topology loads without error or stale diagnosis '+id);}
 await build();await choose('#lab-station','gamma');await selectIds(['b','e']);await run(`document.getElementById('lab-answer').value=1`);await click('#lab-check');
 check(await run(`document.getElementById('lab-notice').dataset.correct==='false'&&document.getElementById('lab-notice').textContent.includes('عددی درست نیست')`),'correct coverage with wrong numeric answer remains error');
 await run(`document.getElementById('lab-answer').value=2`);await click('#lab-check');check(await run(`document.getElementById('lab-notice').dataset.correct==='true'`),'correct numeric and coverage accepted');
 // Geometry-only moves keep presentation, topology redraw restores the shared view API.
 await build();await click('#lab-drawing-board .graph-zoom button:last-child');
 await click('#lab-drawing-board .graph-focus-toggle');await click('#lab-drawing-board .graph-device-switch');
 await run(`window.oldSvg=document.querySelector('#lab-drawing-board svg');window.viewBefore=oldSvg.graphView.getState();document.getElementById('lab-edge-from').value='a';document.getElementById('lab-edge-to').value='c';document.getElementById('lab-edge-toggle').focus();`);await click('#lab-edge-toggle');
 check(await run(`document.activeElement.id==='lab-edge-toggle'&&JSON.stringify(document.querySelector('#lab-drawing-board svg').graphView.getState())===JSON.stringify(viewBefore)`),'topology retains zoom, input, expanded state and focus');
 check(await run(`oldSvg.graphView===undefined&&!oldSvg.isConnected`),'redraw removes old state API and board');await click('#lab-drawing-board .graph-focus-toggle');
 await run(`document.querySelector('#lab-tools-change > summary').focus()`);const openBefore=await run(`document.getElementById('lab-tools-change').open`);await key(' ');check(await run(`document.getElementById('lab-tools-change').open`)!==openBefore,'Space toggles native tools');await key('Enter');check(await run(`document.getElementById('lab-tools-change').open`)===openBefore,'Enter restores native tools');
 await choose('#lab-edit-mode','connect');const edgeCount=await run(`document.querySelectorAll('#lab-drawing-board .board-edge').length`);await click('#lab-drawing-board .vertex-choice[data-vertex-id=a]');await click('#lab-drawing-board .vertex-choice[data-vertex-id=d]');check(await run(`document.querySelectorAll('#lab-drawing-board .board-edge').length`)===edgeCount+1,'two-vertex connection mode');await choose('#lab-edit-mode','select');
 await choose('#lab-move-vertex','a');const geometry=await run(`document.querySelector('#lab-drawing-board [data-vertex-id=a]').getAttribute('transform')`);await click('[data-direction=down]');check(await run(`document.querySelector('#lab-drawing-board [data-vertex-id=a]').getAttribute('transform')`)!==geometry,'movement pad');
 await click('#lab-drawing-board .graph-view-switch > button:nth-child(2)');await pause(700);check(await run(`!document.querySelector('#lab-drawing-board .graph-three').hidden`),'3D ready');
 await selectIds(['a','b','c','d','e','f']);await click('#lab-check');await pause(200);
 check(await run(`document.querySelectorAll('#lab-drawing-board .graph-three-labels [data-diagnostic=removable]').length===6`),'3D removable labels');
 await run(`document.getElementById('lab-drawing-board').scrollIntoView({block:'start',behavior:'instant'})`);await pause(300);const threeShot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/lab-stage-three-removable.png',Buffer.from(threeShot.data,'base64'));
 await selectIds(['a']);await click('#lab-check');await pause(200);check(await run(`document.querySelectorAll('#lab-drawing-board .graph-three-labels [data-diagnostic=missed]').length>0`),'3D uncovered labels');
 await run(`window.threeBefore=document.querySelector('#lab-drawing-board svg').graphView.getState()`);await click('#lab-edge-toggle');await pause(700);check(await run(`document.querySelector('#lab-drawing-board svg').graphView.getState().three&&document.querySelector('#lab-drawing-board svg').graphView.getState().zoom===threeBefore.zoom&&!document.querySelector('#lab-drawing-board .vertex-diagnostic')`),'3D topology state restored, stale markers cleared');
 await click('#lab-drawing-board .graph-view-switch > button:first-child');
 // Native keyboard and touch selection, without replacing DOM handlers.
 await run(`document.querySelector('#lab-drawing-board [data-vertex-id=b]').focus()`);await key('Enter');check(await run(`document.querySelector('#lab-drawing-board [data-vertex-id=b]').getAttribute('aria-pressed')==='true'`),'keyboard selection');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await run(`document.querySelector('#lab-drawing-board .vertex-choice[data-vertex-id=b]').scrollIntoView({block:'center',behavior:'instant'})`);const p=await run(`(()=>{const r=document.querySelector('#lab-drawing-board .vertex-choice[data-vertex-id=b]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);check(await run(`document.querySelector('#lab-drawing-board [data-vertex-id=b]').getAttribute('aria-pressed')==='false'`),'touch selection');
 // Real custom select opening down remains above adjacent tools.
 await run(`document.getElementById('lab-tools-build').open=true;document.getElementById('lab-tools-change').open=true;document.querySelector('#lab-family').closest('.select-field').querySelector('button').scrollIntoView({block:'start',behavior:'instant'});scrollBy(0,-80)`);await click('#lab-family + .glass-select-trigger');await pause(150);
 check(await run(`(()=>{const f=document.getElementById('lab-family').closest('.select-field'),o=f.querySelector('[role=option]'),r=o.getBoundingClientRect();return !f.classList.contains('opens-up')&&r.height>0&&o.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`),'downward select clickable above tools');await key('Escape');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const width of [390,1280])for(const theme of ['day','night']){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<640});await run(`graphRepository.setTheme('${theme}');document.documentElement.style.fontSize='200%'`);await pause(100);check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'200% text fits '+width+theme);await run(`document.documentElement.style.fontSize=''`);}
 check(await run(`JSON.stringify(graphRepository.snapshot().state.teachingProgress)===JSON.stringify(JSON.parse(beforeState).state.teachingProgress)&&JSON.stringify(graphRepository.snapshot().state.attempts)===JSON.stringify(JSON.parse(beforeState).state.attempts)&&JSON.stringify(graphRepository.snapshot().state.sessions)===JSON.stringify(JSON.parse(beforeState).state.sessions)`),'no lab progress, attempts or sessions written');
 // Neither other tab receives our new diagnosis automatically.
 for(const hash of ['practice','teach','competition']){await run(`location.hash='${hash}'`);await pause(200);check(await run(`!document.querySelector('#panel-${hash} .vertex-diagnostic')`),'no disclosure '+hash);}
 await run(`location.hash='lab'`);await build();
 await run(`window.nativeContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:nativeContext.call(this,type,...args);};`);await click('#lab-drawing-board .graph-view-switch > button:nth-child(2)');await pause(500);
 check(await run(`document.querySelector('#lab-drawing-board .graph-stage [role=status]').textContent.includes('در دسترس نیست')&&!document.querySelector('#lab-drawing-board svg').hidden`),'WebGL fallback');await click('#lab-check');check(await run(`document.querySelectorAll('#lab-drawing-board [data-diagnostic=missed]').length===6`),'diagnostics work without WebGL');
 check(errors.length===0,'runtime errors '+errors.join(' / '));console.log(JSON.stringify({checks,measurements,errors},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
