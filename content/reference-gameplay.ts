import raw from './reference/steam-24662480/mechanics.json';
import heroLevels from './reference/steam-24662480/hero-levels.json';
import flags from './reference/steam-24662480/constants.json';
import type {EnemyDefinition,HeroDefinition,HeroKind,TowerDefinition,TowerKind} from '../src/types';
// These JSON tables contain numeric gameplay facts, not original game code or media.
export const NATIVE:Record<string,any>=raw;
export const HERO_LEVELS:Record<string,any[]>=heroLevels;
// Lua represents an empty array as an empty table; normalize collection fields only.
function normalizeCollections(value:any){if(!value||typeof value!=='object')return;for(const [key,child] of Object.entries(value)){if(['list','entity_names','allowed_templates','excluded_templates'].includes(key)&&child&&typeof child==='object'&&!Array.isArray(child)){value[key]=Object.entries(child).sort((a,b)=>Number(a[0])-Number(b[0])).map(([,v])=>v);}normalizeCollections(value[key]);}}
normalizeCollections(NATIVE);normalizeCollections(HERO_LEVELS);
export const REFERENCE_SCALE=900/768;
export const F=flags as unknown as Record<string,number>;
export const ENEMY_ALIASES:Record<string,string>={enemy_goblin:'mushroom',enemy_fat_orc:'orc',enemy_shaman:'shaman',enemy_ogre:'ogre',enemy_wolf_small:'runner',enemy_wolf:'worg',enemy_bandit:'bandit',enemy_brigand:'boar',enemy_marauder:'marauder',enemy_spider_small:'spider',enemy_spider_big:'matriarch',enemy_spider_tiny:'hatchling',enemy_golem_head:'golem',enemy_gargoyle:'bat',enemy_shadow_archer:'shadow',enemy_dark_knight:'knight',enemy_whitewolf:'winterwolf',enemy_troll:'troll',enemy_troll_axe_thrower:'champion',enemy_troll_chieftain:'chieftain',enemy_yeti:'yeti',enemy_rocketeer:'rocket',enemy_slayer:'slayer',enemy_demon:'demon',enemy_demon_mage:'demonlord',enemy_demon_wolf:'hound',enemy_demon_imp:'imp',enemy_skeleton:'skeleton',enemy_skeleton_big:'skeletonknight',enemy_necromancer:'necromancer',enemy_lava_elemental:'magma',eb_juggernaut:'juggernaut',eb_jt:'winterboss',eb_veznan:'boss'};
export const enemyKey=(native:string)=>ENEMY_ALIASES[native]??native;
const enemyNames:Record<string,string>={enemy_sarelgaz_small:'萨雷格兹之子',eb_sarelgaz:'蛛后萨雷格兹',enemy_goblin_zapper:'炸弹地精',enemy_orc_armored:'重甲兽人',enemy_orc_rider:'狼骑兽人',enemy_forest_troll:'森林巨魔',eb_gulthak:'古拉克酋长',enemy_zombie:'腐败僵尸',enemy_spider_rotten:'腐败蛛母',enemy_spider_rotten_tiny:'腐败幼蛛',enemy_rotten_tree:'腐败树精',enemy_swamp_thing:'沼泽巨怪',eb_greenmuck:'绿泥巨兽',enemy_raider:'荒野掠夺者',enemy_pillager:'巨斧劫掠者',eb_kingpin:'盗匪之王',enemy_troll_skater:'冰道巨魔',enemy_troll_brute:'巨魔破坏者',eb_ulgukhai:'乌尔古克海',enemy_demon_legion:'恶魔军团',enemy_demon_flareon:'焰球恶魔',enemy_demon_gulaemon:'暴食恶魔',enemy_demon_cerberus:'三头地狱犬',eb_moloch:'恶魔领主摩洛克',enemy_rotten_lesser:'毒孢菇怪',eb_myconid:'菌菇之王',enemy_halloween_zombie:'不死行尸',enemy_giant_rat:'巨鼠',enemy_wererat:'鼠人',enemy_fallen_knight:'堕落骑士',enemy_spectral_knight:'幽魂骑士',enemy_spectral_knight_spawn:'幽魂残躯',enemy_abomination:'缝合憎恶',enemy_witch:'夜巫',enemy_werewolf:'狼人',enemy_lycan:'狼化人',eb_blackburn:'布莱克本公爵',enemy_skeleton_warrior:'骷髅战士',enemy_skeleton_blackburn:'城堡骷髅'};
export function applyEnemies(registry:Record<string,EnemyDefinition>){
 for(const [native,t] of Object.entries(NATIVE)){
  if(!/^(enemy_|eb_)/.test(native)||!t.enemy||!t.health?.hp_max||!t.motion)continue;
  const id=enemyKey(native),old=registry[id],attack=t.melee?.attacks?.[0],ranged=t.ranged?.attacks?.[0],boss=native.startsWith('eb_');
  const hp=t.health.hp_max,health=Array.isArray(hp)?hp[1]:hp;
  const behavior:EnemyDefinition['behavior']={native,bossId:boss?native:undefined,damageKind:attack?.damage_type===F.DAMAGE_MAGICAL?'magic':attack?.damage_type===F.DAMAGE_TRUE?'true':'physical',areaRadius:attack?.damage_radius?attack.damage_radius*REFERENCE_SCALE:undefined};
  behavior.poisonImmune=!!((t.vis?.bans??0)&(F.F_POISON??0));
  behavior.controlImmune=boss||!!((t.vis?.bans??0)&(F.F_STUN??0));
  if(boss)behavior.boss=native==='eb_juggernaut'?'juggernaut':native==='eb_jt'?'winter':native==='eb_veznan'?'thorn':'expansion';
  if(t.regen)behavior.regeneration=(t.regen.health??0)/(t.regen.cooldown||1);
  if(t.death_spawns?.name){behavior.deathSpawn=enemyKey(t.death_spawns.name);behavior.deathSpawnCount=t.death_spawns.quantity??1;}
  if(t.dodge)behavior.dodge=t.dodge.chance??0;
  if(ranged)behavior.ranged=(ranged.max_range||t.ranged.range||150)*REFERENCE_SCALE;
  const specials=t.timed_attacks?.list??[];
  for(const a of specials){
   if(a.type==='spawn'&&a.entity?.startsWith('enemy_')){behavior.summon=enemyKey(a.entity);behavior.summonInterval=a.cooldown;behavior.summonCount=a.count??a.max_count??1;behavior.summonGeneration=a.generation;}
   if(a.mod&&NATIVE[a.mod]?.hps){behavior.heal=NATIVE[a.mod].hps.heal_max??20;behavior.healRange=(a.range??a.max_range??150)*REFERENCE_SCALE;behavior.healInterval=a.cooldown;}
  }
  for(const aura of t.auras?.list??[]){const regen=NATIVE[aura.name]?.regen;if(regen)behavior.regeneration=regen.health/regen.cooldown;}if(t.timed_actions?.list?.some((a:any)=>a.entity_names))behavior.summon='skeleton';for(const a of specials){const spawn=NATIVE[a.bullet]?.spawner;if(spawn){behavior.summon=enemyKey(spawn.entity);behavior.summonCount=spawn.count;behavior.summonInterval=a.min_cooldown??a.cooldown;}if(a.mod==='mod_demon_shield')behavior.shield=true;}
  const flying=!!((t.vis?.flags??0)&(F.F_FLYING??128));
  const spider=native.includes('spider')||native.includes('sarelgaz'),quad=native.includes('wolf')||native.includes('rat')||native.includes('cerberus');
  const rig=flying?'flying':spider?'spider':quad?'quadruped':'biped';
  const fallback=registry[boss?'boss':flying?'bat':spider?'spider':quad?'worg':native.includes('skeleton')?'skeleton':native.includes('troll')?'troll':native.includes('demon')?'demon':native.includes('tree')?'treant':'marauder'];
  registry[id]={...fallback,...old,id,native,name:old?.name??enemyNames[native]??native.replace(/^(enemy_|eb_)/,''),reference:native,hp:health,difficultyHp:Array.isArray(hp)?hp:undefined,minDamage:attack?.damage_min??0,damage:attack?.damage_max??0,interval:attack?.cooldown??1,speed:t.motion.max_speed*1.28*REFERENCE_SCALE,armor:t.health.armor??0,resist:t.health.magic_armor??0,gold:t.enemy.gold??0,leak:t.enemy.lives_cost??1,flying,rig,behavior,size:boss?145:Math.min(105,Math.max(45,(old?.size??65)*.8)),tint:old?.tint??(native.includes('spectral')?0xb6daf0:native.includes('rotten')?0xb6bd82:0xffffff),description:old?.description??'根据原作属性部署防线，注意它的特殊能力。'};
 }
}
const heroSpecs:[HeroKind,string,string,string,number,number,string,string][]=[
 ['shield','gerald','圣盾 · 团团','坚守与反击',0,4,'勇气鼓舞','格挡反击'],
 ['ranger','alleria','游侠 · 闪闪','弓箭与灵猫伙伴',1,6,'多重射击','野性召唤'],
 ['malik','malik','战锤 · 咚咚','近战震地控场',0,8,'重锤猛击','裂地震波'],
 ['bolin','bolin','枪匠 · 轰轰','霰弹、地雷与焦油',1,8,'道路地雷','焦油炸弹'],
 ['star','magnus','奥术 · 星宝','幻象与传送',2,9,'奥术幻象','奥术之雨'],
 ['ignus','ignus','炎灵 · 焰焰','火焰冲锋与恢复',3,11,'烈焰冲锋','狂热之火'],
 ['healer','denas','国王 · 龙龙','鼓舞塔楼与炮击',0,12,'皇家鼓舞','投石支援'],
 ['elora','elora','冰晶 · 雪雪','冰霜减速与冻结',2,12,'寒冰领域','冰刺风暴'],
 ['ingvar','ingvar','祖灵 · 蛮蛮','召唤祖灵与变熊',3,12,'祖先召唤','巨熊之力'],
 ['hacksaw','hacksaw','机甲 · 锯锯','飞锯与机械处决',0,12,'弹射飞锯','伐木机械臂'],
 ['oni','oni','武士 · 刃刃','真实伤害与斩杀',3,12,'千刃折磨','死亡打击'],
 ['thor','thor','雷神 · 霆霆','连锁闪电与雷锤',0,12,'连锁闪电','雷霆之锤'],
 ['tenshi','10yr','天师 · 天宝','天火与神力变身',3,12,'天火降临','神力化身'],
];
export function createHeroes():Record<HeroKind,HeroDefinition>{
 return Object.fromEntries(heroSpecs.map(([id,key,name,role,row,unlockLevel,one,two])=>{
  const native='hero_'+key,t=NATIVE[native],levels=HERO_LEVELS[native],stats=levels.map(l=>({hp:l.health.hp_max,armor:l.health.armor,minDamage:l.hero.level_stats.ranged_damage_min?.[l.hero.level-1]??l.melee?.attacks[0]?.damage_min??0,maxDamage:l.hero.level_stats.ranged_damage_max?.[l.hero.level-1]??l.melee?.attacks[0]?.damage_max??0,regen:l.regen.health}));
  const ranged=['ranger','star','healer','elora','bolin'].includes(id),attack=ranged?(levels[0].ranged?.attacks[0]??levels[0].timed_attacks?.list[0]):levels[0].melee?.attacks[0];
  const range=(ranged?attack?.max_range:t.melee?.range)??65;
  return[id,{id,native,reference:key==='10yr'?'Ten’Shí':key[0].toUpperCase()+key.slice(1),name,role,row,unlockLevel,description:role+'；技能随单局等级提升自动解锁。',hp:stats[0].hp,minDamage:stats[0].minDamage,damage:stats[0].maxDamage,range:range*REFERENCE_SCALE,speed:t.motion.max_speed*REFERENCE_SCALE,interval:attack?.cooldown??1,armor:stats[0].armor,damageKind:['star','elora'].includes(id)?'magic':['tenshi','ignus'].includes(id)?'true':'physical',air:ranged,block:1,revive:t.health.dead_lifetime,skills:[one,two],levelStats:stats,teleport:id==='star'}];
 })) as Record<HeroKind,HeroDefinition>;
}
export function applyTowers(towers:Record<TowerKind,TowerDefinition>){
 const families={archer:['tower_archer_1','tower_archer_2','tower_archer_3','tower_ranger','tower_musketeer'],barracks:['tower_barrack_1','tower_barrack_2','tower_barrack_3','tower_paladin','tower_barbarian'],mage:['tower_mage_1','tower_mage_2','tower_mage_3','tower_arcane_wizard','tower_sorcerer'],engineer:['tower_engineer_1','tower_engineer_2','tower_engineer_3','tower_bfg','tower_tesla']};
 for(const [kind,names] of Object.entries(families)){
  const d=towers[kind as TowerKind];
  names.forEach((name,index)=>{
   const t=NATIVE[name],soldier=t.barrack?NATIVE[t.barrack.soldier_type]:undefined,attack=t.attacks?.list?.[0]??soldier?.melee?.attacks?.[0],bullet=attack?.bullet?NATIVE[attack.bullet]?.bullet:undefined;
   const modifier=bullet?.mod?NATIVE[bullet.mod]:undefined;
   const min=modifier?.dps?.damage_min??bullet?.damage_min??attack?.damage_min??0,max=modifier?.dps?.damage_max??bullet?.damage_max??attack?.damage_max??0,range=(t.attacks?.range??t.barrack?.rally_range??160)*REFERENCE_SCALE;
   const interval=t.attacks?.min_cooldown??soldier?.melee?.cooldown??attack?.cooldown??1;
   if(index<3){d.costs[index]=t.tower.price;d.minDamage[index]=min;d.damage[index]=max;d.range[index]=range;d.interval[index]=interval;}
   else Object.assign(d.branches[index-3],{cost:t.tower.price,minDamage:name==='tower_tesla'?30:min,damage:name==='tower_tesla'?55:max,range,interval});
  });
 }
}
