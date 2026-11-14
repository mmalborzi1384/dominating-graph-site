import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateTeaching,validateTeachingSources } from '../assets/js/data/validate.js';
import { assessTeachingEvidence,assessEvidencePart } from '../assets/js/domain/teaching-evidence.js';
import { initialProgress,completeActivity,visitUnit,progressPercent,validateProgress } from '../assets/js/domain/progress.js';
import { createRepository,storageKey } from '../assets/js/storage/repository.js';
import { exportBackup,parseBackup,mergeBackup } from '../assets/js/storage/transfer.js';
import { answersFor,answerFor,combinations,minima,covered,uncovered } from './fixtures/apos-authored.mjs';
const read=file=>JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url)));
const c=read('content/teaching.json'),v2=read('content/teaching-v2.json'),v1=read('content/teaching-v1.json'),bank=read('docs/question-bank.json');
const ctx={questions:bank.questions,bankVersion:bank.meta.version,previousCurriculum:v2,legacyCurriculum:v1};
let checks=0;const check=(value,message)=>{checks++;assert.ok(value,message);};
validateTeaching(c,null,bank);validateTeachingSources(read('content/teaching-sources.json'),bank,c);
check(c.activities.length===32&&c.units.length===8,'32 authored activities and eight units');
let p=initialProgress(c);
for(const unit of c.units){
 p=visitUnit(p,unit.id,c);
 for(const id of unit.requiredActivityIds){
  const a=c.activities.find(a=>a.id===id);
  for(const model of [a,...a.exitVariants??[]]){
   const answers=answersFor(model);check(assessTeachingEvidence(model,answers).correct,`${model.id} complete independent witness`);
   check(!assessTeachingEvidence(model,{}).correct,`${model.id} no empty completion`);
   for(const part of model.parts){const missing=structuredClone(answers);delete missing[part.id];check(!assessTeachingEvidence(model,missing).correct,`${model.id} missing ${part.id}`);}
   const reflection=model.parts.find(p=>p.type==='reflection'),missingReview=structuredClone(answers);missingReview[reflection.id][reflection.criteria[0].id]=false;check(!assessTeachingEvidence(model,missingReview).correct,'Each reflection criterion required');
   if(model.figure)check(fs.existsSync(new URL('../'+model.figure.path,import.meta.url)),'Real book asset');
   for(const part of model.parts.filter(p=>['minimumArgument','minimumFamily','dominatingSet'].includes(p.type))){
    for(const set of minima(model.graph)){
     if(part.type==='minimumArgument'){const proof=answerFor(part,model.graph);proof.upperWitness=set;check(assessEvidencePart(part,model.graph,proof),`${model.id} alternative optimum ${set}`);check(!assessEvidencePart(part,model.graph,{upperWitness:set}),`${model.id} lower argument required`);}
    }
   }
  }
  p=completeActivity(p,id,c);
 }
 check(progressPercent(p,c)===(c.units.indexOf(unit)+1)*12.5,'Weighted actual progress');
 if(unit.lessonId==='lesson1'&&unit.stageId==='Schema')check(progressPercent(p,c,'lesson1')===100&&progressPercent(p,c)===50,'End lesson 1 exactly half');
}
check(progressPercent(p,c)===100,'Actual full path completes');validateProgress(p,c);
const get=id=>c.activities.find(a=>a.id===id);
const strict=get('L2-O4').exitVariants[0],max=Math.max(...strict.graph.vertices.map(v=>covered(strict.graph,[v]).length));
check(Math.ceil(strict.graph.vertices.length/max)===2&&minima(strict.graph)[0].length===3,'Strict capacity bound truly less than gamma');
for(const a of c.activities)if(a.exitVariants)check(a.exitVariants.every(v=>JSON.stringify(v.graph)!==JSON.stringify(a.graph)),'Fresh exits have different graph data');
const family=get('L2-O2').parts.find(p=>p.type==='minimumFamily'),proof=answerFor(family,c.activities.find(a=>a.id==='L2-O2').graph);
check(!assessEvidencePart(family,get('L2-O2').graph,[proof[0],proof[0]]),'Repeated optimum is not two distinct minima');
check(!assessEvidencePart(family,get('L2-O2').graph,[{},null]),'Malformed family rejected safely');
const selection=get('L2-A4').parts[0],g=get('L2-A4').graph;
check(assessEvidencePart(selection,g,{selected:g.vertices,rows:Object.fromEntries(g.vertices.map(v=>[v,v]))}),'Action accepts larger valid dominating sets');
check(!assessEvidencePart(selection,g,{selected:['a'],rows:Object.fromEntries(g.vertices.map(v=>[v,'a']))}),'Partial coverage rejected');
const old={schemaVersion:1,curriculumVersion:2,revision:8,teachingProgress:initialProgress(v2),attempts:{},sessions:{},settings:{theme:'night',motion:'off'}};
for(const id of v2.stages[0].requiredActivityIds)old.teachingProgress=completeActivity(old.teachingProgress,id,v2);
let raw=JSON.stringify(old),writes=0,fail=false;const storage={getItem:k=>k===storageKey?raw:null,setItem(k,v){if(fail)throw Error('quota');writes++;raw=v;},removeItem(){}};
let repo=createRepository(c,storage,ctx);check(repo.snapshot().needsMigration,'Real old progress needs confirmation');repo.cancelTeachingMigration();check(raw===JSON.stringify(old)&&writes===0,'Cancel byte preservation');
fail=true;repo.confirmTeachingMigration(8);check(repo.snapshot().state.curriculumVersion===2&&raw===JSON.stringify(old),'Quota preserves both old states');fail=false;check(repo.confirmTeachingMigration(8)&&writes===1,'Exactly one conversion write');
check(JSON.stringify(repo.snapshot().state.teachingProgressArchive.teachingProgress)===JSON.stringify(old.teachingProgress),'Exact archive');
check(!repo.confirmTeachingMigration(8)&&writes===1,'Repeated conversion cannot reset');
for(const a of c.activities)repo.changeProgress(p=>completeActivity(p,a.id,c));
const saved=repo.snapshot().state,backup=exportBackup(saved,c,ctx);check(!backup.includes('beforeReveal')&&!backup.includes('uncoveredWitness')&&!backup.includes('explanation'),'Evidence does not leak');
check(JSON.stringify(parseBackup(backup,c,ctx).teachingProgress)===JSON.stringify(saved.teachingProgress),'New backup roundtrip');repo.dispose();repo=createRepository(c,storage,ctx);check(progressPercent(repo.snapshot().state.teachingProgress,c)===100,'Full actual path reload');
const incoming=parseBackup(exportBackup(old,v2,ctx),c,ctx);
const merged=mergeBackup(repo.snapshot().state,incoming,c,ctx);check(progressPercent(merged.candidate.teachingProgress,c)===100,'Old import never reduces active completion');
const archive=JSON.stringify(repo.snapshot().state.teachingProgressArchive);repo.resetTeaching();check(progressPercent(repo.snapshot().state.teachingProgress,c)===0&&JSON.stringify(repo.snapshot().state.teachingProgressArchive)===archive,'Reset preserves archive');repo.dispose();
const digest=createHash('sha256').update(fs.readFileSync(new URL('../docs/question-bank.json',import.meta.url))).digest('hex');check(digest==='f9c36455948676c09d6463c6ca3f6678fc254837c8c3acfe1cc7909367875d11','Bank bytes unchanged');
console.log(`${checks} authored APOS content/evidence/progress checks passed (32 activities, 8 fresh exits).`);
