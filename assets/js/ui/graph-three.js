import * as THREE from '../../vendor/three/three.module.js';
import {createCoverageTexture} from './coverage-texture.js';
/** On-demand local WebGL view; SVG remains the source of graph, answer and accessible controls. */
export function createThreeView(host,svg){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,100),group=new THREE.Group();scene.add(group);camera.position.set(0,0,7);
 const ambient=new THREE.AmbientLight(new THREE.Color().setRGB(1,1,1),2),light=new THREE.DirectionalLight(new THREE.Color().setRGB(1,1,1),3);light.position.set(2,3,5);scene.add(ambient,light);
 const labels=document.createElement('div');labels.className='graph-three-labels';host.append(labels);
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),hit=new THREE.Vector3();
 const depthsById=new Map();
 let mobile=false;
 let visible=true,disposed=false,frame=0,drag=null,objects=[],labelViews=[];
 const color=name=>getComputedStyle(svg).getPropertyValue(name).trim();
 function clear(){for(const child of [...group.children]){child.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();});group.remove(child);}labels.replaceChildren();objects=[];labelViews=[];}
 function build(){if(disposed)return;clear();const vb=svg.viewBox.baseVal,scale=4/Math.max(vb.width,vb.height),point=(x,y,z=0)=>new THREE.Vector3((x-vb.width/2)*scale,(vb.height/2-y)*scale,z);
 const vertices=[...svg.querySelectorAll('.board-vertex')];
 const depths=vertices.map((_,i)=>depthsById.get(vertices[i].dataset.vertexId)??Math.sin(i*2.4)*.3);const positions=vertices.map((e,i)=>{const m=e.transform.baseVal.consolidate()?.matrix;return m?{x:m.e,y:m.f,z:depths[i]}:null;});const depthAt=p=>positions.reduce((best,v)=>v&&Math.hypot(p.x-v.x,p.y-v.y)<best.distance?{distance:Math.hypot(p.x-v.x,p.y-v.y),z:v.z}:best,{distance:Infinity,z:0}).z;
 for(const path of svg.querySelectorAll('path.board-edge,line.board-edge')){const length=path.getTotalLength(),z1=depthAt(path.getPointAtLength(0)),z2=depthAt(path.getPointAtLength(length)),pts=Array.from({length:33},(_,i)=>{const p=path.getPointAtLength(length*i/32);return point(p.x,p.y,z1+(z2-z1)*i/32);});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:color('--graph-line')}));group.add(line);
 if(path.hasAttribute('marker-end')){const end=pts.at(-1),direction=end.clone().sub(pts.at(-3)).normalize();const arrow=new THREE.ArrowHelper(direction,end.clone().addScaledVector(direction,-.14),.14,color('--graph-line'),.12,.08);group.add(arrow);}}
 vertices.forEach((element,i)=>{const matrix=element.transform.baseVal.consolidate()?.matrix;if(!matrix)return;const selected=element.classList.contains('is-selected'),covered=element.classList.contains('is-covered'),missed=element.classList.contains('is-missed');const owners=[...element.querySelectorAll('.vertex-coverage [data-owner-id]')].map(shape=>{const owner=vertices.find(v=>v.dataset.vertexId===shape.dataset.ownerId);return{id:shape.dataset.ownerId,color:color(`--hatch-${owner.dataset.colorIndex}`)};});
 const texture=!selected&&covered&&owners.length?createCoverageTexture(color('--sheet'),owners):null;
 const material=texture?new THREE.MeshBasicMaterial({map:texture,toneMapped:false}):new THREE.MeshStandardMaterial({roughness:.45,color:color(selected?`--bead-${element.dataset.colorIndex}`:missed?'--error':'--sheet'),wireframe:false});const mesh=new THREE.Mesh(new THREE.SphereGeometry(.22,20,16),material);mesh.position.copy(point(matrix.e,matrix.f,depths[i]));mesh.userData.element=element;group.add(mesh);objects.push(mesh);
 const label=document.createElement('button');label.type='button';label.dataset.vertexId=element.dataset.vertexId;const number=document.createElement('span');number.className='graph-three-number';number.textContent=element.querySelector('.vertex-number')?.textContent??element.dataset.vertexId;label.append(number);label.classList.toggle('is-covered',covered&&!selected);label.setAttribute('aria-label',element.getAttribute('aria-label'));label.setAttribute('aria-pressed',element.getAttribute('aria-pressed'));label.addEventListener('click',e=>{if(e.detail===0)element.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
 const diagnostic=element.dataset.diagnostic;let ring=null;
 if(diagnostic){
  label.dataset.diagnostic=diagnostic;const badge=document.createElement('span');badge.className='graph-three-diagnostic';badge.textContent=diagnostic==='missed'?'!':'−';badge.setAttribute('aria-hidden','true');label.append(badge);
  const geometry=diagnostic==='missed'?new THREE.TorusGeometry(.29,.014,6,40):new THREE.BufferGeometry().setFromPoints(Array.from({length:49},(_,j)=>new THREE.Vector3(.29*Math.cos(j*Math.PI/24),.29*Math.sin(j*Math.PI/24),0)));
  ring=diagnostic==='missed'?new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:color('--error'),toneMapped:false})):new THREE.Line(geometry,new THREE.LineDashedMaterial({color:color('--hint'),dashSize:.07,gapSize:.045,toneMapped:false}));
  if(diagnostic==='removable')ring.computeLineDistances();ring.position.copy(mesh.position);group.add(ring);
 }
 labels.append(label);labelViews.push({label,mesh,ring});});draw();}
 function draw(){if(disposed||!visible||!host.clientWidth)return;const width=host.clientWidth,height=320;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();group.updateMatrixWorld(true);for(const{ring}of labelViews)if(ring)ring.quaternion.copy(group.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(camera.quaternion));renderer.render(scene,camera);for(const{label,mesh}of labelViews){const p=mesh.getWorldPosition(new THREE.Vector3()).project(camera);label.style.left=`${(p.x+1)*width/2}px`;label.style.top=`${(1-p.y)*height/2}px`;}}
 function schedule(){if(frame||disposed)return;frame=requestAnimationFrame(()=>{frame=0;build();});}
 function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(objects,false)[0]?.object;}
 // A fixed plane and grab offset keep dragging stable across mesh rebuilds.
 function meshAt(e){
  const id=e.target.closest?.('[data-vertex-id]')?.dataset.vertexId;
  const exact=id&&objects.find(o=>o.userData.element.dataset.vertexId===id);
  if(exact)return exact;
  const picked=pick(e);if(picked||!mobile)return picked;
  // Touch padding in CSS pixels, independent of camera zoom.
  const rect=host.getBoundingClientRect();let nearest=null,distance=27;
  for(const mesh of objects){const p=mesh.getWorldPosition(new THREE.Vector3()).project(camera);
   const d=Math.hypot((p.x+1)*rect.width/2+rect.left-e.clientX,(1-p.y)*320/2+rect.top-e.clientY);
   if(d<distance){distance=d;nearest=mesh;}}
  return nearest;
 }
 const down=e=>{
  if(e.button!==0||!e.isPrimary||drag)return;
  e.preventDefault();const mesh=meshAt(e),position=mesh?.getWorldPosition(new THREE.Vector3());
  drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,
   id:mesh?.userData.element.dataset.vertexId,moved:false,offset:new THREE.Vector3()};
  if(position){plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),position);pick(e);if(ray.ray.intersectPlane(plane,hit))drag.offset.copy(position).sub(hit);}
  host.setPointerCapture(e.pointerId);
 };
 const move=e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  drag.moved ||= Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5;
  if(!drag.moved)return;
  if(drag.id&&svg.graphMove&&svg.graphCanMove?.()){
   pick(e);
   if(ray.ray.intersectPlane(plane,hit)){
    group.worldToLocal(hit.add(drag.offset));
    depthsById.set(drag.id,hit.z);
    const vb=svg.viewBox.baseVal,scale=4/Math.max(vb.width,vb.height);
    svg.graphMove(drag.id,hit.x/scale+vb.width/2,vb.height/2-hit.y/scale);
    schedule();
   }
  }else if(!drag.id){group.rotation.y+=dx*.008;group.rotation.x+=dy*.008;draw();}
  drag.x=e.clientX;drag.y=e.clientY;
 };
 function finish(e,cancelled=false){
  if(!drag||e.pointerId!==drag.pointerId)return;
  const previous=drag;drag=null;
  if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);
  if(!cancelled&&previous.id&&!previous.moved)
   svg.querySelector(`[data-vertex-id="${previous.id}"]`)?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
 }
 const up=e=>finish(e),cancel=e=>finish(e,true);
 function zoomBy(factor){camera.position.z=factor===0?7:THREE.MathUtils.clamp(camera.position.z/factor,7/3,14);draw();host.dispatchEvent(new Event('graphzoom'));}
 const wheel=e=>{e.preventDefault();zoomBy(Math.exp(-e.deltaY*.001));};
 for(const[type,fn]of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['wheel',wheel]])host.addEventListener(type,fn,{passive:false});
 const observer=new MutationObserver(schedule);observer.observe(svg,{subtree:true,childList:true,attributes:true,attributeFilter:['transform','d','class','aria-pressed','aria-label','data-owner-ids']});
 const theme=new MutationObserver(schedule);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});const resize=new ResizeObserver(draw);resize.observe(host);build();
 return{setMobile(value){mobile=value;renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));draw();},zoomBy,getZoom:()=>7/camera.position.z,setVisible(value){drag=null;visible=value;if(value)schedule();},destroy(){disposed=true;drag=null;for(const[type,fn]of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['wheel',wheel]])host.removeEventListener(type,fn);cancelAnimationFrame(frame);observer.disconnect();theme.disconnect();resize.disconnect();clear();scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();renderer.forceContextLoss();host.replaceChildren();}};
}
