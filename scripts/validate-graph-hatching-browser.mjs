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


 await run(`(async()=>{
  const T=await import('./assets/vendor/three/three.module.js');window.hatchMeshes=new Map();window.hatchDisposed=0;
  const add=T.Group.prototype.add;T.Group.prototype.add=function(...objects){for(const mesh of objects)if(mesh.isMesh){hatchMeshes.set(mesh.userData.element?.dataset.vertexId,mesh);mesh.material.map?.addEventListener('dispose',()=>window.hatchDisposed++);}return add.apply(this,objects);};
  const {createGraphBoard}=await import('./assets/js/ui/graph-editor.js');
  const host=document.createElement('section');host.id='hatch-fixture';document.querySelector('#panel-lab').prepend(host);
  window.hatchSelection=[];window.hatchBoard=createGraphBoard(host,{graph:{n:3,vertices:['a','b','c'],edges:[['a','b'],['b','c']]},places:[{id:'a',label:'الف',x:60,y:160},{id:'b',label:'ب',x:300,y:160},{id:'c',label:'پ',x:540,y:160}]},id=>{hatchSelection=hatchSelection.includes(id)?hatchSelection.filter(v=>v!==id):[...hatchSelection,id];hatchBoard.update(hatchSelection);});
 })()`);
 await click('#hatch-fixture .graph-view-switch button:nth-child(2)');await pause(300);
 const histogram=async()=>run(`(()=>{const mesh=hatchMeshes.get('b'),canvas=mesh.material.map?.image;if(!canvas)return null;const counts={};const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;for(let i=0;i<data.length;i+=4){const k=[...data.slice(i,i+4)].join(',');counts[k]=(counts[k]??0)+1;}return counts;})()`);
 const rgba=async token=>run(`(()=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('${token}');c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].join(',');})()`);
 for(const theme of ['day','night'])for(const width of [320,1280]){
  await viewport(width);await run(`graphRepository.setTheme('${theme}');hatchSelection=['a'];hatchBoard.update(hatchSelection)`);await pause(150);
  let counts=await histogram(),background=await rgba('--sheet'),first=await rgba('--hatch-0'),third=await rgba('--hatch-2');
  check(counts&&counts[first]>0&&counts[background]>0&&!counts[third],`single owner visible texture colors ${theme}/${width}`);
  check(await run(`!hatchMeshes.get('a').material.map`),'selected vertex stays solid');
  const disposed=await run(`hatchDisposed`);
  await run(`hatchSelection=['c','a'];hatchBoard.update(hatchSelection)`);await pause(150);counts=await histogram();
  check(counts&&counts[first]>0&&counts[third]>0&&counts[background]>0,`shared coverage includes both owner colors ${theme}/${width}`);
  check(await run(`hatchMeshes.get('b').material.map.colorSpace==='srgb'`),'coverage texture uses sRGB');
  check(await run(`hatchDisposed>${disposed}`),'replaced textures disposed');
  await run(`document.querySelector('#hatch-fixture').scrollIntoView({block:'center',behavior:'instant'})`);await shot(`hatch-${theme}-${width}`);
  await click('#hatch-fixture .graph-view-switch button:first-child');
  check(await run(`document.querySelector('#hatch-fixture [data-vertex-id=b]').dataset.ownerIds==='a,c'`),'2D same canonical ownership despite reverse click order');
  await click('#hatch-fixture .graph-view-switch button:nth-child(2)');
  await run(`hatchSelection=[];hatchBoard.update([])`);await pause(100);
  check(await run(`!hatchMeshes.get('b').material.map`),'clear removes obsolete hatch');
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'hatching introduces no page overflow');
 }
 await run(`hatchSelection=['a'];hatchBoard.update(hatchSelection)`);await pause(100);
 const beforeDestroy=await run(`hatchDisposed`);await run(`hatchBoard.destroy();document.querySelector('#hatch-fixture').remove()`);
 check(await run(`hatchDisposed>${beforeDestroy}`),'destroy disposes remaining textures');
 check(errors.length===0,'No Runtime errors '+errors.join(' / '));
 console.log(JSON.stringify({checks,failures,errors},null,2));assert.equal(failures.length,0);
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
