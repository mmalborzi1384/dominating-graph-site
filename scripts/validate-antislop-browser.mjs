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
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
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
 const progress=await run(`JSON.stringify(graphRepository.snapshot().state.teachingProgress)`);
 // Test real workbenches in both catalogs, including dense models and resize without rebuilding.
 for(const [tab,picker,qid]of [['practice','practice-question','Q001'],['lab','bank-practice-question','Q141']]){
  await run(`location.hash='#${tab}'`);await pause(60);await choose(picker,qid);
  for(const theme of ['day','night'])for(const width of [320,360,1280]){
   await viewport(width);await run(`graphRepository.setTheme('${theme}')`);
   for(let n=1;n<=16;n++){
    await run(`document.querySelector('#panel-${tab} .source-workbench .workbench-tools input').value='${n}'`);
    await click(`#panel-${tab} .source-workbench .workbench-tools > button`);
    const geometry=await run(`(()=>{const svg=document.querySelector('#panel-${tab} .source-graph'),s=svg.getBoundingClientRect(),hits=[...svg.querySelectorAll('.vertex-hit')].map(n=>n.getBoundingClientRect()),centers=hits.map(r=>({x:r.x+r.width/2,y:r.y+r.height/2,r:r.width/2}));return{count:hits.length,min:Math.min(...hits.map(r=>Math.min(r.width,r.height))),inside:hits.every(r=>r.left>=s.left-.1&&r.right<=s.right+.1&&r.top>=s.top-.1&&r.bottom<=s.bottom+.1),separate:centers.every((a,i)=>centers.slice(i+1).every(b=>Math.hypot(a.x-b.x,a.y-b.y)>=a.r+b.r-.1)),overflow:document.documentElement.scrollWidth>innerWidth+1,scrolls:svg.parentElement.scrollWidth>svg.parentElement.clientWidth+1};})()`);
    check(geometry.count===n&&geometry.min>=44&&geometry.inside,`R-03 targets inside canvas ${tab}/${theme}/${width}/${n}: ${JSON.stringify(geometry)}`);
    check(geometry.separate&&!geometry.overflow,`R-03 initially separate targets; only board may scroll ${tab}/${theme}/${width}/${n}: ${JSON.stringify(geometry)}`);
    if(n===6||n===16)measurements.push({tab,theme,width,n,...geometry});
    if(tab==='lab'&&width===360&&(n===6||n===16)){
     await run(`document.querySelector('#lab-bank .source-graph-viewport').scrollIntoView({block:'center',behavior:'instant'})`);
     await shot(`source-${theme}-${width}-${n}`);
    }
   }
  }
  await viewport(360);await run(`document.querySelector('#panel-${tab} .source-workbench .workbench-tools input').value='6'`);await click(`#panel-${tab} .source-workbench .workbench-tools > button`);
  // Same mounted graph must retain >=44px targets after an orientation/width change.
  const svgSelector=`#panel-${tab} .source-graph`;
  await viewport(1280);await viewport(320);
  check(await run(`[...document.querySelectorAll('${svgSelector} .vertex-hit')].every(n=>n.getBoundingClientRect().width>=44)`),`Resize recalculates targets without rebuilding ${tab}`);
  await run(`document.querySelector('${svgSelector}').scrollIntoView({block:'center',behavior:'instant'})`);await pause(60);
  const point=await run(`(()=>{const g=document.querySelector('${svgSelector} .board-vertex'),h=g.querySelector('.vertex-hit').getBoundingClientRect(),b=g.querySelector('.vertex-base').getBoundingClientRect();return{x:h.x+h.width/2+20,y:h.y+h.height/2,outside:h.x+h.width/2+20>b.right,before:g.getAttribute('aria-pressed')};})()`);
  check(point.outside,`Touch probe is outside visible bead ${tab}`);
  await send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(70);
  check(await run(`document.querySelector('${svgSelector} .board-vertex').getAttribute('aria-pressed')!==${JSON.stringify(point.before)}`),`Expanded target really receives touch outside bead ${tab}`);
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await run(`document.querySelector('${svgSelector} .board-vertex').focus()`);await key('ArrowLeft');
  check(await run(`document.activeElement.matches('${svgSelector} .board-vertex')&&document.activeElement.matches(':focus-visible')`),`Arrow movement keeps visible keyboard focus ${tab}`);
  await click(`#panel-${tab} .practice-response > button`);
  const self=tab==='lab'?'bank-practice-self-assessment':'practice-self-assessment';
  check(await run(`(()=>{const s=document.getElementById('${self}'),l=s.labels[0],b=s.nextElementSibling;return s.labels.length===1&&l.getClientRects().length>0&&l.textContent.includes('ارزیابی پاسخ با معیار')&&document.getElementById(b.getAttribute('aria-labelledby').split(' ')[0]).textContent.includes('ارزیابی پاسخ با معیار');})()`),`Visible associated self-assessment label and custom accessible name ${tab}`);
  await choose(self,'yes');check(await run(`document.getElementById('${self}').value==='yes'`),`Labeled self-assessment can choose real option ${tab}`);
  await shot(`${tab}-320`);
 }
 // Source topology editing and touch drag remain usable with the larger hit area.
 await run(`location.hash='#lab'`);await pause(50);await choose('bank-practice-question','Q141');await viewport(360);
 const mode=value=>run(`(()=>{const s=document.querySelector('#lab-bank .workbench-tools').querySelectorAll('select')[1];s.value='${value}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await mode('edge');const edges=await run(`document.querySelectorAll('#lab-bank .source-graph .board-edge').length`);
 for(let repeat=0;repeat<2;repeat++){
  await click('#lab-bank .source-graph [data-vertex-id="a"] .vertex-hit');await click('#lab-bank .source-graph [data-vertex-id="c"] .vertex-hit');
  check(await run(`document.querySelectorAll('#lab-bank .source-graph .board-edge').length===${edges+(repeat===0?1:0)}`),`Two enlarged targets add/remove actual edge ${repeat}`);
 }
 await mode('move');await run(`document.querySelector('#lab-bank .source-graph').scrollIntoView({block:'center',behavior:'instant'})`);await pause(60);
 const drag=await run(`(()=>{const g=document.querySelector('#lab-bank .source-graph [data-vertex-id="b"]'),r=g.querySelector('.vertex-hit').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,before:g.getAttribute('transform')};})()`);
 await send('Emulation.setTouchEmulationEnabled',{enabled:true});await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:drag.x,y:drag.y}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:drag.x-20,y:drag.y+25}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(60);
 check(await run(`document.querySelector('#lab-bank .source-graph [data-vertex-id="b"]').getAttribute('transform')!==${JSON.stringify(drag.before)}&&getSelection().toString()===''`),'Real source touch drag changes position without selecting text');
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 // No clipping when moving a target to the board's edge, including after resize.
 await run(`document.querySelector('#lab-bank .source-graph [data-vertex-id="a"]').focus()`);for(let i=0;i<20;i++)await key('ArrowLeft');
 await viewport(1280);await viewport(320);
 check(await run(`(()=>{const s=document.querySelector('#lab-bank .source-graph').getBoundingClientRect(),h=document.querySelector('#lab-bank [data-vertex-id="a"] .vertex-hit').getBoundingClientRect();return h.left>=s.left&&h.width>=44;})()`),'Moved edge target remains inside canvas after resize');
 // Real queen workbench: visible labels, numeric editing, unchanged board/summary.
 await choose('bank-practice-question','Q041');
 for(const theme of ['day','night']){
  await run(`graphRepository.setTheme('${theme}')`);
  check(await run(`(()=>{const inputs=[...document.querySelectorAll('#lab-bank .source-workbench .workbench-tools input')];return inputs.length===2&&inputs.every(i=>i.labels.length===1&&i.labels[0].getClientRects().length&&i.labels[0].textContent.includes('وزیر'));})()`),`Queen coordinates have visible associated labels ${theme}`);
  await run(`(()=>{const [r,c]=document.querySelectorAll('#lab-bank .source-workbench input');r.value='2';c.value='5';c.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  check(await run(`document.querySelector('#lab-bank .queen-board').children[12].getAttribute('aria-pressed')==='true'&&[...document.querySelectorAll('#lab-bank .queen-board [aria-pressed=true]')].length===1`),`Queen coordinate edit updates actual board ${theme}`);
  await click('#lab-bank .source-workbench .workbench-field');check(await run(`document.activeElement.matches('#lab-bank .source-workbench input')`),`Queen label activates its input ${theme}`);
  await shot(`queen-${theme}-320`);
 }
 // Blur budget applies to every tab, dropdown, and open details, not just the initial screen.
 for(const theme of ['day','night'])for(const width of [320,360,1280]){
  await viewport(width);await run(`graphRepository.setTheme('${theme}')`);
  for(const tab of ['teach','practice','competition','records','lab']){
   await run(`location.hash='#${tab}'`);await pause(50);
   check(await run(`[...document.querySelectorAll('*')].filter(n=>n.getClientRects().length&&getComputedStyle(n).backdropFilter!=='none').length===0`),`No blur on working surfaces ${tab}/${theme}/${width}`);
   await click('#navigation-toggle');
   check(await run(`(()=>{const blurred=[...document.querySelectorAll('*')].filter(n=>n.getClientRects().length&&getComputedStyle(n).backdropFilter!=='none');return blurred.length===1&&blurred[0].id==='graph-navigation';})()`),`Only requested navigation window blurs ${tab}/${theme}/${width}`);
   await key('Escape');
  }
  check(await run(`(()=>{document.querySelector('#lab-bank .practice-response > button').click();const details=[...document.querySelectorAll('#panel-lab details')];details.forEach(d=>d.open=true);return details.length>0;})()`),`Real lab details opened ${theme}/${width}`);await pause(30);
  await click('#bank-practice-self-assessment + .glass-select-trigger');
  check(await run(`[...document.querySelectorAll('*')].filter(n=>n.getClientRects().length&&getComputedStyle(n).backdropFilter!=='none').length===0`),`Dropdown and opening details do not reintroduce blur ${theme}/${width}`);await key('Escape');
  check(await run(`document.documentElement.scrollWidth<=innerWidth+1`),`No document overflow with queen board ${theme}/${width}`);
  check(await run(`(()=>{const c=getComputedStyle(document.documentElement),lum=v=>{const h=c.getPropertyValue(v).trim().slice(1),a=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];},surface=lum('--surface');return ['--ink','--ink-soft','--heading'].every(v=>{const l=lum(v);return (Math.max(l,surface)+.05)/(Math.min(l,surface)+.05)>=4.5;});})()`),`Working text tokens retain AA contrast on matte surface ${theme}/${width}`);
 }
 check(await run(`JSON.stringify(graphRepository.snapshot().state.teachingProgress)===${JSON.stringify(progress)}`),'Workbench/accessibility changes preserve teaching progress');
 check(errors.length===0,'No browser Runtime errors: '+errors.join('\n'));
 console.log(JSON.stringify({checks,failures,errors,measurements,screenshots:'/tmp/graph-antislop-*.png',physicalTouchDevice:false},null,2));
 assert.equal(failures.length,0,'Approved antislop findings');
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
