import { ENEMIES, TOWERS } from '../content/definitions';
import type { EnemyKind, LevelDefinition, TowerKind } from './types';
export function levelEnemies(level:LevelDefinition):EnemyKind[]{
 const types=new Set(level.waves.flatMap(w=>[...w.groups.map(g=>g.type),...Object.values(w.extraTimelines??{})[0]?.map(e=>e.type)??[]]));
 if(level.id==='stage-12'&&(!level.mode||level.mode==='campaign'))types.add('boss');
 for(const f of level.facilities??[]){if(f.kind==='graveyard'){types.add('skeleton');types.add('skeletonknight');}if(f.kind==='summon')types.add('demon');if(f.kind==='magma')types.add('magma');}
 for(const event of level.scriptEvents??[]){if(event.template==='graveyard_controller'){types.add('skeleton');types.add('skeletonknight');}if(event.template==='swamp_controller'){types.add('enemy_zombie');types.add('enemy_swamp_thing');}if(event.template==='s11_lava_spawner')types.add('magma');if(event.template==='s15_rotten_spawner')types.add('enemy_rotten_tree');}
 for(const k of [...types]){const b=ENEMIES[k]?.behavior;if(b?.summon)types.add(b.summon);if(b?.split)types.add(b.split);}
 return [...types].filter(k=>!!ENEMIES[k]);
}
export function enemyAdvice(kind:string,level?:LevelDefinition){
 const e=ENEMIES[kind],b=e.behavior,tags:string[]=[],suggestions:TowerKind[]=[];
 if(e.flying){tags.push('飞行，无法近战拦截');suggestions.push('archer','mage');}
 if(e.armor>=.3){tags.push('高护甲：魔法更有效');suggestions.push('mage');}
 if(e.resist>=.3){tags.push('高魔抗：优先物理');suggestions.push('archer');}
 if(b.regeneration){tags.push('再生：集中火力，避免分散');suggestions.push('mage','archer');}
 if(b.heal||b.summon){tags.push(b.heal?'治疗支援：优先击杀':'召唤支援：尽快处理');suggestions.push('mage','archer');}
 if(b.split||e.hp<=120&&!e.flying){tags.push('成群出现：范围伤害');suggestions.push('archer','engineer');}
 if(e.speed>=60&&!e.flying){tags.push('移动快：拦截与减速');suggestions.push('barracks');}
 if(b.poisonImmune)tags.push('毒伤免疫');if(b.controlImmune)tags.push('免疫控制');
 if(!tags.length){tags.push('基础地面敌人：拦截配合远程');suggestions.push('archer','barracks');}
 const available=[...new Set(suggestions)].filter(k=>!level||(!level.allowedTowers||level.allowedTowers.includes(k)));
 return{tags,recommended:available.map(k=>TOWERS[k].name),families:available};
}
export function advancedAdvice(enemy:string,level:LevelDefinition){
 if((level.maxTowerLevel??4)<4)return[];
 const d=ENEMIES[enemy],advice=enemyAdvice(enemy,level);
 return advice.families.flatMap(kind=>{
  const preferred=kind==='archer'?(d.behavior.poisonImmune||d.behavior.regeneration?1:0):0;
  if(!((level.unlocks?.[kind]??3)&(1<<preferred)))return[];
  const at=level.unlockAtWave?.[kind]??0;
  return[TOWERS[kind].branches[preferred].name+(at>0?`（第${at}波开放）`:'')];
 });
}
export function scout(level:LevelDefinition){
 const counts=new Map<string,number>();for(const w of level.waves){for(const g of w.groups)counts.set(g.type,(counts.get(g.type)??0)+g.count);for(const e of Object.values(w.extraTimelines??{})[0]??[])counts.set(e.type,(counts.get(e.type)??0)+1);}
 if(level.scouting?.majorEnemies.length)return [...new Set(level.scouting.majorEnemies)].filter(k=>ENEMIES[k]).slice(0,5);
 const all=levelEnemies(level),bosses=all.filter(k=>!!ENEMIES[k].behavior.boss);
 const main=all.filter(k=>!bosses.includes(k)).sort((a,b)=>(counts.get(b)??0)*Math.sqrt(ENEMIES[b].hp)-(counts.get(a)??0)*Math.sqrt(ENEMIES[a].hp)).slice(0,4);
 return [...main,...bosses];
}
