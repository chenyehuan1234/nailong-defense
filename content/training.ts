import { LEGACY_LEVELS } from './legacy-levels';
const trainingBase=()=>{const level=structuredClone(LEGACY_LEVELS[0]);level.slots[3]={x:620,y:405};level.slots[5]={x:795,y:390};level.heroStart={x:760,y:450};return level;};
import type { LevelDefinition } from '../src/types';
const group=(type:string,count:number,interval=3,delay=0)=>({type,count,path:0,interval,delay});
export const TRAINING:LevelDefinition[]=[
 {...trainingBase(),id:'training-1',tutorial:{lesson:0},name:'第一道防线',subtitle:'训练营 · 1 / 3',gold:200,heroes:false,allowedTowers:['archer'],maxTowerLevel:2,maxUpgrade:0,unlocks:{archer:0},waves:[{groups:[group('mushroom',4,4)],rest:20},{groups:[group('mushroom',7,3)],rest:20},{groups:[group('mushroom',10,2)],rest:0}],modes:undefined,facilities:[],description:'从一座弓箭塔开始，学会建立防线。'},
 {...trainingBase(),id:'training-2',tutorial:{lesson:1},name:'伙伴来帮忙',subtitle:'训练营 · 2 / 3',gold:260,heroes:true,allowedTowers:['archer','barracks'],maxTowerLevel:2,maxUpgrade:0,unlocks:{archer:0,barracks:0},waves:[{groups:[group('mushroom',4,4)],rest:20},{groups:[group('runner',5,4)],rest:20},{groups:[group('orc',3,6)],rest:20},{groups:[group('mushroom',8,2.5),group('runner',4,4,8)],rest:0}],modes:undefined,facilities:[],description:'英雄与卫兵能把敌人留在火力范围内。'},
 {...trainingBase(),id:'training-3',tutorial:{lesson:2},name:'读懂敌人的弱点',subtitle:'训练营 · 3 / 3',gold:650,heroes:true,allowedTowers:['archer','barracks','mage','engineer'],maxTowerLevel:2,maxUpgrade:0,unlocks:{archer:0,barracks:0,mage:0,engineer:0},waves:[{groups:[group('boar',2,8)],rest:20},{groups:[group('mushroom',12,.8)],rest:20},{groups:[group('boar',3,7)],rest:20},{groups:[group('mushroom',16,.7),group('orc',3,6,8)],rest:20},{groups:[group('mushroom',15,1),group('boar',3,7,9)],rest:0}],modes:undefined,facilities:[],description:'魔法克制护甲，炮弹处理密集敌人；组合塔系守住村口。'}
];
export interface TeachingStep {id:string;title:string;copy:string;action:string;target:string}
export const LESSONS:TeachingStep[][]=[
 [
 {id:'archer',title:'建立第一道防线',copy:'点击道路旁的空塔位，再选择游侠塔。箭矢会自动攻击进入射程的敌人。',action:'建造一座游侠塔',target:'plot'},
 {id:'range',title:'先看看能覆盖哪里',copy:'点击已建好的游侠塔。地面圆圈就是射程，弯道能让敌人停留更久。',action:'选中游侠塔，观察射程',target:'tower'},
 {id:'wave',title:'准备好再迎敌',copy:'第一波由你决定何时开始。击杀敌人会获得金币；敌人穿过出口会扣生命。',action:'点击“开始第一波”',target:'next-wave'},
 {id:'kill',title:'击杀带来金币',copy:'观察箭矢命中与金币增加。花费金币前，想想升级还是增加火力更合适。',action:'击败至少一名敌人',target:'gold'},
 {id:'upgrade',title:'让箭矢更有力量',copy:'选中游侠塔并升至二级。升级会提高伤害，攻击与建筑外观也会改变。',action:'升级一座游侠塔',target:'tower'},
 {id:'leak',title:'出口与生命',copy:'这一课会演示一名已接近出口的敌人。注意心形图标：漏怪会扣生命，击杀它不会。普通战斗要提前建立防线。',action:'观察一次漏怪扣血',target:'life'},
 {id:'finish',title:'守住出口',copy:'继续手动开启后面的波次，守住所有波次就能获胜。你可以继续建塔。',action:'完成本关',target:'life'}
 ],
 [
 {id:'barracks',title:'卫兵加入防线',copy:'守卫营会派出三名奶龙卫兵。它们负责拦截地面敌人，为远程塔争取时间。',action:'建造守卫营和游侠塔',target:'plot'},
 {id:'rally',title:'把卫兵放到火力里',copy:'选中守卫营，点击“集结点”。面板会收起；在青色范围内点击道路，包括原来被面板遮住的位置。',action:'调整一次集结点',target:'tower'},
 {id:'hero',title:'团团听你指挥',copy:'按H或点击英雄肖像，再点击道路附近。手动命令优先于追击；Shift可以追加路线。',action:'选择团团并移动',target:'hero'},
 {id:'wave',title:'看看拦截如何生效',copy:'卫兵只能拦截地面敌人。把敌人留在游侠塔射程里，比单独摆一座兵营更有效。',action:'开始第一波',target:'next-wave'},
 {id:'block',title:'为箭矢争取时间',copy:'让团团或卫兵接触敌人。被拦截的敌人会停下来作战，箭矢仍可持续攻击它。',action:'实际拦截一名敌人',target:'hero'},
 {id:'retreat',title:'撤退也是战术',copy:'再次命令团团移动到后方。他会优先脱离接敌；附近没有敌人、脱战后后会恢复生命。',action:'撤退到安全处，观察脱战恢复',target:'hero'},
 {id:'reinforce',title:'临时伙伴救场',copy:'按Q或点击奶龙援军，然后点击道路。两名临时卫兵能补上防线空缺。',action:'施放一次援军',target:'reinforce'},
 {id:'finish',title:'伙伴协作',copy:'守卫营维持三名卫兵，阵亡后会补员。英雄倒下也会复活；注意生命和复活提示。',action:'完成本关',target:'hero'}
 ],
 [
 {id:'mage',title:'铁甲也有弱点',copy:'铁甲野猪的护甲会削弱箭矢伤害。建造奥术塔，用魔法攻击它。',action:'建造一座奥术塔',target:'plot'},
 {id:'engineer',title:'密集敌群交给炮弹',copy:'工程塔发射抛物线炮弹，爆炸会伤害范围内的多个地面敌人。注意落点和冲击范围。',action:'建造一座工程塔',target:'plot'},
 {id:'wave',title:'观察克制效果',copy:'先迎战铁甲野猪，下一波会出现密集蘑菇兵。不同塔各有用途，没有一座塔包办所有威胁。',action:'开始第一波',target:'next-wave'},
 {id:'magic-hit',title:'魔法穿过铁甲',copy:'观察奥术塔击中铁甲野猪。魔法攻击绕过物理护甲，但遇到魔法抗性时同样会削弱。',action:'让奥术塔造成实际伤害',target:'tower'},
 {id:'auto',title:'清场后自动继续',copy:'打开自动开波。当前波出怪结束并清空敌人后，等待3秒游戏时间进入下一波。',action:'打开自动开波',target:'auto-wave'},
 {id:'speed',title:'按自己的节奏守护',copy:'点击速度按钮切换到二倍或三倍速。冷却与自动开波一起加速，音乐保持原速。',action:'切换到二倍或三倍速',target:'speed'},
 {id:'aoe',title:'一枚炮弹，多个目标',copy:'爆炸圈与实际伤害半径相同。密集敌人同处圈内时，炮弹会同时伤害它们；飞行敌人通常不能被普通炮弹击中。',action:'观察一次命中多个敌人的爆炸',target:'tower'},
 {id:'finish',title:'组合你的防线',copy:'魔法处理护甲，炮弹清群，守卫负责拦截，游侠负责快速攻击与对空。继续尝试升级和搭配。',action:'完成本关',target:'tower'}
 ]
];
