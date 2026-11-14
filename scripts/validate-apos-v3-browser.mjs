import { foundationCurriculum } from './fixtures/apos-v3.mjs';
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
 check(await run('window.graphRepository.snapshot().state.curriculumVersion===2'),'Published curriculum stays 2');
 check(await run('document.getElementById("records-teaching-migration").hidden'),'No migration UI in current v2');
 for(const tab of ['teach','practice','competition','records','lab']){
  await run(`location.hash=${JSON.stringify('#'+tab)}`);await pause(80);
  check(await run(`!document.getElementById('panel-${tab}').hidden && document.getElementById('panel-${tab}').innerText.length>100`),`${tab} mounted`);
 }
 check(errors.length===0,'No startup exceptions: '+errors.join('\n'));
 // Mount the future records controller with a fixture only, never change shipped content or real localStorage.
 const fixture=foundationCurriculum();
 const setup=`(async()=>{
 const read=async p=>(await fetch(p)).json();
 const [v2,v1,bank]=await Promise.all([read('content/teaching-v2.json'),read('content/teaching-v1.json'),read('docs/question-bank.json')]);
 const c=${JSON.stringify(fixture)};
 const {createRepository,storageKey}=await import('./assets/js/storage/repository.js');
 const {initialProgress,completeActivity}=await import('./assets/js/domain/progress.js');
 const {initRecords}=await import('./assets/js/tabs/records.js');
 let progress=initialProgress(v2);for(const id of v2.stages[0].requiredActivityIds)progress=completeActivity(progress,id,v2);
 const old={schemaVersion:1,curriculumVersion:2,revision:7,teachingProgress:progress,attempts:{},sessions:{},settings:{theme:'night',motion:'off'}};
 const state={raw:JSON.stringify(old),writes:0,fail:false};
 const storage={getItem:k=>k===storageKey?state.raw:null,setItem(k,v){if(state.fail)throw Error('quota');state.writes++;state.raw=v;},removeItem(){}};
 const context={questions:bank.questions,bankVersion:'1.4',legacyCurriculum:v1,previousCurriculum:v2};
 const repo=createRepository(c,storage,context);window.phase2QA={repo,state,before:state.raw};
 await initRecords({...context,curriculum:c},repo);location.hash='#records';return true;
})()`;
 check(await run(setup),'Fixture records mounted');
 for(const theme of ['day','night'])for(const width of [360,1280]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===360});
  await run(`document.documentElement.dataset.theme='${theme}'`);
  await run('document.getElementById("records-migration-preview").click()');
  check(await run('!document.getElementById("records-migration-confirmation").hidden'),'Inline preview visible '+theme+width);
  check(await run('phase2QA.state.writes===0'),'Preview no writes');
  check(await run('document.activeElement.id==="records-migration-confirm"'),'Confirm receives keyboard focus');
  await run('window.scrollTo({top:document.getElementById("records-migration-confirmation").getBoundingClientRect().top+scrollY-100,behavior:"instant"})');await pause(200);
  check(await run('document.getElementById("records-migration-confirm").getBoundingClientRect().top>=0 && document.getElementById("records-migration-confirm").getBoundingClientRect().bottom<=innerHeight'),'Confirm visible in viewport');
  check(await run('document.documentElement.scrollWidth<=innerWidth+1'),'No horizontal overflow '+theme+width);
  await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(async r=>{const {writeFile}=await import('node:fs/promises');await writeFile(`/tmp/apos-records-${theme}-${width}.png`,Buffer.from(r.data,'base64'));});
  await run('document.getElementById("records-migration-cancel").click()');
  check(await run('phase2QA.state.raw===phase2QA.before && phase2QA.state.writes===0'),'Cancel exact preservation');
 }
 await run('phase2QA.state.fail=true;document.getElementById("records-migration-preview").click();document.getElementById("records-migration-confirm").click()');await pause(80);
 check(await run('phase2QA.state.raw===phase2QA.before && phase2QA.repo.snapshot().state.curriculumVersion===2'),'Failed confirm preserves disk and memory');
 check(await run('document.getElementById("records-feedback").innerText.includes("حفظ")'),'Failure explanation visible');
 await run('phase2QA.state.fail=false;document.getElementById("records-migration-preview").click();document.getElementById("records-migration-confirm").click()');await pause(80);
 check(await run('phase2QA.state.writes===1 && phase2QA.repo.snapshot().state.curriculumVersion===3'),'One successful conversion write');
 check(await run('document.getElementById("records-teaching-migration").hidden'),'Conversion controls hidden after success');
 check(await run('phase2QA.repo.snapshot().state.teachingProgressArchive.teachingProgress.passedStageIds[0]==="Action"'),'Archive preserved');
 check(errors.length===0,'No records exceptions: '+errors.join('\n'));
 console.log(JSON.stringify({checks,errors,screenshots:'/tmp/apos-records-{day,night}-{360,1280}.png'},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
