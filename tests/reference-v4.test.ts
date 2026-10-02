import {describe,it,expect} from 'vitest';
import {LEVELS,levelForMode} from '../content/levels';
import {HEROES,HERO_KEYS,ENEMIES} from '../content/definitions';
import {HERO_LEVELS,NATIVE,enemyKey,REFERENCE_SCALE as S} from '../content/reference-gameplay';
import stages from '../content/reference/steam-24662480/stages.json';
import timelines from '../content/reference/steam-24662480/native-timelines.json';
import {Simulation,STEP} from '../src/simulation';
import {validateLevel} from '../src/validation';
import {freshSave,validateSave,earnedStars} from '../src/save';
const advance=(s:Simulation,n:number)=>{for(let i=0;i<Math.round(n/STEP);i++)s.step();};
describe('Steam 24662480 content and rules',()=>{
 it('all 26 stages retain native economy, paths, slots and every ordered birth',()=>{
  expect(LEVELS).toHaveLength(26);
  LEVELS.forEach((level,i)=>{
   expect(()=>validateLevel(level)).not.toThrow();expect(level.gold).toBe(stages[i].waves.cash);expect(level.waves).toHaveLength(stages[i].waves.groups.length);
   expect(level.subPaths).toHaveLength(level.paths.length);
   for(const seed of [9451,20261001,314159])level.waves.forEach((w,j)=>expect(w.timelines![String(seed)]).toEqual((timelines as any)[String(seed)][i][j].events.map((e:any)=>({tick:e.tick,type:enemyKey(e.type),path:e.path-1,subPath:e.subPath-1,node:e.node-1}))));
  });
 });
 it('campaign branches are unlocked through the original chapter graph; challenges are deferred',()=>{
  expect(LEVELS[21].requires).toEqual(['stage-15']);expect(LEVELS[16].requires).toEqual(['stage-16']);expect(LEVELS[22].requires).toEqual(['stage-12']);expect(LEVELS[25].requires).toEqual(['stage-25']);
  expect(()=>levelForMode(LEVELS[0],'iron')).toThrow();expect(()=>levelForMode(LEVELS[0],'heroic')).toThrow();
 });
 it('13 heroes retain native ten-level stats and skill unlock steps',()=>{
  expect(HERO_KEYS).toHaveLength(13);expect(HERO_KEYS.map(k=>HEROES[k].unlockLevel)).toEqual([4,6,8,8,9,11,12,12,12,12,12,12,12]);
  for(const kind of HERO_KEYS){const h=HEROES[kind],native=HERO_LEVELS[h.native!];expect(h.levelStats).toHaveLength(10);native.forEach((t,i)=>{expect(h.levelStats![i].hp).toBe(t.health.hp_max);expect(h.levelStats![i].armor).toBe(t.health.armor);for(const skill of Object.values(t.hero.skills) as any[]){const steps=Object.entries(skill.xp_level_steps).filter(([level])=>Number(level)<=i+1).sort((a,b)=>Number(a[0])-Number(b[0]));expect(skill.level).toBe(steps.length?Number(steps.at(-1)![1]):0);}});}
 });
 it('all hero skill sets survive live combat with finite health, damage and positions',()=>{
  for(const kind of HERO_KEYS){const l=structuredClone(LEVELS[11]);l.waves=[{groups:[{type:'orc',count:1,path:0,delay:120,interval:1}],rest:10}];l.scriptEvents=[];const s=new Simulation(l,kind);s.hero.xp=26000;s.levelHero();const near=s.nearestRoad(s.hero),p=near.road.at(near.progress);Object.assign(s.hero,p);s.hero.anchor={...p};s.hero.destination={...p};s.hero.commanded=false;s.hero.waypoints=[];s.hero.hp*=.5;s.command({type:'next-wave'});
   for(let i=0;i<8;i++){const e=s.spawn('ogre',s.roads.indexOf(near.road),near.progress+i*9*S);e.hp=e.maxHp=20000;}advance(s,30);
   expect(s.allies.every(a=>Number.isFinite(a.hp)&&Number.isFinite(a.x)&&Number.isFinite(a.y)),kind).toBe(true);expect(s.enemies.every(e=>Number.isFinite(e.hp)&&Number.isFinite(e.distance)),kind).toBe(true);expect(s.heroDamage,kind).toBeGreaterThan(0);
  }
 });
 it('guard allies, revival and duplicate reward protection use native templates',()=>{
  const s=new Simulation(LEVELS[5]);expect(s.allies.filter(a=>a.summon?.template==='soldier_s6_imperial_guard')).toHaveLength(7);
  const e=s.spawn('enemy_fallen_knight',0,100),gold=s.gold;s.damage(e,99999,'true');s.kill(e);expect(s.gold).toBe(gold+ENEMIES[e.kind].gold);expect(s.spawns.some(p=>p.kind==='enemy_spectral_knight_spawn')).toBe(true);
 });
 it('v4 reset keeps settings, clears old campaign and starts with an empty bestiary',()=>{
  const old={version:3,scores:{'stage-12':{stars:3,lives:20,hero:'star',difficulty:'normal'}},hero:'star',upgrades:{mage:5},discovered:['boss'],training:{completed:[]},settings:{music:false,speed:3}};
  const s=validateSave(old);expect(s.version).toBe(4);expect(s.scores).toEqual({});expect(s.upgrades.mage??0).toBe(0);expect(s.discovered).toEqual([]);expect(s.settings.music).toBe(false);expect(s.settings.speed).toBe(3);expect(earnedStars(freshSave())).toBe(0);
 });
});
