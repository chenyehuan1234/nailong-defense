import extraSchedules from './reference/steam-24662480/extra-timelines.json';
import pathMetadata from './reference/steam-24662480/path-metadata.json';
import stageData from './reference/steam-24662480/stages.json';
import timelineData from './reference/steam-24662480/native-timelines.json';
import mapData from './reference/steam-24662480/map-points.json';
import {Road} from '../src/math';
import {enemyKey,REFERENCE_SCALE as S} from './reference-gameplay';
import type {LevelDefinition,Point,SpawnTimelineEntry,SpawnGroup,TowerKind,PrebuiltTower} from '../src/types';
const stages:any[]=stageData,timelines:Record<string,any[]>=timelineData;
export const referencePoint=(p:Point):Point=>({x:200+p.x*S,y:900-p.y*S});
const names=['奶龙南港','麦田小径','帕格拉斯','双河渡口','银橡森林','王城要塞','寒步矿场','冰风山口','风暴神殿','荒芜之地','遗忘山谷','黑暗高塔','蛛后巢穴','阿卡洛斯遗迹','腐败森林','静语密林','盗匪巢穴','冰川高地','哈克拉高原','烈火深坑','恶魔之城','菌菇森林','腐木镇','古代墓园','夜牙沼泽','布莱克本城堡'];
const references=['Southport','The Farmlands','Pagras','Twin Rivers','Silveroak Forest','The Citadel','Coldstep Mines','Icewind Pass','Stormcloud Temple','The Wastes','Forsaken Valley','The Dark Tower',"Sarelgaz’s Lair",'Ruins of Acaroth','Rotten Forest','Hushwood','Bandit’s Lair','Glacial Heights','Ha’Kraj Plateau','Pit of Fire','Pandaemonium','Fungal Forest','Rotwick','Ancient Necropolis','Nightfang Swale','Castle Blackburn'];
export const CHAPTERS=[{id:'main',name:'王国远征',stages:[1,2,3,4,5,6,7,8,9,10,11,12]},{id:'spider',name:'蜘蛛巢穴',stages:[13]},{id:'acaroth',name:'阿卡洛斯',stages:[14]},{id:'rot',name:'腐败森林',stages:[15,22]},{id:'bandits',name:'盗匪之乱',stages:[16,17]},{id:'trolls',name:'巨魔部落',stages:[18,19]},{id:'demons',name:'恶魔入侵',stages:[20,21]},{id:'blackburn',name:'布莱克本',stages:[23,24,25,26]}];
const branchNames:Record<TowerKind,string[]>={archer:['tower_ranger','tower_musketeer'],barracks:['tower_paladin','tower_barbarian'],mage:['tower_arcane_wizard','tower_sorcerer'],engineer:['tower_bfg','tower_tesla']};
const required=(n:number)=>n===1?[]:n<=12?['stage-'+String(n-1).padStart(2,'0')]:n===22?['stage-15']:n===17?['stage-16']:n===19?['stage-18']:n===21?['stage-20']:n>=24?['stage-'+String(n-1).padStart(2,'0')]:['stage-12'];
const towerInfo=(template:string):{kind:TowerKind;level:number;branch?:number}|undefined=>{
 for(const [kind,prefix] of [['archer','archer'],['barracks','barrack'],['mage','mage'],['engineer','engineer']] as const){const match=template.match(new RegExp('^tower_'+prefix+'_([123])$'));if(match)return{kind,level:Number(match[1])};const branch=branchNames[kind].indexOf(template);if(branch>=0)return{kind,level:4,branch};}
};
const normalizeEntry=(e:any):SpawnTimelineEntry=>({tick:e.tick,type:enemyKey(e.type),path:e.path-1,subPath:e.subPath-1,node:e.node-1});
export function createReferenceLevels():LevelDefinition[]{return stages.map((stage,index)=>{
 const n=index+1,l=stage.layout,overrides=Array.isArray(l.level_mode_overrides)?l.level_mode_overrides[0]??{}:l.level_mode_overrides?.['1.0']??{};
 const locks:string[]=overrides.locked_towers??[],paths:Point[][]=stage.paths.paths.map((lanes:Point[][])=>lanes[0].map(referencePoint));
 const subPaths:Point[][][]=stage.paths.paths.map((lanes:Point[][])=>lanes.map(lane=>lane.map(referencePoint)));
 const eligible=(l.entities_list as any[]).filter(e=>!e['editor.game_mode']||e['editor.game_mode']===1);
 const holders=new Map<string,any>();
 for(const e of eligible)if(e.template.startsWith('tower_holder')||towerInfo(e.template)){const id=e['tower.holder_id']??`${e.pos.x}:${e.pos.y}`;const old=holders.get(id);if(!old||towerInfo(e.template))holders.set(id,e);}
 const entities=[...holders.values()],slots=entities.map(e=>referencePoint(e.pos)),defaultRallies=entities.map(e=>referencePoint(e['tower.default_rally_pos']??e.pos));
 const prebuilt:PrebuiltTower[]=entities.flatMap((e,slot)=>{const t=towerInfo(e.template);return t?[{slot,...t}]:[];});
 const flag=mapData.flags[index].pos,chapter=CHAPTERS.find(c=>c.stages.includes(n))!;
 const waves=stage.waves.groups.map((g:any,wi:number)=>{
  const traces=Object.fromEntries(Object.entries(timelines).map(([seed,levels])=>[seed,levels[index][wi].events.map(normalizeEntry)]));
  const timeline:SpawnTimelineEntry[]=traces['9451'];
  // Legacy groups remain available for scouting/editor. Runtime uses the ordered trace.
  const groups:SpawnGroup[]=[];for(const e of timeline){const last=groups.at(-1),delay=e.tick/30;if(last&&last.type===e.type&&last.path===e.path&&last.count<150&&(last.count===1||Math.abs(delay-(last.delay+last.interval*last.count))<.04)){last.interval=(delay-last.delay)/last.count;last.count++;}else groups.push({type:e.type,count:1,path:e.path,interval:0,delay});}
  const extraTimelines=Object.fromEntries(Object.entries(extraSchedules as Record<string,any>).map(([seed,levels])=>[seed,(levels[String(n)]?.[wi]?.events??[]).map((e:any)=>({...normalizeEntry(e),from:e.from?referencePoint(e.from):undefined,forcedWaypoint:e.forcedWaypoint?referencePoint(e.forcedWaypoint):undefined}))]));
  return{extraTimelines,completeTicks:Object.fromEntries(Object.entries(timelines).map(([seed,levels])=>[seed,levels[index][wi].completeTick])),groups,rest:g.interval/30,originalInterval:g.interval/30,timeline,timelines:traces,completeTick:timelines['9451'][index][wi].completeTick,native:g};
 });
 const unlocks=Object.fromEntries(Object.entries(branchNames).map(([kind,names])=>[kind,names.reduce((mask,name,i)=>mask|(locks.includes(name)?0:1<<i),0)]));
 const maxTowerLevel=locks.includes('tower_archer_2')?1:locks.includes('tower_archer_3')?2:Object.values(unlocks).every(v=>v===0)?3:4;
 const customStart=l.custom_spawn_pos??entities.at(-1)?.['tower.default_rally_pos']??stage.paths.paths[0][0][Math.floor(stage.paths.paths[0][0].length*.7)];
 const facilities=eligible.flatMap((e,i)=>{const kind=e.template.includes('elf')?'elves':e.template.includes('sasquash')?'sasquatch':e.template==='tower_sunray'?'sunray':undefined;if(!kind||!e.pos)return[];const p=referencePoint(e.pos),rally=referencePoint(e['tower.default_rally_pos']??e.pos);let path=0,progress=0,best=Infinity;for(let pi=0;pi<paths.length;pi++){const road=new Road(paths[pi],true),near=road.nearest(rally);if(near.distance<best){best=near.distance;path=pi;progress=near.progress/road.total;}}return[{id:'native-facility-'+i,kind:kind as 'elves'|'sasquatch'|'sunray',...p,path,progress,cost:kind==='sasquatch'?400:100}];});
 const scripts=eligible.filter(e=>!e.template.startsWith('decal')&&!e.template.startsWith('editor')&&!e.template.startsWith('tower_holder')&&!towerInfo(e.template)).map(e=>({template:e.template,point:e.pos?referencePoint(e.pos):undefined,data:e}));
 return{version:3,id:'stage-'+String(n).padStart(2,'0'),name:names[index],reference:references[index],referenceBuild:24662480,subtitle:chapter.name,chapterId:chapter.id,chapter:n<=6?1:n<=9?2:3,description:`${references[index]} · ${waves.length}波。根据敌人的防御与特殊能力安排防线。`,map:'map-'+String(n).padStart(2,'0'),gold:stage.waves.cash,lives:stage.waves.lives??20,paths,subPaths,pathStarts:pathMetadata[index].start.map(n=>n-1),pathEnds:pathMetadata[index].finish.map(n=>n-1),exitPoints:pathMetadata[index].exits.map(referencePoint),pathConnections:stage.paths.connections,densePaths:true,walkingGrid:stage.grid,logicalSize:{width:1024,height:768,scale:S,offsetX:200},slots,defaultRallies,heroStart:referencePoint(customStart),waves,maxTowerLevel,maxUpgrade:overrides.max_upgrade_level??l.max_upgrade_level??5,unlocks,heroes:n>=4&&!overrides.locked_hero&&!l.locked_hero,lockedPowers:overrides.locked_powers??l.locked_powers,requires:required(n),node:{x:120+flag.x*.49,y:130+flag.y*.68},prebuilt,scriptEvents:scripts,recommended:'结合侦察卡的护甲、魔抗、飞行与召唤信息配置防线。',duration:Math.round(waves.length*.7)+'–'+Math.round(waves.length*1.1)+' 分钟',obstacles:[],portals:[],facilities};
 });}
