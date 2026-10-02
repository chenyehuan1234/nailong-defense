import {applyEnemies,applyTowers,createHeroes} from './reference-gameplay';
import type { EnemyDefinition, HeroDefinition, TowerDefinition, TowerKind, HeroKind, AbilityDefinition } from '../src/types';
const skill=(id:string,name:string,description:string,costs:number[]):AbilityDefinition=>({id,name,description,cost:costs[0],costs,maxLevel:costs.length});
export const TOWERS:Record<TowerKind,TowerDefinition>={
 archer:{id:'archer',name:'游侠塔',description:'快速物理攻击 · 可对空',row:0,costs:[70,110,160,230],minDamage:[4,7,10],damage:[6,11,16],range:[280,320,360],interval:[.8,.6,.5],damageKind:'physical',air:true,branches:[
 {name:'疾风游侠',description:'毒箭与藤蔓，延长火力覆盖。',cost:230,minDamage:13,damage:19,range:400,interval:.4,skills:[skill('poison','淬毒箭','附加三秒真实毒伤；5 / 10 / 15 每秒。',[250,250,250]),skill('roots','森林之怒','缠绕 4 / 6 / 8 个敌人，持续 1 / 2 / 3 秒。',[300,150,150])]},
 {name:'重弩猎手',description:'远距狙击，近距霰弹。',cost:230,minDamage:35,damage:65,range:470,interval:1.5,skills:[skill('sniper','鹰眼狙击','20 / 40 / 60% 概率处决非 Boss，失败造成重击。',[250,250,250]),skill('shrapnel','爆裂霰弹','六发近距离爆炸弹，处理密集地面敌人。',[300,300,300])]}]},
 barracks:{id:'barracks',name:'守卫营',description:'三名奶龙卫兵 · 拦截地面',row:1,costs:[70,110,160,230],minDamage:[1,3,6],damage:[3,4,10],range:[290,290,290],interval:[1,1,1.36],damageKind:'physical',air:false,branches:[
 {name:'皇家盾卫',description:'高护甲、治疗与圣光打击。',cost:230,minDamage:12,damage:18,range:290,interval:1.36,skills:[skill('heal','治愈之光','卫兵独立治疗自身；40–60 / 80–120 / 120–180。',[150,150,150]),skill('armor','勇气之盾','额外增加 15 个百分点护甲。',[250]),skill('holy','圣光打击','10% 概率造成范围打击。',[220,150,150])]},
 {name:'狂战奶龙',description:'投斧、旋风与高近战输出。',cost:230,minDamage:16,damage:24,range:290,interval:1.37,skills:[skill('axes','飞斧','投斧攻击可对空，三级伤害递增。',[200,100,100]),skill('moreAxes','双斧训练','近战伤害增加 10 / 20 / 30。',[300,100,100]),skill('whirl','旋风斩','15 / 20 / 25% 概率发动范围旋风。',[150,100,100])]}]},
 mage:{id:'mage',name:'奥术塔',description:'魔法攻击 · 克制物理护甲',row:2,costs:[100,160,240,300],minDamage:[9,23,40],damage:[17,43,74],range:[280,320,360],interval:[1.5,1.5,1.5],damageKind:'magic',air:true,branches:[
 {name:'星辉术士',description:'分解射线与空间传送。',cost:300,minDamage:76,damage:140,range:400,interval:2,skills:[skill('deathray','分解射线','秒杀非 Boss，冷却 20 / 18 / 16 秒。',[350,200,200]),skill('teleport','空间折返','将目标附近 4 / 5 / 6 个敌人送回道路，每个最多三次。',[300,100,100])]},
 {name:'森灵术士',description:'诅咒削甲，变形与岩石守卫。',cost:300,minDamage:42,damage:78,range:400,interval:1.5,skills:[skill('polymorph','软绵变形','变羊后移除能力与护甲、生命减半；点击可消灭。',[300,150,150]),skill('elemental','大地守卫','召唤 600 / 700 / 800 生命岩石守卫。',[350,150,150])]}]},
 engineer:{id:'engineer',name:'工程塔',description:'爆炸伤害 · 忽略一半物理护甲',row:3,costs:[125,220,320,400],minDamage:[8,20,30],damage:[15,40,60],range:[320,320,358],interval:[3,3,3],damageKind:'explosive',air:false,branches:[
 {name:'爆破工坊',description:'追踪导弹和集束弹。',cost:400,minDamage:50,damage:100,range:360,interval:3.5,skills:[skill('missile','龙息导弹','追踪远处目标，可对空；伤害逐级提高。',[250,100,100]),skill('cluster','集束炸弹','散出 3 / 5 / 7 枚范围炸弹。',[250,150,150])]},
 {name:'雷霆工坊',description:'对空连锁电弧与范围过载。',cost:375,minDamage:30,damage:55,range:360,interval:2.25,skills:[skill('chain','强化电弧','连锁目标由三名增至四名、五名。',[250,250]),skill('overload','电能过载','每次攻击附加周围范围伤害。',[250,125,125])]}]}
};
const e=(id:string,name:string,hp:number,speed:number,damage:number,gold:number,sheet:string,row:number,extra:Partial<EnemyDefinition>={}):EnemyDefinition=>({id,name,description:'',hp,speed,damage,gold,sheet,row,interval:1,armor:0,resist:0,leak:1,size:68,behavior:{},rig:'biped',...extra});
export const ENEMIES:Record<string,EnemyDefinition>={
 mushroom:e('mushroom','蘑菇步兵',20,55,3,3,'enemies-a',0,{reference:'Goblin',description:'基础小怪，数量多但十分脆弱。'}),
 orc:e('orc','苔甲兽人',80,44,6,9,'enemy-new-1',0,{reference:'Orc',description:'比蘑菇步兵更耐打的近战敌人。',size:78}),
 shaman:e('shaman','治疗巫医',100,44,5,15,'enemies-b',1,{reference:'Shaman',description:'治疗附近敌人；魔抗高，优先用物理攻击处理。',resist:.85,behavior:{heal:20,healRange:160,healInterval:4}}),
 ogre:e('ogre','重型食人魔',800,30,60,50,'enemies-b',4,{reference:'Ogre',description:'生命高、重击危险，漏过扣三点生命。',leak:3,size:105,interval:2}),
 runner:e('runner','疾跑虫',35,105,3,5,'enemies-a',1,{reference:'Wulf',description:'快速单位，需要拦截或减速。',rig:'quadruped',size:57}),
 worg:e('worg','荆棘狼',120,105,10,12,'enemy-new-1',1,{reference:'Worg',description:'强壮的疾行兽，冲击薄弱防线。',rig:'quadruped',resist:.5,size:73}),
 bandit:e('bandit','蒙面盗贼',70,75,12,8,'enemy-new-1',2,{reference:'Bandit',description:'移动迅速，近战伤害较高。'}),
 boar:e('boar','铁甲野猪',160,40,10,15,'enemies-a',2,{reference:'Brigand',description:'物理护甲 30%，魔法对它更有效。',armor:.3,rig:'quadruped',size:82}),
 marauder:e('marauder','重装掠夺者',600,30,24,40,'enemy-new-1',3,{reference:'Marauder',description:'高生命与 60% 物理护甲。',armor:.6,leak:3,size:97}),
 spider:e('spider','翠壳蜘蛛',80,70,5,8,'enemy-new-1',4,{reference:'Giant Spiders',description:'60% 魔抗，多足快速步态。',resist:.6,rig:'spider',size:73,behavior:{poisonImmune:true}}),
 matriarch:e('matriarch','蛛母',250,44,10,20,'enemy-new-1',5,{reference:'Spider Matriarch',description:'不断孵化幼蛛，优先阻止召唤。',resist:.6,rig:'spider',size:94,behavior:{poisonImmune:true,summon:'hatchling',summonCount:3,summonInterval:7}}),
 hatchling:e('hatchling','幼蛛',10,95,1,0,'enemy-new-1',6,{reference:'Spider Hatchling',description:'蛛母孵化出的幼体，不产生金币。',resist:.6,rig:'spider',size:38,behavior:{poisonImmune:true}}),
 golem:e('golem','机械小傀儡',125,52,15,10,'enemy-new-1',7,{reference:'Golem Head',description:'机械 Boss 投射产生的移动傀儡。',size:54,behavior:{poisonImmune:true}}),
 bat:e('bat','飞行蝙蝠',100,70,0,12,'enemies-a',4,{reference:'Gargoyle',description:'绕过地面拦截，需要对空火力。',flying:true,rig:'flying'}),
 shadow:e('shadow','暗影弓手',200,47,25,20,'enemy-new-2',0,{reference:'Shadow Archer',description:'远程攻击卫兵，主动接敌打断它。',behavior:{ranged:220}}),
 knight:e('knight','黑甲骑士',300,38,20,25,'enemy-new-2',1,{reference:'Dark Knight',description:'80% 物理护甲，魔法可直接穿透。',armor:.8,size:82}),
 winterwolf:e('winterwolf','霜牙狼',350,100,25,20,'enemy-new-2',2,{reference:'Winter Wolf',description:'高速、高魔抗的雪地猛兽。',resist:.8,rig:'quadruped',size:80}),
 troll:e('troll','苔藓巨魔',280,48,15,25,'enemy-new-2',3,{reference:'Troll',description:'每秒恢复 5 生命，集中火力解决。',behavior:{regeneration:5},size:85}),
 champion:e('champion','巨魔投斧手',600,42,45,50,'enemy-new-2',4,{reference:'Troll Champion',description:'恢复生命并远程投斧。',behavior:{regeneration:8,ranged:220},size:90}),
 chieftain:e('chieftain','巨魔鼓手',1200,35,45,70,'enemy-new-2',5,{reference:'Troll Chieftain',description:'恢复并鼓舞附近巨魔。',behavior:{regeneration:20,aura:true},leak:3,size:110}),
 yeti:e('yeti','雪原巨兽',2500,28,100,120,'enemy-new-2',6,{reference:'Yeti',description:'高生命、范围重击，别把卫兵堆在一起。',leak:5,size:120,interval:2}),
 rocket:e('rocket','火箭飞贼',100,145,0,20,'enemy-new-2',7,{reference:'Rocket Rider',description:'高速飞行，不能让对空火力分心。',flying:true,rig:'flying'}),
 slayer:e('slayer','黑曜巨剑士',1200,26,40,75,'enemy-new-3',0,{reference:'Dark Slayer',description:'95% 护甲，极耐物理攻击。',armor:.95,size:106,leak:3}),
 demon:e('demon','熔火小恶魔',250,52,15,20,'enemy-new-3',1,{reference:'Demon Spawn',description:'50% 魔抗，死亡时爆炸伤害友军。',resist:.5,behavior:{explode:75,poisonImmune:true}}),
 demonlord:e('demonlord','恶魔领主',1200,37,35,60,'enemy-new-3',2,{reference:'Demon Lord',description:'为附近恶魔施加护盾，死亡爆炸。',resist:.6,behavior:{shield:true,explode:120,poisonImmune:true},size:100,leak:3}),
 hound:e('hound','熔岩猎犬',100,105,10,15,'enemy-new-3',3,{reference:'Demon Hound',description:'高速、高魔抗，死亡产生小范围爆炸。',resist:.6,rig:'quadruped',behavior:{explode:45,poisonImmune:true}}),
 imp:e('imp','焰翼魔',350,72,0,25,'enemy-new-3',4,{reference:'Demon Imp',description:'耐打的飞行恶魔，拥有魔抗。',resist:.6,flying:true,rig:'flying',behavior:{poisonImmune:true}}),
 skeleton:e('skeleton','骨芽骷髅',20,48,3,2,'enemy-new-3',5,{reference:'Skeleton',description:'墓地或召唤产生；奖励由生成来源决定。',behavior:{poisonImmune:true}}),
 skeletonknight:e('skeletonknight','骨甲卫士',400,35,20,10,'enemy-new-3',6,{reference:'Skeleton Knight',description:'亡灵重甲单位，不能被毒伤。',armor:.4,size:85,behavior:{poisonImmune:true}}),
 necromancer:e('necromancer','死灵术师',700,35,30,50,'enemy-new-3',7,{reference:'Necromancer',description:'不断召唤无奖励骷髅，近战接敌会阻止施法。',leak:3,behavior:{ranged:220,summon:'skeleton',summonCount:5,summonInterval:8}}),
 magma:e('magma','熔岩元素',2500,25,90,100,'enemy-new-4',0,{reference:'Magma Elemental',description:'从熔岩裂隙出现的巨型范围攻击者。',leak:5,size:120,interval:2,behavior:{poisonImmune:true}}),
 juggernaut:e('juggernaut','齿轮巨兽',10000,22,200,0,'enemy-new-4',1,{reference:'The Juggernaut',description:'机械首领，用投射物在道路上部署傀儡。',leak:20,size:180,interval:2,behavior:{boss:'juggernaut',controlImmune:true,poisonImmune:true}}),
 winterboss:e('winterboss','冰冠巨兽',11000,22,150,0,'enemy-new-4',2,{reference:'J.T.',description:'冻结附近塔并持续召唤雪地敌人。',leak:20,size:180,interval:2,behavior:{boss:'winter',controlImmune:true}}),
 boss:e('boss','荆棘魔王',6666,22,100,0,'enemies-b',5,{reference:"Vez'nan",description:'封塔可点击解除；生命耗尽后变身，必须击败第二形态。',leak:20,size:180,interval:2,behavior:{boss:'thorn',controlImmune:true,poisonImmune:true}}),
 beetle:e('beetle','晶壳甲虫',155,45,14,18,'enemies-a',3,{description:'旧版自定义敌人：60% 魔抗。',resist:.6,rig:'quadruped'}),
 slime:e('slime','分裂史莱姆',145,40,11,20,'enemies-b',0,{description:'旧版自定义敌人：死亡后分裂为两名幼体。',rig:'blob',behavior:{split:'slime'}}),
 treant:e('treant','再生树怪',300,32,24,30,'enemies-b',2,{description:'旧版自定义敌人：每秒恢复生命。',armor:.2,size:92,leak:2,behavior:{regeneration:10}}),
 spear:e('spear','远程投矛怪',160,46,18,22,'enemies-b',3,{description:'旧版自定义敌人：远程投矛。',behavior:{ranged:190}})
};
applyEnemies(ENEMIES);applyTowers(TOWERS);
export const HEROES=createHeroes();
export const TOWER_KEYS=Object.keys(TOWERS) as TowerKind[];
export const HERO_KEYS=Object.keys(HEROES) as HeroKind[];
export const ENEMY_KEYS=Object.keys(ENEMIES);
export const MAIN_ENEMY_KEYS=ENEMY_KEYS.filter(k=>!['beetle','slime','treant','spear'].includes(k));

