import {LEVELS} from '../content/levels';
import {editRoads} from '../src/editor-compatibility';
export function legacyFixture(){const l=structuredClone(LEVELS[0]);editRoads(l);l.id='unit';l.heroes=true;l.lockedPowers=[false,false];l.prebuilt=[];l.facilities=[];l.defaultRallies=undefined;l.waves=[{rest:35,groups:[{type:'mushroom',count:2,path:0,interval:10,delay:0}]},{rest:20,groups:[{type:'orc',count:1,path:0,interval:1,delay:0}]}];return l;}
