import {createReferenceLevels} from './reference-levels';
import type {CampaignDefinition,LevelDefinition,GameMode} from '../src/types';
export const LEVELS=createReferenceLevels();
export function levelForMode(level:LevelDefinition,mode:GameMode):LevelDefinition{
 const copy=structuredClone(level);const rule=level.modes?.[mode];
 if(mode!=='campaign'&&!rule)throw Error('此关的英雄／铁人挑战尚未开放');
 copy.mode=mode;if(rule)Object.assign(copy,{unlockAtWave:{},waves:structuredClone(rule.waves),gold:rule.gold,lives:rule.lives,maxTowerLevel:rule.maxTowerLevel,maxUpgrade:rule.maxUpgrade,heroes:rule.heroes,allowedTowers:rule.allowedTowers});return copy;
}
export const MAIN_CAMPAIGN:CampaignDefinition={version:2,id:'main',name:'奶龙的守护之旅',description:'26关远征与支线章节，13位奶龙守护者。',ordered:true,levels:LEVELS,updatedAt:0};
