import {LEVELS,levelForMode} from '../content/levels';
import {ENEMIES,HEROES,TOWERS} from '../content/definitions';
import {REFERENCE_SCALE as S} from '../content/reference-gameplay';
import {Simulation} from '../src/simulation';
import {distance} from '../src/math';
import type {HeroKind,TowerKind,PlayerCommand,TowerState} from '../src/types';
/** A deterministic player policy. Every purchase, move and spell goes through PlayerCommand. */
export function nativePlay(index:number,hero:HeroKind,upgrades:Record<string,number>,variant=0,seed=9451,timing:'clear'|'original'='clear'){
 const s=new Simulation(levelForMode(LEVELS[index],'campaign'),hero,'normal',upgrades,seed),l=s.level;s.waveTiming=timing;
 const n=index+1,log:{tick:number;command:PlayerCommand}[]=[],leaks:any[]=[];const command=(c:PlayerCommand)=>{if(s.command(c)){log.push({tick:Math.round(s.time*30),command:structuredClone(c)});return true;}return false;};
 const templates:TowerKind[][]=n<=3?[['archer','archer','archer','barracks'],['archer','barracks','mage','archer']]:n>=23?[['mage','mage','mage','barracks','engineer','archer'],['mage','engineer','mage','archer','barracks'],['mage','archer','mage','mage','engineer']]:[16,17].includes(n)?[['archer','archer','engineer','barracks','archer'],['engineer','archer','archer','barracks']]:[15,18,19,20,21,22].includes(n)?[['engineer','engineer','archer','barracks','mage'],['engineer','archer','engineer','barracks','archer'],['archer','engineer','mage','barracks']]:[['mage','archer','mage','barracks','engineer'],['archer','mage','archer','barracks','engineer'],['mage','mage','barracks','archer','engineer']];
 const focused=variant>=8;
 const families=variant>=18?(['mage','engineer','archer','engineer','mage','barracks'] as TowerKind[]):variant>=17?(['engineer','engineer','archer','mage','engineer','barracks'] as TowerKind[]):variant>=16?(['engineer','mage','archer','engineer','mage','barracks'] as TowerKind[]):variant>=12?(['engineer','archer','barracks','engineer','archer'] as TowerKind[]):variant>=11?(['engineer','archer','barracks','mage','engineer'] as TowerKind[]):focused?([18,19,21].includes(n)?['archer','engineer','barracks','archer','mage']:[16,17].includes(n)?['mage','archer','barracks','engineer','mage']:n===15?['archer','engineer','archer','barracks','mage']:['mage','engineer','archer','barracks','mage']) as TowerKind[]:templates[variant%templates.length];
 const branch=(t:TowerState)=>t.kind==='engineer'?1:t.kind==='barracks'?0:t.kind==='archer'?variant%4===3?1:0:n===13||n>=23||variant%4===2?0:1;
 const routeIncludes=(entry:number,path:number)=>{const seen=new Set<number>();while(!seen.has(entry)){if(entry===path)return true;seen.add(entry);const next=s.connectedPath(entry);if(next===undefined)break;entry=next;}return false;};
 const samples=s.roads.flatMap((r,path)=>{const weight=l.waves.slice(0,Math.max(3,s.wave+2)).reduce((total,w)=>total+w.groups.filter(g=>routeIncludes(g.path,path)).reduce((sum,g)=>sum+g.count,0),0)+1;const start=r.lengths[l.pathStarts?.[path]??0]??0;const exit=r.lengths[l.pathEnds?.[path]??r.lengths.length-1]??r.total;const result=[];for(let d=start;d<exit;d+=24*S)result.push({p:r.at(d),weight:weight*(.5+.5*d/r.total),late:d/exit,path});return result;});
 const score=(slot:number,kind:TowerKind)=>{const range=TOWERS[kind].range[Math.min(2,(l.maxTowerLevel??4)-1)];let score=0;for(const q of samples)if(distance(q.p,l.slots[slot])<range){const saturation=s.towers.filter(t=>t.kind!=='barracks'&&distance(l.slots[t.slot],q.p)<s.stats(t).range).length;score+=q.weight*(variant>=12?.2+5*q.late**4:1)/(1+saturation*(variant>=11?4:.65));}return score;};
 const buy=()=>{
  const goal=focused?1:variant>=6?2:3;
  if(variant>=13){const tesla=s.towers.find(t=>t.kind==='engineer'&&t.branch===1&&t.skills[1]<(s.wave>2?3:1));if(tesla){command({type:'tower-skill',slot:tesla.slot,skill:1});return;}}
  const candidates=s.towers.filter(t=>t.level<(variant>=13&&s.wave<7?(t.kind==='barracks'?2:t.kind==='archer'?3:s.maxLevel(t.kind)):s.maxLevel(t.kind))&&(t.level<3||[0,1].some(b=>s.branchOpen(t.kind,b))));
  const build=()=>{const kind=families[s.towers.length%families.length],slots=l.slots.map((_,i)=>i).filter(i=>!s.towerAt(i)).sort((a,b)=>score(b,kind)-score(a,kind)),slot=slots[0];return slot!==undefined&&command({type:'build',slot,kind});};
  if(s.towers.length<goal&&build())return;
  const ordered=candidates.sort((a,b)=>(a.level+(a.kind==='barracks'?1.5:0))-(b.level+(b.kind==='barracks'?1.5:0))||score(b.slot,b.kind)-score(a.slot,a.kind));
  if(focused){const t=ordered.sort((a,b)=>(a.slot===s.towers[0]?.slot?-1:0)-(b.slot===s.towers[0]?.slot?-1:0))[0];if(t){let b=branch(t);if(!s.branchOpen(t.kind,b))b=1-b;command({type:'upgrade',slot:t.slot,branch:b});return;}}
  else for(const t of ordered){let b=branch(t);if(!s.branchOpen(t.kind,b))b=1-b;if(command({type:'upgrade',slot:t.slot,branch:b}))return;}
  // Buy control before filling distant plots. Avoid buying passive heal while damage is scarce.
  for(const t of s.towers.filter(t=>t.branch>=0&&t.kind!=='barracks')){const priorities=t.kind==='engineer'&&t.branch===1?[1,0]:t.kind==='mage'&&t.branch===0?[0,1]:[0,1];for(const skill of priorities)if(t.skills[skill]<1&&(!focused||s.towers.length>=3)&&command({type:'tower-skill',slot:t.slot,skill}))return;}
  if(!candidates.length&&build())return;
  if(s.wave>4)for(const t of s.towers.filter(t=>t.branch>=0))for(let skill=0;skill<TOWERS[t.kind].branches[t.branch].skills.length;skill++)if(command({type:'tower-skill',slot:t.slot,skill}))return;
 };
 for(let i=0;i<35;i++)buy();const melee=HEROES[hero].range<100*S;
 const safe=s.towers.find(t=>t.kind==='barracks')?.rally??s.nearestRoad(l.slots[s.towers[0]?.slot??0]).point;if(l.heroes!==false)command({type:'move-hero',point:safe});command({type:'next-wave'});
 for(let tick=0;tick<90000&&s.result==='playing';tick++){
  if(tick%30===0){buy();for(const t of s.towers)while(t.sealAt||t.iceClicks)command({type:'unseal',slot:t.slot});for(const e of s.enemies)if(e.sheep)command({type:'pop-sheep',id:e.id});
   const enemies=s.enemies.filter(e=>e.hp>0).sort((a,b)=>s.remainingDistance(a)/ENEMIES[a.kind].speed-s.remainingDistance(b)/ENEMIES[b.kind].speed),lead=enemies[0];
   if(lead){const dense=enemies.map(e=>({e,score:enemies.filter(f=>distance(f,e)<65*S).reduce((sum,f)=>sum+Math.min(f.hp,400),0)})).sort((a,b)=>b.score-a.score)[0];if(dense.score>100){const e=dense.e,p=variant>=14&&!s.blocked.has(e.id)?s.enemyRoad(e).at(Math.min(s.goalProgress(e),e.distance+ENEMIES[e.kind].speed*(1-(e.statuses.find(x=>x.type==='slow')?.power??0))*1.6)):e;command({type:'cast',skill:'meteor',point:{x:p.x,y:Math.max(0,Math.min(900,p.y))}});}
    const ground=enemies.find(e=>!s.isFlying(e));if(ground)command({type:'cast',skill:'reinforce',point:s.enemyRoad(ground).at(ground.distance+25*S)});
    if(s.hero.hp>0&&l.heroes!==false){const target=melee?ground:lead;if(target){if(s.hero.hp<s.hero.maxHp*.22&&!s.hero.transformedUntil){if(distance(s.hero,l.heroStart)>30&&!s.hero.commanded)command({type:'move-hero',point:l.heroStart});}else if(!s.hero.commanded&&distance(s.hero,target)>(melee?120*S:HEROES[hero].range)&&(!focused||(s.goalProgress(target)-target.distance)/ENEMIES[target.kind].speed<12)){const goal=s.enemyRoad(target).at(Math.min(s.goalProgress(target)-25*S,target.distance+(melee?30*S:HEROES[hero].range*.55)));command({type:'move-hero',point:goal});}}}
   }
  }
  const lives=s.lives;s.step();if(lives!==s.lives)leaks.push({time:s.time,kind:s.events.filter(e=>e.type==='leak').at(-1)?.kind});
 }
 return {level:l.id,hero,variant,seed,timing,result:s.result,lives:s.lives,gold:s.gold,time:s.time,wave:s.wave,heroLevel:s.hero.level,heroDamage:s.heroDamage,leaks,upgrades,metrics:s.metrics,towers:s.towers.map(t=>({slot:t.slot,kind:t.kind,level:t.level,branch:t.branch,skills:t.skills})),remaining:s.enemies.map(e=>({kind:e.kind,hp:e.hp,x:e.x,y:e.y})),log};
}
