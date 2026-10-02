import {it,expect} from 'vitest';
import {LEVELS} from '../content/levels';
import {Simulation} from '../src/simulation';
import {unitInformation} from '../src/unit-inspector';
import {newCampaign,referenceTemplate,validateCampaign} from '../src/workshop';

it('inspects live health, debuffed armor and control without changing combat state',()=>{
  const sim=new Simulation(LEVELS[3]),e=sim.spawn('boar',0,100);
  const before={gold:sim.gold,hp:e.hp,discovered:sim.events.length};
  expect(unitInformation(sim,{side:'enemy',id:e.id})?.hp).toBe(e.hp);
  expect({gold:sim.gold,hp:e.hp,discovered:sim.events.length}).toEqual(before);
  e.hp=23;e.armor=.12;e.shieldHits=3;e.statuses=[{type:'stun',remaining:1,power:1}];
  const info=unitInformation(sim,{side:'enemy',id:e.id})!;
  expect(info.hp).toBe(23);expect(info.stats.find(s=>s.label==='护甲')?.value).toBe('12%');expect(info.state).toContain('眩晕');expect(info.state).toContain('3次');
  e.hp=0;expect(unitInformation(sim,{side:'enemy',id:e.id})).toBeUndefined();
});
it('hero growth and purchased guard upgrades appear in the actor inspector',()=>{
  const sim=new Simulation(LEVELS[11],'ingvar');sim.hero.xp=26000;sim.levelHero();
  const hero=unitInformation(sim,{side:'ally',id:sim.hero.id})!;expect(hero.category).toContain('Lv.10');expect(hero.description).toContain('Lv.3');
  sim.gold=2000;sim.command({type:'build',kind:'barracks',slot:0});sim.command({type:'upgrade',slot:0});sim.command({type:'upgrade',slot:0});sim.command({type:'upgrade',slot:0,branch:0});
  const soldier=sim.allies.find(a=>a.tower===0)!;expect(unitInformation(sim,{side:'ally',id:soldier.id})?.name).toBe('皇家盾卫');
  sim.command({type:'sell',slot:0});expect(unitInformation(sim,{side:'ally',id:soldier.id})).toBeUndefined();
});
it('a fresh workshop exposes all 26 templates and adding one preserves a one-stage work',()=>{
  const full=newCampaign();expect(full.levels).toHaveLength(26);expect(()=>validateCampaign(JSON.parse(JSON.stringify(full)))).not.toThrow();
  const old=newCampaign(false),original=structuredClone(old.levels[0]);old.levels.push(referenceTemplate(25,old.levels.map(l=>l.id)));
  expect(old.levels[0]).toEqual(original);expect(old.levels[1].map).toBe(LEVELS[25].map);expect(old.levels[1].waves).toEqual(LEVELS[25].waves);
  old.levels.push(referenceTemplate(25,old.levels.map(l=>l.id)));expect(()=>validateCampaign(old)).not.toThrow();
});
