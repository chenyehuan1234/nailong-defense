from pathlib import Path
p=Path('content/levels.ts');p.write_text('''import {createReferenceLevels} from './reference-levels';
import type {CampaignDefinition,LevelDefinition,GameMode} from '../src/types';
export const LEVELS=createReferenceLevels();
export function levelForMode(level:LevelDefinition,mode:GameMode):LevelDefinition{
 const copy=structuredClone(level);const rule=level.modes?.[mode];
 if(mode!=='campaign'&&!rule)throw Error('此关的英雄／铁人挑战尚未开放');
 copy.mode=mode;if(rule)Object.assign(copy,{unlockAtWave:{},waves:structuredClone(rule.waves),gold:rule.gold,lives:rule.lives,maxTowerLevel:rule.maxTowerLevel,maxUpgrade:rule.maxUpgrade,heroes:rule.heroes,allowedTowers:rule.allowedTowers});return copy;
}
export const MAIN_CAMPAIGN:CampaignDefinition={version:2,id:'main',name:'奶龙的守护之旅',description:'26关远征与支线章节，13位奶龙守护者。',ordered:true,levels:LEVELS,updatedAt:0};
''',encoding='utf8')
p=Path('content/definitions.ts');s=p.read_text(encoding='utf8');a=s.index('const LEGACY_HEROES=');b=s.index('const e=',a);s=s[:a]+s[b:];p.write_text(s,encoding='utf8')
p=Path('content/reference-gameplay.ts');s=p.read_text(encoding='utf8')
s=s.replace("if(a.mod&&NATIVE[a.mod]?.heal){behavior.heal=NATIVE[a.mod].heal.health??NATIVE[a.mod].heal.health_max??20;", "if(a.mod&&NATIVE[a.mod]?.hps){behavior.heal=NATIVE[a.mod].hps.heal_max??20;")
s=s.replace("const flying=", "for(const aura of t.auras?.list??[]){const regen=NATIVE[aura.name]?.regen;if(regen)behavior.regeneration=regen.health/regen.cooldown;}if(t.timed_actions?.list?.some((a:any)=>a.entity_names))behavior.summon='skeleton';for(const a of specials){const spawn=NATIVE[a.bullet]?.spawner;if(spawn){behavior.summon=enemyKey(spawn.entity);behavior.summonCount=spawn.count;behavior.summonInterval=a.min_cooldown??a.cooldown;}if(a.mod==='mod_demon_shield')behavior.shield=true;}\n  const flying=")
s=s.replace("id==='tenshi'?'true'", "['tenshi','ignus'].includes(id)?'true'")
p.write_text(s,encoding='utf8')
p=Path('src/reference-combat.ts');s=p.read_text(encoding='utf8')
s=s.replace("!ctrl||(ctrl.vis_bans&32)||event.template", "!ctrl||((t.vis?.flags??0)&ctrl.vis_bans)||event.template")
s=s.replace("const targets=sim.enemies", "const targets=sim.enemies")
s=s.replace("targets.filter(f=>!a.allowed_templates", "targets.filter(f=>(a.mod!=='mod_kingpin_heal_self'||f===e)&&(!a.allowed_templates")
s=s.replace("includes(ENEMIES[f.kind].native)).slice", "includes(ENEMIES[f.kind].native))).slice")
s=s.replace("for(const k of Object.keys(e.nativeCds))e.nativeCds[k]-=dt;", "for(const k of Object.keys(e.nativeCds))if(!k.endsWith('Index'))e.nativeCds[k]-=dt;")
s=s.replace("  if(a.entity==='enemy_spider_small')", "  const egg=NATIVE[a.bullet]?.spawner;if(egg)periodic('egg'+i,a.min_cooldown??a.cooldown,()=>{for(let j=0;j<egg.count;j++)queueEnemy(sim,egg.entity,e.path,e.distance+egg.node_offset*5*S,1+j*egg.cycle_time,j%3);e.nativeCds!['egg'+i]=sim.random(a.min_cooldown,a.max_cooldown);},!sim.blocked.has(e.id));\n  if(a.entity==='enemy_spider_small')")
s=s.replace("t.sealAt=sim.time+NATIVE.mod_veznan_tower.click_time;", "t.sealAt=sim.time+NATIVE.mod_veznan_tower.click_time;t.sealClicks=NATIVE.mod_veznan_tower.required_clicks;")
p.write_text(s,encoding='utf8')
p=Path('src/simulation.ts');s=p.read_text(encoding='utf8')
s=s.replace("Math.floor(this.nextWaveAt-this.time)","Math.ceil(this.nextWaveAt-this.time)")
s=s.replace("this.spawns[0].at<=this.time", "this.spawns[0].at<=this.time+1e-8")
s=s.replace("this.level.slots[t!.slot],goal", "this.level.slots[t!.slot],goal")
s=s.replace("damage=this.random(lo??", "damage=this.random(lo??")
s=s.replace("if(counter)this.damage(e,def.damage*.4+4*a.level,'true',a.id);", "if(counter)this.damage(e,def.damage*.4+4*a.level,'true',a.id);")
old="this.hitAlly(a,this.random(def.minDamage??def.damage,def.damage));"
new="const incoming=this.random(def.minDamage??def.damage,def.damage),dodge=a.kind==='shield'?heroSnapshot(a).dodge:undefined,deflected=dodge&&this.rng.next()<dodge.chance*(def.behavior.boss?dodge.low_chance_factor:1);if(deflected){const rank=heroSnapshot(a).hero.skills.block_counter.level;this.damage(e,incoming*(.5+.5*rank),'true',a.id);a.xp+=heroSnapshot(a).hero.skills.block_counter.xp_gain[rank-1]??0;this.levelHero();this.emit('skill',a,{kind:'counter'});}else this.hitAlly(a,incoming*(e.rageUntil&&e.rageUntil>this.time?2:1));"
s=s.replace(old,new)
s=s.replace("remaining:5,power:10", "remaining:4.9,power:8")
s=s.replace("radius:up>=3?150:120", "radius:(up>=3?75:60)*REFERENCE_SCALE")
s=s.replace("this.random(-55,55)", "this.random(-20,20)*REFERENCE_SCALE").replace("this.random(-40,40)","this.random(-20,20)*REFERENCE_SCALE")
s=s.replace("this.area(zone.point,100,15,'true'", "this.area(zone.point,65*REFERENCE_SCALE,this.random(10,20),'physical'")
s=s.replace("a.maxHp=a.hp=[30,50,70,90,110,110][up];a.armor=[0,0,.1,.2,.3,.3][up];", "a.maxHp=a.hp=this.soldierTemplate()?.health.hp_max??30;a.armor=this.soldierTemplate()?.health.armor??0;")
s=s.replace("max=ls?.maxDamage", "max=ls?.maxDamage")
s=s.replace("max=a.summon?.damage??(t?this.stats(t).damage:nativeAttack?.damage_max??3);", "max=a.summon?.damage??(t?this.stats(t).damage: NATIVE[nativeAttack?.bullet]?.bullet?.damage_max??nativeAttack?.damage_max??3);lo=a.summon?.minDamage??(t?this.stats(t).minDamage:NATIVE[nativeAttack?.bullet]?.bullet?.damage_min??nativeAttack?.damage_min??1);")
s=s.replace("damage=this.random(lo??h?.minDamage??1,max??h?.damage??3)", "damage=this.random(lo??h?.minDamage??1,max??h?.damage??3)")
s=s.replace("this.random(45,65)", "45")
s=s.replace("t.skillCd=22-a*2", "t.skillCd=22-a*2")
s=s.replace("e.maxHp*.1+stats.damage", "e.maxHp*a*.2")
s=s.replace("radius:85,air:true,shot:'missile'", "radius:41.25*REFERENCE_SCALE,air:true,shot:'missile'")
s=s.replace("t.secondaryCd=9;for(let i=0;i<6;i++)this.fire(p,e,this.random(10,40)*b,'explosive',{radius:85,air:false", "t.secondaryCd=9;for(let i=0;i<6;i++)this.fire(p,e,this.random(10,40)*b,'explosive',{radius:40*REFERENCE_SCALE,air:false")
s=s.replace("f.distance-190-b*65", "f.distance-this.random(17+5*b,26+5*b)*5*REFERENCE_SCALE")
s=s.replace("Object.assign(f,this.roads[f.path].at(f.distance))", "Object.assign(f,this.enemyRoad(f).at(f.distance))")
p.write_text(s,encoding='utf8')
p=Path('src/hero-mechanics.ts');s=p.read_text(encoding='utf8')
s=s.replace('friend.buffUntil=sim.time+6;', 'friend.buffUntil=sim.time+6;friend.courageRank=r;')
s=s.replace("'physical',{source:a.id,shot:'sawblade'}", "'true',{source:a.id,shot:'sawblade'}")
s=s.replace('sim.random(45,65)', '45')
s=s.replace("a.commanded||a.moving)return", "a.commanded||a.moving)return")
s=s.replace("radius:value(d,'max_range',r)","radius:value(d,'max_range',r)*S")
p.write_text(s,encoding='utf8')
p=Path('src/ui.ts');s=p.read_text(encoding='utf8')
s=s.replace("this.selectedLevel=Math.min(LEVELS.length-1,this.selectedLevel+1);", "const current=LEVELS[this.selectedLevel].id,child=LEVELS.findIndex(l=>l.requires?.includes(current)&&!this.save.scores[scoreKey('main',l.id)]);this.selectedLevel=child>=0?child:Math.max(0,LEVELS.findIndex((_,i)=>this.unlocked(i)&&!this.save.scores[scoreKey('main',LEVELS[i].id)]));this.selectedChapter=LEVELS[this.selectedLevel].chapterId??'';")
s=s.replace("c.levels.length%12", "c.levels.length%26")
s=s.replace("bounty:mini?0:def.gold", "bounty:mini?0:def.gold")
p.write_text(s,encoding='utf8')
p=Path('src/scene.ts');s=p.read_text(encoding='utf8');s=s.replace("const exit=sim.roads[0].at(sim.roads[0].total)","const exit=sim.level.exitPoints?.[0]??sim.roads[0].at(sim.roads[0].total)");p.write_text(s,encoding='utf8')
