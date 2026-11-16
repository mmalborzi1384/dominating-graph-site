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
 const initial=await run(`JSON.stringify(graphRepository.snapshot().state)`);
 for(const theme of ['day','night'])for(const width of [320,390,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width<640});
  await run(`graphRepository.setTheme('${theme}');document.querySelector('input[name=motion-level][value=off]').click();scrollTo(0,0)`);await pause(200);
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),`${theme}/${width} no overflow`);
  check(await run(`getComputedStyle(document.body).backgroundImage==='none'&&getComputedStyle(document.querySelector('.graph-world')).pointerEvents==='none'`),'no grid / no hit interception');
  const frozen=await run(`document.querySelector('.graph-world').toDataURL()`);await pause(150);
  check(frozen===await run(`document.querySelector('.graph-world').toDataURL()`),'off freezes world');
  await run(`document.querySelector('input[name=motion-level][value=medium]').click()`);await pause(250);
  check(frozen!==await run(`document.querySelector('.graph-world').toDataURL()`),'motion resumes');
  await run(`document.querySelector('input[name=motion-level][value=off]').click()`);
  const before=await run(`document.querySelector('.graph-world').toDataURL()`);await run(`scrollTo(0,500)`);await pause(150);
  check(before===await run(`document.querySelector('.graph-world').toDataURL()`),'paused scroll remains static');
  await run(`scrollTo(0,0)`);
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/graph-world-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 // Inspect actual canvas coordinates to distinguish pointer/scroll response from idle drift.
 await run(`document.querySelector('input[name=motion-level][value=medium]').click();window.worldCenters=[];window.originalArc=CanvasRenderingContext2D.prototype.arc;CanvasRenderingContext2D.prototype.arc=function(x,y,r,...rest){if(this.canvas.className==='graph-world'&&r===3.8){worldCenters.push({x,y});if(worldCenters.length>200)worldCenters.shift();}return originalArc.call(this,x,y,r,...rest);}`);
 await pause(150);
 const center=await run(`worldCenters.at(-1)`);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:center.x,y:center.y});await pause(400);
 check(await run(`Math.hypot(worldCenters.at(-1).x-${center.x},worldCenters.at(-1).y-${center.y})>8`),'nearby vertex moves away from pointer');
 await run(`window.dispatchEvent(new Event('blur'));scrollTo(0,document.documentElement.scrollHeight*.8)`);await pause(500);
 check(await run(`Math.abs(worldCenters.at(-1).y-${center.y})>15`),'scroll gradually reshapes graph');
 await run(`CanvasRenderingContext2D.prototype.arc=originalArc;scrollTo(0,0)`);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await run(`document.querySelector('input[name=motion-level][value=full]').click()`);await pause(150);
 const still=await run(`document.querySelector('.graph-world').toDataURL()`);await pause(150);
 check(still===await run(`document.querySelector('.graph-world').toDataURL()`)&&await run(`document.querySelector('.graph-world').dataset.running==='false'`),'system reduced motion overrides full');
 await send('Emulation.setEmulatedMedia',{features:[]});
 await run(`document.querySelector('input[name=motion-level][value=off]').click();document.querySelector('#lab-build').click()`);await pause(100);
 // Use the real lab board and native keyboard activation for all zoom buttons.
 const prefix='#lab-drawing-board ';
 const click=selector=>run(`document.querySelector(${JSON.stringify(prefix+selector)}).click()`);
 const activate=async selector=>{await run(`document.querySelector(${JSON.stringify(prefix+selector)}).focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(80);};
 const widthOf=()=>run(`document.querySelector('#lab-drawing-board svg').getBoundingClientRect().width`);
 const normal=await widthOf();await activate('.graph-zoom button:last-child');
 check((await widthOf())>normal*1.2,'2D zoom in keyboard');
 await activate('.graph-zoom button:first-child');check(Math.abs((await widthOf())-normal)<2,'2D zoom out');
 await activate('.graph-zoom button:first-child');check((await widthOf())<normal*.85,'2D below 100% despite min width');
 await activate('.graph-zoom button:nth-child(2)');check(Math.abs((await widthOf())-normal)<2,'2D reset');
 await run(`document.querySelector('#lab-drawing-board .board-vertex').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
 const selected=await run(`document.querySelector('#lab-drawing-board .board-vertex').getAttribute('aria-pressed')`);
 await click('.graph-view-switch > button:nth-child(2)');await pause(1500);
 check(await run(`!document.querySelector('#lab-drawing-board .graph-three').hidden`),'3D opens');
 const position=()=>run(`document.querySelector('#lab-drawing-board .graph-three-labels button').style.left`);
 const original=await position();await activate('.graph-zoom button:last-child');check(original!==await position(),'3D zoom moves projected vertices');
 await activate('.graph-zoom button:nth-child(2)');check(original===await position(),'3D reset camera');
 await activate('.graph-zoom button:first-child');check(original!==await position(),'3D zoom out keyboard');await activate('.graph-zoom button:nth-child(2)');
 await click('.graph-view-switch > button:first-child');
 check(selected===await run(`document.querySelector('#lab-drawing-board .board-vertex').getAttribute('aria-pressed')`),'selection survives zoom and view switch');
 for(let i=0;i<15;i++)await click('.graph-zoom button:last-child');check(await run(`document.querySelector('#lab-drawing-board .graph-zoom button:last-child').disabled`),'upper zoom limit');
 for(let i=0;i<15;i++)await click('.graph-zoom button:first-child');check(await run(`document.querySelector('#lab-drawing-board .graph-zoom button:first-child').disabled`),'lower zoom limit');
 await click('.graph-zoom button:nth-child(2)');
 await click('.graph-zoom button:last-child');await send('Emulation.setDeviceMetricsOverride',{width:390,height:850,deviceScaleFactor:1,mobile:true});await pause(150);
 check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'resize zoomed board stays inside page');
 for(const id of ['teach','practice','competition','records','lab']){await run(`location.hash='#${id}'`);await pause(150);check(await run(`!document.querySelector('#panel-${id}').hidden&&document.querySelectorAll('.graph-world').length===1`),'route '+id);}
 check(await run(`(()=>{const a=JSON.parse(${JSON.stringify(initial)}),b=graphRepository.snapshot().state;return JSON.stringify(a.attempts)===JSON.stringify(b.attempts)&&JSON.stringify(a.sessions)===JSON.stringify(b.sessions)&&JSON.stringify(a.learning)===JSON.stringify(b.learning)})()`),'world/zoom preserve records');
 check(errors.length===0,'runtime errors '+errors.join(' / '));console.log(JSON.stringify({checks,errors},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
