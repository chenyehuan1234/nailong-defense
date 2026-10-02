import type {Point} from './types';

/** Coordinates are in the game's 1600×900 layout, so dragging also works after scaling. */
export function positionEditorPanel(panel:HTMLElement,position:Point){
  const shell=document.querySelector<HTMLElement>('#game-shell')!,width=shell.clientWidth,height=shell.clientHeight,minTop=document.documentElement.classList.contains('mobile')?64:108;
  const x=Math.max(12,Math.min(width-panel.offsetWidth-12,position.x));
  const y=Math.max(minTop,Math.min(height-180,position.y));
  panel.style.left=x+'px';panel.style.top=y+'px';panel.style.maxHeight=(height-y-12)+'px';
  return{x,y};
}
export function attachEditorPanelDrag(panel:HTMLElement,position:Point,onMove:(p:Point)=>void){
  const shell=document.querySelector<HTMLElement>('#game-shell')!,handle=panel.querySelector<HTMLElement>('.editor-drag-handle')!;
  let current=positionEditorPanel(panel,position),drag:{pointer:number;x:number;y:number;origin:Point}|undefined;
  handle.addEventListener('pointerdown',e=>{
    if(e.button!==0||(e.target as HTMLElement).closest('button'))return;
    e.preventDefault();drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,origin:{...current}};handle.setPointerCapture(e.pointerId);panel.classList.add('dragging');
  });
  handle.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.pointer)return;const rect=shell.getBoundingClientRect();
    current=positionEditorPanel(panel,{x:drag.origin.x+(e.clientX-drag.x)*shell.clientWidth/rect.width,y:drag.origin.y+(e.clientY-drag.y)*shell.clientHeight/rect.height});onMove(current);
  });
  const end=()=>{drag=undefined;panel.classList.remove('dragging');};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
  handle.addEventListener('keydown',e=>{
    const delta:{[key:string]:Point}={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}};const step=delta[e.key];if(!step||e.target!==handle)return;
    e.preventDefault();current=positionEditorPanel(panel,{x:current.x+step.x*(e.shiftKey?30:10),y:current.y+step.y*(e.shiftKey?30:10)});onMove(current);
  });
  onMove(current);
}
