export const isMobile = () => document.documentElement.classList.contains('mobile');
export const battleView={zoom:1,x:0,y:0,screen:''};
let onViewChange=()=>{};
export function listenViewChange(callback:()=>void){onViewChange=callback;}
export function setViewScreen(screen:string){if(screen!==battleView.screen){battleView.screen=screen;battleView.zoom=1;battleView.x=0;battleView.y=0;}resizeViewport();}
export function panBattle(dx:number,dy:number){battleView.x+=dx;battleView.y+=dy;resizeViewport();onViewChange();}
export function zoomBattle(zoom:number,point={x:innerWidth/2,y:innerHeight/2}){
  const r=document.querySelector<HTMLCanvasElement>('#canvas canvas')!.getBoundingClientRect(),next=Math.max(1,Math.min(2.5,zoom)),ratio=next/battleView.zoom;
  battleView.zoom=next;
  const fit=Math.min(innerWidth/1600,innerHeight/900)*next;
  battleView.x=point.x-(point.x-r.left)*ratio-(innerWidth-1600*fit)/2;
  battleView.y=point.y-(point.y-r.top)*ratio-(innerHeight-900*fit)/2;
  resizeViewport();onViewChange();
}
export function resetBattleView(){battleView.zoom=1;battleView.x=battleView.y=0;resizeViewport();onViewChange();}
export function resizeViewport(){
  const width=window.innerWidth,height=window.innerHeight;
  const mobile=matchMedia('(pointer: coarse)').matches||width<900;
  const scale=Math.min(width/1600,height/900)*(mobile&&battleView.screen==='battle'?battleView.zoom:1);
  const maxX=Math.max(0,(1600*scale-width)/2),maxY=Math.max(0,(900*scale-height)/2);
  battleView.x=Math.max(-maxX,Math.min(maxX,battleView.x));battleView.y=Math.max(-maxY,Math.min(maxY,battleView.y));
  const shell=document.querySelector<HTMLElement>('#game-shell')!;
  document.documentElement.classList.toggle('mobile',mobile);
  document.documentElement.classList.toggle('portrait',width<height);
  shell.style.setProperty('--scale',String(scale));
  shell.style.setProperty('--viewport-height',`${height}px`);
  shell.style.setProperty('--canvas-x',`${(width-1600*scale)/2+battleView.x}px`);
  shell.style.setProperty('--canvas-y',`${(height-900*scale)/2+battleView.y}px`);
}
export function clientToWorld(p:{x:number;y:number}){const r=document.querySelector<HTMLCanvasElement>('#canvas canvas')!.getBoundingClientRect();return{x:(p.x-r.left)*1600/r.width,y:(p.y-r.top)*900/r.height};}
export function worldToClient(p:{x:number;y:number}){
  const canvas=document.querySelector<HTMLCanvasElement>('#canvas canvas')!;
  const r=canvas.getBoundingClientRect();
  return{x:r.left+p.x*r.width/1600,y:r.top+p.y*r.height/900};
}
