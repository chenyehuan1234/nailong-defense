import {it,expect} from 'vitest';
import {Simulation,STEP} from '../src/simulation';
import {LEVELS} from '../content/levels';
import {ENEMIES} from '../content/definitions';
import {NATIVE,REFERENCE_SCALE as S} from '../content/reference-gameplay';
import {nativeEnemyContact,updateNativeEnemy,updateNativeFacilities} from '../src/reference-combat';
import {updateHeroMechanics} from '../src/hero-mechanics';
const advance=(s:Simulation,seconds:number)=>{for(let i=0;i<Math.round(seconds/STEP);i++)s.step();};
it('undead deaths never recursively feed the native graveyard',()=>{
 const s=new Simulation(LEVELS[9]);const e=s.spawn('skeleton',0,200);s.damage(e,99999,'true');expect(s.spawns).toHaveLength(0);
 const living=s.spawn('orc',0,200);s.damage(living,99999,'true');expect(s.spawns.some(p=>['skeleton','skeletonknight'].includes(p.kind))).toBe(true);
});
it('a demon shield absorbs exactly four contacts, then damage reaches health',()=>{
 const s=new Simulation(LEVELS[10]),e=s.spawn('demon',0,200);e.shieldHits=4;for(let i=0;i<4;i++)s.damage(e,20,'true');expect(e.hp).toBe(e.maxHp);s.damage(e,20,'true');expect(e.hp).toBe(e.maxHp-20);
});
it('ghost armor ignores physical/explosive hits while magic remains useful',()=>{
 const s=new Simulation(LEVELS[22]),e=s.spawn('enemy_spectral_knight',0,200);s.damage(e,10,'physical');s.damage(e,10,'explosive');expect(e.hp).toBe(e.maxHp);s.damage(e,10,'magic');expect(e.hp).toBeLessThan(e.maxHp);
});
it('legion clones keep generation and current health, and stop at the native generation cap',()=>{
 const s=new Simulation(LEVELS[20]),e=s.spawn('enemy_demon_legion',0,200);e.hp=200;e.generation=0;e.nativeCds={attack0:0};updateNativeEnemy(s,e,STEP);const p=s.spawns.find(p=>p.kind==='enemy_demon_legion')!;expect(p.generation).toBe(1);expect(p.hp).toBe(200);expect(p.bounty).toBe(0);
 s.spawns=[];e.generation=3;e.nativeCds={attack0:0};updateNativeEnemy(s,e,STEP);expect(s.spawns).toHaveLength(0);
});
it('flying witches attack without stopping their advance forever',()=>{
 const s=new Simulation(LEVELS[24]);const near=s.nearestRoad(s.hero),e=s.spawn('enemy_witch',s.roads.indexOf(near.road),near.progress);s.hero.immuneUntil=Infinity;const d=e.distance;advance(s,1);expect(e.distance).toBeGreaterThan(d);
});
it('native ice skaters cannot be blocked on the ice terrain',()=>{
 const s=new Simulation(LEVELS[17]),e=s.spawn('enemy_troll_skater',0,0);const ice=s.roads.flatMap(r=>r.points).find(p=>s.terrain(p)&2048)!;expect(ice).toBeDefined();Object.assign(e,ice);expect(s.canBlock(e)).toBe(false);
});
it('native facility soldiers revive for free without losing the purchased rank',()=>{
 const s=new Simulation(LEVELS[4]),f=s.level.facilities!.find(f=>f.kind==='elves')!;expect(s.command({type:'facility',id:f.id})).toBe(true);const a=s.allies.find(a=>a.facility===f.id)!,gold=s.gold;s.hitAlly(a,99999,'true');advance(s,4);expect(a.hp).toBeGreaterThan(0);expect(s.gold).toBe(gold);expect(s.facilityStates.get(f.id)!.rank).toBe(1);
});
it('poison damage bypasses plate armor and nonlethal spores leave one health',()=>{
 const s=new Simulation(LEVELS[21]);s.hero.armor=.95;s.hero.hp=100;s.hero.dot={until:10,next:0,power:60,interval:1,nonlethal:true};updateNativeFacilities(s,STEP);expect(s.hero.hp).toBe(40);s.time=1;updateNativeFacilities(s,STEP);expect(s.hero.hp).toBe(1);
});
it('Gerald courage excludes heroes and heals soldiers at its native skill rank',()=>{
 const s=new Simulation(LEVELS[3]);s.hero.xp=300;s.levelHero();s.hero.hp=50;for(let i=0;i<2;i++){const a=s.createSoldier(undefined,i,s.hero);a.commanded=false;a.hp=1;}s.grid.rebuild([]);updateHeroMechanics(s,STEP);expect(s.hero.hp).toBe(50);expect(s.allies.filter(a=>a.kind==='soldier').every(a=>a.buffUntil>s.time&&a.hp>1)).toBe(true);
});
it('Bolin mines expire after fifty seconds instead of accumulating forever',()=>{
 const s=new Simulation(LEVELS[7],'bolin');s.heroMines=[{point:s.hero,at:0,until:50,damage:100}];s.time=51;updateHeroMechanics(s,STEP);expect(s.heroMines).toHaveLength(0);
});
it('Tenshi rain emits the native number of strikes rather than tripling the loop count',()=>{
 const s=new Simulation(LEVELS[11],'tenshi');s.hero.xp=300;s.levelHero();const p=s.nearestRoad(s.hero),e=s.spawn('ogre',s.roads.indexOf(p.road),p.progress);s.hero.x=e.x;s.hero.y=e.y;s.hero.commanded=false;s.hero.moving=false;s.grid.rebuild(s.enemies);updateHeroMechanics(s,STEP);expect(s.hits.filter(h=>h.radius===NATIVE.fireball_10yr.bullet.damage_radius*S)).toHaveLength(2);
});

