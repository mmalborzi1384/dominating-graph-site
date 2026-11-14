import fs from 'node:fs';
import { foundationCurriculum } from './fixtures/apos-v3.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateTeaching, validateTeachingSources } from '../assets/js/data/validate.js';
import { initialProgress, completeActivity, validateProgress, visitUnit, progressPercent, mergeProgress } from '../assets/js/domain/progress.js';
import { assessEvidencePart, assessTeachingEvidence } from '../assets/js/domain/teaching.js';
import { decodeStoredState, migrateCurriculum } from '../assets/js/storage/migrate.js';
import { createRepository, storageKey } from '../assets/js/storage/repository.js';
import { validateStoredEnvelope, same } from '../assets/js/storage/validate.js';
import { exportBackup, parseBackup, mergeBackup } from '../assets/js/storage/transfer.js';
import { createAttempt } from '../assets/js/domain/attempts.js';
import { createCompetition, competitionPool, addCompetition, finalizeTurn, advanceTurn } from '../assets/js/domain/sessions.js';
import { deleteResults } from '../assets/js/domain/coverage.js';

const read = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const v2 = read('../content/teaching-v2.json'), v1 = read('../content/teaching-v1.json'), bank = read('../docs/question-bank.json');
const context = { questions: bank.questions, bankVersion: bank.meta.version, previousCurriculum: v2, legacyCurriculum: v1 };
let checks = 0;
const check = (value, message) => { checks++; assert.ok(value, message); };
const rejects = (fn, message) => { checks++; assert.throws(fn, undefined, message); };
const eq = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
const graph = (vertices, edges) => ({ vertices: [...vertices], edges: edges.map(e => [...e]), directed: false, multigraph: false });
const p3 = graph('abc', [['a','b'],['b','c']]), p5 = graph('abcde', [['a','b'],['b','c'],['c','d'],['d','e']]);
const part = (type, props = {}) => ({ id: type, label: type, type, ...props });
const review = part('reflection', { criteria: [{ id: 'reason', label: 'دلیل را با معیار مقایسه کردم' }, { id: 'limits', label: 'فرض‌ها را بازبینی کردم' }] });
const c = foundationCurriculum();
const sources = read('../content/teaching-sources.json');
check(validateTeachingSources(sources,bank) === sources, 'Complete reviewed source matrix');
const hash = value => createHash('sha256').update(value).digest('hex');
eq(hash(fs.readFileSync(new URL('../docs/question-bank.json',import.meta.url))),sources.bankSha256,'Raw bank unchanged');
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])) : value;
for (const row of sources.questions) {
  const source = bank.questions.find(q=>q.id===row.questionId);
  eq(hash(JSON.stringify(stable(source))),row.instructionalReview.sourceSha256,`${row.questionId} exact reviewed source`);
  if(row.requiresFigure)check(fs.existsSync(new URL(`../${row.instructionalReview.figureAsset}`,import.meta.url)),`${row.questionId} real figure asset`);
}
const badMatrix=structuredClone(sources);badMatrix.questions[0].sourceStage='Schema';rejects(()=>validateTeachingSources(badMatrix,bank),'Original stage not silently rewritten');
check(validateTeaching(c, null, bank).models.size === c.activities.length, 'Data-driven activity count');
for (const mutate of [x=>x.units[1].prerequisites=[], x=>x.activities[0].prerequisites=['unknown'],
  x=>x.activities[0].sourceReferences[0].originalAposStage='Schema', x=>x.activities[0].parts[0].expected='1',
  x=>x.units[0].progressWeight=0, x=>x.activities[0].parts[0].type='free-proof', x=>x.activities[0].parts[0].score=15,
  x=>x.activities[0].sourceReferences[0].questionId='Q999', x=>x.lessons[1].unitIds.reverse(),
  x=>x.activities[1].exitVariants=[], x=>x.activities[0].parts=[part('number',{expected:1})],
  x=>x.activities[1].exitVariants[0].graph=graph('xyz',[['x','y'],['y','z']])]) {
  const bad = structuredClone(c); mutate(bad); rejects(()=>validateTeaching(bad,null,bank),'Malformed content rejected');
}
let progress = initialProgress(c);
rejects(()=>visitUnit(progress,c.units[1].id,c),'Locked visit');
rejects(()=>completeActivity(progress,c.activities[1].id,c),'Activity order');
for (const [index, unit] of c.units.entries()) {
  for (const id of unit.requiredActivityIds) progress = completeActivity(progress,id,c);
  eq(progressPercent(progress,c),(index+1)*12.5,'Weighted unit progress');
  if(index===3) eq(progressPercent(progress,c,'lesson1'),100,'Lesson 1 complete means 50% total');
}
const saved = structuredClone(progress);
eq(completeActivity(progress,c.activities[0].id,c),progress,'Review never lowers completion');
eq(mergeProgress(initialProgress(c),progress,c),progress,'Union restores valid progress');
rejects(()=>validateProgress({...progress,answer:'leak'},c),'No response field allowed');
rejects(()=>validateProgress({...initialProgress(c),passedUnitIds:[c.units[1].id]},c),'Forged completion');
const weighted=structuredClone(c);weighted.units[0].progressWeight=3;
let first=initialProgress(weighted);for(const id of weighted.units[0].requiredActivityIds)first=completeActivity(first,id,weighted);
eq(progressPercent(first,weighted),30,'Weights from content');
const cover=part('coverageTable',{selected:['b']});
check(assessEvidencePart(cover,p3,{a:'b',b:'b',c:'b'}),'Closed self coverage');
check(!assessEvidencePart(cover,p3,{a:'b',c:'b'}),'Every vertex needs a row');
check(!assessEvidencePart(cover,p3,{a:'b',b:null,c:'b'}),'Cannot omit self coverage');
check(assessEvidencePart(part('coverageTable',{selected:['a']}),p3,{a:'a',b:'a',c:null}),'Honest uncovered vertex accepted');
const deletion=part('deletionTable',{selected:['b','d']});
check(assessEvidencePart(deletion,p5,{b:['b','a'],d:['e','d']}),'All independent deletions, order irrelevant');
check(!assessEvidencePart(deletion,p5,{b:['a','b']}),'One deletion insufficient');
check(!assessEvidencePart(deletion,p5,{b:['a'],d:['e']}),'All uncovered vertices required');
const minimum=part('minimumArgument',{lowerBoundMethods:['capacity','packing','subset-witnesses']});
const proof={upperWitness:['b','d'],lowerBound:{method:'capacity',vertexCount:5,maxClosedSize:3,bound:2}};
check(assessEvidencePart(minimum,p5,proof),'Upper witness and tight capacity bound');
check(assessEvidencePart(minimum,p5,{...proof,upperWitness:['e','b']}),'Alternative optimum');
check(!assessEvidencePart(minimum,p5,{upperWitness:['b','d']}),'No lower argument, no pass');
check(!assessEvidencePart(minimum,p5,{...proof,upperWitness:['a','b']}),'Bound alone cannot cover');
check(assessEvidencePart(minimum,p5,{upperWitness:['a','d'],lowerBound:{method:'packing',vertices:['a','e']}}),'Packing independent neighborhoods');
check(!assessEvidencePart(minimum,p5,{upperWitness:['a','d'],lowerBound:{method:'packing',vertices:['a','c']}}),'Distance two not packing');
const exhaustive={upperWitness:['b','d'],lowerBound:{method:'subset-witnesses',rows:[{selected:['a'],uncoveredWitness:'e'},{selected:['b'],uncoveredWitness:'d'},{selected:['c'],uncoveredWitness:'a'},{selected:['d'],uncoveredWitness:'a'},{selected:['e'],uncoveredWitness:'a'}]}};
check(assessEvidencePart(minimum,p5,exhaustive),'Explicit witness against every smaller subset');
const missing=structuredClone(exhaustive);missing.lowerBound.rows.pop();check(!assessEvidencePart(minimum,p5,missing),'No missing smaller subset');
const star=graph('abcde',[['a','b'],['a','c'],['a','d'],['a','e']]);
const counter=part('counterexample',{claim:'minimal-implies-minimum'});
check(assessEvidencePart(counter,null,{graph:star,selected:['b','c','d','e'],smallerWitness:['a']}),'Four leaves minimal nonminimum');
check(!assessEvidencePart(counter,null,{graph:star,selected:['a'],smallerWitness:[]}), 'Minimum is not a counterexample');
check(assessEvidencePart(part('classification',{property:'minimal',selected:['b','c','d','e']}),star,true),'Minimal distinct from minimum');
check(assessEvidencePart(part('classification',{property:'minimum',selected:['b','c','d','e']}),star,false),'Nonminimum classification');
const prediction=part('prediction',{part:part('neighborhood',{vertexId:'b',closed:true})});
check(assessEvidencePart(prediction,p3,{beforeReveal:['a'],revised:['c','b','a'],committedBeforeReveal:true}),'Wrong prediction may be corrected');
check(!assessEvidencePart(prediction,p3,{beforeReveal:['a'],revised:['a','b','c'],committedBeforeReveal:false}),'No reveal before committing');
check(!assessEvidencePart(prediction,p3,{beforeReveal:null,revised:['a','b','c'],committedBeforeReveal:true}),'Missing prediction');
check(assessEvidencePart(review,null,{reason:true,limits:true}),'Explicit criterion self-review');
for(const value of ['long free explanation',true,{reason:true},{reason:true,limits:false},{reason:true,limits:true,answer:'leak'}])check(!assessEvidencePart(review,null,value),'Text/generic checkbox cannot certify explanation');
const multi={...p3,multigraph:true,edges:[['a','b'],['a','b'],['b','c']]};
check(assessEvidencePart(part('relation',{expected:multi}),null,multi),'Parallel edges preserved');
check(!assessEvidencePart(part('relation',{expected:multi}),null,p3),'No silent simplification');
const directed={...p3,directed:true};
check(!assessEvidencePart(part('relation',{expected:directed}),null,{...directed,edges:[['b','a'],['b','c']]}),'Direction matters');
rejects(()=>assessEvidencePart(minimum,multi,proof),'Simple domination evaluator rejects multigraph');
check(!assessTeachingEvidence({graph:p3,parts:[part('number',{expected:1}),review]},{number:1,reflection:{reason:true}}).correct,'Every required part matters');

