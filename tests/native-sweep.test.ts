import {it,expect} from 'vitest';
import {writeFileSync,mkdirSync,readFileSync,existsSync} from 'node:fs';
import {LEVELS} from '../content/levels';
import {HEROES} from '../content/definitions';
import {UPGRADE_TREES,upgradeSpent} from '../content/upgrades';
import {play} from './balance-driver';
import {nativePlay} from './native-strategy';
it.skipIf(!process.env.NATIVE_SEARCH)('records resource-legal campaign attempts to locate combat mismatches',()=>{
 mkdirSync('test-results/native',{recursive:true});const report:any[]=process.env.RESUME&&existsSync('test-results/native/sweep.json')?JSON.parse(readFileSync('test-results/native/sweep.json','utf8')):[];const limit=Number(process.env.STAGE_LIMIT??26);let earned=report.reduce((sum,r)=>{const win=r.attempts.find((a:any)=>a.result==='won');return sum+(win?(win.lives>=18?3:win.lives>=6?2:1):0);},0);
 const indices=process.env.STAGES?process.env.STAGES.split(',').map(n=>Number(n)-1):Array.from({length:limit-(Number(process.env.STAGE_START??1)-1)},(_,i)=>i+Number(process.env.STAGE_START??1)-1);
 for(const index of indices){
  if(report.find(r=>r.stage===index+1)?.attempts.some((a:any)=>a.result==='won'))continue;
  const n=index+1,available=earned,upgrades:Record<string,number>={};let left=available;
  for(const key of index<12?['reinforce','archer','meteor','mage','engineer','barracks']:['engineer','archer','meteor','mage','reinforce','barracks'])for(const node of UPGRADE_TREES[key]){if(left<node.cost)break;left-=node.cost;upgrades[key]=(upgrades[key]??0)+1;}
  expect(upgradeSpent(upgrades)).toBeLessThanOrEqual(available);
  const hero=n>=13?'tenshi':n>=12?'oni':n>=11?'ignus':n>=9?'star':n>=8?'malik':n>=6?'ranger':'shield';expect(n<4||HEROES[hero].unlockLevel!<=n).toBe(true);
  const attempts=[];outer:for(const h of process.env.HEROES?.split(',')??[hero])for(let variant=Number(process.env.VARIANT_START??0);variant<Number(process.env.VARIANTS??10);variant++){const legacy=index<12||process.env.DRIVER==='legacy';const r=legacy?play(index,h as any,upgrades,variant):nativePlay(index,h as any,upgrades,variant);attempts.push({...r,driver:legacy?'legacy':'native'});if(r.result==='won')break outer;}
  const best=attempts.at(-1)!;if(best.result==='won')earned+=best.lives>=18?3:best.lives>=6?2:1;const prior=report.findIndex(r=>r.stage===n);if(prior>=0)report.splice(prior,1);report.push({stage:n,available,upgrades,attempts,earned});writeFileSync('test-results/native/sweep.json',JSON.stringify(report,null,2));console.log(n,best.result,best.lives,best.time,'variant',best.variant,'hero',best.hero,'gold',best.gold);
 }
},1200000);
