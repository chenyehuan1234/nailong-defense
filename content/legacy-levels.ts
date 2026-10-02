import type { EnemyKind, LevelDefinition, SpawnGroup, WaveDefinition } from '../src/types';
const group=(type:EnemyKind,count:number,path=0,interval=1.8,delay=0):SpawnGroup=>({type,count,path,interval,delay});
const wave=(...groups:SpawnGroup[]):WaveDefinition=>({groups,rest:20});
export const LEGACY_LEVELS: LevelDefinition[] = [
  {version:1,id:'forest',name:'奶龙林地',subtitle:'第一章 · 森林的守护者',description:'村口传来急促的铃声。小小的森林，需要一群勇敢的奶龙。',map:'forest',gold:350,
    paths:[[{x:-60,y:380},{x:190,y:380},{x:325,y:500},{x:465,y:500},{x:610,y:315},{x:825,y:315},{x:985,y:535},{x:1180,y:535},{x:1360,y:405},{x:1660,y:405}]],
    slots:[{x:220,y:275},{x:350,y:380},{x:430,y:625},{x:600,y:470},{x:710,y:220},{x:845,y:460},{x:990,y:380},{x:1085,y:655},{x:1240,y:405},{x:1390,y:545}],heroStart:{x:1210,y:515},recommended:'游侠塔 + 守卫营',duration:'8–10 分钟',
    waves:[wave(group('mushroom',7,0,3.5)),wave(group('mushroom',10,0,3)),wave(group('runner',6,0,3),group('mushroom',8,0,2,8)),wave(group('boar',3,0,6),group('mushroom',12,0,2,5)),wave(group('runner',10,0,2),group('beetle',4,0,5,10)),wave(group('bat',8,0,3),group('boar',5,0,5,4)),wave(group('slime',6,0,4),group('runner',10,0,2,6)),wave(group('ogre',2,0,12),group('boar',5,0,5,5),group('mushroom',18,0,2,2))]},
  {version:1,id:'river',name:'双桥河谷',subtitle:'第二章 · 河谷来信',description:'两座桥，两条来路。分兵防守，在汇流处建立你的防线。',map:'river',gold:460,
    paths:[[{x:-60,y:290},{x:240,y:290},{x:370,y:420},{x:570,y:420},{x:755,y:300},{x:880,y:285},{x:1120,y:285},{x:1250,y:450},{x:1660,y:450}],
      [{x:-60,y:665},{x:260,y:665},{x:425,y:560},{x:620,y:560},{x:860,y:565},{x:1120,y:565},{x:1250,y:450},{x:1660,y:450}]],
    slots:[{x:220,y:400},{x:415,y:300},{x:535,y:525},{x:280,y:560},{x:570,y:700},{x:700,y:435},{x:800,y:215},{x:790,y:685},{x:1200,y:575},{x:1280,y:325},{x:1430,y:570},{x:1470,y:345}],heroStart:{x:1230,y:460},recommended:'两路兵营 · 汇流控场',duration:'12–15 分钟',
    waves:Array.from({length:12},(_,i)=>wave(group(i<3?'mushroom':i<6?'boar':i<9?'slime':'ogre',i<9?8+i:3, i%2,2.8,0),group(i<2?'runner':i<5?'beetle':i<8?'bat':'spear',6+Math.floor(i/2),1-i%2,3,9),...(i>=7?[group('shaman',2,i%2,10,20)]:[])))},
  {version:1,id:'ruins',name:'古树遗迹',subtitle:'第三章 · 星光与荆棘',description:'古老的符文正在苏醒。穿过荆棘，在最后的守望中击败巨兽。',map:'ruins',gold:550,
    paths:[[{x:-60,y:340},{x:220,y:340},{x:350,y:485},{x:545,y:485},{x:680,y:290},{x:925,y:290},{x:1065,y:460},{x:1350,y:460},{x:1660,y:460}],
      [{x:290,y:960},{x:290,y:740},{x:520,y:655},{x:770,y:655},{x:965,y:535},{x:1065,y:460},{x:1350,y:460},{x:1660,y:460}]],
    slots:[{x:200,y:225},{x:300,y:450},{x:475,y:345},{x:560,y:585},{x:685,y:420},{x:795,y:200},{x:940,y:420},{x:1010,y:655},{x:1180,y:340},{x:1220,y:580},{x:1410,y:330},{x:1420,y:610}],heroStart:{x:1230,y:450},recommended:'高级塔协同 · 优先治疗者',duration:'16–20 分钟',
    waves:Array.from({length:16},(_,i)=>i===15?wave(group('boss',1,0,1),group('shaman',3,0,12,12),group('bat',14,1,3,15)):
      wave(group(i<3?'boar':i<6?'treant':i<10?'ogre':'treant',i<6?5+i:4+Math.floor(i/3),i%2,4,0),group(i<4?'runner':i<8?'slime':i<11?'spear':'beetle',10+i,1-i%2,2.4,7),...(i>=3?[group(i%2?'shaman':'bat',i%2?2+Math.floor(i/5):8,i%2,5,20)]:[])))}
];
// Preparation windows preserve each chapter's intended duration; players may call waves early.
for(const [index,level]of LEGACY_LEVELS.entries())for(const w of level.waves)w.rest=index===0?40:index===1?30:20;

