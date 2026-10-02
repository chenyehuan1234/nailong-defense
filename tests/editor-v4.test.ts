import {it,expect} from 'vitest';
import {LEVELS} from '../content/levels';
import {validateLevel} from '../src/validation';
import {editRoads,editWaveGroups,customizeLevel} from '../src/editor-compatibility';
import {Simulation} from '../src/simulation';
it('all 26 editor JSON round trips retain subpaths, grid, script, ordered births and every reference seed',()=>{
 for(const level of LEVELS)expect(validateLevel(JSON.parse(JSON.stringify(level)))).toEqual(level);
});
it('changing groups affects only that wave and replaces its native scheduling',()=>{
 const level=structuredClone(LEVELS[25]),untouched=structuredClone(level.waves[1]);editWaveGroups(level.waves[0]);level.waves[0].groups=[{type:'mushroom',count:1,path:0,interval:1,delay:0}];
 expect(level.waves[1]).toEqual(untouched);expect(level.waves[0].extraTimelines).toBeUndefined();expect(level.waves[0].timeline).toBeUndefined();expect(()=>validateLevel(level)).not.toThrow();
});
it('a geometry edit uses edited roads rather than retained original lanes',()=>{
 const level=structuredClone(LEVELS[3]);editRoads(level);level.paths=[[[400,300],[800,500]].map(([x,y])=>({x,y}))];level.waves=[{groups:[{type:'mushroom',count:1,path:0,delay:0,interval:1}],rest:3}];
 const sim=new Simulation(customizeLevel(level));expect(sim.enemyRoad(sim.spawn('mushroom',0,100)).at(100)).toEqual(sim.roads[0].at(100));expect(level.walkingGrid).toBeUndefined();expect(()=>validateLevel(level)).not.toThrow();
});
it('malformed extra timeline is rejected instead of crashing editor play',()=>{
 const level=structuredClone(LEVELS[25]);level.waves[0].extraTimelines={bad:[{tick:1,type:'mushroom',path:99,subPath:0}]};expect(()=>validateLevel(level)).toThrow();
});
