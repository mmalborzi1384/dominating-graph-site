// Real Chrome regression for the lab/navigation follow-up, on a Pages-style subpath.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),profile=await mkdtemp(join(tmpdir(),'graph-navigation-'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/dominating-graph-site/,''));if(path!==root&&!path.startsWith(root+'/'))throw Error();const file=path===root?join(path,'index.html'):path;res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
const origin=`http://127.0.0.1:${server.address().port}/dominating-graph-site/`;
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ws,serial=0,checks=0;const pending=new Map(),errors=[],failures=[];
const check=(ok,message)=>{checks++;if(!ok){failures.push(message);console.error('FAIL:',message);}};
try {
 let port;for(let i=0;i<150;i++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}
 assert.ok(port,'Chrome debugger ready');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((r,j)=>{const id=++serial;pending.set(id,{resolve:r,reject:j});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value;};
 const key=async value=>{const codes={Escape:27,Enter:13,Tab:9,ArrowLeft:37,ArrowRight:39,' ':32};await send('Input.dispatchKeyEvent',{type:'keyDown',key:value,code:value===' '?'Space':value,windowsVirtualKeyCode:codes[value],text:value==='Enter'?'\r':value===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key:value,windowsVirtualKeyCode:codes[value]});await pause(40);};
 const click=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);await pause(30);const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await pause(80);};
 const choose=async(id,value)=>{await click(`#${id} + .glass-select-trigger`);const selector=await run(`(()=>{const s=document.getElementById(${JSON.stringify(id)});return '#'+s.parentElement.querySelector('[role=listbox]').id+' > button:nth-child('+([...s.options].findIndex(o=>o.value===${JSON.stringify(value)})+1)+')';})()`);await click(selector);};
 const viewport=async width=>{await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=640});await pause(60);};
 const shot=async name=>{await pause(300);const result=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/graph-followup-${name}.png`,Buffer.from(result.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');await viewport(1280);await send('Page.navigate',{url:origin+'#lab'});
 for(let i=0;i<200;i++){if(await run(`Boolean(window.graphRepository && document.querySelector('#lab-bank .practice-filters'))`))break;await pause(50);}
 check(await run(`document.querySelectorAll('[role=tab]').length===5&&!document.querySelector('.tab-list')`),'Exactly five routes moved out of old tab rail');
 const before=await run(`JSON.stringify(graphRepository.snapshot().state.teachingProgress)`);
 // Native popover routes, Escape, outside dismissal, keyboard operation, themes and narrow viewport.
 for(const theme of ['day','night'])for(const width of [320,360,1280]){
  await viewport(width);await run(`graphRepository.setTheme('${theme}')`);
  await click('#navigation-toggle');
  check(await run(`document.getElementById('navigation-toggle').getAttribute('aria-expanded')==='true'&&!document.getElementById('graph-navigation').hidden`),`Open window ${theme}/${width}`);
  const geometry=await run(`(()=>{const w=document.getElementById('graph-navigation'),r=w.getBoundingClientRect(),nodes=[...w.querySelectorAll('.graph-tab')].map(n=>n.getBoundingClientRect());return{fits:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,targets:nodes.every(n=>n.width>=44&&n.height>=44),overlap:nodes.some((a,i)=>nodes.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)),blur:getComputedStyle(w).backdropFilter,overflow:document.documentElement.scrollWidth>innerWidth+1,focus:document.activeElement.matches('[role=tab][aria-selected=true]')};})()`);
  check(geometry.fits&&geometry.targets&&!geometry.overlap&&!geometry.overflow,`Window and five separate touch targets fit ${theme}/${width}: ${JSON.stringify(geometry)}`);
  check(geometry.focus&&geometry.blur!=='none',`Focus active route/liquid glass ${theme}/${width}`);
  await shot(`navigation-${theme}-${width}`);
  await key('Escape');check(await run(`document.getElementById('graph-navigation').hidden&&document.activeElement.id==='navigation-toggle'`),`Escape restores trigger ${theme}/${width}`);
  for(const tab of ['teach','practice','competition','records','lab']){
   await click('#navigation-toggle');await click(`#tab-${tab}`);
   const route=await run(`({hash:location.hash,panelHidden:document.getElementById('panel-${tab}').hidden,windowHidden:document.getElementById('graph-navigation').hidden,focus:document.activeElement.id})`);
   check(route.hash==='#'+tab&&!route.panelHidden&&route.windowHidden&&route.focus==='panel-'+tab,`Actual route click ${tab}/${theme}/${width}: ${JSON.stringify(route)}`);
  }
  await click('#navigation-toggle');await click('#navigation-close');check(await run(`document.getElementById('graph-navigation').hidden&&document.activeElement.id==='navigation-toggle'`),`Close button ${theme}/${width}`);
 }
 await viewport(1280);await click('#navigation-toggle');await key('ArrowLeft');check(await run(`document.activeElement.matches('[role=tab]')&&document.activeElement.getAttribute('aria-selected')==='true'`),'Arrow navigation retains focus and selected state');await key('Enter');check(await run(`document.getElementById('graph-navigation').hidden`),'Keyboard Enter chooses route');
 await click('#navigation-toggle');await click('.brand-name');check(await run(`document.getElementById('graph-navigation').hidden`),'Pointer outside closes nonmodal window');
 await click('#navigation-toggle');await key('Tab');check(await run(`document.getElementById('graph-navigation').hidden`),'Keyboard can leave nonmodal window without trapped focus');
 // All three random levels use the active lesson/category filter in both catalog surfaces.
 const levelCounts={};
 for(const [tab,prefix]of [['practice',''],['lab','bank-']]){
  await run(`location.hash='#${tab}'`);await pause(80);const picker=prefix+'practice-question',difficulty=prefix+'practice-difficulty';
  check(await run(`document.getElementById('${difficulty}').value==='all'&&[1,2,3].every(n=>[...document.getElementById('${picker}').options].some(o=>o.value==='random:'+n))`),`Three random degrees initially visible ${tab}`);
  for(const level of [1,2,3]){
   const enabled=await run(`![...document.getElementById('${picker}').options].find(o=>o.value==='random:${level}').disabled`);
   levelCounts[tab+level]=enabled;
   if(!enabled)continue;
   await choose(picker,`random:${level}`);check(await run(`document.querySelector('#panel-${tab} article[data-bank-tab="${tab}"]').dataset.difficulty==='${level}'`),`Random exact level ${tab}/${level}`);
   await click('#'+prefix+'practice-random-next');check(await run(`document.querySelector('#panel-${tab} article[data-bank-tab="${tab}"]').dataset.difficulty==='${level}'`),`Next random retains level ${tab}/${level}`);
  }
  await choose(difficulty,'2');check(await run(`[...document.getElementById('${picker}').options].filter(o=>o.value.startsWith('random:')&&!o.disabled).every(o=>o.value==='random:2')`),`Other degrees disabled under degree filter ${tab}`);
  await choose(difficulty,'all');
 }
 // No automatic solution: the learner edits the actual common lab board, then records a checked graph.
 await run(`location.hash='#lab';document.getElementById('lab-target-n').value='2';document.getElementById('lab-target-gamma').value='1'`);await pause(50);
 const attempts=await run(`Object.keys(graphRepository.snapshot().state.attempts).length`);
 await click('#lab-draw-start');
 check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex').length===2&&document.querySelectorAll('#lab-drawing-board .board-edge').length===0&&document.getElementById('lab-edit-mode').value==='connect'&&document.activeElement.id==='lab-drawing-board'`),'Start creates empty target-size board in connection mode and focuses it');
 await click('#lab-drawing-board .vertex-choice:nth-child(1)');await click('#lab-drawing-board .vertex-choice:nth-child(2)');
 check(await run(`document.querySelectorAll('#lab-drawing-board .board-edge').length===1`),'Two vertex choices create a real edge');
 await click('#lab-draw-jump');check(await run(`document.querySelectorAll('#lab-drawing-board .board-edge').length===1`),'Jump to existing drawing preserves edges');
 await click('#lab-draw-submit');check(await run(`Object.keys(graphRepository.snapshot().state.attempts).length===${attempts+1}&&Object.values(graphRepository.snapshot().state.attempts).at(-1).evaluation.satisfiesTarget`),'Draw submission checks n/gamma and records actual graph');
 await run(`document.getElementById('lab-target-n').value='11'`);await click('#lab-draw-start');check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex').length===2&&document.getElementById('lab-notice').dataset.tone==='error'`),'Invalid drawing target leaves existing model intact');
 await run(`document.getElementById('lab-target-n').value='2'`);
 // Real touch selection and drag, no native blue highlight; keyboard still has a circular outline.
 await viewport(360);await send('Emulation.setTouchEmulationEnabled',{enabled:true});
 await choose('lab-edit-mode','select');
 await run(`document.querySelector('#lab-drawing-board').scrollIntoView({block:'center',behavior:'instant'})`);await pause(100);
 const point=await run(`(()=>{const g=document.querySelector('#lab-drawing-board .board-vertex'),r=g.querySelector('circle').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,before:g.getAttribute('aria-pressed'),transform:g.getAttribute('transform')};})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);
 check(await run(`document.querySelector('#lab-drawing-board .board-vertex').getAttribute('aria-pressed')!==${JSON.stringify(point.before)}`),'Real touch changes vertex selection');
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+20,y:point.y+25}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);
 check(await run(`document.querySelector('#lab-drawing-board .board-vertex').getAttribute('transform')!==${JSON.stringify(point.transform)}&&getSelection().toString()===''`),'Real touch drags vertex without selecting text');
 const tap=await run(`[...document.querySelectorAll('.board-vertex,.board-vertex text,.board-vertex circle')].every(n=>getComputedStyle(n).webkitTapHighlightColor==='rgba(0, 0, 0, 0)')`);check(tap,'Every mounted shared graph vertex and painted child suppresses native tap highlight');
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});await key('Tab');await run(`document.querySelector('#lab-drawing-board .board-vertex').focus()`);check(await run(`(()=>{const n=document.querySelector('#lab-drawing-board .board-vertex');return n.matches(':focus-visible')&&getComputedStyle(n.querySelector('.vertex-outline')).strokeDasharray!=='none';})()`),'Keyboard circular focus indicator survives touch fix');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(60);await click('#navigation-toggle');
 check(await run(`document.documentElement.dataset.motion==='off'&&!document.getElementById('graph-navigation').getAnimations().some(a=>a.playState==='running')`),'OS reduced motion disables navigation animation');await key('Escape');
 check(await run(`JSON.stringify(graphRepository.snapshot().state.teachingProgress)===${JSON.stringify(before)}`),'Lab/navigation changes preserve teaching progress');
 await send('Emulation.setEmulatedMedia',{features:[]});await run(`location.hash='#lab'`);await pause(80);await choose('bank-practice-question','Q141');
 const auditMetrics=await run(`(()=>{const g=document.querySelector('#lab-bank .source-graph'),r=g.querySelector('.board-vertex circle').getBoundingClientRect();return{viewport:innerWidth,sourceGraphWidth:g.getBoundingClientRect().width,sourceVertexHitWidth:r.width,sourceVertexHitHeight:r.height,blurredVisibleElements:[...document.querySelectorAll('*')].filter(n=>n.getClientRects().length&&getComputedStyle(n).backdropFilter!=='none').length,selfAssessmentVisibleLabel:document.querySelector('#lab-bank select[id$="practice-self-assessment"]').labels.length};})()`);
 // Exercise fallback in browsers without Popover API on a fresh document.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:'HTMLElement.prototype.showPopover=undefined;HTMLElement.prototype.hidePopover=undefined;'});
 await send('Page.navigate',{url:origin+'#lab'});for(let i=0;i<200;i++){if(await run(`Boolean(window.graphRepository&&document.getElementById('lab-draw-start'))`))break;await pause(40);}
 await click('#navigation-toggle');check(await run(`!document.getElementById('graph-navigation').hidden&&getComputedStyle(document.getElementById('graph-navigation')).display!=='none'&&document.getElementById('graph-navigation').getBoundingClientRect().width>0`),'Non-Popover fallback visibly opens');await key('Escape');check(await run(`document.getElementById('graph-navigation').hidden`),'Non-Popover fallback closes with Escape');
 check(errors.length===0,'No browser runtime exceptions: '+errors.join('\n'));
 console.log(JSON.stringify({checks,failures,errors,levelCounts,auditMetrics,screenshots:'/tmp/graph-followup-*.png',physicalTouchDevice:false},null,2));
 assert.equal(failures.length,0,'Navigation/lab browser regressions');
} finally { ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{}); }
