import {it,expect} from 'vitest';
import {Simulation} from '../src/simulation';
import {LEVELS} from '../content/levels';
import {TOWERS} from '../content/definitions';
it('basic and branch towers have useful finite damage, range and cooldowns',()=>{
 for(const tower of Object.values(TOWERS))for(const [min,max,range,cooldown] of [...tower.damage.map((max,i)=>[tower.minDamage[i],max,tower.range[i],tower.interval[i]]),...tower.branches.map(b=>[b.minDamage,b.damage,b.range,b.interval])]){
  expect([min,max,range,cooldown].every(Number.isFinite)).toBe(true);expect(max).toBeGreaterThan(0);expect(min).toBeLessThanOrEqual(max);expect(range).toBeGreaterThan(0);expect(cooldown).toBeGreaterThan(0);
 }
 const s=new Simulation(LEVELS[0]);s.command({type:'build',slot:3,kind:'archer'});const e=s.spawn('mushroom',0,s.roads[0].nearest(s.level.slots[3]).progress);for(let i=0;i<60;i++)s.step();expect(e.hp).toBeLessThan(e.maxHp);
});
