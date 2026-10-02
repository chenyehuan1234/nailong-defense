import Phaser from 'phaser';
import {TOWERS} from '../content/definitions';
import {ACTION_SCALES} from '../content/action-scales';
import type {TowerState} from './types';
import type {Simulation} from './simulation';
export class TowerRig {
 root:Phaser.GameObjects.Container;base:Phaser.GameObjects.Image;operator:Phaser.GameObjects.Image;front:Phaser.GameObjects.Image;status?:Phaser.GameObjects.Text;frame=-1;level=0;upgradeUntil=0;
 constructor(public scene:Phaser.Scene,public slot:number){this.root=scene.add.container(0,0);this.base=scene.add.image(0,0,'tower-plates',0).setOrigin(.5,.84).setDisplaySize(160,160);this.operator=scene.add.image(0,0,'tower-operators',0).setOrigin(.5,176/192);this.front=scene.add.image(0,0,'tower-plates','0-front').setOrigin(.5,0);this.root.add([this.base,this.operator,this.front]);}
 draw(t:TowerState,sim:Simulation){
  const p=sim.level.slots[t.slot],row=TOWERS[t.kind].row,column=t.branch>=0?3+t.branch:t.level-1,frame=row*5+column;
  const y=({archer:[-54,-70,-79,-68,-76],barracks:[-21,-36,-49,-54,-43],mage:[-15,-44,-61,-74,-68],engineer:[-22,-32,-44,-39,-53]}as const)[t.kind][column];
  const alive=t.disabledUntil<=sim.time&&!t.iceClicks,stats=sim.stats(t),target=sim.targets(p,stats.range,stats.air)[0];
  const elapsed=sim.time-t.firedAt,prepare=alive&&target&&t.attackCd>0&&t.attackCd<.22;
  let pose=elapsed<.12?4:elapsed<.32?5:prepare?t.attackCd<.1?2:1:0;
  if(t.kind==='barracks')pose=this.upgradeUntil>sim.time?4:0;
  if(this.level!==t.level){this.level=t.level;this.upgradeUntil=sim.time+.55;}
  const sheet=t.kind==='barracks'?'soldiers-actions':'tower-operators',opRow=t.kind==='barracks'?t.branch===1?3:t.branch===0?2:t.level>1?1:0:row;
  const scale=(t.kind==='barracks'?52:58)+(t.level-1)*3,factor=ACTION_SCALES[sheet]?.[opRow]??1;
  this.operator.setTexture(sheet,opRow*6+pose).setPosition(t.kind==='engineer'?-30:0,y).setDisplaySize(scale*factor,scale*factor).setFlipX(!!target&&target.x<p.x);
  // The deck foreground covers the operator's feet; only the actor moves when firing.
  if(this.frame!==frame){this.frame=frame;this.base.setFrame(frame);this.front.setFrame(`${frame}-front`);}
  const cut=({archer:[97,78,69,80,72],barracks:[135,118,102,96,110],mage:[142,108,88,74,82],engineer:[134,122,108,114,97]}as const)[t.kind][column];
  this.front.setPosition(0,-134.4+cut*160/192).setDisplaySize(160,(192-cut)*160/192);
  const color=t.iceClicks?0x9de5ff:t.sealAt>sim.time?0xe0a0ff:alive?0xffffff:0x8996ab;for(const image of [this.base,this.operator,this.front])image.setTint(color);
  const label=t.iceClicks?`解冻：还需 ${t.iceClicks} 次`:t.sealAt>sim.time?`点击解除封印 · ${Math.ceil(t.sealAt-sim.time)}s`:t.disabledUntil>sim.time?`停用 ${Math.ceil(t.disabledUntil-sim.time)}s`:'';
  if(label&&!this.status){this.status=this.scene.add.text(0,-142,'',{fontFamily:'Microsoft YaHei',fontSize:'13px',color:'#f5efff',stroke:'#293830',strokeThickness:4}).setOrigin(.5);this.root.add(this.status);}
  this.status?.setText(label).setVisible(!!label);
  this.root.setPosition(p.x,p.y).setDepth(90+p.y);this.operator.setAlpha(alive?1:.6);this.base.x=t.kind==='engineer'&&elapsed<.25?-Math.sin(elapsed/.25*Math.PI)*3:0;
  if(this.upgradeUntil>sim.time){const u=Math.sin((this.upgradeUntil-sim.time)/.55*Math.PI);this.operator.y=y-u*4;}
 }
 destroy(){this.root.destroy();}
}
