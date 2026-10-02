import type {LevelDefinition,WaveDefinition} from './types';
/** Editing legacy groups explicitly replaces that wave's native trace. Unedited imports remain lossless. */
export function editWaveGroups(wave:WaveDefinition){delete wave.timeline;delete wave.timelines;delete wave.completeTick;delete wave.completeTicks;delete wave.extraTimelines;delete wave.native;delete wave.originalInterval;}
export function editRoads(level:LevelDefinition){
 delete level.subPaths;delete level.pathStarts;delete level.pathEnds;delete level.pathConnections;delete level.walkingGrid;delete level.exitPoints;delete level.logicalSize;delete level.referenceBuild;delete level.scriptEvents;
 for(const w of level.waves)editWaveGroups(w);
}
export function customizeLevel(level:LevelDefinition){
 level.heroes=true;level.lockedPowers=[false,false];level.maxTowerLevel=4;level.unlocks={archer:3,barracks:3,mage:3,engineer:3};level.unlockAtWave={};level.modes=undefined;delete level.requires;delete level.referenceBuild;
 return level;
}
