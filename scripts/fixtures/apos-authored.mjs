/** Independent finite arithmetic used only by validation scripts, never product. */
export const combinations=(vertices,size)=>size===0?[[]]:size<0?[]:vertices.flatMap((v,i)=>combinations(vertices.slice(i+1),size-1).map(t=>[v,...t]));
export const covered=(g,set)=>g.vertices.filter(v=>set.some(c=>c===v||g.edges.some(e=>e.includes(c)&&e.includes(v))));
export const uncovered=(g,set)=>g.vertices.filter(v=>!covered(g,set).includes(v));
export const minima=g=>{for(let n=1;n<=g.vertices.length;n++){const list=combinations(g.vertices,n).filter(s=>!uncovered(g,s).length);if(list.length)return list;}};
const simple=(vertices,edges)=>({vertices:[...vertices],edges:edges.map(e=>[...e]),directed:false,multigraph:false});
export function proofFor(g,set,methods){
 const k=set.length,max=Math.max(...g.vertices.map(v=>covered(g,[v]).length));
 if(methods.includes('capacity')&&Math.ceil(g.vertices.length/max)===k)return{upperWitness:set,lowerBound:{method:'capacity',vertexCount:g.vertices.length,maxClosedSize:max,bound:k}};
 if(methods.includes('packing')){const packing=combinations(g.vertices,k).find(s=>s.every((a,i)=>s.slice(i+1).every(b=>!g.vertices.some(v=>covered(g,[v]).includes(a)&&covered(g,[v]).includes(b)))));if(packing)return{upperWitness:set,lowerBound:{method:'packing',vertices:packing}};}
 if(methods.includes('subset-witnesses'))return{upperWitness:set,lowerBound:{method:'subset-witnesses',rows:combinations(g.vertices,k-1).map(selected=>({selected,uncoveredWitness:uncovered(g,selected)[0]}))}};
 throw Error('No permitted lower proof for graph');
}
function route(g,start,end){const walk=(path)=>{if(path.at(-1)===end)return path;for(const v of g.vertices){const a=path.at(-1);if(path.includes(v)||!g.edges.some(([x,y])=>g.directed?x===a&&y===v:x===a&&y===v||x===v&&y===a))continue;const found=walk([...path,v]);if(found)return found;}};return walk([start]);}
export function answerFor(p,g){
 switch(p.type){
 case 'number':case 'choice':return p.expected;
 case 'relation':case 'model':return structuredClone(p.expected);
 case 'neighborhood':return g.vertices.filter(v=>(p.closed&&v===p.vertexId)||v!==p.vertexId&&g.edges.some(e=>e.includes(v)&&e.includes(p.vertexId)));
 case 'coverageTable':return Object.fromEntries(g.vertices.map(v=>[v,p.selected.find(c=>covered(g,[c]).includes(v))??null]));
 case 'deletionTable':return Object.fromEntries(p.selected.map(v=>[v,uncovered(g,p.selected.filter(c=>c!==v))]));
 case 'prediction':{const value=answerFor(p.part,g);return{beforeReveal:value,revised:value,committedBeforeReveal:true};}
 case 'classification':{
  if(p.property==='directed')return g.directed;if(p.property==='loops')return g.edges.some(([a,b])=>a===b);
  if(p.property==='parallel')return new Set(g.edges.map(e=>JSON.stringify(g.directed?e:[...e].sort()))).size<g.edges.length;
  if(p.property==='regular')return new Set(g.vertices.map(v=>g.edges.filter(e=>e.includes(v)).length)).size===1;
  if(p.property==='complete')return g.edges.length===g.vertices.length*(g.vertices.length-1)/2;
  if(p.property==='dominating')return !uncovered(g,p.selected).length;
  if(p.property==='minimal')return !uncovered(g,p.selected).length&&p.selected.every(v=>uncovered(g,p.selected.filter(c=>c!==v)).length>0);
  return !uncovered(g,p.selected).length&&minima(g)[0].length===p.selected.length;
 }
 case 'dominatingSet':{const selected=minima(g)[0];return{selected,rows:Object.fromEntries(g.vertices.map(v=>[v,selected.find(c=>covered(g,[c]).includes(v))]))};}
 case 'minimumArgument':return proofFor(g,minima(g)[0],p.lowerBoundMethods);
 case 'minimumFamily':return minima(g).slice(0,p.count).map(set=>proofFor(g,set,p.lowerBoundMethods));
 case 'route':return route(g,p.start,p.end);
 case 'reflection':return Object.fromEntries(p.criteria.map(c=>[c.id,true]));
 case 'counterexample':{
  if(p.claim==='regular-implies-complete')return{graph:simple('abcd',['ab','bc','cd','da'])};
  if(p.claim==='reachable-implies-adjacent')return{graph:simple('abc',['ab','bc']),route:['a','b','c']};
  return{graph:simple('abcde',['ab','ac','ad','ae']),selected:['b','c','d','e'],smallerWitness:['a']};
 }
 default:throw Error(p.type);
 }
}
export const answersFor=activity=>Object.fromEntries(activity.parts.map(p=>[p.id,answerFor(p,activity.graph)]));

export async function legacyEnvelope(v2,bank){
 const{initialProgress,completeActivity}=await import('../../assets/js/domain/progress.js');
 const{createAttempt}=await import('../../assets/js/domain/attempts.js');
 const{createCompetition,competitionPool,addCompetition,finalizeTurn,advanceTurn}=await import('../../assets/js/domain/sessions.js');
 const{deleteResults}=await import('../../assets/js/domain/coverage.js');
 const{readFile}=await import('node:fs/promises');
 const config=JSON.parse(await readFile(new URL('../../content/competition.json',import.meta.url)));
 let state={schemaVersion:1,curriculumVersion:2,revision:8,teachingProgress:initialProgress(v2),attempts:{},sessions:{},settings:{theme:'night',motion:'off'}};
 for(const id of v2.stages[0].requiredActivityIds)state.teachingProgress=completeActivity(state.teachingProgress,id,v2);
 const attempt=createAttempt({tab:'practice',questionId:'Q001',mode:'self-assessed-text',target:'rubric',response:'هر ناحیه یک رأس و هر پل یک یال است.',selfAssessed:true});state.attempts[attempt.id]=attempt;
 const context={questions:bank.questions,bankVersion:bank.meta.version};
 const match=createCompetition(['یک','دو'],1,competitionPool(bank.questions,config),state);state=addCompetition(state,match,v2,context);state=finalizeTurn(state,match.id,[],v2,context);state=advanceTurn(state,match.id,v2,context);
 state=deleteResults(state,[state.sessions[match.id].turns[0].finalizedAttemptId]);
 return state;
}
