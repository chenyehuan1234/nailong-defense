import Phaser from 'phaser';
import {ENEMIES} from '../content/definitions';
import {ACTION_SCALES} from '../content/action-scales';
import type {AllyState,EnemyState} from './types';
export class UnitRig {
 root:Phaser.GameObjects.Container;body:Phaser.GameObjects.Image;feet:Phaser.GameObjects.Image[]=[];wings:Phaser.GameObjects.Image[]=[];
 tint=0xffffff;family:string;frameKey='';
 constructor(public scene:Phaser.Scene,public sheet:string,public row:number,public size:number,public columns:number,public id:number){
  this.root=scene.add.container(0,0);this.body=scene.add.image(0,-176,sheet,row*columns+1).setOrigin(.5,0);this.root.add(this.body);
  this.family='biped';
  for(let i=0;i<6;i++){const image=scene.add.image(0,0,sheet,row*columns+1).setOrigin(0,0).setVisible(false);this.feet.push(image);this.root.addAt(image,0);}
  for(let i=0;i<2;i++){const image=scene.add.image(0,0,sheet,row*columns+1).setOrigin(i?0:1,.5).setVisible(false);this.wings.push(image);this.root.addAt(image,0);}
 }
 draw(unit:AllyState|EnemyState,time:number,_hero=false){
  const friend=['heroes','soldiers','special-allies'].includes(this.sheet),family=ENEMIES[unit.kind]?.rig??(ENEMIES[unit.kind]?.flying?'flying':'biped');this.family=family;
  const walking=unit.moving&&!['attack','skill','death'].includes(unit.anim),travel='walkDistance'in unit?unit.walkDistance:'distance'in unit?unit.distance:time*110;
  const cycle=travel/90*Math.PI*2,dir=unit.facing===0?0:unit.facing===2?2:1;
  let frame=unit.anim==='death'?6:unit.anim==='hurt'?(friend?6:dir===2?2:dir===0?0:1):unit.anim==='attack'||unit.anim==='skill'?friend&&unit.anim==='skill'?7:5:walking&&dir===1?(Math.sin(cycle)>0?3:4):dir===2?2:dir===0?0:1;
  let texture=this.sheet,index=this.row*this.columns+frame,part=false;
  if(walking&&['heroes','soldiers'].includes(this.sheet)){
   texture=`${this.sheet}-walk-${this.row<2?'a':'b'}`;index=((this.row%2)*3+dir)*6+(Math.floor(travel/15)%6);frame=0;
  }else if(['heroes','soldiers'].includes(this.sheet)){
   texture=this.sheet+'-actions';let pose=0;
   if(unit.anim==='attack'){const elapsed=.4-(unit.animUntil-time);pose=['ranger','star','healer','elf'].includes(unit.kind)?elapsed<.12?2:elapsed<.26?3:0:elapsed<.18?1:elapsed<.28?2:3;}
   else if(unit.anim==='skill')pose=4;else if(unit.anim==='death')pose=5;else if(unit.anim==='hurt')pose=1;
   else if('targetId'in unit&&unit.targetId&&unit.attackCd>0&&unit.attackCd<.16)pose=1;
   index=this.row*6+pose;
  }else if(walking&&!['blob','flying'].includes(family)){part=true;}
  const flying=family==='flying'&&unit.anim!=='death'&&!friend;
  const bodyFrame=flying?`${index}-flight-body`:part?`${index}-body`:index;
  const factor=texture.endsWith('-actions')?(ACTION_SCALES[texture]?.[this.row]??1):1;
  this.body.setTexture(texture,bodyFrame);this.body.y=-176*factor;this.body.rotation=0;
  const feetCount=family==='quadruped'?4:family==='spider'?6:2,width=192/feetCount,cutY=family==='spider'?140:154;
  this.feet.forEach((foot,i)=>{foot.setVisible(part&&i<feetCount);if(part&&i<feetCount){const phase=cycle+i*(family==='quadruped'?Math.PI/2:Math.PI);foot.setTexture(this.sheet,`${index}-foot${feetCount}-${i}`);foot.setPosition(-96+i*width,-176+cutY-Math.max(0,Math.sin(phase))*3);foot.setScale(1,1-Math.max(0,Math.sin(phase))*.12);foot.rotation=Math.sin(phase)*(family==='spider'?.12:.055);}});
  this.wings.forEach((wing,i)=>{wing.setVisible(flying);if(flying){wing.setTexture(this.sheet,`${index}-wing${i}`);wing.setPosition(i?25:-25,-80);wing.setScale(1,.7+Math.sin(time*15+this.id)*.28);wing.rotation=(i?1:-1)*(.08+Math.sin(time*15+this.id)*.1);}});
  const breath=Math.sin(time*2.6+this.id)*.012,attack=unit.anim==='attack'?Math.max(0,Math.min(1,1-(unit.animUntil-time)/.4)):0;
  // Key poses carry the action; interpolation gives anticipation, contact and recovery.
  const push=attack<.4?-Math.sin(attack/.4*Math.PI)*2:Math.sin((attack-.4)/.6*Math.PI)*3;
  this.body.x=unit.anim==='attack'?push:unit.anim==='hurt'?Math.sin(time*25)*2:0;
  this.body.setScale(factor*(family==='blob'?1+Math.sin(cycle)*.07:1),factor*(family==='blob'?1-Math.sin(cycle)*.075:1+breath));
  const sign=unit.facing===-1?-1:1;this.root.setPosition(unit.x,unit.y).setScale(this.size/192*sign,this.size/192).setRotation(0).setVisible(unit.hp>0);
  const color=time-unit.lastHit<.14?0xffb9a9:0xffffff;if(color!==this.tint){this.tint=color;for(const image of [this.body,...this.feet,...this.wings])image.setTint(color);}
 }
 destroy(){this.root.destroy();}
}
