import {ASSET_BASE} from './assets';
import {TOWERS,TOWER_KEYS} from '../content/definitions';
import {escapeHtml as esc,icon} from './icons';
import type {Simulation} from './simulation';
import type {TowerKind} from './types';
const art=(kind:TowerKind,column:number)=>`<img class="mini-tower-art" src="${ASSET_BASE}tower-icons/${TOWERS[kind].row}-${column}.png" alt="" draggable="false">`;
const skillIcons:Record<string,string>={poison:'leaf',roots:'lock',sniper:'target',shrapnel:'flame',heal:'heart',armor:'shield',holy:'star',axes:'axe',moreAxes:'swords',whirl:'swirl',deathray:'bolt',teleport:'arrow',polymorph:'leaf',elemental:'shield',missile:'arrow',cluster:'flame',chain:'bolt',overload:'star'};
export function mobileTowerMenu(sim:Simulation,slot:number){
 const t=sim.towerAt(slot),choices:string[]=[];
 const button=(action:string,label:string,image:string,price:number|string,attrs='',disabled=false)=>`<button class="tower-chip" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${attrs} ${typeof price==='number'?`data-cost="${price}"`:''} ${disabled?'disabled':''}>${image}<span class="chip-price">${typeof price==='number'?icon('coin'):''}${price}</span></button>`;
 if(!t){for(const kind of TOWER_KEYS.filter(key=>sim.maxLevel(key)>0)){const cost=sim.price(kind,0);choices.push(button('build',`${TOWERS[kind].name}，${cost}金币`,art(kind,0),cost,`data-kind="${kind}"`,sim.gold<cost));}}
 else{
  if(t.iceClicks||t.sealAt>sim.time)choices.push(button('unfreeze','解除冰封或封印',icon('bolt'),'解封'));
  if(t.level<3&&t.level<sim.maxLevel(t.kind)){const cost=sim.price(t.kind,t.level);choices.push(button('tower-upgrade',`升级至${t.level+1}级，${cost}金币`,art(t.kind,t.level)+`<i class="chip-up">↑</i>`,cost,'',sim.gold<cost));}
  if(t.level===3&&sim.maxLevel(t.kind)>=4)TOWERS[t.kind].branches.forEach((branch,i)=>{
   const cost=sim.price(t.kind,3,i),open=sim.branchOpen(t.kind,i);
   choices.push(button('tower-upgrade',`${branch.name}，${cost}金币${open?'':'，本关尚未开放'}`,art(t.kind,3+i)+(open?'':'<i class="chip-up">锁</i>'),cost,`data-branch="${i}" ${open?'':'data-owned="true"'}`,!open||sim.gold<cost));
  });
  if(t.branch>=0)TOWERS[t.kind].branches[t.branch].skills.forEach((skill,i)=>{
   const cost=sim.skillPrice(t,i),max=t.skills[i]>=skill.maxLevel;
   choices.push(button('tower-skill',`${skill.name}，${t.skills[i]}级${max?'，已满级':'，'+cost+'金币'}`,icon(skillIcons[skill.id]??'star')+`<i class="chip-rank">${t.skills[i]}/${skill.maxLevel}</i>`,max?'✓':cost,`data-skill="${i}" ${max?'data-owned="true"':''}`,max||sim.gold<cost));
  });
  if(t.kind==='barracks'||sim.allies.some(a=>a.tower===slot&&a.kind==='elemental'))choices.push(button('rally','调整集结点',icon('flag'),'集结'));
  choices.push(button('sell',`出售，返还${sim.refund(t)}金币`,icon('coin')+'<i class="chip-up">↶</i>',`+${sim.refund(t)}`));
 }
 return`<section class="tower-popover tower-wheel" aria-label="${t?'升级和管理防御塔':'选择防御塔'}"><div class="wheel-options ${choices.length>4?'wheel-many':''}">${choices.join('')}</div><button class="wheel-close" data-action="close-tower" aria-label="关闭防御塔菜单">${icon('cross')}</button></section>`;
}
