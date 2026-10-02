import {it,expect} from 'vitest';
import {TRAINING,LESSONS} from '../content/training';
import {Simulation} from '../src/simulation';
import {TeachingSession} from '../src/teaching';
import type {PlayerCommand} from '../src/types';
it('all training battles complete with their actual teaching conditions and starting budgets',()=>{
 for(let index=0;index<3;index++){
  const sim=new Simulation(TRAINING[index],'shield','normal',{}),lesson=new TeachingSession(index);sim.autoWave=false;let speed=1;
  const command=(c:PlayerCommand)=>{if(sim.command(c)){lesson.observe(c,sim);return true;}return false;};
  const seen=new Set<string>();
  for(let tick=0;tick<24000&&sim.result==='playing';tick++){
   const id=lesson.current.id;seen.add(id);
   if(id==='archer')command({type:'build',slot:3,kind:'archer'});
   if(id==='range')lesson.selectedTower=true;
   if(id==='upgrade')command({type:'upgrade',slot:3});
   if(id==='barracks'){command({type:'build',slot:3,kind:'barracks'});command({type:'build',slot:4,kind:'archer'});}
   if(id==='rally')command({type:'rally',slot:3,point:sim.nearestRoad({x:720,y:300}).point});
   if(id==='hero')command({type:'move-hero',point:sim.towerAt(3)!.rally});
   if(id==='retreat'&&lesson.retreatAt<0)command({type:'move-hero',point:TRAINING[index].heroStart});
   if(id==='mage')command({type:'build',slot:5,kind:'mage'});
   if(id==='engineer')command({type:'build',slot:3,kind:'engineer'});
   if(id==='wave')command({type:'next-wave'});
   if(id==='reinforce')command({type:'cast',skill:'reinforce',point:sim.towerAt(3)!.rally});
   if(id==='auto')command({type:'auto-wave',enabled:true});
   if(id==='speed')speed=3;
   lesson.advance(sim,speed);
   if(tick%30===0){if(index===2){command({type:'upgrade',slot:5});command({type:'upgrade',slot:3});}if(index===1)command({type:'upgrade',slot:4});
    if(lesson.canStart()&&sim.wave>0&&!sim.spawns.length&&!sim.enemies.length&&sim.wave<sim.level.waves.length&&!sim.autoWave)command({type:'next-wave'});
   }
   sim.step();
  }
  expect({index,result:sim.result,step:lesson.current.id}).toEqual({index,result:'won',step:'finish'});
  expect([...seen]).toEqual(LESSONS[index].map(s=>s.id));
  if(index===0)expect(sim.metrics.leaks).toBeGreaterThan(0);
  if(index===1)expect(sim.metrics.blockedSeconds).toBeGreaterThan(0);
  if(index===2)expect(sim.metrics.aoeHits).toBeGreaterThan(0);
 }
});
