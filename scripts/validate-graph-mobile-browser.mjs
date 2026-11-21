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


 await send('Emulation.setDeviceMetricsOverride',{width:390,height:850,deviceScaleFactor:1,mobile:true});
 await run(`document.getElementById('navigation-toggle').click()`);
 await run(`scrollTo({top:0,behavior:'instant'});document.querySelector('input[name=motion-level][value=full]').click()`);
 for(const [theme,selector]of [['day','.theme-sun-rays'],['night','.theme-moon']]){
  await run(`graphRepository.setTheme('${theme}')`);await pause(100);
  check(await run(`getComputedStyle(document.querySelector('${selector}')).animationName!=='none'`),theme+' ornament animates');
  const before=await run(`getComputedStyle(document.querySelector('${selector}')).transform`);await pause(250);
  check(await run(`getComputedStyle(document.querySelector('${selector}')).transform`)!==before,theme+' continuous motion changes transform');
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),theme+' header fits');
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/theme-${theme}-mobile.png`,Buffer.from(shot.data,'base64'));
 }
 for(const setting of ['off','low']){await run(`document.querySelector('input[name=motion-level][value=${setting}]').click()`);check(await run(`getComputedStyle(document.querySelector('.theme-moon')).animationName==='none'`),'moon respects '+setting);}
 await run(`document.querySelector('input[name=motion-level][value=full]').click()`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 check(await run(`getComputedStyle(document.querySelector('.theme-moon')).animationName==='none'`),'moon respects reduced motion');
 await run(`graphRepository.setTheme('day')`);check(await run(`getComputedStyle(document.querySelector('.theme-sun-rays')).animationName==='none'`),'sun respects reduced motion');
 await send('Emulation.setEmulatedMedia',{features:[]});
 await run(`document.getElementById('navigation-close').click()`);
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const touch=async(type,x,y)=>send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});
 let mouse=false;
 const drag=async(x,y,dx,dy,cancel=false)=>{if(mouse){await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});for(let i=1;i<=6;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+dx*i/6,y:y+dy*i/6,button:'left',buttons:1});await pause(35);}await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+dx,y:y+dy,button:'left',buttons:0,clickCount:1});await pause(150);return;}await touch('touchStart',x,y);for(let i=1;i<=6;i++){await touch('touchMove',x+dx*i/6,y+dy*i/6);await pause(35);}await touch(cancel?'touchCancel':'touchEnd',x+dx,y+dy);await pause(150);};
 const center=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})`);return run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);};
 const tap=async selector=>{const p=await center(selector);await touch('touchStart',p.x,p.y);await touch('touchEnd',p.x,p.y);await pause(150);};
 for(const width of [320,390,1280])for(const theme of ['day','night']){
  mouse=width===1280;
  await send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width<640});
  await run(`(async()=>{document.documentElement.dataset.theme='${theme}';document.body.replaceChildren();document.body.style.padding='0';const host=document.createElement('div');host.id='fixture';host.style.cssText='max-width:700px;margin:auto';document.body.append(host);const spacer=document.createElement('div');spacer.style.height='1500px';document.body.append(spacer);const {createEditableGraphBoard}=await import('./assets/js/ui/graph-editor.js');window.model={graph:{n:4,vertices:['a','b','c','d'],edges:[['a','b'],['b','c'],['c','d']]},places:[{id:'a',label:'a',x:150,y:90},{id:'b',label:'b',x:350,y:90},{id:'c',label:'c',x:350,y:230},{id:'d',label:'d',x:150,y:230}]};window.chosen=[];window.board=createEditableGraphBoard(host,model,id=>{chosen=chosen.includes(id)?chosen.filter(v=>v!==id):[...chosen,id];board.update(chosen);});})()`);await run(`scrollTo({top:0,behavior:'instant'})`);await pause(250);
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'controls fit '+width+theme);
  if(await run(`document.querySelector('.graph-device-switch').getAttribute('aria-checked')==='false'`))await tap('.graph-device-switch');check(await run(`document.querySelector('.graph-device-switch').getAttribute('aria-checked')==='true'`),'mobile mode toggle');
  const normalWidth=await run(`document.querySelector('#fixture svg').getBoundingClientRect().width`);
  await tap('.graph-zoom button:last-child');
  check(await run(`document.querySelector('#fixture svg').getBoundingClientRect().width`)>normalWidth*1.2,'2D native zoom in '+width+theme+' '+JSON.stringify(await run(`({scrollY,normal:${normalWidth},actual:document.querySelector('#fixture svg').getBoundingClientRect().width,zoom:document.querySelector('.graph-zoom').textContent})`)));
  await tap('.graph-zoom button:first-child');await tap('.graph-zoom button:first-child');
  check(await run(`document.querySelector('#fixture svg').getBoundingClientRect().width`)<normalWidth*.85,'2D native zoom out below 100');
  await tap('.graph-zoom button:last-child');await tap('.graph-zoom button:last-child');
  const zoom=await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`);
  const p=await center('[data-vertex-id="b"] .vertex-number');await drag(p.x,p.y,-15,20);
  check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)===zoom,'zoom retained after 2D drag');
  check(await run(`model.places[1].y>90`),'2D drag changes model '+width+theme+' '+JSON.stringify(await run('({scrollY,places:model.places})')));
  const clicked=await center('[data-vertex-id="b"] .vertex-number');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...clicked,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...clicked,button:'left',clickCount:1});await pause(100);
  check(await run(`chosen.includes('b')`),'mouse click selects after drag');
  await tap('[data-vertex-id="b"] .vertex-number');check(await run(`!chosen.includes('b')`),'touch toggles selection exactly once');
  // Force viewBox relayout and resize, preserving the displayed zoom.
  await run(`document.querySelector('#fixture svg').setAttribute('viewBox','0 0 680 350')`);await pause(150);
  check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)===zoom,'zoom retained after geometry relayout');await run('board.relayout()');await pause(150);
  await tap('.graph-view-switch > button:nth-child(2)');await pause(650);
  check(await run(`!document.querySelector('.graph-three').hidden`),'3D enabled');
  check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)===zoom,'zoom retained into 3D');
  const label='.graph-three-labels button:nth-child(2)';
  const stage=await center('.graph-three');
  const bounds=await run(`(()=>{const r=document.querySelector('.graph-three').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width};})()`);
  // Rotate nearly a quarter turn: screen displacement now needs local Z.
  await drag(bounds.x+15,bounds.y+290,180,0);
  const scroll=await run('scrollY');
  for(const[dx,dy]of [[16,0],[-16,0],[0,16],[0,-16]]){const a=await center(label);await drag(a.x,a.y,dx,dy);const b=await center(label);
   check(Math.hypot(b.x-a.x-dx,b.y-a.y-dy)<7,'rotated 3D follows finger '+dx+'/'+dy+' '+width+theme+' '+JSON.stringify({a,b}));}
  check(await run('scrollY')===scroll,'3D touch never scrolls document');
  check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)===zoom,'3D drag retains zoom');
  await tap('.graph-zoom button:first-child');check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)!==zoom,'3D zoom out by touch');
  await tap('.graph-zoom button:last-child');
  await tap('.graph-view-switch > button:first-child');
  check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)===zoom,'3D to 2D zoom retained');
  await tap('.graph-device-switch');check(await run(`document.querySelector('.graph-device-switch').getAttribute('aria-checked')==='false'`),'desktop mode available');
  await touch('touchStart',width/2,740);for(let i=1;i<=5;i++){await touch('touchMove',width/2,740-i*30);await pause(30);}await touch('touchEnd',width/2,590);await pause(150);check(await run('scrollY')>50,'page scroll remains available outside board');await touch('touchStart',width/2,740);await touch('touchCancel',width/2,740);await pause(100);await run('scrollTo({top:0,behavior:"instant"});board.destroy()');
 }

 mouse=false;
 // Source workbench uses redraws and distinct select/edge/move permissions.
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:850,deviceScaleFactor:1,mobile:true});
 await run(`(async()=>{document.body.replaceChildren();const host=document.createElement('div');host.id='source';document.body.append(host);const {createWorkbench}=await import('./assets/js/ui/model-workbench.js');window.workbench=createWorkbench(host,{id:'test',response_mode:'interactive_graph',graph:{n:6,vertices:['a','b','c','d','e','f'],edges:[['a','b'],['b','c'],['c','d'],['d','e'],['e','f'],['f','a']]}},{mode:'self-assessed-text'},()=>{});const action=document.querySelector('[aria-label="حالت ابزار مدل"]');action.value='move';action.dispatchEvent(new Event('change'));})()`);await pause(150);
 await tap('.graph-zoom button:last-child');
 const sourceZoom=await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`);
 const sourceVertex='svg [data-vertex-id="a"] .vertex-number';let point=await center(sourceVertex);
 const original=await run(`document.querySelector('svg [data-vertex-id="a"]').getAttribute('transform')`);
 await drag(point.x,point.y,-12,20);
 check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)===sourceZoom,'source redraw retains zoom');
 check(await run(`document.querySelector('svg [data-vertex-id="a"]').getAttribute('transform')`)!==original,'source touch movement');
 await tap('.graph-view-switch > button:nth-child(2)');await pause(600);
 const sourceLabel='.graph-three-labels button:first-child';point=await center(sourceLabel);
 await drag(point.x,point.y,12,12,true);
 check(await run(`document.querySelector('svg [data-vertex-id="a"]').getAttribute('aria-pressed')`)==='false','cancel does not select');
 await run(`const action=document.querySelector('[aria-label="حالت ابزار مدل"]');action.value='select';action.dispatchEvent(new Event('change'));`);
 const fixed=await run(`document.querySelector('svg [data-vertex-id="a"]').getAttribute('transform')`);
 point=await center(sourceLabel);await drag(point.x,point.y,15,15);
 check(await run(`document.querySelector('svg [data-vertex-id="a"]').getAttribute('transform')`)===fixed,'select mode does not move vertices');
 await tap(sourceLabel);check(await run(`document.querySelector('svg [data-vertex-id="a"]').getAttribute('aria-pressed')`)==='true','3D tap selects after cancellation');
 await run('workbench.lock()');await tap(sourceLabel);
 check(await run(`document.querySelector('svg [data-vertex-id="a"]').getAttribute('aria-pressed')`)==='true','locked source ignores input');
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/graph-mobile-controls.png',Buffer.from(shot.data,'base64'));
 await run('workbench.destroy()');
 check(errors.length===0,'runtime errors '+errors.join(' / '));console.log(JSON.stringify({checks,errors},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
