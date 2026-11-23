import { legacyEnvelope } from './fixtures/apos-authored.mjs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),profile=await mkdtemp(join(tmpdir(),'apos-browser-'));
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.webp':'image/webp','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!path.startsWith(root+'/')&&path!==root)throw Error();const file=path===root?join(path,'index.html'):path;res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin=`http://127.0.0.1:${server.address().port}`;
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
let ws,checks=0,errors=[],pending=new Map(),seq=0;
const check=(value,msg)=>{checks++;assert.ok(value,msg);};
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
 check(await run('window.graphRepository.snapshot().state.curriculumVersion===3'),'Complete curriculum 3 activated');
 check(await run('document.getElementById("records-teaching-migration").hidden'),'No migration UI on fresh v3');
 const curriculum=JSON.parse(await readFile(join(root,'content/teaching.json'),'utf8'));
 const key=async(key,code=key)=>{const virtual={Enter:13,' ':32,Escape:27,Tab:9,ArrowDown:40};await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:virtual[key],text:key==='Enter'?'\r':key===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtual[key]});};
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const{writeFile}=await import('node:fs/promises');await writeFile(`/tmp/learning-map-${name}.png`,Buffer.from(r.data,'base64'));};
 const scroll=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`);await pause(80);};
 await run(`(async()=>{window.qaCurriculum=await(await fetch('content/teaching.json')).json();window.qaProgress=await import('./assets/js/domain/progress.js');})()`);
 await run("location.hash='#teach'");await pause(60);
 check(await run("Boolean(document.querySelector('.apos3-unit-path'))"),'Ordered connected learning map exists');
 check(await run("document.querySelectorAll('.apos3-lessons button').length===qaCurriculum.lessons.length"),'Lesson buttons data driven');
 check(await run("document.querySelector('.apos3-units [aria-current=step]').dataset.unitId===qaCurriculum.units[0].id"),'Fresh current unit');
 await run("location.hash='#teach/L2-Object'");await pause(80);
 check(await run("document.querySelector('#teaching-stage').dataset.unitId==='L1-Action'"),'Locked deep link denied');
 await run("location.hash='#teach/%E0%A4%A'");await pause(40);
 check(await run("document.querySelector('#teaching-stage').dataset.unitId==='L1-Action'"),'Malformed deep link safely ignored');
 await run("location.hash='#teach';document.querySelector('.apos3-units button').focus();window.qaFocused=document.activeElement;graphRepository.setMotion('off')");
 check(await run('document.activeElement===qaFocused && qaFocused.isConnected'),'Repository notification retains native map focus');
 await key('Enter');
 check(await run("document.activeElement.id==='learning-activity-heading'"),'Keyboard navigation focuses current activity heading');
 // Every actual unit, using valid completion flags as navigation fixtures only.
 for(const [index,u]of curriculum.units.entries()){
  await run(`graphRepository.resetTeaching();graphRepository.changeProgress(()=>{let p=qaProgress.initialProgress(qaCurriculum);for(const unit of qaCurriculum.units.slice(0,${index}))for(const id of unit.requiredActivityIds)p=qaProgress.completeActivity(p,id,qaCurriculum);return p;});location.hash='#teach/${u.id}'`);await pause(50);
  const lesson=curriculum.lessons.find(l=>l.id===u.lessonId),actual=await run(`(()=>{const p=graphRepository.snapshot().state.teachingProgress;return{ids:[...document.querySelectorAll('.apos3-units button')].map(b=>b.dataset.unitId),current:[...document.querySelectorAll('.apos3-units button[aria-current=step]')].map(b=>b.dataset.unitId),disabled:[...document.querySelectorAll('.apos3-units button')].map(b=>b.disabled),steps:[...document.querySelectorAll('.apos3-step-route button')].map(b=>({id:b.dataset.activityId,disabled:b.disabled,current:b.getAttribute('aria-current')})),edges:[...document.querySelectorAll('.apos3-route-edge')].map(e=>[e.dataset.from,e.dataset.to])};})()`);
  assert.deepEqual(actual.ids,lesson.unitIds);checks++;
  assert.deepEqual(actual.current,[u.id]);checks++;
  assert.deepEqual(actual.disabled,lesson.unitIds.map(id=>curriculum.units.findIndex(v=>v.id===id)>index));checks++;
  assert.deepEqual(actual.steps.map(s=>s.id),u.requiredActivityIds);checks++;
  check(actual.steps.filter(s=>s.current==='step').length===1&&!actual.steps[0].disabled&&actual.steps.slice(1).every(s=>s.disabled),'Step gates '+u.id);
  assert.deepEqual(actual.edges,lesson.unitIds.flatMap(id=>curriculum.units.find(v=>v.id===id).prerequisites.map(from=>[from,id])));checks++;
 }
 await run("graphRepository.resetTeaching();location.hash='#teach/L1-Action'");await pause(50);
 await run("graphRepository.changeProgress(p=>qaProgress.completeActivity(p,'L1-A1',qaCurriculum))");
 check(await run("document.querySelector('.apos3-step-route button[data-activity-id=L1-A1]').dataset.complete==='true'"),'Current step completion updates without navigation');
 check(await run("document.querySelector('.apos3-unit-button').innerText.includes('۱ از ۴')"),'Activity count is derived');
 await run("graphRepository.setMotion('full');graphRepository.changeProgress(p=>{for(const id of qaCurriculum.units[0].requiredActivityIds)p=qaProgress.completeActivity(p,id,qaCurriculum);return p;})");
 check(await run("document.querySelector('.apos3-unit-button[data-unit-id=L1-Process]').disabled===false"),'Unlocking is immediate, independent of connection motion');
 check(await run("document.getAnimations().some(a=>a.playState==='running'&&a.effect?.target?.classList?.contains('apos3-route-edge'))"),'Newly passed prerequisite has finite connection feedback');
 await run("graphRepository.setMotion('off')");
 check(await run("!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.target?.classList?.contains('apos3-route-edge'))"),'Off cancels path motion immediately');
 for(const mode of ['low','reduce']){
  await run("graphRepository.resetTeaching()");
  if(mode==='reduce')await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  else await run("graphRepository.setMotion('low')");
  await run("graphRepository.changeProgress(p=>{for(const id of qaCurriculum.units[0].requiredActivityIds)p=qaProgress.completeActivity(p,id,qaCurriculum);return p;})");
  check(await run("!document.getAnimations().some(a=>a.playState==='running'&&a.effect?.target?.classList?.contains('apos3-route-edge'))"),'Path honors '+mode);
 }
 await send('Emulation.setEmulatedMedia',{features:[]});await run("graphRepository.setMotion('off')");
 // Touch activation uses the same native route, not a mobile fork.
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await scroll('.apos3-units button');const point=await run("(()=>{const r=document.querySelector('.apos3-units button').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+20};})()");
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:2,radiusY:2,force:1}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(70);
 check(await run("document.querySelector('#teaching-stage').dataset.unitId==='L1-Action'"),'Native touch opens unit');await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 // Layout and all-complete routes with actual source titles in two palettes.
 const contrast=[];
 for(const theme of ['day','night'])for(const width of [320,390,768,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await run(`graphRepository.setTheme('${theme}');location.hash='#teach';document.documentElement.dataset.theme='${theme}'`);await pause(80);
  check(await run('document.documentElement.scrollWidth<=innerWidth'),'Teach page reflow '+theme+width);
  check(await run("[...document.querySelectorAll('.apos3-units button,.apos3-lessons button,.apos3-step-route button')].every(b=>b.getBoundingClientRect().height>=44)"),'44px native path targets '+theme+width);
  check(await run(`(()=>{const b=[...document.querySelectorAll('.apos3-units button')].map(b=>b.getBoundingClientRect());return b.slice(1).every((r,i)=>${width<768?'r.top-b[i].bottom>=8':'Math.abs(r.top-b[i].top)<2'});})()`),'Responsive route reading direction '+theme+width);
  await scroll('.apos3-units');if([390,1280].includes(width))await shot('teach-'+theme+'-'+width);
  const ratios=await run(`(()=>{const lum=rgb=>{const c=rgb.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};const e=document.createElement('span');e.style.backgroundColor='var(--sheet)';document.body.append(e);const ratios=['ink','muted','heading','error'].map(token=>{e.style.color='var(--'+token+')';const style=getComputedStyle(e),a=lum(style.color),b=lum(style.backgroundColor);return{token,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});e.remove();return ratios;})()`);
  check(ratios.every(r=>r.ratio>=4.5),'Text contrast '+theme+width);contrast.push({theme,width,ratios});
 }
 await run("graphRepository.changeProgress(()=>{let p=qaProgress.initialProgress(qaCurriculum);for(const a of qaCurriculum.activities)p=qaProgress.completeActivity(p,a.id,qaCurriculum);return p;});location.hash='#teach/L2-Schema'");await pause(80);
 check(await run("[...document.querySelectorAll('.apos3-units button')].every(b=>b.dataset.state==='complete'&&!b.disabled)"),'Completed path remains reviewable');
 check(await run("document.querySelector('#teaching-percent').textContent==='۱۰۰٪'"),'Complete curriculum derives 100 percent');
 // Records mounts on a valid isolated repository. App's real profile is never read/overwritten.
 await run(`(async()=>{const read=async p=>(await fetch(p)).json();const [bank,v2,v1]=await Promise.all([read('docs/question-bank.json'),read('content/teaching-v2.json'),read('content/teaching-v1.json')]);const {createRepository,storageKey}=await import('./assets/js/storage/repository.js'),{initRecords}=await import('./assets/js/tabs/records.js'),transfer=await import('./assets/js/storage/transfer.js');window.qaContext={questions:bank.questions,bankVersion:bank.meta.version,previousCurriculum:v2,legacyCurriculum:v1};let progress=qaProgress.initialProgress(qaCurriculum);for(const id of qaCurriculum.units[0].requiredActivityIds)progress=qaProgress.completeActivity(progress,id,qaCurriculum);const text=(id,date,tab='practice')=>({id,tab,questionId:'Q001',recordedAt:date,responseMode:'self-assessed-text',target:'rubric',response:('توضیح رابطه و فرض مدل با متن بلند '.repeat(20)).trim(),hintLevel:0,evaluation:{satisfiesTarget:true,selfAssessed:true},baseScore:10,finalScore:10});const {createAttempt}=await import('./assets/js/domain/attempts.js');const q=bank.questions.find(q=>q.tabs.includes('practice')&&q.graph?.n&&q.graph.n<=10&&!q.graph.directed&&!q.graph.multigraph);const {analyzeGraph}=await import('./assets/js/domain/evaluate.js');const choice=createAttempt({questionId:q.id,tab:'practice',mode:'vertex-selection',target:'minimum',response:analyzeGraph(q.graph).minimumSets[0],graph:q.graph});choice.id='selection';choice.recordedAt='2026-11-20T09:00:00Z';const old=text('old','2026-11-11T08:00:00Z'),fresh=text('fresh','2026-11-22T09:00:00Z');const archived=qaProgress.initialProgress(v2);const state={schemaVersion:2,curriculumVersion:3,revision:4,teachingProgress:progress,teachingProgressArchive:{curriculumVersion:2,teachingProgress:archived},attempts:{old,selection:choice,fresh},sessions:{},settings:{theme:'day',motion:'off'}};window.qaState={raw:JSON.stringify(state),writes:0,fail:false};const storage={getItem:k=>k===storageKey?qaState.raw:null,setItem(k,v){if(qaState.fail)throw Error('quota');qaState.writes++;qaState.raw=v;},removeItem(){}};const repo=createRepository(qaCurriculum,storage,qaContext);window.recordsQA={repo,transfer,state,storageKey,initRecords,createRepository,storage,seed:JSON.stringify(state)};await initRecords({...qaContext,curriculum:qaCurriculum},repo);location.hash='#records';})()`);
 check(await run("recordsQA.repo.snapshot().readStatus==='ready'"),'Valid records fixture accepted');
 assert.deepEqual(await run("[...document.querySelectorAll('.records-row')].map(r=>r.dataset.attemptId)"),['fresh','selection','old']);checks++;
 assert.deepEqual(await run("[...document.querySelectorAll('.records-row time')].map(t=>t.dateTime)"),['2026-11-22T09:00:00Z','2026-11-20T09:00:00Z','2026-11-11T08:00:00Z']);checks++;
 check(await run("document.querySelectorAll('.records-learning-map li[data-unit-id]').length===qaCurriculum.units.length && document.querySelectorAll('.records-learning-map time').length===0"),'Teaching map honest completion without dates');
 check(await run("document.querySelectorAll('.records-coverage').length===6"),'Six domains retained');
 check(await run("!document.querySelector('#records-management').hidden && document.querySelector('#records-management').contains(document.querySelector('#records-export')) && document.querySelector('#records-management').contains(document.querySelector('#records-reset'))"),'Management actions visible and grouped');
 await run("document.querySelector('.records-row details summary').focus()");await key(' ' ,'Space');
 check(await run("document.querySelector('.records-row details').open && document.querySelector('.records-row details p').innerText.length>300"),'Keyboard opens real long answer');
 await run("recordsQA.repo.setTheme('night')");
 check(await run("document.querySelector('.records-row details').open"),'Open answer survives repository refresh');
 await run("document.getElementById('records-teaching-archive').querySelector('summary').focus()");await key('Enter');
 check(await run("document.getElementById('records-teaching-archive').open && document.getElementById('records-teaching-archive').innerText.includes('۰')"),'Archive view keyboard readable, no invented achievement');
 for(const theme of ['day','night'])for(const width of [320,390,768,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await run(`document.documentElement.dataset.theme='${theme}'`);await pause(50);
  check(await run('document.documentElement.scrollWidth<=innerWidth'),'Records long answer page reflow '+theme+width);
  check(await run("[...document.querySelectorAll('#panel-records button,#panel-records summary')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).every(e=>e.getBoundingClientRect().height>=44)"),'Records action sizes '+theme+width);
  await scroll('#panel-records h1');if([390,1280].includes(width))await shot('records-'+theme+'-'+width);
 }
 // The existing custom combobox is tested via keyboard, in place above the ledger.
 await run("document.querySelector('#records-filter').closest('.select-field').querySelector('[role=combobox]').focus()");await key('Enter');await key('ArrowDown');await key('ArrowDown');await key('Enter');
 check(await run("document.getElementById('records-filter').value!=='all'"),'Keyboard filter changes native value');
 await run("document.getElementById('records-filter').value='lab';document.getElementById('records-filter').dispatchEvent(new Event('change',{bubbles:true}))");
 check(await run("document.querySelectorAll('.records-row').length===0 && document.getElementById('records-list').innerText.includes('هنوز')"),'Filtered empty state is explicit');
 await run("document.getElementById('records-filter').value='all';document.getElementById('records-filter').dispatchEvent(new Event('change',{bubbles:true}))");
 const progressBefore=await run('JSON.stringify(recordsQA.repo.snapshot().state.teachingProgress)');
 const rawBefore=await run('qaState.raw');
 await run("document.querySelector('.records-row input[data-attempt-id=fresh]').click();document.getElementById('records-delete').click();document.getElementById('records-delete-cancel').click()");
 check(await run('qaState.raw')===rawBefore,'Delete cancel leaves exact stored bytes');
 await run("document.getElementById('records-delete').click();document.getElementById('records-delete-confirm').click()");
 check(await run("!recordsQA.repo.snapshot().state.attempts.fresh && Object.keys(recordsQA.repo.snapshot().state.attempts).length===2"),'Selective deletion removes only selected attempt');
 check(await run('JSON.stringify(recordsQA.repo.snapshot().state.teachingProgress)')===progressBefore,'Deletion leaves learning completion intact');
 // Import real files through the existing file input handler (preview/confirm/cancel).
 await run(`window.qaIncoming=recordsQA.transfer.exportBackup(recordsQA.state,qaCurriculum,qaContext);window.qaImport=async text=>{const input=document.getElementById('records-import-file'),data=new DataTransfer();data.items.add(new File([text],'backup.json',{type:'application/json'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,80));};`);
 const beforeImport=await run('qaState.raw');await run('qaImport(qaIncoming)');
 check(await run("!document.getElementById('records-import-confirmation').hidden && document.getElementById('records-import-preview').textContent.includes('پیش')"),'Valid import preview visible');
 check(await run('qaState.raw')===beforeImport,'Preview never writes');
 await run("document.getElementById('records-import-cancel').click()");check(await run('qaState.raw')===beforeImport,'Import cancel exact preservation');
 // Import a distinct valid attempt using the existing validated merge contract.
 await run("(()=>{const incoming=recordsQA.repo.snapshot().state;incoming.attempts.new=structuredClone(incoming.attempts.old);incoming.attempts.new.id='new';incoming.attempts.new.recordedAt='2026-11-23T10:00:00Z';window.qaNewBackup=recordsQA.transfer.exportBackup(incoming,qaCurriculum,qaContext);})();qaImport(qaNewBackup)");
 await run("document.getElementById('records-import-confirm').click()");
 check(await run("Boolean(recordsQA.repo.snapshot().state.attempts.new)&&!recordsQA.repo.snapshot().state.attempts.fresh"),'Confirmed import adds a distinct valid attempt');
 const beforeBad=await run('qaState.raw');await run("qaImport('{')");
 check(await run("document.getElementById('records-feedback').innerText.length>0 && document.getElementById('records-import-confirmation').hidden"),'Parse error is visible without confirmation');
 check(await run('qaState.raw')===beforeBad,'Parse error preserves stored state');
 // Real quota and conflict paths of unchanged repository.
 await run("qaState.fail=true;recordsQA.repo.setTheme('day')");
 check(await run("recordsQA.repo.snapshot().dirty && document.getElementById('panel-records').innerText.includes('ذخیره') && !document.getElementById('records-retry').hidden"),'Quota warning/recovery visible');
 check(await run('qaState.raw')===beforeBad,'Quota preserves old disk bytes');
 await run("qaState.fail=false;document.getElementById('records-retry').click()");
 check(await run('!recordsQA.repo.snapshot().dirty'),'Retry saves valid memory');
 await run("(()=>{const external=JSON.parse(qaState.raw);external.revision++;qaState.raw=JSON.stringify(external);})();recordsQA.repo.setTheme('night')");
 check(await run("recordsQA.repo.snapshot().conflict && document.getElementById('records-delete').disabled && document.getElementById('records-retry').disabled"),'Conflict disables destructive/retry actions and leaves recovery');
 await run("document.getElementById('records-reload').click();document.getElementById('records-reload-confirm').click()");
 check(await run('!recordsQA.repo.snapshot().conflict'),'Inline reload resolves conflict');
 const sessionsBeforeReset=await run('JSON.stringify(recordsQA.repo.snapshot().state.sessions)');
 await run("document.getElementById('records-reset').click();document.getElementById('records-reset-confirm').click()");
 check(await run('recordsQA.repo.snapshot().state.teachingProgress.completedActivityIds.length===0'),'Inline teaching reset still works in management');
 check(await run('JSON.stringify(recordsQA.repo.snapshot().state.sessions)')===sessionsBeforeReset,'Reset preserves other sessions');
 check(await run('Boolean(recordsQA.repo.snapshot().state.teachingProgressArchive)'),'Reset retains archive');
 // Existing valid legacy fixture includes a consumed/deleted competition turn.
 const v2=JSON.parse(await readFile(join(root,'content/teaching-v2.json'),'utf8')),bank=JSON.parse(await readFile(join(root,'docs/question-bank.json'),'utf8'));
 const legacy=await legacyEnvelope(v2,bank);
 await run(`(async()=>{recordsQA.repo.dispose();qaState.raw=${JSON.stringify(JSON.stringify(legacy))};qaState.writes=0;recordsQA.repo=recordsQA.createRepository(qaCurriculum,recordsQA.storage,qaContext);await recordsQA.initRecords({...qaContext,curriculum:qaCurriculum},recordsQA.repo);})()`);
 check(await run('recordsQA.repo.snapshot().needsMigration'),'Legacy is held for explicit migration');
 const legacyBefore=await run('qaState.raw');
 await run("document.getElementById('records-migration-preview').click();document.getElementById('records-migration-cancel').click()");
 check(await run('qaState.raw')===legacyBefore,'Legacy cancel leaves exact disk bytes');
 await run("document.getElementById('records-migration-preview').click();document.getElementById('records-migration-confirm').click()");
 check(await run("!recordsQA.repo.snapshot().needsMigration && recordsQA.repo.snapshot().state.teachingProgress.completedActivityIds.length===0"),'Legacy migration gives no fresh learning credit');
 check(await run("document.getElementById('records-teaching-archive').innerText.includes('مسیر قبلی') && document.querySelectorAll('.records-deleted').length>0"),'Archive and consumed deleted turn remain visible');
 check(await run('JSON.stringify(recordsQA.repo.snapshot().state.sessions)')===JSON.stringify(legacy.sessions),'Legacy sessions preserved exactly');
 // A failed normal teaching save still displays temporary completion honestly.
 await run("location.hash='#teach';graphRepository.resetTeaching();window.qaOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('graph-learning:v1:'))throw Error('quota');return qaOriginalSet.call(this,k,v);};graphRepository.changeProgress(p=>qaProgress.completeActivity(p,'L1-A1',qaCurriculum))");await pause(60);
 check(await run("graphRepository.snapshot().dirty && document.getElementById('teaching-save-state').innerText.includes('نشده') && document.getElementById('teaching-notice').innerText.length>0"),'Teaching quota shows unsaved completion and recovery warning');
 check(await run("document.querySelector('.apos3-step-route button[data-activity-id=L1-A1]').dataset.complete==='true'"),'Temporary completion remains visible during failed save');
 await run('Storage.prototype.setItem=qaOriginalSet;graphRepository.retry()');
 check(await run('!graphRepository.snapshot().dirty'),'Teaching retry persists after storage recovers');
 // 200% text stress plus reduced motion in both real tabs/themes.
 for(const theme of ['day','night'])for(const width of [320,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await run(`document.documentElement.dataset.theme='${theme}';document.documentElement.style.fontSize='200%'`);
  for(const tab of ['teach','records']){await run(`location.hash='#${tab}'`);await pause(100);check(await run('document.documentElement.scrollWidth<=innerWidth'),'200 percent text '+tab+theme+width);}
 }
 await run("document.documentElement.style.fontSize='';document.querySelectorAll('.records-row details').forEach(d=>d.open=true)");
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:1000,deviceScaleFactor:1,mobile:true});
 await scroll('.records-timeline');await shot('ledger-details-night-320');
 check(errors.length===0,'No runtime exceptions '+errors.join('\n'));
 console.log(JSON.stringify({checks,errors,contrast,screenshots:'/tmp/learning-map-*.png',physicalTouchDevice:false,browserZoom:'200% text simulation; native viewport reflow separately'},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
