import Phaser from 'phaser';
import { GameUI } from './ui';
import { BattleScene } from './scene';
import {resizeViewport} from './viewport';
import './style.css';
import './expansion.css';
resizeViewport();
const ui=new GameUI();
const scene=new BattleScene({ready:s=>{ui.attach(s);s.input.on('pointermove',(p:Phaser.Input.Pointer)=>ui.editorMove({x:p.x,y:p.y},p.isDown));s.input.on('pointerup',()=>ui.finishEditorDrag());},tick:()=>ui.tick(),click:p=>ui.click(p),event:e=>ui.event(e),loadError:key=>ui.toast(`资源 ${key} 加载失败，请刷新重试`)});
const game=new Phaser.Game({type:Phaser.AUTO,width:1600,height:900,parent:'canvas',autoFocus:false,backgroundColor:'#25392d',scene:[scene],render:{antialias:true,roundPixels:false},audio:{noAudio:true},fps:{target:60},input:{activePointers:2}});
const resize=()=>{resizeViewport();requestAnimationFrame(()=>{game.scale.refresh();ui.reflow();});};
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
resize();
if(import.meta.env.DEV){Object.assign(window,{__NAILONG__:{ui,scene,game,get sim(){return scene.sim;}}});}

import './experience.css';
import './mobile.css';
