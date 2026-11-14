import { answersFor,legacyEnvelope } from './fixtures/apos-authored.mjs';
import { exportBackup } from '../assets/js/storage/transfer.js';
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
 const curriculum=JSON.parse(await readFile(join(root,'content/teaching.json'),'utf8'));
 check(await run('window.graphRepository.snapshot().state.curriculumVersion===3'),'Real curriculum activated');
 check(await run('document.querySelectorAll(".apos3-card").length===1'),'One active learning card');
 check(await run('document.querySelector("[data-lesson-id=lesson2]").disabled'),'Lesson 2 locked initially');
 await run("location.hash='#teach/L2-Object'");await pause(100);
 check(await run('document.querySelector(".apos3-workspace").dataset.unitId==="L1-Action"'),'Locked deep link cannot skip');
 await run("location.hash='#teach';document.querySelector('.apos3-units button:not(:disabled)').click()");
 for(const theme of ['day','night'])for(const width of [360,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===360});await run(`document.documentElement.dataset.theme='${theme}';window.scrollTo(0,document.querySelector('.apos3').getBoundingClientRect().top+scrollY-10)`);await pause(100);
  check(await run('document.documentElement.scrollWidth<=innerWidth+1'),'No overflow '+theme+width);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const{writeFile}=await import('node:fs/promises');await writeFile(`/tmp/apos-learning-${theme}-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await run(await readFile(new URL('./fixtures/apos-browser-fill.js.txt',import.meta.url),'utf8'));
 const fill=async model=>{await run(`fillActivity(${JSON.stringify(model)},${JSON.stringify(answersFor(model))})`);};
 const checkCard=()=>run('document.querySelector(".apos3-card [data-action=check]").click()');
 const continueCard=()=>run('document.querySelector(".apos3-card [data-action=continue]").click()');
 for(const a of curriculum.activities){
  console.log('Checking',a.id);
  check(await run(`document.querySelector('.apos3-workspace').dataset.activityId===${JSON.stringify(a.id)}`),'Actual next activity '+a.id);
  const before=await run('JSON.stringify(window.graphRepository.snapshot().state.teachingProgress)');
  await checkCard();check(await run('!document.querySelector(".apos3-card [data-action=continue]")'),'Empty evidence cannot continue '+a.id);
  if(a.parts.some(p=>p.type==='prediction')){
   await run('document.querySelector(".apos3-card [data-action=hint]").click()');
   check(await run('!document.querySelector(".apos3-card .teaching-solution").textContent'),'No solution before prediction '+a.id);
   check(await run('[...document.querySelectorAll(".apos3-experiment")].every(e=>e.hidden)'),'No result before prediction '+a.id);
   await run('document.querySelector("[data-action=commit-prediction]").click()');check(await run('[...document.querySelectorAll(".apos3-experiment")].every(e=>e.hidden)'),'No experiment without a method '+a.id);
  }else{
   await run('document.querySelector(".apos3-card [data-action=hint]").click();document.querySelector(".apos3-card [data-action=reveal]").click()');
  }
  check(await run('JSON.stringify(window.graphRepository.snapshot().state.teachingProgress)')===before,'Hint/sample never completes '+a.id);
  await fill(a);await checkCard();
  check(await run('Boolean(document.querySelector(".apos3-card [data-action=continue]"))'),'Real inputs pass '+a.id+' '+await run('document.querySelector(".apos3-feedback").innerText'));
  check(await run(`document.querySelector('.apos3-workspace').dataset.activityId===${JSON.stringify(a.id)}`),'Feedback remains until manual continue');
  if(a.exitVariants){
   check(await run(`!window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.includes(${JSON.stringify(a.id)})`),'Practice does not bypass fresh exit');
   await continueCard();check(await run('document.querySelector(".apos3-workspace").dataset.exitVariant==="true"'),'Fresh exit shown');
   const variant={...a,...a.exitVariants[0],id:a.id};await fill(variant);await checkCard();
   check(await run('Boolean(document.querySelector(".apos3-card [data-action=continue]"))'),'Fresh exit passes '+a.id+' '+await run('document.querySelector(".apos3-feedback").innerText'));
  }
  check(await run(`window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.includes(${JSON.stringify(a.id)})`),'Completion saved '+a.id);
  check(await run('![...Object.values(localStorage)].some(s=>s.includes("QA_EPHEMERAL_EXPLANATION")||s.includes("QA_EPHEMERAL_METHOD")||s.includes("beforeReveal")||s.includes("uncoveredWitness"))'),'No answer leaks '+a.id);
  if(['L1-O3','L2-O1','L2-O4','L2-S4'].includes(a.id)){
   await run("window.scrollTo(0,document.querySelector('.apos3-workspace').getBoundingClientRect().top+scrollY-10)");const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const{writeFile}=await import('node:fs/promises');await writeFile(`/tmp/apos-learning-${a.id}.png`,Buffer.from(shot.data,'base64'));
  }
  await continueCard();
 }
 check(await run('window.graphRepository.snapshot().state.teachingProgress.passedUnitIds.length===8'),'All eight units pass through real UI');
 await send('Page.reload');await pause(1200);
 check(await run('window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.length===32'),'Progress survives real reload');
 await run("location.hash='#records'");await pause(100);check(await run('document.getElementById("panel-records").innerText.includes("۱۰۰")'),'Records shows derived completion');
 for(const tab of ['practice','competition','lab']){await run(`location.hash='#${tab}'`);await pause(100);check(await run(`!document.getElementById('panel-${tab}').hidden&&document.getElementById('panel-${tab}').innerText.length>100`),`${tab} still mounts`);}

 const completeBackup=await run('window.graphRepository.recoveryJSON()');
 const v2=JSON.parse(await readFile(join(root,'content/teaching-v2.json'),'utf8')),bank=JSON.parse(await readFile(join(root,'docs/question-bank.json'),'utf8'));
 const old=await legacyEnvelope(v2,bank),context={questions:bank.questions,bankVersion:bank.meta.version};
 const oldBackup=exportBackup(old,v2,context),oldRaw=JSON.stringify(old);
 await run(`window.qaStorageKey=[...Object.keys(localStorage)].find(k=>k.startsWith('graph-learning:v1:'));localStorage.setItem(qaStorageKey,${JSON.stringify(oldRaw)})`);
 await send('Page.reload');await pause(1200);
 check(await run('window.graphRepository.snapshot().needsMigration'),'Actual app holds legacy envelope before consent');
 await run("location.hash='#teach'");await pause(80);check(await run('!document.querySelector(".apos3-card")&&document.querySelector(".apos3-workspace").innerText.includes("پیشرفت")'),'Teaching pending until migration, with direction to records');
 for(const tab of ['practice','competition','records','lab']){await run(`location.hash='#${tab}'`);await pause(80);check(await run(`!document.getElementById('panel-${tab}').hidden&&document.getElementById('panel-${tab}').innerText.length>100`),'Old-data '+tab+' still available');}
 await run("location.hash='#records';document.getElementById('records-migration-preview').click();document.getElementById('records-migration-cancel').click()");
 check(await run('window.graphRepository.originalJSON()')===oldRaw,'Actual cancel preserves exact old bytes');
 await run("window.qaOriginalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('graph-learning:v1:'))throw new DOMException('quota','QuotaExceededError');return qaOriginalSetItem.call(this,k,v)};document.getElementById('records-migration-preview').click();document.getElementById('records-migration-confirm').click()");
 check(await run('window.graphRepository.snapshot().state.curriculumVersion===2&&window.graphRepository.snapshot().needsMigration'),'Actual quota keeps live legacy state');
 check(await run('window.graphRepository.originalJSON()')===oldRaw,'Actual quota keeps old bytes');
 await run("Storage.prototype.setItem=qaOriginalSetItem;document.getElementById('records-migration-preview').click();document.getElementById('records-migration-confirm').click()");
 check(await run('window.graphRepository.snapshot().state.curriculumVersion===3&&!window.graphRepository.snapshot().needsMigration'),'Actual conversion activates new route');
 check(await run('JSON.stringify(window.graphRepository.snapshot().state.attempts)')===JSON.stringify(old.attempts),'Real attempt content preserved');
 check(await run('JSON.stringify(window.graphRepository.snapshot().state.sessions)')===JSON.stringify(old.sessions),'Real session and deletion tombstone preserved');
 check(await run('window.graphRepository.snapshot().state.teachingProgressArchive.teachingProgress.passedStageIds[0]==="Action"'),'Archive shown from old progress');
 check(await run('Boolean(document.getElementById("records-teaching-archive"))'),'Archive visibly separate in records');
 const importFile=async(text)=>{await run(`(()=>{const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(text)}],'qa-backup.json',{type:'application/json'}));const input=document.getElementById('records-import-file');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);await pause(150);check(await run('!document.getElementById("records-import-confirmation").hidden'),'Actual file import preview');await run('document.getElementById("records-import-confirm").click()');};
 await importFile(oldBackup);check(await run('window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.length===0'),'Old file import adds no new credit');
 await importFile(completeBackup);check(await run('window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.length===32'),'New file import restores real completion');
 check(await run('JSON.stringify(window.graphRepository.snapshot().state.sessions)')===JSON.stringify(old.sessions),'Import preserves spent/deleted turn');
 await run('document.getElementById("records-reset").click();document.getElementById("records-reset-confirm").click()');
 check(await run('window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.length===0'),'Actual inline reset');
 check(await run('window.graphRepository.snapshot().state.teachingProgressArchive.teachingProgress.passedStageIds[0]==="Action"'),'Reset keeps archive');
 check(await run('JSON.stringify(window.graphRepository.snapshot().state.sessions)')===JSON.stringify(old.sessions),'Reset keeps sessions and tombstones');
 await send('Page.reload');await pause(1200);check(await run('!window.graphRepository.snapshot().needsMigration&&window.graphRepository.snapshot().state.teachingProgress.completedActivityIds.length===0'),'No repeat migration or reset loss after reload');
 check(errors.length===0,'No browser exceptions: '+errors.join('\n'));
 console.log(JSON.stringify({checks,errors,screenshots:'/tmp/apos-learning-*.png'},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
