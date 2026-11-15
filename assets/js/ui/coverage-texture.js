import {CanvasTexture,SRGBColorSpace} from '../../vendor/three/three.module.js';

/** Project the 2D coverage sectors onto both faces of a sphere. The ordered owners
 * come from the shared vertex engine, so clicking order never changes the colors. */
export function createCoverageTexture(base,owners){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
 const context=canvas.getContext('2d');
 function rgba(css){context.fillStyle=css;context.fillRect(0,0,1,1);return context.getImageData(0,0,1,1).data;}
 const background=rgba(base),colors=owners.map(owner=>rgba(owner.color));
 const pixels=context.createImageData(canvas.width,canvas.height);
 for(let row=0;row<canvas.height;row++){
  const phi=Math.PI*(row+.5)/canvas.height,y=Math.cos(phi),radius=Math.sin(phi);
  for(let column=0;column<canvas.width;column++){
   const theta=2*Math.PI*(column+.5)/canvas.width,x=-radius*Math.cos(theta);
   const angle=(Math.atan2(x,y)+2*Math.PI)%(2*Math.PI);
   const sector=Math.min(owners.length-1,Math.floor(angle/(2*Math.PI)*owners.length));
   const stripe=((Math.floor((x-y)*12)%8)+8)%8<2;
   const color=stripe?colors[sector]:background;
   pixels.data.set(color,(row*canvas.width+column)*4);
  }
 }
 context.putImageData(pixels,0,0);
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return texture;
}
