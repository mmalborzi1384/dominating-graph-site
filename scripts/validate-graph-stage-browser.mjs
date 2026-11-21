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
 const measurements=[];
 const key=async key=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:{Enter:13,Escape:27,Tab:9}[key],...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});};
 for(const width of [320,390,768,1280])for(const theme of ['day','night']){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<640});
  await run(`(async()=>{document.documentElement.dataset.theme='${theme}';document.body.replaceChildren();document.body.style.padding='8px';const host=document.createElement('div');host.id='fixture';host.style.cssText='max-width:760px;margin:auto';document.body.append(host);const {createEditableGraphBoard}=await import('./assets/js/ui/graph-editor.js');window.model={graph:{n:3,vertices:['a','b','c'],edges:[['a','b'],['b','c']]},places:[{id:'a',label:'a',x:150,y:90},{id:'b',label:'b',x:350,y:90},{id:'c',label:'c',x:350,y:230}]};window.chosen=[];window.board=createEditableGraphBoard(host,model,id=>{chosen=chosen.includes(id)?chosen.filter(v=>v!==id):[...chosen,id];board.update(chosen);});window.svg=host.querySelector('svg');window.originalSvg=svg;})()`);await pause(100);
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'no overflow '+width+theme);
  check(await run(`document.querySelector('.graph-tools').getBoundingClientRect().top>=document.querySelector('.graph-surface-viewport').getBoundingClientRect().bottom`),'tools below graph');
  check(await run(`[...document.querySelectorAll('.graph-tools button')].every(b=>b.getBoundingClientRect().height>=44&&b.getBoundingClientRect().width>=44)`),'touch targets');
  await run(`document.querySelector('.vertex-choice').click();document.querySelector('.graph-zoom button:last-child').click()`);
  const selected=await run('JSON.stringify(chosen)'),zoom=await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`);
  for(const three of [false,true]){
   if(three){await run(`document.querySelector('.graph-view-switch button:nth-child(2)').click()`);for(let i=0;i<80;i++){if(await run(`document.querySelector('.graph-three canvas')!==null`))break;await pause(50);}check(await run(`!!document.querySelector('.graph-three canvas')`),'3D loaded');await run(`window.originalCanvas=document.querySelector('.graph-three canvas')`);}
   for(let cycle=0;cycle<2;cycle++){
    await run(`document.querySelector('.graph-focus-toggle').focus()`);await key('Enter');await pause(100);
    check(await run(`document.querySelector('.graph-focus-toggle').getAttribute('aria-expanded')==='true'`),'keyboard expands '+width+theme+three+cycle+' '+JSON.stringify(await run(`({active:document.activeElement.outerHTML,expanded:document.querySelector('.graph-focus-toggle').outerHTML})`)));
    await run(`document.querySelector('.graph-zoom button:last-child').focus()`);await key('Escape');
    check(await run(`document.querySelector('.graph-focus-toggle').getAttribute('aria-expanded')==='false'&&document.activeElement===document.querySelector('.graph-focus-toggle')`),'Escape restores and returns focus');
    check(await run('JSON.stringify(chosen)')===selected,'selection retained');
    check(await run(`document.querySelector('.graph-zoom button:nth-child(2)').textContent`)===zoom,'zoom retained');
    check(await run('svg===originalSvg'),'same SVG');
    if(three)check(await run(`document.querySelector('.graph-three canvas')===originalCanvas`),'same renderer');
   }
  }
  const ratios=await run(`(()=>{const rgb=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number),lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),bg=getComputedStyle(document.querySelector('.graph-stage')).backgroundColor;return [...document.querySelectorAll('.graph-tool-label,.graph-stage-title,.graph-tools button:not(:disabled)')].map(n=>{const st=getComputedStyle(n),a=lum(rgb(st.color)),b=lum(rgb(st.backgroundColor==='rgba(0, 0, 0, 0)'?bg:st.backgroundColor));return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});})()`);
  measurements.push({width,theme,minContrast:Math.min(...ratios)});check(Math.min(...ratios)>=4.5,'text contrast');
  if(width===390||width===1280){await run(`document.querySelector('.graph-view-switch button:first-child').click();document.querySelector('.graph-zoom button:nth-child(2)').click();scrollTo(0,0)`);await pause(900);const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/stage-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));}
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await run(`document.documentElement.style.fontSize='200%';document.querySelector('.graph-focus-toggle').click()`);await pause(80);
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),'200 percent text and focused layout');
  await run(`document.documentElement.style.fontSize='';document.querySelector('.graph-focus-toggle').click()`);
  await send('Emulation.setEmulatedMedia',{features:[]});
  await run('board.destroy()');check(await run(`!document.querySelector('.graph-stage')&&document.querySelector('svg')===originalSvg`),'teardown unwraps');
 }
 await run(`(async()=>{const {createTeachingBoard}=await import('./assets/js/ui/teaching-board.js');const host=document.getElementById('fixture');window.lesson=createTeachingBoard(host,{...model.graph,directed:false,multigraph:false});const other=document.createElement('div');document.body.append(other);const{createWorkbench}=await import('./assets/js/ui/model-workbench.js');window.workbench=createWorkbench(other,{id:'test',response_mode:'interactive_graph',graph:model.graph},{mode:'self-assessed-text'},()=>{});})()`);
 check(await run(`document.querySelectorAll('.graph-stage').length===2`),'teaching and source adapters share frame');
 await run(`document.querySelector('.graph-focus-toggle').click();document.body.tabIndex=0;document.body.focus()`);await key('Escape');check(await run(`document.querySelector('.graph-focus-toggle').getAttribute('aria-expanded')==='true'`),'outside Escape does not collapse');
 await run(`lesson.destroy();workbench.destroy()`);check(await run(`!document.querySelector('.graph-stage')`),'multiple adapters cleanup');
 // A denied WebGL context must leave the shared 2D surface usable.
 await run(`(async()=>{const{createGraphBoard}=await import('./assets/js/ui/graph-editor.js');window.fallback=createGraphBoard(document.getElementById('fixture'),model,()=>{});window.nativeContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:nativeContext.call(this,type,...args);};document.querySelector('.graph-view-switch button:nth-child(2)').click();window.loadingText=document.querySelector('.graph-stage [role=status]').textContent;})()`);
 check(await run(`loadingText.includes('آماده')`),'loading status');await pause(500);
 check(await run(`document.querySelector('.graph-stage [role=status]').textContent.includes('در دسترس نیست')&&!document.querySelector('svg').hasAttribute('hidden')`),'WebGL failure preserves 2D');
 await run(`HTMLCanvasElement.prototype.getContext=nativeContext;fallback.destroy()`);
 check(errors.length===0,'runtime errors '+errors.join(' / '));console.log(JSON.stringify({checks,measurements,errors},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
