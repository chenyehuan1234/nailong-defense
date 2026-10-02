import { LEVELS } from '../content/levels';
import { validateLevel } from './validation';
import type { CampaignDefinition } from './types';
import {customizeLevel} from './editor-compatibility';
export function validateCampaign(raw:unknown):CampaignDefinition {
 const c=raw as CampaignDefinition;if(!c||c.version!==2||typeof c.name!=='string'||c.name.length>100||typeof c.id!=='string'||!Array.isArray(c.levels)||c.levels.length<1||c.levels.length>100)throw Error('战役须包含 1–100 关');
 const levels=c.levels.map(validateLevel);if(new Set(levels.map(l=>l.id)).size!==levels.length)throw Error('每关 ID 必须唯一');return {...c,ordered:!!c.ordered,levels,updatedAt:Date.now()};
}
export function referenceTemplate(index:number,usedIds:string[]=[]){
 const level=customizeLevel(structuredClone(LEVELS[index]??LEVELS[0]));
 if(usedIds.includes(level.id))level.id='custom-'+Date.now()+'-'+index;
 return level;
}
export const newCampaign=(reference=true):CampaignDefinition=>({version:2,id:'custom-'+Date.now(),name:reference?'我的26关奶龙战役':'我的奶龙战役',description:'自己的冒险',ordered:true,levels:reference?LEVELS.map((_,i)=>referenceTemplate(i)):[customizeLevel({...structuredClone(LEVELS[0]),id:'custom-1',name:'第一关'})],updatedAt:Date.now()});
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open('nailong-workshop',1);req.onupgradeneeded=()=>req.result.createObjectStore('drafts');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function loadDraft():Promise<CampaignDefinition|undefined>{const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('drafts').objectStore('drafts').get('active');r.onsuccess=()=>{db.close();try{resolve(r.result?validateCampaign(r.result):undefined);}catch(e){reject(e);}};r.onerror=()=>{db.close();reject(r.error);};});}
export async function saveDraft(c:CampaignDefinition){const db=await database();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(structuredClone(c),'active');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
