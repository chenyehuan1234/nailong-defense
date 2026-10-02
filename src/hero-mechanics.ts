import {HEROES,ENEMIES} from '../content/definitions';
import {HERO_LEVELS,NATIVE,REFERENCE_SCALE as S} from '../content/reference-gameplay';
import {distance} from './math';
import type {Simulation} from './simulation';
import type {AllyState,EnemyState,HeroKind,Point,DamageKind} from './types';
export const heroSnapshot=(a:AllyState)=>HERO_LEVELS[HEROES[a.kind as HeroKind].native!][a.level-1];
export function heroXpFactor(a:AllyState){const t=heroSnapshot(a),attack=t.ranged?.attacks?.[0];return attack?NATIVE[attack.bullet]?.bullet?.xp_gain_factor??attack.xp_gain_factor??2.5:t.melee?.attacks?.[0]?.xp_gain_factor??2.5;}
function summon(sim:Simulation,template:string,kind:'pet'|'illusion'|'ancestor',count:number,hp:number,min:number,max:number,duration=Infinity){
 const hero=sim.hero,t=NATIVE[template];
 for(let i=0;i<count;i++){
  const a=sim.createSoldier(undefined,i,{x:hero.x+(i-1)*24,y:hero.y+12});a.kind=kind;a.hp=a.maxHp=hp;a.armor=t.health?.armor??0;a.expires=sim.time+duration;a.commanded=false;a.destination={...a};a.anchor={...a};a.waypoints=[];
  a.summon={template,minDamage:min,damage:max,speed:(t.motion?.max_speed??66)*S,range:(t.ranged?.attacks?.[0]?.max_range??t.melee?.range??65)*S,interval:t.ranged?.attacks?.[0]?.cooldown??t.melee?.attacks?.[0]?.cooldown??1,damageKind:kind==='illusion'?'magic':'physical'};
  sim.emit('spawn',a,{kind});
 }
}
/** Skills resolve in the rule layer; animation consumes the resulting combat events. */
export function updateHeroMechanics(sim:Simulation,dt:number){
 const a=sim.hero;updateHeroFields(sim);if(a.hp<=0)return;const t=heroSnapshot(a),skills=t.hero.skills;
 a.heroCds??={};for(const key of Object.keys(a.heroCds))a.heroCds[key]-=dt;
 const nearby=sim.targets(a,250*S,true),ground=nearby.filter(e=>!sim.isFlying(e)),enemy=nearby[0];
 const active=(key:string,cd:number,condition:boolean,perform:(rank:number,data:any)=>void)=>{
  const data=skills[key],rank=data?.level??0;if(!rank||!condition||(a.heroCds![key]??0)>0||a.commanded||a.moving)return;
  a.heroCds![key]=cd;perform(rank,data);a.anim='skill';a.animUntil=sim.time+.65;a.xp+=data.xp_gain?.[rank-1]??0;sim.levelHero();sim.emit('skill',a,{kind:key,text:HEROES[sim.heroKind].skills[Object.keys(skills).indexOf(key)%2]});
 };
 const value=(d:any,k:string,r:number,fallback=0)=>d[k]?.[r-1]??fallback;
 const delayedArea=(p:Point,radius:number,min:number,max:number,kind:DamageKind,delay=.5,status?:Parameters<Simulation['area']>[4])=>sim.hits.push({at:sim.time+delay,point:{...p},radius,damage:sim.random(min,max),kind,source:a.id,status,air:false});
 switch(sim.heroKind){
  case 'shield':active('courage',t.timed_attacks.list[0].cooldown,sim.allies.filter(f=>f.hp>0&&f!==a&&distance(f,a)<90*S).length>=2,(r)=>{
   for(const friend of sim.allies.filter(f=>f.hp>0&&!(f.kind in HEROES)&&distance(f,a)<90*S)){friend.buffUntil=sim.time+6;friend.courageRank=r;const heal=friend.maxHp*.15;friend.hp=Math.min(friend.maxHp,friend.hp+heal);sim.emit('heal',friend,{amount:Math.round(heal)});}
  });break;
  case 'ranger':
   active('multishot',t.ranged.attacks[1].cooldown,!!enemy,(r,d)=>{for(let i=0;i<d.count_base+d.count_inc*r;i++)sim.fire(a,nearby[i%nearby.length],sim.random(HEROES.ranger.levelStats![a.level-1].minDamage,HEROES.ranger.levelStats![a.level-1].maxDamage),'physical',{source:a.id,shot:'arrow'});});
   active('callofwild',20,!!enemy&&!sim.allies.some(f=>f.kind==='pet'&&f.hp>0),(r,d)=>summon(sim,'soldier_alleria_wildcat','pet',1,d.hp_base+d.hp_inc*r,d.damage_min_base+d.damage_inc*r,d.damage_max_base+d.damage_inc*r));break;
  case 'malik':
   active('smash',t.melee.attacks[2].cooldown,ground.filter(e=>distance(e,a)<60*S).length>=3,(r,d)=>delayedArea(a,60*S,value(d,'damage_min',r),value(d,'damage_max',r),'true',t.melee.attacks[2].hit_time));
   active('fissure',t.melee.attacks[3].cooldown,ground.some(e=>distance(e,a)<70*S),(r,d)=>{const q=ground[0],road=sim.enemyRoad(q);for(let i=-2;i<=2;i++)delayedArea(road.at(q.distance+i*25*S),40*S,value(d,'damage_min',r),value(d,'damage_max',r),'true',.6+Math.abs(i)*.12,{type:'stun',remaining:2,power:1});});break;
  case 'bolin':
   active('mines',t.timed_attacks.list[2].cooldown,ground.length>0&&(sim.heroMines?.length??0)<5,(r,d)=>{const p=sim.nearestRoad(a).point;(sim.heroMines??=[]).push({point:p,at:sim.time+.8,until:sim.time+NATIVE.decal_bolin_mine.duration,damage:sim.random(value(d,'damage_min',r),value(d,'damage_max',r))});sim.emit('warning',p,{kind:'mine',radius:20});});
   active('tar',t.timed_attacks.list[1].cooldown,!!ground.length,(r,d)=>{(sim.heroFields??=[]).push({point:{...ground[0]},radius:47.5*S,until:sim.time+value(d,'duration',r),next:sim.time,slow:.5});});break;
  case 'star':
   active('mirage',t.timed_attacks.list[0].cooldown,!!enemy,(r,d)=>summon(sim,'soldier_magnus_illusion','illusion',value(d,'count',r),a.maxHp*d.health_factor,HEROES.star.levelStats![a.level-1].minDamage*d.damage_factor,HEROES.star.levelStats![a.level-1].maxDamage*d.damage_factor,NATIVE.soldier_magnus_illusion.reinforcement?.duration??10));
   active('arcane_rain',t.timed_attacks.list[1].cooldown,!!ground.length,(r,d)=>{for(let i=0;i<value(d,'count',r);i++){const p={x:ground[0].x+sim.random(-55,55)*S,y:ground[0].y+sim.random(-35,35)*S};delayedArea(p,20*S,value(d,'damage',r),value(d,'damage',r),'magic',.5+i*.15);sim.emit('shot',a,{target:p,effect:'magic',damageKind:'magic',amount:.5+i*.15});}});break;
  case 'ignus':
   active('surge_of_flame',4,ground.some(e=>distance(e,a)>40*S&&distance(e,a)<130*S),(r,d)=>{const e=ground.find(e=>distance(e,a)>40*S&&distance(e,a)<130*S)!,p=sim.enemyRoad(e).at(e.distance+40*S),duration=distance(a,p)/(HEROES.ignus.speed*t.timed_attacks.list[1].speed_factor);a.charge={until:sim.time+duration+.2,damage:sim.random(value(d,'damage_min',r),value(d,'damage_max',r)),hitIds:[]};a.immuneUntil=a.charge.until;sim.route(a,p);});
   active('flaming_frenzy',4.8,ground.some(e=>distance(e,a)<90*S)&&sim.rng.next()<.25,(r,d)=>{sim.area(a,90*S,sim.random(value(d,'damage_min',r),value(d,'damage_max',r)),'true',undefined,a.id,false);a.hp=Math.min(a.maxHp,a.hp+a.maxHp*.2);sim.emit('heal',a,{amount:a.maxHp*.2});});break;
  case 'healer':
   active('tower_buff',t.timed_attacks.list[1].cooldown,sim.towers.some(f=>distance(sim.level.slots[f.slot],a)<165*S),(r,d)=>{for(const tower of sim.towers.filter(f=>distance(sim.level.slots[f.slot],a)<165*S))tower.buffUntil=sim.time+value(d,'duration',r);});
   active('catapult',t.timed_attacks.list[2].cooldown,!!ground.length,(r,d)=>{for(let i=0;i<value(d,'count',r);i++)delayedArea({x:ground[0].x+sim.random(-45,45)*S,y:ground[0].y+sim.random(-30,30)*S},40*S,value(d,'damage_min',r),value(d,'damage_max',r),'explosive',.5+i*.2);});break;
  case 'elora':
   active('chill',t.timed_attacks.list[1].cooldown,!!ground.length,(r,d)=>{const q=ground[0];(sim.heroFields??=[]).push({point:{...q},radius:value(d,'max_range',r)*S,until:sim.time+4,next:sim.time,slow:1-value(d,'slow_factor',r)});});
   active('ice_storm',t.timed_attacks.list[0].cooldown,!!ground.length,(r,d)=>{for(let i=0;i<value(d,'count',r);i++)delayedArea({x:ground[0].x+sim.random(-50,50)*S,y:ground[0].y+sim.random(-30,30)*S},51.2*S,value(d,'damage_min',r),value(d,'damage_max',r),'magic',.8+i*.12);});break;
  case 'ingvar':
   active('ancestors_call',t.timed_attacks.list[0].cooldown,!!ground.length,(r,d)=>summon(sim,'soldier_ingvar_ancestor','ancestor',value(d,'count',r),value(d,'hp_max',r),value(d,'damage_min',r),value(d,'damage_max',r),10));
   active('bear',10,a.hp/a.maxHp<.6&&!!ground.length&&!a.transformedUntil,(r,d)=>{a.transformedUntil=sim.time+value(d,'duration',r);a.immuneUntil=a.transformedUntil;});break;
  case 'hacksaw':
   active('sawblade',t.ranged.attacks[0].cooldown,!!enemy,(r,d)=>{let from:Point=a;let next:EnemyState|undefined=enemy;const seen=new Set<number>();for(let i=0;i<=value(d,'bounces',r)&&next;i++){seen.add(next.id);sim.fire(from,next,45,'true',{source:a.id,shot:'sawblade'});from=next;next=sim.targets(from,150*S,true).find(e=>!seen.has(e.id));}});
   active('timber',t.melee.attacks[1].cooldown,ground.some(e=>distance(e,a)<65*S&&sim.canAffect(e,'instakill')),()=>{const e=ground.find(e=>distance(e,a)<65*S&&sim.canAffect(e,'instakill'))!;e.hp=0;sim.kill(e);});break;
  case 'oni':
   active('torment',t.timed_attacks.list[0].cooldown,ground.filter(e=>distance(e,a)<100*S).length>=2,(r,d)=>delayedArea(a,100*S,value(d,'min_damage',r),value(d,'max_damage',r),'true',.5333));
   active('death_strike',11.6,ground.some(e=>distance(e,a)<65*S),(r,d)=>{const e=ground.find(e=>distance(e,a)<65*S)!;if(sim.canAffect(e,'instakill')&&sim.rng.next()<value(d,'chance',r)){e.hp=0;sim.kill(e);}else sim.damage(e,value(d,'damage',r),'true',a.id);});break;
  case 'thor':
   active('chainlightning',t.melee.attacks[1].cooldown,ground.some(e=>distance(e,a)<65*S)&&sim.rng.next()<.25,(r,d)=>{for(const e of nearby.slice(0,value(d,'count',r)))sim.fire(a,e,value(d,'damage_max',r),'true',{source:a.id,shot:'lightning'});});
   active('thunderclap',t.ranged.attacks[0].cooldown,!!enemy,(r,d)=>{sim.fire(a,enemy,value(d,'damage_max',r),'true',{source:a.id,shot:'lightning'});delayedArea(enemy,value(d,'max_range',r)*S,value(d,'secondary_damage_max',r),value(d,'secondary_damage_max',r),'magic',.6,{type:'stun',remaining:value(d,'stun_duration',r),power:1});});break;
  case 'tenshi':
   active('rain',25,!!enemy,(r,d)=>{for(let i=0;i<value(d,'loops',r);i++)delayedArea({x:enemy!.x+sim.random(-45,45)*S,y:enemy!.y+sim.random(-35,35)*S},NATIVE.fireball_10yr.bullet.damage_radius*S,value(d,'damage_min',r),value(d,'damage_max',r),'true',.7+i*.5);});
   active('buffed',10,(a.hp/a.maxHp<.6||ground.filter(e=>distance(e,a)<100*S).length>=3)&&!a.transformedUntil,(r,d)=>{a.transformedUntil=sim.time+value(d,'duration',r);a.immuneUntil=a.transformedUntil;});
   if(a.transformedUntil){const d=skills.buffed,r=d.level;
    if((a.heroCds.spin??0)<=0&&ground.some(e=>distance(e,a)<50*S)){a.heroCds.spin=t.melee.attacks[2].cooldown;for(let i=0;i<t.melee.attacks[2].loops;i++)for(const delay of t.melee.attacks[2].hit_times)delayedArea(a,50*S,value(d,'spin_damage_min',r),value(d,'spin_damage_max',r),'physical',delay+i*.4);}
    const far=ground.find(e=>distance(e,a)>80*S&&distance(e,a)<150*S);if(far&&(a.heroCds.bomb??0)<=0){a.heroCds.bomb=t.timed_attacks.list[2].cooldown;delayedArea(far,40*S,value(d,'bomb_damage_min',r),value(d,'bomb_damage_max',r),'true',t.timed_attacks.list[2].hit_time);const road=sim.enemyRoad(far);for(let i=0;i<value(d,'bomb_steps',r);i++)delayedArea(road.at(far.distance+(i-2)*25*S),40*S,value(d,'bomb_step_damage_min',r),value(d,'bomb_step_damage_max',r),'physical',1+i*.1);}
   }break;
 }
 if(a.transformedUntil&&a.transformedUntil<=sim.time){a.transformedUntil=undefined;a.immuneUntil=undefined;}
}
function updateHeroFields(sim:Simulation){const a=sim.hero;
 if(a.charge){if(sim.time>a.charge.until||!a.commanded){a.charge=undefined;a.immuneUntil=undefined;}else for(const e of sim.targets(a,NATIVE.aura_ignus_surge_of_flame.aura.damage_radius*S,false))if(!a.charge.hitIds.includes(e.id)){a.charge.hitIds.push(e.id);sim.damage(e,a.charge.damage,'true',a.id);sim.emit('impact',e,{kind:'flame',radius:25*S});}}
 for(const mine of sim.heroMines??[])if(sim.time<mine.until&&sim.time>=mine.at&&sim.targets(mine.point,NATIVE.decal_bolin_mine.radius*S,false).length){sim.area(mine.point,55*S,mine.damage,'explosive',undefined,a.id,false);mine.damage=0;}
 sim.heroMines=(sim.heroMines??[]).filter(m=>m.damage>0&&sim.time<m.until);
 for(const field of sim.heroFields??[])if(sim.time>=field.next){field.next=sim.time+.33;for(const e of sim.targets(field.point,field.radius,false))sim.addStatus(e,'slow',.5,field.slow,a.id);sim.emit('skill',field.point,{kind:'slow',radius:field.radius});}
 sim.heroFields=(sim.heroFields??[]).filter(f=>f.until>sim.time);
}
