import {ENEMIES,HEROES} from '../content/definitions';
import {NATIVE,enemyKey,REFERENCE_SCALE as S} from '../content/reference-gameplay';
import {referencePoint} from '../content/reference-levels';
import {distance} from './math';
import type {Simulation} from './simulation';
import type {EnemyState,AllyState,Point} from './types';
export function queueEnemy(sim:Simulation,name:string,path:number,progress:number,delay=0,subPath=0,bounty?:number,generation=0,hp?:number){
 const kind=enemyKey(name);if(!ENEMIES[kind]||!sim.roads[path])return;
 sim.spawns.push({kind,path,progress,at:sim.time+delay,subPath,bounty,generation,hp});sim.spawns.sort((a,b)=>a.at-b.at);sim.autoWaveAt=Infinity;
}
function friends(sim:Simulation,p:Point,r:number){return sim.allies.filter(a=>a.hp>0&&distance(a,p)<=r);}
function heal(sim:Simulation,e:EnemyState,amount:number){e.hp=Math.min(e.maxHp,e.hp+amount);sim.emit('heal',e,{amount});}
export function enemyDeath(sim:Simulation,e:EnemyState){
 const d=ENEMIES[e.kind],t=NATIVE[d.native??''];if(!t)return;
 const spawn=t.death_spawns;
 if(!e.sheep&&spawn?.name){
  if(ENEMIES[enemyKey(spawn.name)])for(let i=0;i<(spawn.quantity??1);i++)queueEnemy(sim,spawn.name,e.path,e.distance+i*(spawn.spread_nodes??0)*5*S,spawn.delay??0,e.subPath,undefined,e.generation);
  else{const aura=NATIVE[spawn.name]?.aura;if(aura){for(const a of friends(sim,e,aura.radius*S)){if(aura.excluded_templates?.includes(HEROES[a.kind as keyof typeof HEROES]?.native??a.summon?.template??''))continue;if(aura.damage_max)sim.hitAlly(a,sim.random(aura.damage_min,aura.damage_max));if(aura.mod)applyAllyMod(sim,a,aura.mod);}}}
 }
 if(t.on_death_spawn_count)for(let i=0;i<t.on_death_spawn_count;i++)queueEnemy(sim,'enemy_rotten_lesser',e.path,e.distance+(i-6)*5*S,t.on_death_spawn_wait+i*.1,i%3);
 // Resurrection controllers operate on actual deaths, including friendly casualties in swamps.
 for(const event of sim.level.scriptEvents??[]){const ctrl=NATIVE[event.template]?.graveyard;if(!ctrl||((t.vis?.flags??0)&ctrl.vis_bans)||((t.vis?.bans??0)&ctrl.vis_flags)||event.template!=='graveyard_controller'||t.vis?.flags&32)continue;
  const raw=event.data?.['graveyard.spawn_pos'] as Point[]|undefined;if(!raw?.length)continue;
  const name=ctrl.spawns_by_health.find((x:any)=>e.maxHp<=x[1])?.[0];if(!name)continue;const p=referencePoint(raw[Math.floor(sim.rng.next()*raw.length)]),road=sim.nearestRoad(p),path=sim.roads.findIndex(r=>r===road.road);
  const actual=path<0?sim.roads.map(r=>r.nearest(p)).findIndex(n=>n.distance===road.distance):path;queueEnemy(sim,name,Math.max(0,actual),road.progress,ctrl.dead_time,e.subPath,ctrl.keep_gold?undefined:0);
 }
}
export function applyAllyMod(sim:Simulation,a:AllyState,name:string){const mod=NATIVE[name];if(!mod)return;
 if((mod.modifier?.vis_bans??0)&16&&a.kind in HEROES)return;
 if(mod.moon?.transform_name)a.infectedAs=mod.moon.transform_name;
 if(mod.dps)a.dot={until:sim.time+(mod.modifier?.duration??1),next:sim.time,power:mod.dps.damage_max,interval:mod.dps.damage_every,nonlethal:mod.dps.kill===false};
 if(mod.modifier?.duration&&name.includes('stun'))a.stunnedUntil=sim.time+mod.modifier.duration;
}
export function nativeAllyDeath(sim:Simulation,a:AllyState){
 if(a.kind in HEROES)return;
 if(a.infectedAs){const near=sim.nearestRoad(a);queueEnemy(sim,a.infectedAs,sim.roads.indexOf(near.road),near.progress,.5,0,0);a.infectedAs=undefined;return;}
 for(const ev of sim.level.scriptEvents??[]){if(ev.template!=='swamp_controller')continue;const ctrl=NATIVE.swamp_controller.graveyard;if(ctrl.excluded_templates.includes(a.summon?.template??''))continue;
  const name=ctrl.spawns_by_health.find((x:any)=>a.maxHp<=x[1])?.[0],near=sim.nearestRoad(a),path=sim.roads.indexOf(near.road);if(name)queueEnemy(sim,name,path,near.progress,ctrl.dead_time,0,0);
 }
}
export function nativeEnemyContact(sim:Simulation,e:EnemyState,a:AllyState,ranged:boolean){const t=NATIVE[ENEMIES[e.kind].native??''];if(!t)return;
 const attacks=ranged?t.ranged?.attacks:t.melee?.attacks;
 for(const attack of attacks??[])if(attack.mod&&sim.rng.next()<(attack.chance??1))applyAllyMod(sim,a,attack.mod);
 const bullet=NATIVE[t.ranged?.attacks?.[0]?.bullet]?.bullet;if(ranged&&bullet?.mod)applyAllyMod(sim,a,bullet.mod);
}
export function updateNativeEnemy(sim:Simulation,e:EnemyState,dt:number){
 const t=NATIVE[ENEMIES[e.kind].native??''];if(!t||e.sheep)return;e.nativeCds??={};for(const k of Object.keys(e.nativeCds))if(!k.endsWith('Index'))e.nativeCds[k]-=dt;
 const periodic=(key:string,cd:number,perform:()=>void,condition=true)=>{if(!condition)return;if(e.nativeCds![key]===undefined)e.nativeCds![key]=cd;if(e.nativeCds![key]!<=0){e.nativeCds![key]=cd;perform();}};
 if(t.lycan_trigger_factor&&e.hp/e.maxHp<=t.lycan_trigger_factor){const target=ENEMIES[enemyKey(t.moon.transform_name)],mult=sim.difficulty==='casual'?.8:sim.difficulty==='normal'?1:1.2;e.kind=target.id;e.hp=e.maxHp=target.hp*mult;e.armor=target.armor;e.bounty=target.gold;sim.emit('skill',e,{kind:'transform',text:'月夜狼人现身',actor:e.id});return;}
 for(const a of t.auras?.list??[]){const regen=NATIVE[a.name]?.regen;if(regen&&sim.time-e.lastHit>regen.last_hit_standoff_time)e.hp=Math.min(e.maxHp,e.hp+regen.health/regen.cooldown*dt);}
 if(t.regen&&sim.time-e.lastHit>(t.regen.last_hit_standoff_time??0))e.hp=Math.min(e.maxHp,e.hp+t.regen.health/t.regen.cooldown*dt);
 if(e.statuses.some(s=>s.remaining>0&&['stun','freeze'].includes(s.type)))return;
 if(t.template_name==='eb_kingpin'){const aura=NATIVE.kingpin_damage_aura.aura;periodic('damageAura',aura.cycle_time,()=>{for(const f of friends(sim,e,aura.radius*S))sim.hitAlly(f,aura.damage_max);});}
 for(const [i,a] of (t.timed_actions?.list??[]).entries()){
  if(a.type==='spawn')periodic('action'+i,a.cooldown,()=>{const count=Math.min(a.max_count,a.count_group_max-sim.enemies.filter(f=>['skeleton','skeletonknight'].includes(f.kind)&&f.hp>0).length);for(let j=0;j<count;j++)queueEnemy(sim,sim.rng.next()<a.entity_chances[0]?a.entity_names[0]:a.entity_names[1],e.path,Math.max(0,e.distance+(j-2)*15*S),a.spawn_time+j*a.spawn_delay,j%3);},!sim.blocked.has(e.id));
  if(a.mod==='mod_gulaemon_fly')periodic('action'+i,a.cooldown,()=>{e.flyingUntil=sim.time+NATIVE[a.mod].modifier.duration;sim.blocked.delete(e.id);sim.emit('skill',e,{kind:'takeoff'});});
 }
 for(const [i,a]of(t.timed_attacks?.list??[]).entries()){
  const targets=sim.enemies.filter(f=>f.hp>0&&distance(f,e)<(a.max_range??a.range??150)*S);
  const mods=a.mods??(a.mod?[a.mod]:[]);
  if(mods.some((m:string)=>NATIVE[m]?.hps))periodic('attack'+i,a.cooldown,()=>{for(const f of targets.filter(f=>(a.mod!=='mod_kingpin_heal_self'||f===e)&&(!a.allowed_templates||a.allowed_templates.includes(ENEMIES[f.kind].native))).slice(0,a.max_count??9999)){for(const name of mods){const mod=NATIVE[name];if(mod.hps)heal(sim,f,mod.hps.heal_max);if(mod.modifier.type==='rage')f.rageUntil=sim.time+mod.modifier.duration;}}});
  if(a.entity==='enemy_demon_legion'){
   e.nativeCds.copyRemainingIndex??=Math.max(0,a.generation-(e.generation??0));
   periodic('attack'+i,a.cooldown,()=>{e.nativeCds!.copyRemainingIndex--;queueEnemy(sim,a.entity,e.path,Math.min(sim.enemyRoad(e).total,e.distance+sim.random(5,10)*5*S),a.spawn_time,e.subPath,0,(e.generation??0)+1,e.hp);e.immobileUntil=sim.time+a.clone_time;e.nativeCds!['attack'+i]=a.cooldown_after+a.clone_time;},e.nativeCds.copyRemainingIndex>0&&!sim.blocked.has(e.id)&&sim.remainingDistance(e)>a.nodes_limit*5*S);
  }
  const egg=NATIVE[a.bullet]?.spawner;if(egg)periodic('egg'+i,a.min_cooldown??a.cooldown,()=>{for(let j=0;j<egg.count;j++)queueEnemy(sim,egg.entity,e.path,e.distance+egg.node_offset*5*S,1+j*egg.cycle_time,j%3);e.nativeCds!['egg'+i]=sim.random(a.min_cooldown,a.max_cooldown);},!sim.blocked.has(e.id));
  if(a.entity==='enemy_spider_small')periodic('attack'+i,a.cooldown,()=>{queueEnemy(sim,a.entity,e.path,e.distance,a.spawn_time??1,e.subPath);},!sim.blocked.has(e.id));
  if(a.bullet==='bomb_greenmuck')periodic('attack'+i,a.cooldown,()=>{const bullet=NATIVE[a.bullet].bullet;for(const friend of friends(sim,e,Infinity).slice(0,a.count)){sim.warnings.push({at:sim.time+1,point:{...friend},kind:'boss',radius:bullet.damage_radius*S,damage:sim.random(bullet.damage_min,bullet.damage_max)});sim.emit('warning',friend,{kind:'boss',radius:bullet.damage_radius*S,amount:1});}});
  if(a.bullet==='bomb_juggernaut')periodic('attack'+i,a.cooldown,()=>{const road=sim.enemyRoad(e),p=road.at(Math.min(road.total-100*S,e.distance+150*S));for(let j=0;j<7;j++)queueEnemy(sim,'enemy_golem_head',e.path,road.nearest(p).progress+j*10*S,1+j*.2,j%3);sim.emit('warning',p,{kind:'boss',amount:1});});
  if(a.bullet==='missile_juggernaut')periodic('attack'+i,a.cooldown,()=>{const friend=friends(sim,e,Infinity)[0],b=NATIVE[a.bullet].bullet;if(friend){sim.warnings.push({at:sim.time+1,point:{...friend},kind:'boss',radius:b.damage_radius*S,damage:sim.random(b.damage_min,b.damage_max)});sim.emit('warning',friend,{kind:'boss',amount:1});}});
  if(a.mod==='mod_jt_tower')periodic('attack'+i,a.cooldown,()=>{for(const tower of sim.towers.filter(f=>distance(sim.level.slots[f.slot],e)<a.max_range*S).slice(0,a.count)){tower.disabledUntil=Infinity;tower.iceClicks=NATIVE.mod_jt_tower.required_clicks;sim.emit('seal',sim.level.slots[tower.slot],{text:'冰封：点击三次解除'});}e.immobileUntil=sim.time+a.exhausted_duration;});
  if(a.mod_towers==='mod_blackburn_tower')periodic('attack'+i,a.cooldown,()=>{for(const tower of sim.towers.filter(f=>distance(sim.level.slots[f.slot],e)<a.max_range*S)){tower.disabledUntil=sim.time+NATIVE[a.mod_towers].modifier.duration;sim.emit('seal',sim.level.slots[tower.slot],{text:'震击：4秒后恢复'});}for(const friend of friends(sim,e,a.damage_radius*S)){sim.hitAlly(friend,sim.random(a.damage_min,a.damage_max));applyAllyMod(sim,friend,a.mod);}sim.emit('impact',e,{kind:'boss',radius:a.damage_radius*S});});
  if(a.mod==='mod_myconid_poison')periodic('attack'+i,a.cooldown,()=>{for(const f of friends(sim,e,a.radius*S))applyAllyMod(sim,f,a.mod);const j=(e.nativeCds!.sporesIndex??0)%a.summon_counts.length;e.nativeCds!.sporesIndex=j+1;for(let k=0;k<a.summon_counts[j];k++)queueEnemy(sim,'enemy_rotten_lesser',e.path,e.distance+sim.random(-2,9)*5*S,.8+k*.15,k%3);sim.emit('warning',e,{kind:'spores',radius:a.radius*S});});
  if(a.sound==='EnemyInfernoHorns')periodic('attack'+i,a.cooldown,()=>{for(const f of friends(sim,e,a.damage_radius*S))sim.hitAlly(f,99999);sim.emit('impact',e,{kind:'boss',radius:a.damage_radius*S});},friends(sim,e,a.damage_radius*S).length>=a.min_targets);
 }
 if(t.template_name==='enemy_demon_mage'){const a=t.timed_attacks.list[0];periodic('shield',a.cooldown,()=>{for(const f of sim.enemies.filter(f=>f.hp>0&&!f.shieldHits&&a.allowed_templates.includes(ENEMIES[f.kind].native)&&distance(f,e)<a.max_range*S).slice(0,a.max_count)){f.shieldHits=NATIVE.mod_demon_shield.shield_ignore_hits;sim.emit('skill',f,{kind:'shield'});}});}
 if(t.template_name==='enemy_spectral_knight'){const aura=NATIVE.aura_spectral_knight.aura;periodic('spectral',aura.cycle_time,()=>{for(const f of sim.enemies.filter(f=>f.hp>0&&!f.spectralBuffed&&aura.allowed_templates.includes(ENEMIES[f.kind].native)&&distance(f,e)<aura.radius*S)){f.damageBuffUntil=sim.time+NATIVE.mod_spectral_knight.modifier.duration;f.spectralBuffed=true;}});}
}
export function nativeWaveEvents(sim:Simulation){
 const extra=sim.level.waves[sim.wave-1]?.extraTimelines?.[String(sim.rngSeed)]??sim.level.waves[sim.wave-1]?.extraTimelines?.['9451'];
 for(const e of extra??[])sim.spawns.push({at:sim.time+e.tick/30,kind:e.type,path:e.path,subPath:e.subPath,node:e.node,from:e.from,forcedWaypoint:e.forcedWaypoint});
 const rotten=(sim.level.scriptEvents??[]).some(e=>e.template==='s15_rotten_spawner');if(rotten){const timers=NATIVE.s15_rotten_spawner.spawn_timers,keys=Object.keys(timers).map(Number).sort((a,b)=>a-b),key=keys.filter(k=>k<=sim.wave).at(-1);const config=key?timers[String(key)+'.0']:undefined;if(config){sim.nativeState.rottenInterval=config[0];sim.nativeState.rottenCount=config[1];}}
 if(sim.level.id==='stage-01'){sim.level.lockedPowers=[sim.wave<3,sim.wave<4];}
}
export function updateNativeFacilities(sim:Simulation,dt:number){
 for(const a of sim.allies){if(a.dot&&a.hp>0&&a.dot.until>sim.time&&a.dot.next<=sim.time){a.dot.next=sim.time+a.dot.interval;sim.hitAlly(a,a.dot.nonlethal?Math.min(a.dot.power,Math.max(0,a.hp-1)):a.dot.power,'true');}}
 if(!sim.waveActive||sim.wave===0){for(const k of ['lava','rotten','vezSeal','vezPortal','fire','burnTick'])if(Number.isFinite(sim.nativeState[k]))sim.nativeState[k]+=dt;return;}
 const timer=(key:string,interval:number,action:()=>void)=>{sim.nativeState[key]??=sim.time+interval;if(sim.time+1e-8>=sim.nativeState[key]){sim.nativeState[key]=sim.time+interval;action();}};
 for(const ev of sim.level.scriptEvents??[]){
  if(ev.template==='s11_lava_spawner')timer('lava',sim.nativeState.lava?NATIVE.s11_lava_spawner.cooldown_after:NATIVE.s11_lava_spawner.cooldown,()=>queueEnemy(sim,NATIVE.s11_lava_spawner.entity,NATIVE.s11_lava_spawner.pi-1,0));
  if(ev.template==='s15_rotten_spawner'&&sim.nativeState.rottenCount)timer('rotten',sim.nativeState.rottenInterval,()=>{for(let j=0;j<sim.nativeState.rottenCount;j++){const path=Math.floor(sim.rng.next()*Math.min(3,sim.roads.length)),road=sim.roads[path];queueEnemy(sim,NATIVE.s15_rotten_spawner.entity,path,sim.random(.15,.6)*road.total,0,j%3,0);}});
 }
 if(sim.level.id==='stage-12'&&!sim.finalBossStarted){const vez=NATIVE.eb_veznan;
  const seals=vez.timed_attacks.list[0].data[String(sim.wave)+'.0'];if(seals)timer('vezSeal',seals[0],()=>{for(const t of [...sim.towers].sort(()=>sim.rng.next()-.5).slice(0,seals[1])){t.sealAt=sim.time+NATIVE.mod_veznan_tower.click_time;t.sealClicks=NATIVE.mod_veznan_tower.required_clicks;sim.emit('seal',sim.level.slots[t.slot],{text:'迅速点击解除封印'});}});
  const portals=vez.timed_attacks.list[1].data[String(sim.wave)+'.0'];if(portals)timer('vezPortal',portals[0],()=>{for(const ev of sim.level.scriptEvents??[])if(ev.template==='veznan_portal'&&portals[2][Number(ev.data?.portal_idx)-1]){const template=NATIVE.veznan_portal,groups=template.spawn_groups[Number(ev.data?.portal_idx)-1],choice=sim.rng.next(),group=groups.find((g:any)=>choice<=g[0])?.[1]??groups.at(-1)[1],node=(ev.data?.out_nodes as number[])[0]-1;for(const [min,max,type]of group){for(let j=0;j<Math.floor(sim.random(min,max+1));j++)queueEnemy(sim,type,0,sim.roads[0].lengths[node]??0,1+j*template.spawn_interval,j%3);}}});
 }
 const ctrl=sim.level.scriptEvents?.find(e=>e.template==='burning_floor_controller');if(ctrl){const cfg=ctrl.data?.cooldowns as any,rows=cfg?.[0],cooldown=Array.isArray(rows)?rows[sim.wave-1]:rows?.[String(sim.wave)+'.0'];if(cooldown)timer('fire',cooldown[1],()=>{const fire=sim.level.scriptEvents!.filter(e=>e.template==='aura_burning_floor');sim.nativeState.fireUntil=sim.time+cooldown[0];for(const ev of fire)sim.emit('warning',ev.point!,{kind:'burning-floor',radius:75*S,amount:cooldown[0]});});
  if(sim.nativeState.fireUntil>sim.time)timer('burnTick',.3666667,()=>{for(const ev of sim.level.scriptEvents!.filter(e=>e.template==='aura_burning_floor'))for(const f of friends(sim,ev.point!,75*S))sim.hitAlly(f,20);});
 }
}
