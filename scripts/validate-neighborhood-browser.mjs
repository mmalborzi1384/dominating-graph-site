// Phase four: real input and read-only neighborhood, using the mobile validator CDP harness.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
const root=process.env.NEIGHBORHOOD_TEST_ROOT??resolve(import.meta.dirname,'..'),profile=await mkdtemp(join(tmpdir(),'neighborhood-'));
let loadMode='normal';
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://local'),path=resolve(root,'.'+url.pathname.replace(/^\/dominating-graph-site/,''));
 if(!path.startsWith(root+'/')&&path!==root)throw Error();
 if(url.pathname.endsWith('/content/shell.json')&&loadMode==='slow')await new Promise(r=>setTimeout(r,1600));
 if(url.pathname.endsWith('/content/teaching.json')&&loadMode==='error')throw Error();
 res.setHeader('Content-Type',path===root?'text/html':({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'})[extname(path)]??'application/octet-stream');
 res.end(await readFile(path===root?join(root,'index.html'):path));
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}/dominating-graph-site/`;
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,serial=0,checks=0;const pending=new Map(),errors=[];
const check=(ok,label)=>{checks++;assert.ok(ok,label);};
try{
 let port;for(let i=0;i<150;i++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<200;i++){if(await run(expression))return;await pause(50);}throw Error('Timeout: '+expression+' '+JSON.stringify({errors,state:await run('({url:location.href,body:document.body?.innerText.slice(-1800),notice:document.querySelector("#content-notice")?.textContent})')}));};
 const metrics=width=>send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
 const key=async k=>{const code={Enter:13,' ':32,Escape:27,Tab:9}[k];await send('Input.dispatchKeyEvent',{type:'keyDown',key:k,windowsVirtualKeyCode:code,text:k==='Enter'?'\r':k===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key:k,windowsVirtualKeyCode:code});};
 const center=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);return run(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);};
 const click=async selector=>{const p=await center(selector);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',buttons:0,clickCount:1});await pause(50);};
 const snapshot=()=>run('JSON.stringify(graphRepository.snapshot().state)');
 await send('Page.enable');await send('Runtime.enable');await metrics(1280);await send('Page.navigate',{url:origin+'#teach'});
 await wait('Boolean(window.graphRepository&&document.querySelector("#lab-bank .practice-filters"))');
 check(await run('Boolean(document.querySelector("#neighborhood-disclosure"))'),'Native neighborhood disclosure exists');
 check(await run('!document.querySelector("#neighborhood-disclosure").open'),'Exploration starts closed');
 check(await run('document.querySelector("#hero-learning-link").hash==="#teach"'),'Fresh generic learning link');
 const before=await snapshot();
 await run('window.qaAnswer=document.querySelector("#panel-practice textarea");if(qaAnswer)qaAnswer.value="پاسخ موقت برای بررسی حفظ وضعیت"');
 await click('#neighborhood-disclosure > summary');
 await wait('document.querySelectorAll("#neighborhood-board .board-vertex").length===5');
 check(await run('document.querySelectorAll("#neighborhood-board .board-edge").length===8'),'Exact existing eight roads');
 check(await run('!document.querySelector(".hero-map").closest("[aria-hidden=true]")'),'Interactive map perceivable');
 check(await run('document.querySelectorAll("#neighborhood-board [aria-pressed=true]").length===1'),'Only initial 2D view pressed, no initial place');
 const neighbors={house:['school','library','clinic'],school:['house','library','clinic'],library:['school','park','house','clinic'],park:['library','clinic'],clinic:['park','house','school','library']};
 const names={house:'خانه',school:'مدرسه',library:'کتابخانه',park:'پارک',clinic:'درمانگاه'};
 for(const id of Object.keys(neighbors)){
  await click(`#neighborhood-board .board-vertex[data-vertex-id="${id}"]`);
  const text=await run('document.querySelector("#neighborhood-status").textContent');
  check(text.includes(names[id])&&neighbors[id].every(n=>text.includes(names[n])),'Direct neighbors of '+id);
  const listed=text.split('همسایه‌های مستقیمش: ')[1]?.split('.')[0].split('، ');
  check(listed?.length===neighbors[id].length&&listed.every(label=>neighbors[id].map(n=>names[n]).includes(label)),'No indirect neighbors '+id);
  check(await run(`document.querySelectorAll('#neighborhood-board .board-vertex[aria-pressed=true]').length===1&&document.querySelector('#neighborhood-board .board-vertex[data-vertex-id=${id}]').getAttribute('aria-pressed')==='true'`),'Exclusive native mouse selection '+id);
  check(await run(`document.querySelectorAll('#neighborhood-board .board-edge.is-direct').length===${neighbors[id].length}`),'Existing direct edges highlighted '+id);
  check(await run('!document.querySelector("#neighborhood-board .vertex-coverage [data-owner-id]")'),'No coverage result '+id);
 }
 await click('#neighborhood-reset');check(await run('document.querySelectorAll("#neighborhood-board .is-selected").length===0'),'Reset clears');
 await run('document.querySelector("#neighborhood-board .vertex-choice").focus()');await key(' ');
 check(await run('document.querySelector("#neighborhood-board .is-selected").dataset.vertexId==="house"'),'Native Space selects');
 await run('document.querySelector("#neighborhood-board .board-vertex[data-vertex-id=school]").focus()');await key('Enter');
 check(await run('document.querySelector("#neighborhood-board .is-selected").dataset.vertexId==="school"'),'SVG Enter selects');
 await key(' ');check(await run('!document.querySelector("#neighborhood-board .is-selected")'),'SVG Space toggles clear');
 await metrics(390);await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const p=await center('#neighborhood-board .board-vertex[data-vertex-id=park]');
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);
 check(await run('document.querySelector("#neighborhood-board .is-selected")?.dataset.vertexId==="park"'),'Native touch selects exactly once');
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 check(await snapshot()===before,'Exploration never writes repository');
 check(await run('!qaAnswer||qaAnswer.isConnected&&qaAnswer.value==="پاسخ موقت برای بررسی حفظ وضعیت"'),'Other activity draft remains intact');
 await run('document.querySelector("#neighborhood-disclosure > summary").focus()');await key(' ');
 check(await run('!document.querySelector("#neighborhood-disclosure").open'),'Native summary Space closes');await key('Enter');
 check(await run('document.querySelector("#neighborhood-disclosure").open&&document.querySelector("#neighborhood-board .is-selected").dataset.vertexId==="park"'),'Disclosure retains selection');
 await key('Tab');check(await run('document.querySelector("#neighborhood-board").contains(document.activeElement)'),'Native Tab reaches shared viewport');
 const selected=await run('document.querySelector("#neighborhood-board .is-selected").dataset.vertexId');
 await run('graphRepository.setTheme("night");graphRepository.setMotion("off")');
 check(await run('document.querySelector("#neighborhood-board .is-selected").dataset.vertexId')===selected,'Theme/motion retain neighborhood selection');
 await run(`(async()=>{window.qaCurriculum=await(await fetch('content/teaching.json')).json();window.qaProgress=await import('./assets/js/domain/progress.js');})()`);
 await run('graphRepository.changeProgress(p=>qaProgress.completeActivity(p,"L1-A1",qaCurriculum))');
 check(await run('document.querySelector(".site-landing").dataset.learning==="returning"'),'Durable activity makes return entrance');
 check(await run('document.querySelector("#hero-learning-link").hash==="#teach/L1-Action"'),'Exact unlocked return link');
 await run('graphRepository.changeProgress(p=>{for(const id of qaCurriculum.units[0].requiredActivityIds)p=qaProgress.completeActivity(p,id,qaCurriculum);return qaProgress.visitUnit(p,"L1-Process",qaCurriculum)})');
 check(await run('document.querySelector("#hero-learning-link").hash==="#teach/L1-Process"'),'Uses actual saved unit');
 await click('#hero-learning-link');check(await run('document.querySelector("#teaching-stage").dataset.unitId==="L1-Process"'),'Return navigates to actual unlocked unit');
 await run('graphRepository.changeProgress(()=>{let p=qaProgress.initialProgress(qaCurriculum);for(const a of qaCurriculum.activities)p=qaProgress.completeActivity(p,a.id,qaCurriculum);return p})');
 check(await run('document.querySelector(".site-landing").dataset.learning==="complete"&&document.querySelector("#hero-learning-link").textContent.includes("مرور")'),'All complete invites review');
 const ratios=[];
 for(const theme of ['day','night'])for(const width of [320,390,768,1280]){
  await metrics(width);await run(`graphRepository.setTheme('${theme}')`);
  for(const tab of ['teach','practice','competition','records','lab']){
   await run(`location.hash='#${tab}'`);await pause(40);
   check(await run('document.documentElement.scrollWidth<=innerWidth'),'No page overflow '+tab+theme+width);
  }
  check(await run('[...document.querySelectorAll("#neighborhood-disclosure summary,#neighborhood-board button,#neighborhood-reset")].filter(b=>b.getBoundingClientRect().width).every(b=>b.getBoundingClientRect().height>=44)'),'44px controls '+theme+width);
  check(await run('getComputedStyle(document.querySelector("#neighborhood-board .vertex-buttons")).gap==="8px"'),'8px alternatives gap '+theme+width);
  const ratio=await run(`(()=>{const lum=c=>{const a=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722};const e=document.createElement('span');e.style.backgroundColor='var(--sheet)';document.body.append(e);const values=['ink','muted','heading'].map(t=>{e.style.color='var(--'+t+')';const s=getComputedStyle(e),a=lum(s.color),b=lum(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});e.remove();return values})()`);
  check(ratio.every(v=>v>=4.5),'Measured matte text contrast '+theme+width);ratios.push({theme,width,min:Math.min(...ratio)});
  const point=await center('#hero-learning-link');await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
  const cta=await run(`(()=>{const lum=c=>{const a=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722};const s=getComputedStyle(document.querySelector('#hero-learning-link')),a=lum(s.color),b=lum(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)})()`);
  check(cta>=4.5,'Actual hovered CTA contrast '+theme+width+' '+cta);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});
  if([390,1280].includes(width)){await run('scrollTo({top:0,behavior:"instant"})');const s=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/neighborhood-${theme}-${width}.png`,Buffer.from(s.data,'base64'));}
 }
 // View controls are shared, their state and selection remain presentation-only.
 await metrics(1280);const viewState=await snapshot();await click('#neighborhood-board .graph-zoom button:last-child');
 check(await run('document.querySelector("#neighborhood-board .graph-zoom button:nth-child(2)").textContent!=="۱۰۰٪"'),'Real 2D zoom');
 await click('#neighborhood-board .graph-device-switch');await click('#neighborhood-board .graph-focus-toggle');
 check(await run('document.querySelector("#neighborhood-board .graph-stage").classList.contains("is-focused")'),'Focused view opens');await key('Escape');
 check(await run('!document.querySelector("#neighborhood-board .is-focused")'),'Escape restores inline view');
 await click('#neighborhood-board .graph-view-switch button:last-child');await wait('!document.querySelector("#neighborhood-board .graph-three").hidden');
 await click('#neighborhood-board .graph-three-labels button');
 check(await run('document.querySelector("#neighborhood-board .board-vertex[aria-pressed=true]").dataset.vertexId==="house"'),'Shared 3D native label selects');
 await click('#neighborhood-board .graph-view-switch button:first-child');check(await snapshot()===viewState,'Views never write repository');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 check(await run('document.documentElement.dataset.motion==="off"'),'Reduced motion respected');
 for(const width of [320,1280]){await metrics(width);await run('document.documentElement.style.fontSize="200%"');check(await run('document.documentElement.scrollWidth<=innerWidth'),'200% text reflow '+width);await run('document.documentElement.style.fontSize=""');}
 // Isolated adapters exercise non-durable/invalid snapshots without changing persistence logic.
 const cases=await run(`(async()=>{const{initNeighborhood}=await import('./assets/js/ui/neighborhood.js');const saved=graphRepository.snapshot(),results=[];for(const mode of ['dirty','conflict','migration','unavailable','invalid']){const n=initNeighborhood();const s=structuredClone(saved);if(mode==='migration')s.needsMigration=true;else if(mode==='unavailable')s.readStatus='unavailable';else if(mode==='invalid')s.state.teachingProgress.lastVisitedUnitId='not-a-unit';else s[mode]=true;n.connect({curriculum:qaCurriculum},{subscribe(fn){fn(s);return()=>{};}});results.push(document.querySelector('#hero-learning-link').hash==='#teach'&&document.querySelector('.site-landing').dataset.learning==='unavailable');n.destroy();}return results})()`);
 check(cases.every(Boolean),'Dirty/conflict/migration/unavailable/invalid use honest generic links');
 const cleanup=await run(`(async()=>{const{initNeighborhood}=await import('./assets/js/ui/neighborhood.js');let subscriptions=0,unsubscriptions=0;const n=initNeighborhood(),repo={subscribe(fn){subscriptions++;fn(graphRepository.snapshot());return()=>unsubscriptions++}};n.connect({curriculum:qaCurriculum},repo);n.connect({curriculum:qaCurriculum},repo);n.destroy();return subscriptions===2&&unsubscriptions===2&&!document.querySelector('#neighborhood-board .graph-stage')})()`);
 check(cleanup,'Reconnect unsubscribes and destroy removes shared stage');
 // Reload clean actual application; denied storage never advertises a saved cursor.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError')}})`});
 await send('Page.navigate',{url:origin+'?denied#teach'});await wait('Boolean(window.graphRepository)');
 check(await run('document.querySelector("#hero-learning-link").hash==="#teach"'),'Denied storage generic link');
 loadMode='slow';await send('Page.navigate',{url:origin+'?slow#lab'});await wait('Boolean(document.querySelector("#neighborhood-board .board-vertex"))');
 check(await run('!window.graphRepository&&document.querySelector(".site-landing").dataset.learning==="loading"'),'Map usable before delayed repository');
 await run('document.querySelector("#neighborhood-disclosure").open=true;document.querySelector("#neighborhood-board .vertex-choice").click()');check(await run('document.querySelector("#neighborhood-status").textContent.includes("کتابخانه")'),'Selection during delayed load');await wait('Boolean(window.graphRepository)');
 loadMode='error';await send('Page.navigate',{url:origin+'?error#records'});await wait('document.querySelector(".site-landing")?.dataset.learning==="unavailable"');
 check(await run('document.querySelectorAll("#neighborhood-board .board-vertex").length===5'),'Content failure preserves exploration');
 await run('document.querySelector("#neighborhood-disclosure").open=true');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){return /webgl/.test(type)?null:original.call(this,type,...rest)}`});
 loadMode='normal';await send('Page.navigate',{url:origin+'?no-webgl#practice'});await wait('Boolean(window.graphRepository)');await run('document.querySelector("#neighborhood-disclosure").open=true');
 await click('#neighborhood-board .graph-view-switch button:last-child');await wait('document.querySelector("#neighborhood-board .model-key").textContent.includes("در دسترس نیست")');
 check(await run('!document.querySelector("#neighborhood-board svg").hidden'),'WebGL unavailable retains 2D');
 check(errors.length===0,'No introduced runtime exceptions: '+errors.join('\n'));
 console.log(JSON.stringify({checks,errors,ratios,screenshots:'/tmp/neighborhood-{day,night}-{390,1280}.png'},null,2));
}finally{ws?.close();chrome.kill();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:200});}
