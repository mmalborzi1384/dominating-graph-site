import { normalizeGraph } from './graph.js';
import { analyzeGraph, evaluateSelection } from './evaluate.js';
const canonical = edges => edges.map(e=>JSON.stringify([...e].sort())).sort().join('|');
const sameSet = (a,b) => Array.isArray(a) && new Set(a).size===a.length && a.length===b.length && a.every(v=>b.includes(v));
export function teachingNumber(value) {
  if(typeof value==='number')return Number.isSafeInteger(value)?value:NaN;
  if(typeof value!=='string')return NaN;
  const digits=value.trim().replace(/[۰-۹]/g,x=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/[٠-٩]/g,x=>'٠١٢٣٤٥٦٧٨٩'.indexOf(x));
  return /^\d{1,2}$/.test(digits)?Number(digits):NaN;
}
/** One stage-wide variant keeps all dependent activities consistent. No answer goes to storage. */
export function teachingInstance(activity, variant) {
  const roles=activity.graph.vertices, map=new Map(roles.map((v,i)=>[v,String.fromCharCode(97+variant.permutation[i])]));
  const names=new Map(roles.map((v,i)=>[map.get(v),variant.names[variant.permutation[i]]]));
  const copy=value=>String(value).replace(/\{\{([a-f])\}\}/g,(_,v)=>names.get(map.get(v))??v);
  const graph=normalizeGraph({vertices:roles.map(v=>map.get(v)),edges:activity.graph.edges.map(e=>e.map(v=>map.get(v)))});
  const parts=activity.parts.map(p=>({...p,label:copy(p.label),...(Array.isArray(p.expected)?{expected:p.expected.map(v=>map.get(v))}:{}),...(p.start?{start:map.get(p.start),end:map.get(p.end)}:{})}));
  const places=graph.vertices.map((id,i)=>({id,label:names.get(id),x:80+(i%3)*210,y:i<3?90:245}));
  return {...activity,graph,parts,places,scenario:variant.scenario,prompt:copy(activity.prompt),solution:copy(activity.solution),variantId:variant.id};
}
export function assessTeaching(activity, answers) {
  const issues=[],graph=activity.graph;
  for(const part of activity.parts){
    const value=answers[part.id];let correct=false;
    if(part.type==='number')correct=teachingNumber(value)===part.expected;
    else if(part.type==='choice')correct=value===part.expected;
    else if(part.type==='edges'){
      try { const normalized=normalizeGraph({vertices:graph.vertices,edges:value});correct=canonical(normalized.edges)===canonical(graph.edges); }catch{/* Typed wrong answer, not a storage mutation. */}
    }else if(part.type==='route'){
      correct=Array.isArray(value)&&value.length>=2&&value[0]===part.start&&value.at(-1)===part.end&&new Set(value).size===value.length
        &&value.every(v=>graph.vertices.includes(v))&&value.slice(1).every((v,i)=>graph.edges.some(e=>e.includes(v)&&e.includes(value[i])));
    }else if(Array.isArray(value)&&new Set(value).size===value.length&&value.every(v=>graph.vertices.includes(v))){
      if(part.test==='cover'||part.test==='minimum')correct=evaluateSelection(graph,value,part.test==='minimum'?'minimum':'dominating').satisfiesTarget&&(part.max===undefined||value.length<=part.max);
      else correct=sameSet(value,part.expected);
    }
    if(!correct)issues.push({partId:part.id,message:`«${part.label}» هنوز مطابق معیار نیست؛ ${part.type==='route'?'شروع، پایان و تک‌تک گام‌های مستقیم را بررسی کن.':part.type==='edges'?'راه جاافتاده یا اضافی را با صورت مسئله مقایسه کن.':part.test==='minimum'?'پوشش کامل و کمترین تعداد هر دو لازم‌اند.':part.test==='cover'?'پوشش همهٔ مکان‌ها و محدودیت تعداد را هم‌زمان بررسی کن.':'پاسخ این بخش را با رابطه‌ها و خواستهٔ مسئله دوباره بسنج.'}`});
  }
  return {correct:issues.length===0,issues};
}
/** Canonical fixture witness; the evaluator accepts all equivalent valid answers. */
export function teachingWitness(activity){
  const result={};for(const p of activity.parts){
    if(p.type==='edges')result[p.id]=structuredClone(activity.graph.edges);
    else if(p.type==='route'){
      const queue=[[p.start]];while(queue.length){const route=queue.shift();if(route.at(-1)===p.end){result[p.id]=route;break;}
        for(const [a,b]of activity.graph.edges){const next=a===route.at(-1)?b:b===route.at(-1)?a:null;if(next&&!route.includes(next))queue.push([...route,next]);}}
    }else if(p.test==='cover'||p.test==='minimum')result[p.id]=analyzeGraph(activity.graph).minimumSets[0];
    else result[p.id]=structuredClone(p.expected);
  }return result;
}
