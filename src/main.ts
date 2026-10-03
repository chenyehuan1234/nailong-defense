import Phaser from 'phaser';
import { GameUI } from './ui';
import { BattleScene } from './scene';
import {resizeViewport,listenViewChange} from './viewport';
import {attachTouchMap} from './touch-map';
import './style.css';
import './expansion.css';
resizeViewport();
const ui=new GameUI();
const canvasMode=new URL(location.href).searchParams.get('renderer')==='canvas';
const compatibility=()=>{const url=new URL(location.href);url.searchParams.set('renderer','canvas');location.assign(url.href);};
const startupError=()=>{if(ui.scene)return;ui.root.innerHTML='<section class="loading startup-error"><h2>画面初始化未完成</h2><p>浏览器未能启动游戏画面。可重试，或使用兼容显示模式。</p><button class="button primary" id="retry-startup">重新打开</button><button class="button secondary" id="canvas-startup">使用兼容显示</button></section>';ui.root.querySelector('#retry-startup')?.addEventListener('click',()=>location.reload());ui.root.querySelector('#canvas-startup')?.addEventListener('click',compatibility);};
window.addEventListener('error',startupError);const startupTimer=setTimeout(startupError,12000);
const scene=new BattleScene({ready:s=>{clearTimeout(startupTimer);ui.attach(s);const canvas=document.querySelector<HTMLCanvasElement>('#canvas canvas')!;attachTouchMap(canvas,()=>ui.screen,p=>ui.click(p));canvas.addEventListener('webglcontextlost',()=>{ui.showModal('游戏画面暂时中断','<p class="lesson-copy">可以等待浏览器恢复，或切换到兼容显示模式重新进入。</p><button class="button primary" id="lost-canvas">使用兼容显示</button>','context-error-modal');ui.root.querySelector('#lost-canvas')?.addEventListener('click',compatibility);});canvas.addEventListener('webglcontextrestored',()=>{if(ui.modal==='context-error-modal')ui.closeModal();});s.input.on('pointermove',(p:Phaser.Input.Pointer)=>ui.editorMove({x:p.x,y:p.y},p.isDown));s.input.on('pointerup',()=>ui.finishEditorDrag());},tick:()=>ui.tick(),click:p=>ui.click(p),event:e=>ui.event(e),loadError:key=>ui.toast(`资源 ${key} 加载失败，请刷新重试`)});
let game:Phaser.Game|undefined;
try{game=new Phaser.Game({type:canvasMode?Phaser.CANVAS:Phaser.AUTO,width:1600,height:900,parent:'canvas',autoFocus:false,backgroundColor:'#25392d',scene:[scene],render:{antialias:true,roundPixels:false},loader:{maxParallelDownloads:4,timeout:45000},audio:{noAudio:true},fps:{target:60},input:{activePointers:2}});}catch{startupError();}
const resize=()=>{resizeViewport();requestAnimationFrame(()=>{game?.scale.refresh();ui.reflow();});};
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
listenViewChange(()=>requestAnimationFrame(()=>{game?.scale.refresh();ui.reflow();}));
resize();
if(import.meta.env.DEV){Object.assign(window,{__NAILONG__:{ui,scene,game,get sim(){return scene.sim;}}});}

import './experience.css';
import './mobile.css';
