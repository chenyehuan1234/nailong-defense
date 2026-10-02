import { LESSONS } from '../content/training';
import type { PlayerCommand } from './types';
import type { Simulation } from './simulation';
export class TeachingSession {
 step=0;commands:PlayerCommand[]=[];selectedTower=false;leakDemo=false;retreatHp=-1;retreatAt=-1;
 constructor(public index:number){}
 get current(){return LESSONS[this.index][this.step];}
 observe(c:PlayerCommand,sim?:Simulation){this.commands.push(c);if(c.type==='move-hero'&&this.current.id==='retreat'&&sim){this.retreatHp=sim.hero.hp;this.retreatAt=sim.time;}}
 complete(sim:Simulation,speed:number){const id=this.current.id;
  const has=(type:string)=>this.commands.some(c=>c.type===type);
  if(id==='archer')return sim.towers.some(t=>t.kind==='archer');
  if(id==='range')return this.selectedTower;
  if(id==='wave')return sim.wave>0;
  if(id==='kill')return sim.kills>0;
  if(id==='upgrade')return sim.towers.some(t=>t.level>=2);
  if(id==='barracks')return sim.towers.some(t=>t.kind==='barracks')&&sim.towers.some(t=>t.kind==='archer');
  if(id==='rally')return has('rally');
  if(id==='hero')return has('move-hero');
  if(id==='block')return sim.metrics.blockedSeconds>0;
  if(id==='retreat')return this.retreatAt>=0&&!sim.hero.commanded&&sim.time-sim.hero.lastHit>=4&&sim.time-this.retreatAt>=4&&sim.hero.hp>=Math.min(sim.hero.maxHp,this.retreatHp+sim.hero.maxHp*.03);
  if(id==='leak'){if(!this.leakDemo){this.leakDemo=true;sim.spawn('mushroom',0,sim.roads[0].total-12);}return sim.metrics.leaks>0;}
  if(id==='magic-hit')return sim.towers.some(t=>t.kind==='mage'&&(sim.metrics.towers[t.slot]?.damage??0)>0);
  if(id==='aoe')return sim.metrics.aoeHits>0;
  if(id==='reinforce')return this.commands.some(c=>c.type==='cast'&&c.skill==='reinforce');
  if(id==='mage'||id==='engineer')return sim.towers.some(t=>t.kind===id);
  if(id==='auto')return sim.autoWave;
  if(id==='speed')return speed>1;
  return sim.result==='won';
 }
 advance(sim:Simulation,speed:number){if(this.current.id!=='finish'&&this.complete(sim,speed)){this.step++;return true;}return false;}
 canStart(){return this.current.id==='wave'||this.current.id==='finish'||this.step>LESSONS[this.index].findIndex(s=>s.id==='wave')||this.commands.some(c=>c.type==='next-wave');}
}
