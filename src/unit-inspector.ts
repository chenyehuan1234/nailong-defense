import {ASSET_BASE} from './assets';
import {ENEMIES,HEROES,TOWERS} from '../content/definitions';
import {NATIVE,REFERENCE_SCALE as S,HERO_LEVELS} from '../content/reference-gameplay';
import {enemyAdvice} from './scouting';
import type {Simulation} from './simulation';
import type {HeroKind,AllyState} from './types';

export type UnitSelection={id:number;side:'enemy'|'ally'};
export interface UnitInformation {
  id:number;name:string;category:string;portrait:string;hp:number;maxHp:number;
  stats:{label:string;value:string}[];description:string;state:string;
}
const percent=(n:number)=>Math.round(n*100)+'%';
const damage=(lo:number,hi:number)=>Math.floor(lo)+'–'+Math.ceil(hi);
const damageType=(kind:string)=>({physical:'物理',magic:'魔法',true:'真实',explosive:'范围'}[kind]??'物理');

/** Read the selected actor's live state; inspection never issues a combat command. */
export function unitInformation(sim:Simulation,selection?:UnitSelection):UnitInformation|undefined {
  if(!selection)return;
  if(selection.side==='enemy'){
    const e=sim.enemies.find(e=>e.id===selection.id&&e.hp>0);if(!e)return;
    const d=ENEMIES[e.kind],factor=((e.rageUntil??0)>sim.time?2:1)*((e.damageBuffUntil??0)>sim.time?1.2:1);
    const advice=enemyAdvice(e.kind,sim.level),state=e.statuses.map(s=>({slow:'减速',stun:'眩晕',poison:'中毒',burn:'燃烧',mark:'标记',root:'缠绕',freeze:'冻结',curse:'诅咒'}[s.type]));
    if(e.shieldHits)state.push('护盾剩余'+e.shieldHits+'次');
    if(e.sheep)state.push('变羊');if(sim.blocked.has(e.id))state.push('被拦截');
    return{id:e.id,name:e.sheep?'变羊 · '+d.name:d.name,category:d.behavior.boss?'首领 · '+(e.phase===1?'第二形态':'第一形态'):sim.isFlying(e)?'飞行敌人':'地面敌人',portrait:`${ASSET_BASE}${e.sheep?'enemy-new-4':d.sheet}-${e.sheep?7:d.row}.png`,hp:e.hp,maxHp:e.maxHp,
      stats:[{label:'攻击',value:e.sheep?'0':damage((d.minDamage??d.damage)*factor,d.damage*factor)},{label:'护甲',value:percent(e.armor*(e.statuses.some(s=>s.type==='curse')?.5:1))},{label:'魔抗',value:percent(d.resist)},{label:'移速',value:Math.round(d.speed/S)+' / 秒'},{label:'漏怪',value:'−'+d.leak+'生命'}],
      description:advice.tags.join(' · ')+(advice.recommended.length?' ｜ 应对：'+advice.recommended.join('、'):''),state:state.join(' · ')||'正常'};
  }
  const a=sim.allies.find(a=>a.id===selection.id);if(!a)return;
  const h=HEROES[a.kind as HeroKind],tower=a.tower!==undefined?sim.towerAt(a.tower):undefined;
  const t=h?HERO_LEVELS[h.native!][a.level-1]:a.summon?NATIVE[a.summon.template]:a.kind==='soldier'?sim.soldierTemplate(tower):NATIVE[a.kind==='elemental'?'soldier_elemental':a.kind==='elf'?'soldier_elf':'soldier_sasquash'];
  const inMelee=Array.from(sim.blocked.values()).some(friend=>friend.id===a.id),attack=inMelee?t?.melee?.attacks?.[0]:t?.ranged?.attacks?.[0]??t?.melee?.attacks?.[0],bullet=NATIVE[attack?.bullet]?.bullet;
  const ls=h?.levelStats?.[a.level-1],soldier=tower&&a.kind==='soldier'?sim.stats(tower):undefined;
  let lo=a.summon?.minDamage??soldier?.minDamage??(h&&!inMelee?ls?.minDamage:undefined)??bullet?.damage_min??attack?.damage_min??h?.minDamage??1;
  let hi=a.summon?.damage??soldier?.damage??(h&&!inMelee?ls?.maxDamage:undefined)??bullet?.damage_max??attack?.damage_max??h?.damage??3;
  if(a.kind==='elemental'){lo=20+10*(tower?.skills[1]??1);hi=40+10*(tower?.skills[1]??1);}
  if(a.kind==='ingvar'&&a.transformedUntil){const b=t.hero.skills.bear;lo=b.damage_min[b.level-1];hi=b.damage_max[b.level-1];}
  const bonus=(a.buffUntil>sim.time?2*(a.courageRank??1):0)+(tower?.kind==='barracks'&&tower.branch===1?10*tower.skills[1]:0);lo+=bonus;hi+=bonus;
  let name=h?.name??({soldier:tower?.branch===0?'皇家盾卫':tower?.branch===1?'狂战奶龙':tower?'Lv.'+tower.level+' 奶龙卫兵':'奶龙援军',elemental:'岩石守卫',elf:'精灵奶龙',sasquatch:'雪人奶龙',pet:'灵猫伙伴',illusion:'奥术幻象',ancestor:a.summon?.template==='soldier_s6_imperial_guard'?'王城守卫':'祖灵战士'} as Record<AllyState['kind'],string>)[a.kind];
  const row=h?.row??(a.kind==='soldier'?(tower?.branch===1?3:tower?.branch===0?2:(tower?.level??1)>1?1:0):a.kind==='sasquatch'?1:a.kind==='elemental'?2:0);
  const sheet=h?'heroes':a.kind==='soldier'?'soldiers':'special-allies';
  const states=[a.hp<=0?'阵亡 · '+Math.max(0,Math.ceil(a.revive))+'秒后补员':a.commanded?'正在移动':a.targetId?'正在交战':'待命'];
  if(a.buffUntil>sim.time)states.push('勇气鼓舞');if((a.transformedUntil??0)>sim.time)states.push('强化形态');if((a.stunnedUntil??0)>sim.time)states.push('眩晕');
  const skills=h?Object.entries(t.hero.skills).map(([key,d],i)=>{const data=d as {level:number};const unlock=HERO_LEVELS[h.native!].findIndex(l=>l.hero.skills[key]?.level>0)+1;return h.skills[i%2]+' '+(data.level?'Lv.'+data.level:'Lv.'+unlock+'解锁');}).join(' · '):tower?(TOWERS[tower.kind].branches[tower.branch]?.skills??[]).filter((_,i)=>tower.skills[i]>0).map((s,i)=>s.name).join(' · '):a.expires?'临时援军 · 剩余'+Math.max(0,Math.ceil(a.expires-sim.time))+'秒':'拦截地面敌人';
  return{id:a.id,name,category:h?'英雄 · Lv.'+a.level:tower?TOWERS[tower.kind].name:'友军',portrait:`${ASSET_BASE}${sheet}-${row}.png`,hp:a.hp,maxHp:a.maxHp,
    stats:[{label:'攻击',value:damage(lo,hi)},{label:'护甲',value:percent(Math.min(.95,a.armor+(a.buffUntil>sim.time?.05*(a.courageRank??0):0)))},{label:'魔抗',value:'0%'},{label:'类型',value:damageType(a.summon?.damageKind??(inMelee?(attack?.damage_type===1?'true':attack?.damage_type===4?'magic':'physical'):h?.damageKind??'physical'))},{label:'移速',value:Math.round((h?.speed??a.summon?.speed??(t?.motion?.max_speed??75)*S)/S)+' / 秒'},{label:h?'成长':'拦截',value:h?'经验 '+Math.round(a.xp):'地面敌人'}],description:skills||'拦截地面敌人，脱战后恢复生命。',state:states.join(' · ')};
}
