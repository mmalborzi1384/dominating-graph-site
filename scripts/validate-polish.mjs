import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRepository,storageKey} from '../assets/js/storage/repository.js';
import {validateStoredEnvelope} from '../assets/js/storage/validate.js';
import {exportBackup,parseBackup} from '../assets/js/storage/transfer.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const curriculum=read('content/teaching.json'),bank=read('docs/question-bank.json');
const context={questions:bank.questions,bankVersion:bank.meta.version,legacyCurriculum:read('content/teaching-v1.json')};
let raw=null,denied=false;
const storage={getItem:()=>raw,setItem:(k,v)=>{assert.equal(k,storageKey);if(denied)throw Error('quota');raw=v;},removeItem(){}};
let repository=createRepository(curriculum,storage,context),checks=0;
for(const motion of ['off','low','medium','full']){
 assert(repository.setMotion(motion));assert(repository.setTheme('night'));checks+=2;
 assert.equal(repository.snapshot().state.settings.motion,motion);checks++;
 const imported=parseBackup(exportBackup(repository.snapshot().state,curriculum,context),curriculum,context);
 assert.equal(imported.settings.motion,motion);checks++;
 repository.dispose();repository=createRepository(curriculum,storage,context);
 assert.equal(repository.snapshot().state.settings.motion,motion);checks++;
}
const state=repository.snapshot().state;
for(const invalid of ['fast','',null,1,{},true]){const next=structuredClone(state);next.settings.motion=invalid;assert.throws(()=>validateStoredEnvelope(next,curriculum,context));assert.throws(()=>parseBackup(JSON.stringify({...JSON.parse(exportBackup(state,curriculum,context)),data:{...JSON.parse(exportBackup(state,curriculum,context)).data,settings:next.settings}}),curriculum,context));checks+=2;}
const old=structuredClone(state);delete old.settings.motion;assert.doesNotThrow(()=>validateStoredEnvelope(old,curriculum,context));checks++;
const before=raw;denied=true;assert.equal(repository.setMotion('low'),false);assert.equal(raw,before);assert.equal(repository.snapshot().state.settings.motion,'low');assert(repository.snapshot().dirty);checks+=4;
denied=false;assert(repository.retry());checks++;
const backup=JSON.parse(exportBackup(repository.snapshot().state,curriculum,context));for(const version of ['1.1','1.2','1.3']){backup.bankVersion=version;assert.throws(()=>parseBackup(JSON.stringify(backup),curriculum,context));checks++;}
assert(!/response|score|hint|motion/.test(JSON.stringify(repository.snapshot().state.teachingProgress)));checks++;
repository.dispose();console.log(`${checks} phase-8 preference/current-bank transfer checks passed.`);
