// Atlas presentation acceptance. Synthetic content is transient and never saved.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const args=process.argv.slice(2);
assert.ok(args.length===0||(args.length===2&&args[0]==='--story'&&/^US[1-6]$/.test(args[1])), 'Usage: --story US1..US6');
assert.ok(!args.length||args[1]==='US1','Only US1 is implemented; later stories await review');
const root=fileURLToPath(new URL('../',import.meta.url)), profile=await mkdtemp(join(tmpdir(),'atlas-browser-'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{
 const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/^\/dominating-graph-site/,''));
 if(path!==resolve(root)&&!path.startsWith(root))throw Error('Outside root');
 const file=path===resolve(root)?join(path,'index.html'):path;
 res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});
await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});
const origin=`http://127.0.0.1:${server.address().port}/dominating-graph-site/`;
const chrome=spawn(process.env.CHROME_BIN??'/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ws,serial=0,checks=0;const pending=new Map(),errors=[],measurements=[],contrasts=[],screenshots=[];
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
try{
 let port;for(let i=0;i<150;i++){try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await pause(100);}}
 assert.ok(port,'Chrome debugger ready');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
 const waitFor=async expression=>{for(let i=0;i<200;i++){if(await run(expression))return;await pause(50);}throw Error('Timed out: '+expression);};
 const key=async key=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:{Enter:13,Escape:27,Tab:9}[key],...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});};
 const viewport=width=>send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=640});
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});const path=`/tmp/atlas-${name}.png`;await writeFile(path,Buffer.from(r.data,'base64'));screenshots.push(path);};
 await send('Page.enable');await send('Runtime.enable');await viewport(1280);await send('Page.navigate',{url:origin+'#teach'});
 await waitFor(`Boolean(window.graphRepository&&document.querySelector('.apos3-scenario'))`);
 await run('document.fonts.ready');
 check(await run(`document.fonts.check('16px Vazirmatn')`),'Local Persian font loaded');
 // Capture domain state, excluding intentional theme/motion preferences.
 const stateExpression=`JSON.stringify((({attempts,sessions,teachingProgress})=>({attempts,sessions,teachingProgress}))(graphRepository.snapshot().state))`;
 const before=await run(stateExpression);
 for(const theme of ['day','night']){
  await run(`graphShellTheme.set('${theme}')`);
  const ratios=await run(`(()=>{const c=getComputedStyle(document.documentElement),lum=v=>{const h=c.getPropertyValue(v).trim().slice(1),a=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];},bg=lum('--surface');return Object.fromEntries(['--ink','--ink-soft','--heading'].map(v=>{const l=lum(v);return[v,(Math.max(l,bg)+.05)/(Math.min(l,bg)+.05)];}));})()`);
  contrasts.push({theme,ratios});check(Object.values(ratios).every(r=>r>=4.5),'Reading token contrast '+theme);
  for(const width of [320,390,768,1280,1440]){
   await viewport(width);
   for(const tab of ['teach','practice','competition','records','lab']){
    await run(`location.hash='#${tab}'`);await waitFor(`!document.querySelector('#panel-${tab}').hidden`);await pause(100);
    const metrics=await run(`(()=>{const panel=document.querySelector('#panel-${tab}'),h=panel.querySelector('h1'),body=getComputedStyle(document.body),r=document.documentElement;return{client:r.clientWidth,scroll:r.scrollWidth,body:parseFloat(body.fontSize),heading:parseFloat(getComputedStyle(h).fontSize),dir:document.documentElement.dir};})()`);
    check(metrics.scroll<=metrics.client+1,'No page overflow '+JSON.stringify({theme,width,tab,metrics}));
    check(metrics.body>=16&&metrics.heading>metrics.body&&metrics.dir==='rtl','Hierarchy and RTL '+tab);
    measurements.push({theme,width,tab,...metrics});
    if((width===390||width===1280)&&['teach','practice','records'].includes(tab)){
     await run(`document.querySelector('#panel-${tab}').scrollIntoView({block:'start',behavior:'instant'})`);
     await shot(`${theme}-${width}-${tab}`);
    }
   }
  }
 }
 // Long prose must reflow in the actual mounted teaching/practice containers.
 for(const tab of ['teach','practice']){
  await run(`location.hash='#${tab}'`);await pause(100);
  const selector=tab==='teach'?'.apos3-scenario':'#panel-practice .question-card p';
  await waitFor(`Boolean(document.querySelector('${selector}'))`);
  const original=await run(`document.querySelector('${selector}').innerHTML`);
  await run(`document.querySelector('${selector}').append(document.createTextNode(' '+ 'در این مسئله رابطه میان مکان‌ها و مسیرهای یک محله را بررسی کن و دلیل انتخاب مدل را بنویس. '.repeat(12)))`);
  // The first teaching activity has no visible formula. Exercise the real
  // renderer with a synthetic formula, without changing curriculum or progress.
  await run(`(async()=>{const {renderFormula}=await import('./assets/js/ui/math.js');const host=document.createElement('span');const result=renderFormula(host,'G=(V,E), \\gamma(G)=2');if(!result.ok)throw Error('KaTeX fixture failed');document.querySelector('${selector}').append(host);})()`);
  for(const width of [320,390,640]){
   await viewport(width);await pause(50);
   check(await run(`(()=>{const n=document.querySelector('${selector}'),c=getComputedStyle(n),r=n.getBoundingClientRect();return parseFloat(c.fontSize)>=16&&r.height>100&&n.scrollWidth<=n.clientWidth+1&&document.documentElement.scrollWidth<=document.documentElement.clientWidth+1;})()`),'Long Persian text reflows '+tab+'/'+width);
  }
  // 640 CSS px models reflow at 200% on a 1280px desktop, not browser chrome zoom.
  await run(`document.querySelector('${selector}').scrollIntoView({block:'start',behavior:'instant'})`);
  await shot('reflow-200-'+tab);
  const math=await run(`(()=>{const list=[...document.querySelectorAll('#panel-${tab} .math')].filter(n=>n.getClientRects().length);return{count:list.length,ok:list.every(n=>getComputedStyle(n).direction==='ltr'&&n.getBoundingClientRect().width<=document.documentElement.clientWidth)};})()`);
  check(math.count>0&&math.ok,'Real mixed Persian/KaTeX stays LTR and bounded '+tab);
  await run(`document.querySelector('${selector}').innerHTML=${JSON.stringify(original)}`);
 }
 await viewport(390);
 for(const motion of ['off','low','medium','full']){
  await run(`document.querySelector('input[name="motion-level"][value="${motion}"]').click()`);
  check(await run(`document.documentElement.dataset.motion==='${motion}'`),'Real motion control '+motion);
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 check(await run(`getComputedStyle(document.documentElement).scrollBehavior==='auto'`),'Reduced motion disables smooth document scroll');
 await send('Page.bringToFront');
 await run(`document.querySelector('#theme-toggle').focus()`);
 await key('Enter');await pause(100);
 await waitFor(`document.documentElement.dataset.theme==='day'`);
 check(await run(`document.documentElement.dataset.theme==='day'`),'Keyboard toggles actual theme');
 await key('Tab');check(await run(`document.activeElement.matches(':focus-visible')`),'Tab focus remains visible');
 await run(`document.querySelector('#navigation-toggle').focus()`);await key('Enter');
 await waitFor(`document.querySelector('#navigation-toggle').getAttribute('aria-expanded')==='true'`);
 check(await run(`document.querySelector('#navigation-toggle').getAttribute('aria-expanded')==='true'`),'Keyboard opens navigation');await key('Escape');
 check(await run(`document.querySelector('#navigation-toggle').getAttribute('aria-expanded')==='false'`),'Escape closes navigation');
 check(await run(stateExpression)===before,'Typography/preferences preserve attempts, sessions and teaching progress');
 check(errors.length===0,'No runtime exceptions: '+errors.join('\n'));
 console.log(JSON.stringify({story:'US1',checks,errors,contrasts,measurements,screenshots,zoom:'200% reflow emulation: 1280 physical / 640 CSS px; native toolbar zoom not tested',physicalTouchDevice:false},null,2));
}finally{ws?.close();chrome.kill('SIGTERM');server.close();await pause(300);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
