import {it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {LEVELS} from '../content/levels';
import {HEROES} from '../content/definitions';
import {UPGRADE_TREES,upgradeSpent} from '../content/upgrades';
import policies from './fixtures/campaign-strategies.json';
import {play} from './balance-driver';
import {nativePlay} from './native-strategy';
import type {HeroKind} from '../src/types';
it('26 normal campaign stages clear through the chapter graph with earned resources for three seeds',()=>{
 const results:any[]=[],failures:string[]=[];
 for(const seed of [9451,20261001,314159]){
  let earned=0;const cleared=new Set<string>();
  for(let i=0;i<26;i++){
   const level=LEVELS[i],n=i+1,preferred=((policies as any).bySeed?.[String(seed)]?.[String(n)]??(policies as any)[String(n)]) as {hero:HeroKind;variant:number;driver:string};
   if(level.requires?.some(id=>!cleared.has(id))){failures.push(`${seed}/${level.id}: predecessor not cleared`);continue;}
   let left=earned;const upgrades:Record<string,number>={};
   for(const key of i<12?['reinforce','archer','meteor','mage','engineer','barracks']:['engineer','archer','meteor','mage','reinforce','barracks'])for(const node of UPGRADE_TREES[key]){if(left<node.cost)break;left-=node.cost;upgrades[key]=(upgrades[key]??0)+1;}
   expect(upgradeSpent(upgrades)).toBeLessThanOrEqual(earned);
   const available=Object.keys(HEROES).filter(k=>HEROES[k as HeroKind].unlockLevel!<=n) as HeroKind[];
   const candidates=[preferred,...(n>=13?['tenshi','oni','ingvar','elora']:available.slice(-2)).flatMap(hero=>Array.from({length:n>=13?19:10},(_,variant)=>({hero:hero as HeroKind,variant,driver:n>=13?'native':'legacy'})))];
   const tried=new Set<string>(),attempts:any[]=[];let won:any;
   for(const policy of candidates){if(!policy||n>=4&&!available.includes(policy.hero))continue;const key=policy.driver+policy.hero+policy.variant;if(tried.has(key))continue;tried.add(key);
    const r=policy.driver==='native'?nativePlay(i,policy.hero,upgrades,policy.variant,seed):play(i,policy.hero,upgrades,policy.variant,'campaign','normal',seed);
    attempts.push({hero:policy.hero,variant:policy.variant,driver:policy.driver,result:r.result,lives:r.lives,wave:r.wave,time:r.time});
    if(r.result==='won'){won={...r,driver:policy.driver};break;}
   }
   if(!won){failures.push(`${seed}/${level.id}: no legal clear`);results.push({seed,level:level.id,earnedBefore:earned,upgrades,attempts,result:'lost'});continue;}
   const stars=won.lives>=18?3:won.lives>=6?2:1;results.push({...won,earnedBefore:earned,stars,attempts});earned+=stars;cleared.add(level.id);
   console.log(seed,n,won.hero,won.variant,won.lives,'stars',earned);
  }
 }
 mkdirSync('test-results/native',{recursive:true});writeFileSync('test-results/native/campaign-acceptance.json',JSON.stringify({rules:'Steam 24662480; normal; clear+3s; no injected gold/stars/HP',results,failures},null,2));
 expect(failures).toEqual([]);expect(results.filter(r=>r.result==='won')).toHaveLength(78);
},1200000);
