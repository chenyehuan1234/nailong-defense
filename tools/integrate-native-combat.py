from pathlib import Path
p=Path('src/simulation.ts');s=p.read_text(encoding='utf8')
s="import {heroSnapshot,heroXpFactor,updateHeroMechanics} from './hero-mechanics';\n"+s
s=s.replace("  zones:{", "  heroMines:{point:Point;at:number;damage:number}[]=[];heroFields:{point:Point;radius:number;until:number;next:number;slow:number}[]=[];\n  zones:{")
s=s.replace('this.hero.xp+=actual*2.5','this.hero.xp+=actual*heroXpFactor(this.hero)')
a=s.index('  levelHero()');b=s.index('  kill(',a)
s=s[:a]+'''  levelHero(){const thresholds=[0,300,900,2000,4000,8000,12000,16000,20000,26000];while(this.hero.level<10&&this.hero.xp>=thresholds[this.hero.level]){this.hero.level++;const stats=HEROES[this.heroKind].levelStats![this.hero.level-1];this.hero.maxHp=stats.hp;this.hero.armor=stats.armor;this.hero.hp=this.hero.maxHp;this.emit('upgrade',this.hero,{text:'英雄 Lv.'+this.hero.level});}}
'''+s[b:]
s=s.replace("if(a.hp<=0)return;const guard=", "if(a.hp<=0||(a.immuneUntil??0)>this.time)return;const guard=")
s=s.replace("if(this.cooldowns[c.skill]>0)","if(this.level.lockedPowers?.[c.skill==='meteor'?0:1])return fail('本关尚未开放此技能');if(this.cooldowns[c.skill]>0)")
s=s.replace("if(c.type==='move-hero'){if", "if(c.type==='move-hero'){if(this.level.heroes===false)return fail('本关尚未开放英雄');if")
# Native hero teleport occurs on a long command, without crossing terrain.
s=s.replace("this.hero.commanded=true;return true;", "this.hero.commanded=true;if(HEROES[this.heroKind].teleport&&!c.append&&distance(this.hero,goal)>130*REFERENCE_SCALE){Object.assign(this.hero,goal);this.hero.waypoints=[];this.hero.commanded=false;this.emit('teleport',goal,{actor:this.hero.id});}return true;")
a=s.index('  soldierStats(');b=s.index('  createSoldier(',a)
s=s[:a]+'''  soldierTemplate(t?:TowerState){return t?NATIVE[t.branch===0?'soldier_paladin':t.branch===1?'soldier_barbarian':['soldier_militia','soldier_footmen','soldier_knight'][t.level-1]]:NATIVE['soldier_reinforcement_'+Math.min(4,this.upgrades.reinforce??0)];}
  soldierStats(a:AllyState,t?:TowerState){if(a.kind==='elemental')return;const base=this.soldierTemplate(t);a.maxHp=(base?.health.hp_max??30)*(t?(this.up('barracks',4)?1.2:this.up('barracks',1)?1.1:1):1)*(this.difficulty==='casual'?1.2:1);a.armor=(base?.health.armor??0)+(t&&this.up('barracks',2)?.1:0)+(t?.branch===0&&t.skills[1]?.15:0);}
'''+s[b:]
a=s.index('  updateAllies(');b=s.index('  updateEnemies(',a)
s=s[:a]+'''  updateAllies(dt:number){
    this.metrics.blockedSeconds+=this.blocked.size*dt;for(const a of this.blocked.values())if(a.tower!==undefined){this.recordInvestment(a.tower,0);this.metrics.towers[String(a.tower)].blockedSeconds+=dt;}this.blocked.clear();const taken=new Set<number>();
    for(const a of this.allies){
      a.attackCd-=dt;a.specialCd-=dt;a.secondaryCd-=dt;
      const t=a.tower!==undefined?this.towerAt(a.tower):undefined,h=a.kind in HEROES?HEROES[a.kind as HeroKind]:undefined;
      const template=h?heroSnapshot(a):a.summon?NATIVE[a.summon.template]:a.kind==='soldier'?this.soldierTemplate(t):NATIVE[a.kind==='elemental'?'soldier_elemental':a.kind==='elf'?'soldier_elf':'soldier_sasquash'];
      if(a.hp<=0){a.revive-=dt;if(a.revive<=0&&!a.expires){if(a.kind==='soldier'&&!t)continue;a.hp=a.maxHp;const p=t?this.level.slots[t.slot]:this.level.heroStart;a.x=p.x;a.y=p.y;a.heroCds={};a.transformedUntil=undefined;a.immuneUntil=undefined;this.route(a,a.anchor);this.emit('spawn',a,{kind:a.kind});}continue;}
      if(a.expires&&this.time>=a.expires){a.hp=0;continue;}
      if(a.kind==='elemental'&&t){const rank=t.skills[1];a.maxHp=500+100*rank;a.armor=.3+.1*rank;}
      if(a.kind==='pet'&&!a.commanded&&distance(a,this.hero)>220*REFERENCE_SCALE)this.route(a,this.hero);
      const range=h?.range??a.summon?.range??(a.kind==='elf'?205*REFERENCE_SCALE:!t&&this.up('reinforce',5)?230*REFERENCE_SCALE:60*REFERENCE_SCALE),block=h?.block??1;
      if(h&&h.range<100*REFERENCE_SCALE&&!a.commanded){const target=this.targets(a.anchor,130*REFERENCE_SCALE,false).find(e=>!e.sheep);const predicted=target?this.enemyRoad(target).at(target.distance+Math.min(25*REFERENCE_SCALE,ENEMIES[target.kind].speed*distance(a,target)/h.speed)):a.anchor;const goal=distance(predicted,a.anchor)<=150*REFERENCE_SCALE?predicted:a.anchor;if(distance(a.destination,goal)>20){a.destination={x:goal.x,y:goal.y};a.waypoints=this.navigation.path(a,goal)??[];}}
      while(a.waypoints.length&&distance(a,a.waypoints[0])<=3){const reached=a.waypoints.shift()!;a.x=reached.x;a.y=reached.y;if(!a.waypoints.length)a.commanded=false;}
      const goal=a.waypoints[0]??a.destination;let moving=distance(a,goal)>3;
      const targets=this.targets(a,moving?40*REFERENCE_SCALE:range,h?.air??(a.kind==='illusion'||a.kind==='elf'||!t&&this.up('reinforce',5)));
      const ground=targets.filter(e=>(!moving||a.kind==='soldier'&&!a.commanded||!!h&&h.range<100*REFERENCE_SCALE&&!a.commanded)&&!e.sheep&&!this.isFlying(e)&&distance(a,e)<60*REFERENCE_SCALE&&!taken.has(e.id));
      for(const e of ground.slice(0,block)){this.blocked.set(e.id,a);taken.add(e.id);}
      const blockedEnemy=ground.find(e=>this.blocked.get(e.id)===a);a.targetId=(blockedEnemy??targets[0])?.id;if(blockedEnemy)moving=false;a.moving=moving;
      if(moving){const dd=distance(a,goal),speed=h?.speed??a.summon?.speed??(template?.motion?.max_speed??75)*REFERENCE_SCALE,step=Math.min(dd,speed*dt),dx=(goal.x-a.x)/dd,dy=(goal.y-a.y)/dd;a.x+=dx*step;a.y+=dy*step;a.walkDistance+=step;if(step>=dd-.001){a.waypoints.shift();if(!a.waypoints.length)a.commanded=false;}a.facing=Math.abs(dy)>.8?(dy<0?2:0):(dx>=0?1:-1);}
      const nativeAttack=blockedEnemy?template?.melee?.attacks?.[0]:template?.ranged?.attacks?.[0]??template?.timed_attacks?.list?.find((x:any)=>x.bullet)??template?.melee?.attacks?.[0];
      if(!moving){const e=blockedEnemy??targets[0];if(e&&a.attackCd<=0){
        const ls=h?.levelStats?.[a.level-1];let lo=blockedEnemy?template?.melee?.attacks?.[0]?.damage_min:ls?.minDamage,max=blockedEnemy?template?.melee?.attacks?.[0]?.damage_max:ls?.maxDamage;
        if(!h){lo=a.summon?.minDamage??(t?this.stats(t).minDamage:nativeAttack?.damage_min??1);max=a.summon?.damage??(t?this.stats(t).damage:nativeAttack?.damage_max??3);}
        if(a.transformedUntil&&a.kind==='ingvar'){const b=template.hero.skills.bear,r=b.level;lo=b.damage_min[r-1];max=b.damage_max[r-1];}
        const damage=this.random(lo??h?.minDamage??1,max??h?.damage??3)*(a.buffUntil>this.time?1.25:1);
        a.attackCd=a.transformedUntil&&a.kind==='ingvar'?1: a.summon?.interval??(t?this.stats(t).interval:nativeAttack?.cooldown??h?.interval??1);a.facing=e.x>=a.x?1:-1;a.anim='attack';a.animUntil=this.time+.4;
        const damageKind=a.summon?.damageKind??h?.damageKind??'physical';
        if(range>90*REFERENCE_SCALE&&!blockedEnemy)this.fire(a,e,damage,damageKind,{source:a.id,shot:a.kind==='ranger'?'arrow':a.kind==='bolin'?'shotgun':damageKind==='magic'?'magic':'hero'});
        else this.hits.push({effect:'melee',at:this.time+(nativeAttack?.hit_time??.2),target:e.id,point:{...e},damage,kind:damageKind,source:a.id,radius:a.kind==='sasquatch'?80*REFERENCE_SCALE:a.kind==='elemental'?65*REFERENCE_SCALE:a.kind==='tenshi'&&a.transformedUntil?50*REFERENCE_SCALE:undefined,air:false});
        if(a.kind==='bolin'&&!blockedEnemy)for(let j=1;j<3;j++)this.hits.push({at:this.time+j*.4,target:e.id,point:{...e},damage,kind:'physical',source:a.id});
        if(t?.kind==='barracks'&&t.branch===0&&t.skills[2]&&this.rng.next()<.1)this.area(a,50*REFERENCE_SCALE,this.random(25,45)*t.skills[2],'true',undefined,a.id,false);
        if(t?.kind==='barracks'&&t.branch===1&&t.skills[2]&&this.rng.next()<.1+.05*t.skills[2])this.area(a,45*REFERENCE_SCALE,this.random(25,45)*t.skills[2],'physical',undefined,a.id,false);
      }}
      const regen=template?.regen;if(!moving&&!targets.length&&this.time-a.lastHit>(regen?.last_hit_standoff_time??2))a.hp=Math.min(a.maxHp,a.hp+(regen?.health??a.maxHp*.1)/(regen?.cooldown??1)*dt);
      if(t?.kind==='barracks'&&t.branch===1&&t.skills[0]&&a.specialCd<=0){const e=this.targets(a,155*REFERENCE_SCALE,true)[0];if(e){this.fire(a,e,this.random(34,42)+10*(t.skills[0]-1),'physical',{source:a.id,shot:'axe'});a.specialCd=3.5;}}
      if(a.animUntil<=this.time)a.anim=moving?'walk':'idle';
    }
    updateHeroMechanics(this,dt);
  }
'''+s[b:]
s=s.replace("  targets(p:Point", "  isFlying(e:EnemyState){return !!ENEMIES[e.kind].flying||(e.flyingUntil??0)>this.time;}\n  targets(p:Point")
s=s.replace("air||!ENEMIES[e.kind].flying", "air||!this.isFlying(e)")
s=s.replace("distance(p,e)/850", "distance(p,e)/(850*REFERENCE_SCALE)")
s=s.replace("this.level.referenceBuild!==24662480&&this.level.id==='stage-12'", "this.level.id==='stage-12'")
s=s.replace("this.wave===this.level.waves.length&&!this.enemies.length&&!this.spawns.length", "this.wave===this.level.waves.length&&this.time+1e-8>=this.waveCompleteAt&&!this.enemies.length&&!this.spawns.length")
s=s.replace("if(e.distance>=this.enemyRoad(e).total){", "const connection=(this.level.pathConnections as Record<string,number>|undefined)?.[String(e.path+1)+'.0']??(this.level.pathConnections as Record<string,number>|undefined)?.[String(e.path+1)];if(e.distance>=this.enemyRoad(e).total&&connection){e.path=connection-1;e.distance=0;this.emit('teleport',e);}\n      if(e.distance>=this.enemyRoad(e).total){")
s=s.replace("def.damage);if(counter)", "this.random(def.minDamage??def.damage,def.damage));if(counter)")
p.write_text(s,encoding='utf8')
