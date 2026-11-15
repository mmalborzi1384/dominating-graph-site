// Real browser acceptance for the three approved audit findings; no learner data is used.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),profile=await mkdtemp(join(tmpdir(),'graph-antislop-'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/dominating-graph-site/,''));if(path!==root&&!path.startsWith(root+'/'))throw Error();const file=path===root?join(path,'index.html'):path;res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
const origin=`http://127.0.0.1:${server.address().port}/dominating-graph-site/`;
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ws,serial=0,checks=0;const pending=new Map(),errors=[],failures=[],measurements=[];
const check=(ok,message)=>{checks++;if(!ok){failures.push(message);console.error('FAIL:',message);}};
try {
 let port;for(let i=0;i<150;i++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}
 assert.ok(port,'Chrome debugger ready');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((r,j)=>{const id=++serial;pending.set(id,{resolve:r,reject:j});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const key=async value=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:value,code:value,windowsVirtualKeyCode:{Enter:13,Escape:27,ArrowLeft:37}[value]});await send('Input.dispatchKeyEvent',{type:'keyUp',key:value});await pause(30);};
 const click=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})`);await pause(20);const p=await run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await pause(40);};
 const choose=async(id,value)=>{await click(`#${id} + .glass-select-trigger`);const selector=await run(`(()=>{const s=document.getElementById(${JSON.stringify(id)});return '#'+s.parentElement.querySelector('[role=listbox]').id+' > button:nth-child('+([...s.options].findIndex(o=>o.value===${JSON.stringify(value)})+1)+')';})()`);await click(selector);};
 const viewport=async width=>{await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=640});await pause(60);};
 const shot=async name=>{await pause(1000);const r=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/graph-antislop-${name}.png`,Buffer.from(r.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');await viewport(360);await send('Page.navigate',{url:origin+'#lab'});
 for(let i=0;i<200;i++){if(await run(`Boolean(window.graphRepository && document.querySelector('#lab-bank .practice-filters'))`))break;await pause(50);}

 const initial=await run(`JSON.stringify(graphRepository.snapshot().state)`);
 for(const theme of ['day','night'])for(const width of [320,360,390,540,1280]){
  await viewport(width);await run(`graphRepository.setTheme('${theme}');location.hash='#records'`);await pause(600);
  await run(`scrollTo(0,scrollY)`);
  const geometry=await run(`({scrollX,body:document.body.getBoundingClientRect().toJSON(),width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(n=>n.getClientRects().length).filter(n=>n.getBoundingClientRect().right>document.documentElement.clientWidth+1||n.getBoundingClientRect().left-document.body.getBoundingClientRect().left< -1).map(n=>({tag:n.tagName,cls:n.className,id:n.id,left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,width:n.getBoundingClientRect().width})).sort((a,b)=>a.left-b.left).slice(0,10)})`);
  check(geometry.scroll<=width+1,'records width '+theme+'/'+width+JSON.stringify(geometry));
  if(width===360)await shot('records-'+theme);
 }
 await viewport(390);await run(`location.hash='#lab'`);await pause(100);
 const before=await run(`JSON.stringify({attempts:graphRepository.snapshot().state.attempts,sessions:graphRepository.snapshot().state.sessions})`);
 await run(`document.querySelector('#lab-target-n').value=8;document.querySelector('#lab-target-gamma').value=3;document.querySelector('#lab-draw-start').click()`);await pause(150);
 check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex').length===8`),'generator draws 8 vertices');
 check(await run(`!document.querySelector('#lab-save,#lab-game-start,#lab-challenge-start,#lab-saved-results')`),'lab no scored save/session controls');
 await click('#lab-check');await click('#lab-hint');await click('#lab-solutions');
 await click('#lab-drawing-board .vertex-choice');
 check(await run(`document.querySelector('#lab-drawing-board .board-vertex').getAttribute('aria-pressed')==='true'`),'shared 2D selection');
 const toggle='#lab-drawing-board .graph-view-switch button:nth-child(2)';await click(toggle);
 for(let i=0;i<150;i++){if(await run(`Boolean(document.querySelector('#lab-drawing-board .graph-three canvas'))`))break;await pause(50);}
 await pause(400);
 check(await run(`Boolean(document.querySelector('#lab-drawing-board .graph-three canvas'))`),'local Three.js WebGL view created');
 check(await run(`document.querySelector('#lab-drawing-board svg').hidden`),'2D hidden in 3D');
 await click('#lab-drawing-board .graph-three-labels button:nth-child(2)');await pause(150);
 check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex[aria-pressed=true]').length===2`),'3D selection updates same answer');

 const oldPosition=await run(`document.querySelector('#lab-drawing-board .board-vertex').getAttribute('transform')`);
 const dragPoint=await run(`(()=>{const r=document.querySelector('#lab-drawing-board .graph-three-labels button').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...dragPoint,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:dragPoint.x+15,y:dragPoint.y+30,button:'left',buttons:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:dragPoint.x+15,y:dragPoint.y+30,button:'left',clickCount:1});await pause(150);
 check(await run(`document.querySelector('#lab-drawing-board .board-vertex').getAttribute('transform')!==${JSON.stringify(oldPosition)}`),'3D dragging updates 2D geometry');
 await shot('three-night-390');
 await click('#lab-drawing-board .graph-view-switch button:first-child');
 check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex[aria-pressed=true]').length===2&&!document.querySelector('#lab-drawing-board svg').hidden`),'2D return retains selection');
 await choose('bank-practice-question','Q141');await click('#lab-bank .practice-response button');
 check(await run(`!document.querySelector('#lab-bank #bank-practice-submit')`),'bank lab no final submit');
 check(await run(`JSON.stringify({attempts:graphRepository.snapshot().state.attempts,sessions:graphRepository.snapshot().state.sessions})===${JSON.stringify(before)}`),'lab actions leave attempts and sessions unchanged');
 check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'lab mobile no page overflow');
 for(const tab of ['teach','practice','competition','records','lab']){await run(`location.hash='#${tab}'`);await pause(100);check(await run(`!document.querySelector('#panel-${tab}').hidden`),'route '+tab);}

 await run(`location.hash='#lab';document.querySelector('#lab-load').click()`);await pause(80);
 check(await run(`document.querySelectorAll('#lab-drawing-board .board-vertex').length>0`),'prepared model loads');
 for(const st of ['formula','bounds','minimal','game']){await run(`(()=>{const s=document.querySelector('#lab-station');s.value='${st}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause(50);await click('#lab-check');await click('#lab-hint');}
 await run(`document.querySelector('#lab-station').value='formula';document.querySelector('#lab-station').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#lab-observe').click()`);
 check(await run(`document.querySelector('.lab-observations').textContent.includes('γ=')`),'comparison note works without score');await click('#lab-clear-observations');
 await run(`location.hash='#practice'`);await choose('practice-question','Q001');await click('#panel-practice .source-workbench .graph-view-switch button:nth-child(2)');await pause(200);
 check(await run(`Boolean(document.querySelector('#panel-practice .source-workbench .graph-three canvas'))`),'source multigraph uses shared 3D');
 await run(`location.hash='#lab'`);
 // A blocked WebGL context must keep the functional 2D fallback.
 await run(`(()=>{const get=HTMLCanvasElement.prototype.getContext;window.originalGetContext=get;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind.startsWith('webgl')?null:get.call(this,kind,...args);};document.querySelector('#lab-build').click();})()`);await pause(100);
 await click('#lab-drawing-board .graph-view-switch button:nth-child(2)');await pause(200);
 check(await run(`!document.querySelector('#lab-drawing-board svg').hasAttribute('hidden')&&document.querySelector('#lab-drawing-board .model-key').textContent.includes('دسترس نیست')`),'WebGL failure keeps 2D and explains fallback');
 await run(`HTMLCanvasElement.prototype.getContext=window.originalGetContext`);
 check(errors.length===0,'runtime errors '+errors.join(' / '));
 console.log(JSON.stringify({checks,failures,errors},null,2));assert.equal(failures.length,0);
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