const fresh=(curriculum=c)=>({schemaVersion:curriculum.curriculumVersion===3?2:1,curriculumVersion:curriculum.curriculumVersion,revision:0,teachingProgress:initialProgress(curriculum),attempts:{},sessions:{},settings:{theme:'night',motion:'low'}});
let old=fresh(v2);for(const id of v2.stages[0].requiredActivityIds)old.teachingProgress=completeActivity(old.teachingProgress,id,v2);
old.attempts.a=createAttempt({tab:'practice',questionId:'Q001',mode:'self-assessed-text',target:'rubric',response:'رأس و یال',selfAssessed:true});old.attempts.a.id='a';
const match=createCompetition(['یک','دو'],1,competitionPool(bank.questions,read('../content/competition.json')),old);
old=addCompetition(old,match,v2,context);old=finalizeTurn(old,match.id,[],v2,context);old=advanceTurn(old,match.id,v2,context);
const oldLive=structuredClone(old);
old=deleteResults(old,[old.sessions[match.id].turns[0].finalizedAttemptId]);
const migrated=migrateCurriculum(old,c,context);
check(same(migrated.teachingProgress,initialProgress(c)),'Old progress grants no new credit');
eq(migrated.teachingProgressArchive,{curriculumVersion:2,teachingProgress:old.teachingProgress},'Exact limited archive');
for(const key of ['attempts','sessions','settings'])eq(migrated[key],old[key],`${key} unchanged`);
eq(migrateCurriculum(migrated,c,context),migrated,'Idempotent migration');
const invalid=structuredClone(old);invalid.teachingProgress.extra='answer';rejects(()=>migrateCurriculum(invalid,c,context),'Validate before migration');
rejects(()=>validateStoredEnvelope({...migrated,schemaVersion:1},c,context),'No schema mixing');
rejects(()=>validateStoredEnvelope({...migrated,teachingProgressArchive:{...migrated.teachingProgressArchive,answer:'secret'}},c,context),'Archive allowlist');
rejects(()=>parseBackup(exportBackup(migrated,c,context),v2,context),'No downgrade');
eq(parseBackup(exportBackup(old,v2,context),c,context),{...migrated,revision:0},'Old import archives, no active credit');
let active={...migrated,teachingProgress:saved};
eq(mergeBackup(active,parseBackup(exportBackup(old,v2,context),c,context),c,context).candidate.teachingProgress,saved,'Old file cannot lower active progress');
const oldMore=structuredClone(old);for(const id of v2.stages[1].requiredActivityIds)oldMore.teachingProgress=completeActivity(oldMore.teachingProgress,id,v2);
const union=mergeBackup(active,parseBackup(exportBackup(oldMore,v2,context),c,context),c,context).candidate;
eq(union.teachingProgressArchive.teachingProgress,oldMore.teachingProgress,'Compatible archive union');
check(union.sessions[match.id].turns[0].resultStatus==='finalized-deleted','Deletion remains spent');
const resurrect=mergeBackup(active,migrateCurriculum(oldLive,c,context),c,context).candidate;
check(resurrect.sessions[match.id].turns[0].resultStatus==='finalized-deleted' && !resurrect.attempts[oldLive.sessions[match.id].turns[0].finalizedAttemptId],'Old import cannot resurrect a deleted turn');
const reverse=mergeBackup(migrateCurriculum(oldLive,c,context),active,c,context).candidate;
check(reverse.sessions[match.id].turns[0].resultStatus==='finalized-deleted','Incoming tombstone also wins');
const old1=fresh(v1);for(const a of v1.activities)old1.teachingProgress=completeActivity(old1.teachingProgress,a.id,v1);
eq(migrateCurriculum(old1,c,context).teachingProgressArchive.teachingProgress,initialProgress(v2),'v1 policy does not invent v2 credit');
let raw=JSON.stringify(old),writes=0,fail=false;
const storage={getItem:key=>key===storageKey?raw:null,setItem:(key,value)=>{if(fail){const e=Error('quota');e.name='QuotaExceededError';throw e;}writes++;raw=value;},removeItem(){}};
let repo=createRepository(c,storage,context);
check(repo.snapshot().needsMigration&&writes===0,'No silent conversion');
const originalRaw=raw,originalMemory=repo.snapshot().state;
repo.migrationPreview();repo.cancelTeachingMigration();eq(raw,originalRaw,'Cancel writes nothing');eq(repo.snapshot().state,originalMemory,'Cancel keeps memory');
eq(JSON.parse(repo.recoveryJSON()).curriculumVersion,2,'Export before confirm uses original curriculum');
check(repo.setTheme('day'),'Other tabs/settings work while awaiting confirmation');
check(repo.snapshot().needsMigration&&repo.snapshot().state.curriculumVersion===2,'Ordinary write does not convert');
const beforeQuota=raw,beforeQuotaState=repo.snapshot().state;fail=true;
check(!repo.confirmTeachingMigration(beforeQuotaState.revision),'Quota reports failed conversion');eq(raw,beforeQuota,'Quota exact bytes');eq(repo.snapshot().state,beforeQuotaState,'Quota exact memory');
fail=false;check(repo.confirmTeachingMigration(beforeQuotaState.revision),'Explicit retry succeeds');check(writes===2,'One settings write + one conversion write');
check(!repo.snapshot().needsMigration,'Conversion clears pending');check(!repo.confirmTeachingMigration(repo.snapshot().state.revision),'Second confirmation cannot reset');
for(const id of c.units[0].requiredActivityIds)repo.changeProgress(p=>completeActivity(p,id,c));
const beforeReset=repo.snapshot().state;check(repo.resetTeaching(),'Reset active only');eq(repo.snapshot().state.teachingProgressArchive,beforeReset.teachingProgressArchive,'Reset preserves archive');
for(const key of ['attempts','sessions','settings'])eq(repo.snapshot().state[key],beforeReset[key],'Reset other data unchanged');
const exported=JSON.parse(repo.recoveryJSON());check(!/reflection|beforeReveal|lowerBound|upperWitness|hint|score/.test(JSON.stringify({progress:exported.data.teachingProgress,archive:exported.data.teachingProgressArchive})),'No evidence in progress/export');
repo.dispose();
raw=JSON.stringify(old);repo=createRepository(c,storage,context);const revision=repo.migrationPreview().expectedRevision;repo.setMotion('full');check(!repo.confirmTeachingMigration(revision),'Stale preview rejected');repo.dispose();
raw=JSON.stringify(old);repo=createRepository(c,storage,context);const external=JSON.parse(raw);external.settings.theme='day';raw=JSON.stringify(external);const changed=raw;check(!repo.confirmTeachingMigration(old.revision),'Concurrent disk change rejects conversion');eq(raw,changed,'No overwrite');repo.dispose();
// Import conflicts and capacity failures reject the entire candidate; no mutation of inputs.
const aBefore=structuredClone(active),conflicting=structuredClone(active);conflicting.attempts.a.response='different';
rejects(()=>mergeBackup(active,conflicting,c,context),'Stable attempt conflict');eq(active,aBefore,'Conflict keeps local state');
const wrongArchive=structuredClone(active);wrongArchive.teachingProgressArchive.teachingProgress.completedActivityIds.push('unknown');
rejects(()=>mergeBackup(active,wrongArchive,c,context),'Invalid archive rejects whole import');
const many=fresh();for(let i=0;i<201;i++){const id=`record-${i}`;many.attempts[id]={...old.attempts.a,id};}
rejects(()=>validateStoredEnvelope(many,c,context),'Capacity remains 200');
const mismatch=structuredClone(active);mismatch.sessions[match.id].groups[0].name='تعارض';
rejects(()=>mergeBackup(active,mismatch,c,context),'Session identity conflict');
const bothSchema = parseBackup(exportBackup({...fresh(),teachingProgress:saved},c,context),c,context);
eq(bothSchema.teachingProgress,saved,'Schema2 round-trip');
const bankMismatch=JSON.parse(exportBackup(migrated,c,context));bankMismatch.bankVersion='1.3';
rejects(()=>parseBackup(JSON.stringify(bankMismatch),c,context),'Bank compatibility unchanged');
raw=JSON.stringify(old);repo=createRepository(c,storage,context);const prior=repo.snapshot().state;
const bypass=migrateCurriculum(prior,c,context);check(!repo.commit(bypass,prior.revision),'Ordinary commit cannot bypass confirmation');eq(repo.snapshot().state,prior,'Bypass keeps old memory');repo.dispose();
raw=JSON.stringify(old);repo=createRepository(c,storage,context);repo.setEditingDirty('draft',true);
check(!repo.confirmTeachingMigration(old.revision),'Unsaved editor blocks migration');eq(raw,JSON.stringify(old),'Editor retained');repo.dispose();
for(const bad of ['{bad',JSON.stringify({...old,schemaVersion:99}),JSON.stringify(invalid)]){
 raw=bad;repo=createRepository(c,storage,context);const oldWrites=writes;check(!repo.confirmTeachingMigration(0),'Broken source cannot convert');eq(raw,bad,'Broken bytes preserved');eq(writes,oldWrites,'No repair write');repo.dispose();
}
const denied=createRepository(c,{getItem(){throw Error('denied');},setItem(){throw Error('denied');}},context);
check(denied.snapshot().readStatus==='unavailable','Unavailable storage stays recoverable');denied.dispose();
raw=JSON.stringify(old);repo=createRepository(c,storage,context);let renderCalls=0;
const unsubscribe=repo.subscribe(()=>{if(renderCalls++)throw Error('render failure');});
check(repo.confirmTeachingMigration(old.revision),'A rendering error cannot undo a durable migration');check(JSON.parse(raw).curriculumVersion===3,'Durable result after render failure');unsubscribe();repo.dispose();
check(decodeStoredState(JSON.stringify(invalid),c,context).status==='corrupt','Invalid old data retained');
eq(hash(fs.readFileSync(new URL('../content/teaching-v2.json',import.meta.url))),'954a0b7dcad2c934d6a153eb5dc8aab4220ba0feb1892a15f796e0282a06881c','Published v2 snapshot remains byte exact after v3 activation');
console.log(`${checks} APOS v3 foundation checks passed (fixture curriculum and preserved v2 snapshot).`);
// Once curriculum 3 is activated, validate the authored route as well as the
// deliberately unequal-count technical fixture above.
await import('./validate-apos-authored.mjs');
