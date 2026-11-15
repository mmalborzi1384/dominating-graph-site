import assert from 'node:assert/strict';
import {constructGraph} from '../assets/js/domain/construct-graph.js';
import {analyzeGraph} from '../assets/js/domain/evaluate.js';
import {familyGraph} from '../assets/js/domain/lab.js';
import {canonicalPlaces,spaceLayout} from '../assets/js/ui/graph-layout.js';
let checks=0;
for(let n=2;n<=10;n++)for(let gamma=1;gamma<=n;gamma++){const g=constructGraph(n,gamma);assert.equal(g.n,n);assert.equal(analyzeGraph(g).gamma,gamma);checks+=2;}
for(const[n,g]of [[1,1],[11,2],[6,0],[6,7],[6.5,2],[6,2.5],[NaN,1]]){assert.throws(()=>constructGraph(n,g));checks++;}
for(const family of ['path','cycle','star','complete','empty'])for(let n=family==='cycle'?3:2;n<=10;n++){
 const g=familyGraph(n,family),before=JSON.stringify(g),places=canonicalPlaces(g,g.vertices.map(id=>({id,label:id,x:0,y:0}))),s=spaceLayout(places,600,330);
 assert.equal(JSON.stringify(g),before);assert.equal(places.length,n);assert.ok(s.places.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)assert.ok(Math.hypot(s.places[i].x-s.places[j].x,s.places[i].y-s.places[j].y)>=61.99);checks+=4;
 if(family==='path'){assert.equal(new Set(places.map(p=>p.y)).size,1);checks++;}
 if(family==='star'&&n>=4){assert.equal(places[0].x,300);assert.equal(places[0].y,165);checks+=2;}
}
const directed={n:2,vertices:['a','b'],edges:[['a','b']],directed:true},fallback=[{id:'a',x:60,y:90},{id:'b',x:90,y:90}];assert.equal(canonicalPlaces(directed,fallback),fallback);checks++;
const petersen={n:10,vertices:Array.from({length:10},(_,i)=>String(i)),edges:[]};for(let i=0;i<5;i++){petersen.edges.push([String(i),String((i+1)%5)],[String(i),String(i+5)],[String(i+5),String((i+2)%5+5)]);}const pt=canonicalPlaces(petersen,[]);assert.equal(pt.length,10);assert.ok(Math.abs((pt[0].y-165)*.45-(pt[5].y-165))<.001);checks+=2;
console.log(`${checks} construction/layout checks passed`);
