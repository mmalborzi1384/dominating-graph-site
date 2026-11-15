/** Reference families: graph-learning/code/graphs.js layoutPoints. Vertex IDs never change. */
export function canonicalPlaces(graph, fallback = [], {width=600,height=330,alternate=false}={}) {
 const ids=graph.vertices,n=ids.length,adj=new Map(ids.map(id=>[id,new Set()]));
 if(graph.directed||graph.multigraph||graph.edges.some(([a,b])=>a===b))return fallback;
 for(const[a,b]of graph.edges){adj.get(a).add(b);adj.get(b).add(a);}
 const degree=id=>adj.get(id).size,center=ids.find(id=>degree(id)===n-1);
 let ordered=[...ids],kind=null,parts;
 if(n===1||graph.edges.length===0)kind='line';
 else if(graph.edges.length===n-1&&ids.every(id=>degree(id)<=2)&&ids.filter(id=>degree(id)===1).length===2){
  ordered=[];let next=ids.find(id=>degree(id)===1);while(next&&!ordered.includes(next)){ordered.push(next);next=[...adj.get(next)].find(v=>!ordered.includes(v));}if(ordered.length===n)kind='line';
 }else if(n>=3&&graph.edges.length===n&&ids.every(id=>degree(id)===2)){
  ordered=[ids[0]];while(ordered.length<n){const next=[...adj.get(ordered.at(-1))].find(v=>!ordered.includes(v));if(!next)break;ordered.push(next);}if(ordered.length===n)kind='circle';
 }else if(center&&graph.edges.length===n-1){kind='star';ordered=[center,...ids.filter(id=>id!==center)];}
 else if(graph.edges.length===n*(n-1)/2)kind='circle';
 else if(center&&n>=5&&ids.filter(id=>id!==center).every(id=>degree(id)===3)){const rim=ids.filter(id=>id!==center);ordered=[rim[0]];while(ordered.length<rim.length){const v=[...adj.get(ordered.at(-1))].find(v=>v!==center&&!ordered.includes(v));if(!v)break;ordered.push(v);}if(ordered.length===rim.length){ordered.push(center);kind='wheel';}}
 if(!kind){const left=[ids[0]],right=[...adj.get(ids[0])];for(const id of ids.slice(1))if(!right.includes(id))left.push(id);if(left.length*right.length===graph.edges.length&&left.every(a=>right.every(b=>adj.get(a).has(b)))){kind='bip';parts=[left,right];}}
 // Recognize the canonical Petersen labelling without guessing an arbitrary 3-regular graph.
 if(!kind&&n===10&&graph.edges.length===15){const outer=ids.slice(0,5),inner=ids.slice(5);if(outer.every((v,i)=>adj.get(v).has(outer[(i+1)%5])&&adj.get(v).has(inner[i]))&&inner.every((v,i)=>adj.get(v).has(inner[(i+2)%5]))){kind='petersen';ordered=ids;}}
 if(!kind)return fallback;
 const result=new Map(),cx=width/2,cy=height/2,rx=width/2-60,ry=height/2-65;
 const put=(id,x,y)=>result.set(id,{...(fallback.find(p=>p.id===id)??{id,label:id}),id,x,y});
 const ring=(list,scale=1)=>list.forEach((id,i)=>{const a=-Math.PI/2+(alternate?-1:1)*i*2*Math.PI/list.length;put(id,cx+rx*scale*Math.cos(a),cy+ry*scale*Math.sin(a));});
 if(kind==='line')ordered.forEach((id,i)=>put(id,n===1?cx:60+i*(width-120)/(n-1),cy));
 else if(kind==='bip')parts.forEach((part,j)=>part.forEach((id,i)=>put(id,width*(j?.72:.28),part.length===1?cy:65+i*(height-130)/(part.length-1))));
 else if(kind==='star'){put(ordered[0],cx,cy);ring(ordered.slice(1));}
 else if(kind==='wheel'){ring(ordered.slice(0,-1));put(ordered.at(-1),cx,cy);}
 else if(kind==='petersen'){ring(ordered.slice(0,5));ring(ordered.slice(5),.45);}
 else ring(ordered);
 return ids.map(id=>result.get(id));
}
/** Keep dense canonical drawings legible; any extra width scrolls inside the board. */
export function spaceLayout(places,width,height){
 const distance=Math.min(...places.flatMap((p,i)=>places.slice(i+1).map(q=>Math.hypot(p.x-q.x,p.y-q.y))));
 const factor=Number.isFinite(distance)&&distance>0?Math.max(1,62/distance):1;
 const horizontal=places.every(p=>p.y===places[0]?.y);
 return{places:places.map(p=>({...p,x:p.x*factor,y:horizontal?p.y:p.y*factor})),width:width*factor,height:horizontal?height:height*factor};
}