it('native tunnel array connections are one-based values with zero-based array positions',()=>{
 const s=new Simulation(LEVELS[17]);expect(s.connectedPath(0)).toBe(4);expect(s.connectedPath(1)).toBe(5);
 const e=s.spawn('runner',0,0),end=s.goalProgress(e);e.distance=end-1;Object.assign(e,s.enemyRoad(e).at(e.distance));const hp=s.lives;s.step();expect(e.path).toBe(4);expect(s.lives).toBe(hp);
});
it('native goal nodes extend beyond the visible exit marker without early life loss',()=>{
 const s=new Simulation(LEVELS[20]),e=s.spawn('runner',0,0),road=s.enemyRoad(e),visible=road.nearest(s.level.exitPoints![0]).progress;
 expect(s.goalProgress(e)).toBeGreaterThan(visible);e.distance=visible+1;Object.assign(e,road.at(e.distance));s.step();expect(s.lives).toBe(20);
 e.distance=s.goalProgress(e)-.01;Object.assign(e,road.at(e.distance));s.step();expect(s.lives).toBe(19);
});
it('a legion reaching the last twenty nodes cannot create another clone',()=>{
 const s=new Simulation(LEVELS[20]),e=s.spawn('enemy_demon_legion',0,0);e.distance=s.goalProgress(e)-19*5*S;e.nativeCds={attack0:0};updateNativeEnemy(s,e,STEP);expect(s.spawns).toHaveLength(0);
});
it('Cerberus and spectral knights retain their native control bans',()=>{
 const s=new Simulation(LEVELS[20]),hound=s.spawn('enemy_demon_cerberus',0,200),ghost=s.spawn('enemy_spectral_knight',0,200);expect(s.canAffect(hound,'instakill')).toBe(false);expect(s.canAffect(ghost,'thorn')).toBe(false);
 s.command({type:'build',slot:0,kind:'mage'});s.damage(hound,10,'magic',-100);expect(hound.statuses.some(x=>x.type==='slow')).toBe(false);
});

it('Legion roots make at most two copies, their children at most one, and grandchildren none',()=>{
 const s=new Simulation(LEVELS[20]);for(const generation of [0,1,2]){
  const e=s.spawn('enemy_demon_legion',0,200);e.generation=generation;e.nativeCds={attack0:0};s.spawns=[];
  for(let i=0;i<5;i++){e.nativeCds.attack0=0;updateNativeEnemy(s,e,STEP);}
  expect(s.spawns.length).toBe(2-generation);expect(s.spawns.every(c=>c.generation===generation+1)).toBe(true);
 }
});
