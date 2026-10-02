export const isMobile = () => document.documentElement.classList.contains('mobile');
export function resizeViewport(){
  const width=window.innerWidth,height=window.innerHeight;
  const mobile=matchMedia('(pointer: coarse)').matches||width<900;
  const scale=Math.min(width/1600,height/900);
  const shell=document.querySelector<HTMLElement>('#game-shell')!;
  document.documentElement.classList.toggle('mobile',mobile);
  document.documentElement.classList.toggle('portrait',width<height);
  shell.style.setProperty('--scale',String(scale));
  shell.style.setProperty('--viewport-height',`${height}px`);
  shell.style.setProperty('--canvas-x',`${(width-1600*scale)/2}px`);
  shell.style.setProperty('--canvas-y',`${(height-900*scale)/2}px`);
}
export function worldToClient(p:{x:number;y:number}){
  const canvas=document.querySelector<HTMLCanvasElement>('#canvas canvas')!;
  const r=canvas.getBoundingClientRect();
  return{x:r.left+p.x*r.width/1600,y:r.top+p.y*r.height/900};
}
