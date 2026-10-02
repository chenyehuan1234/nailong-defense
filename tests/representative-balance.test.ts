import {it,expect} from 'vitest';
import {Simulation,STEP} from '../src/simulation';
import {LEVELS} from '../content/levels';
it('fixed-step results agree at 15/30/60/120 render FPS and 1x/3x under both wave clocks',()=>{
 for(const seed of [9451,20261001,314159])for(const timing of ['clear','original'] as const){
  const outputs=[];for(const fps of [15,30,60,120])for(const speed of [1,3]){
   const s=new Simulation(structuredClone(LEVELS[3]),'shield','normal',{},seed);s.waveTiming=timing;s.command({type:'build',slot:0,kind:'archer'});s.command({type:'next-wave'});
   let accumulator=0,ticks=0;while(ticks<1800){accumulator+=Math.min(1/fps,.15)*speed;while(accumulator+1e-12>=STEP&&ticks<1800){if(ticks===300)s.command({type:'cast',skill:'reinforce',point:s.roads[0].at(200)});s.step();ticks++;accumulator-=STEP;}}
   outputs.push({time:s.time,wave:s.wave,gold:s.gold,lives:s.lives,result:s.result,hero:s.hero.xp,enemies:s.enemies.map(e=>({id:e.id,kind:e.kind,hp:e.hp,distance:e.distance})),metrics:s.metrics});
  }
  for(const o of outputs)expect(o).toEqual(outputs[0]);
 }
});
