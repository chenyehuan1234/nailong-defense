import {battleView,clientToWorld,isMobile,panBattle,zoomBattle} from './viewport';
export function attachTouchMap(canvas:HTMLCanvasElement,screen:()=>string,tap:(point:{x:number;y:number})=>void){
  const pointers=new Map<number,{x:number;y:number;startX:number;startY:number;moved:boolean}>();
  const pair=()=>{const [a,b]=[...pointers.values()];return{distance:Math.hypot(a.x-b.x,a.y-b.y),center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};};
  canvas.addEventListener('pointerdown',e=>{
    if(!isMobile()||screen()!=='battle')return;
    canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false});
    if(pointers.size>1)for(const p of pointers.values())p.moved=true;
  });
  canvas.addEventListener('pointermove',e=>{
    const p=pointers.get(e.pointerId);if(!p)return;
    const before=pointers.size===2?pair():undefined,dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(Math.hypot(p.x-p.startX,p.y-p.startY)>8)p.moved=true;
    if(before){const after=pair();zoomBattle(battleView.zoom*after.distance/Math.max(1,before.distance),before.center);panBattle(after.center.x-before.center.x,after.center.y-before.center.y);}
    else if(p.moved)panBattle(dx,dy);
  });
  canvas.addEventListener('pointerup',e=>{const p=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(p&&!p.moved&&screen()==='battle')tap(clientToWorld({x:e.clientX,y:e.clientY}));});
  canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));
}
