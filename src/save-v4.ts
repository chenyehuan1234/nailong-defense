import {ENEMIES,HERO_KEYS} from '../content/definitions';
import {LEVELS} from '../content/levels';
import {UPGRADE_TREES,upgradeSpent} from '../content/upgrades';
import type {SaveData,Score} from './types';
export const SAVE_KEY='nailong-defense.save.v4';
export const V2_SAVE_KEY='nailong-defense.save.v2';
export const LEGACY_SAVE_KEY='nailong-defense.save.v1';
export const RULES_VERSION=24662480;
export const freshSave=():SaveData=>({version:4,rulesVersion:RULES_VERSION,discovered:[],training:{completed:[],dismissed:false},scores:{},hero:'shield',upgrades:{},settings:{sound:true,music:true,lowQuality:false,autoWave:true,speed:1,waveTiming:'clear',masterVolume:.8,musicVolume:.75,sfxVolume:.8,ambientVolume:.45}});
/** The user explicitly chose a fresh campaign. Editor drafts use a separate IndexedDB. */
export function migrateSave(raw:Record<string,unknown>):Record<string,unknown>{
 if(Number(raw.version)<4)return{...freshSave(),settings:raw.settings??freshSave().settings};return raw;
}
function scores(input:unknown):Record<string,Score>{
 const result:Record<string,Score>={};if(!input||typeof input!=='object')return result;
 for(const [key,value] of Object.entries(input)){
  if(!/^[a-zA-Z0-9:_-]{1,180}$/.test(key)||!value||typeof value!=='object')continue;
  if(key.startsWith('main:')&&!LEVELS.some(l=>key===scoreKey('main',l.id)))continue;
  const s=value as Score;if(!Number.isInteger(s.stars)||s.stars<1||s.stars>3)continue;
  result[key]={stars:s.stars,lives:Math.max(1,Math.min(100,Number(s.lives)||1)),hero:HERO_KEYS.includes(s.hero)?s.hero:'shield',difficulty:['casual','normal','veteran','challenge'].includes(s.difficulty)?s.difficulty:'normal'};
 }return result;
}
export function validateSave(input:unknown):SaveData{
 if(!input||typeof input!=='object')throw Error('存档格式不正确');const raw=migrateSave(input as Record<string,unknown>);
 if(raw.version!==4)throw Error('不支持此存档版本，请保留原文件');
 if(raw.rulesVersion!==RULES_VERSION)throw Error('存档的规则版本不兼容');
 const save=freshSave();save.scores=scores(raw.scores);
 if(HERO_KEYS.includes(raw.hero as SaveData['hero']))save.hero=raw.hero as SaveData['hero'];
 if(Array.isArray(raw.discovered))save.discovered=[...new Set(raw.discovered.filter(k=>typeof k==='string'&&!!ENEMIES[k]))];
 if(raw.training&&typeof raw.training==='object'){const t=raw.training as SaveData['training'];save.training={completed:Array.isArray(t.completed)?[...new Set(t.completed.filter(k=>/^training-[123]$/.test(k)))]:[],dismissed:t.dismissed===true,steps:Object.fromEntries(Object.entries(t.steps??{}).filter(([k,v])=>/^training-[123]$/.test(k)&&Number.isInteger(v)&&v>=0&&v<12))};}
 if(raw.settings&&typeof raw.settings==='object'){
  const settings=raw.settings as Record<string,unknown>;
  for(const key of ['sound','music','lowQuality','autoWave'] as const)if(typeof settings[key]==='boolean')save.settings[key]=settings[key];
  for(const key of ['masterVolume','musicVolume','sfxVolume','ambientVolume'] as const)if(typeof settings[key]==='number'&&Number.isFinite(settings[key]))save.settings[key]=Math.max(0,Math.min(1,settings[key]));
  if([1,2,3].includes(Number(settings.speed)))save.settings.speed=Number(settings.speed) as 1|2|3;
  if(settings.waveTiming==='original')save.settings.waveTiming='original';
 }
 let available=earnedStars(save);
 if(raw.upgrades&&typeof raw.upgrades==='object')for(const [key,tree] of Object.entries(UPGRADE_TREES)){
  const count=Math.max(0,Math.min(5,Math.floor(Number((raw.upgrades as Record<string,unknown>)[key])||0)));let bought=0;
  for(const node of tree.slice(0,count)){if(available<node.cost)break;available-=node.cost;bought++;}if(bought)save.upgrades[key]=bought;
 }return save;
}
export function loadSave():SaveData{
 try{
  const current=localStorage.getItem(SAVE_KEY);
  if(current){try{return validateSave(JSON.parse(current));}catch{localStorage.setItem('nailong-defense.backup.invalid.v4',current);return freshSave();}}
  let previous:Record<string,unknown>|undefined;
  for(const key of ['nailong-defense.save.v3',V2_SAVE_KEY,LEGACY_SAVE_KEY]){
   const text=localStorage.getItem(key);if(text&&!previous){try{previous=JSON.parse(text);}catch{}}localStorage.removeItem(key);
  }
  for(const key of ['nailong-defense.backup.v1','nailong-defense.backup.v2'])localStorage.removeItem(key);
  const save=previous?validateSave(previous):freshSave();writeSave(save);return save;
 }catch{return freshSave();}
}
export function writeSave(save:SaveData){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));return true;}catch{return false;}}
export const scoreKey=(campaign:string,level:string,mode='campaign')=>[campaign,level,mode].join(':');
export const earnedStars=(save:SaveData)=>Math.min(78,LEVELS.reduce((sum,l)=>sum+(save.scores[scoreKey('main',l.id)]?.stars??0),0));
export const freeStars=(save:SaveData)=>earnedStars(save)-upgradeSpent(save.upgrades);
