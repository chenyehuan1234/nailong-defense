import { ENEMIES } from '../content/definitions';
import type { LevelDefinition, Point } from './types';
export function validateLevel(raw:unknown):LevelDefinition {
  const fail=(s:string):never=>{throw new Error(s);};
  if(!raw||typeof raw!=='object')return fail('关卡数据必须为 JSON 对象');
  const l=raw as LevelDefinition;
  const point=(p:Point)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=-500&&p.x<=2100&&p.y>=-200&&p.y<=1100;
  if(l.version!==1&&l.version!==2&&l.version!==3)return fail('不支持此关卡版本');
  for(const key of ['id','name','subtitle','description','recommended','duration']as const)if(typeof l[key]!=='string'||l[key].length>500)return fail(`缺少有效字段 ${key}`);
  if(!['forest','river','ruins',...Array.from({length:26},(_,i)=>`map-${String(i+1).padStart(2,'0')}`)].includes(l.map))return fail('地图背景不受支持');
  if(!Number.isFinite(l.gold)||l.gold<0||l.gold>10000)return fail('初始金币须为 0–10000');
  if(!Array.isArray(l.paths)||l.paths.length<1||l.paths.length>12||l.paths.some(p=>!Array.isArray(p)||p.length<2||p.length>(l.densePaths?5000:60)||!p.every(point)))return fail('道路必须包含至少两个有效坐标，最多十二条道路');
  if(!Array.isArray(l.slots)||l.slots.length>80||!l.slots.every(point)||!point(l.heroStart))return fail('塔位或英雄起点不正确');
  if(!Array.isArray(l.waves)||!l.waves.length||l.waves.length>100)return fail('波次须为 1–100 波');
  if(l.scouting&&(!Array.isArray(l.scouting.majorEnemies)||l.scouting.majorEnemies.length>5||l.scouting.majorEnemies.some(k=>!ENEMIES[k])))return fail('侦察配置须为最多五种有效敌人');
  if(l.tutorial&&(!Number.isInteger(l.tutorial.lesson)||l.tutorial.lesson<0||l.tutorial.lesson>2))return fail('教学配置不正确');
  let count=0;
  if(l.subPaths&&(!Array.isArray(l.subPaths)||l.subPaths.length!==l.paths.length||l.subPaths.some(lanes=>!Array.isArray(lanes)||lanes.length<1||lanes.length>3||lanes.some(p=>!Array.isArray(p)||p.length<2||p.length>5000||!p.every(point)))))return fail('子道路配置不正确');
  if(l.pathStarts&&(!Array.isArray(l.pathStarts)||l.pathStarts.length!==l.paths.length||l.pathStarts.some((n,i)=>!Number.isInteger(n)||n<0||n>=l.paths[i].length)))return fail('入口节点不正确');
  if(l.pathEnds&&(!Array.isArray(l.pathEnds)||l.pathEnds.length!==l.paths.length||l.pathEnds.some((n,i)=>!Number.isInteger(n)||n<0||n>=l.paths[i].length||n<(l.pathStarts?.[i]??0))))return fail('出口节点不正确');
  if(l.pathConnections&&(typeof l.pathConnections!=='object'||Object.values(l.pathConnections).some(n=>!Number.isInteger(n)||Number(n)<0||Number(n)>l.paths.length)))return fail('道路连接编号不正确');
  if(l.exitPoints&&(!Array.isArray(l.exitPoints)||!l.exitPoints.every(point)))return fail('出口位置不正确');
  if(l.logicalSize&&(!Number.isFinite(l.logicalSize.scale)||l.logicalSize.scale<=0||l.logicalSize.scale>10||!Number.isFinite(l.logicalSize.width)||!Number.isFinite(l.logicalSize.height)||!Number.isFinite(l.logicalSize.offsetX)))return fail('逻辑尺寸不正确');
  if(l.walkingGrid&&(!Number.isFinite(l.walkingGrid.ox)||!Number.isFinite(l.walkingGrid.oy)||!Array.isArray(l.walkingGrid.grid)||l.walkingGrid.grid.length<1||l.walkingGrid.grid.length>200||l.walkingGrid.grid.some(row=>!Array.isArray(row)||row.length<1||row.length>200||row.some(n=>!Number.isInteger(n)))))return fail('通行网格不正确');
  for(const w of l.waves){if(!Number.isFinite(w.rest)||w.rest<0||w.rest>2000||!Array.isArray(w.groups)||(!w.groups.length&&!w.timeline)||w.groups.length>2000)return fail('波次配置不正确');
   const traces=[w.timeline,...Object.values(w.timelines??{}),...Object.values(w.extraTimelines??{})].filter(Boolean);for(const trace of traces){if(!Array.isArray(trace)||trace.length>10000)return fail('出怪时间线不正确');let previous=-1;for(const e of trace){if(!ENEMIES[e.type]||!Number.isInteger(e.tick)||e.tick<previous||e.tick>180000||!Number.isInteger(e.path)||e.path<0||e.path>=l.paths.length||!Number.isInteger(e.subPath)||e.subPath<0||e.subPath>=(l.subPaths?.[e.path]?.length??1)||e.node!==undefined&&(!Number.isInteger(e.node)||e.node<0||e.node>=(l.subPaths?.[e.path]?.[e.subPath]??l.paths[e.path]).length)||e.from&&!point(e.from)||e.forcedWaypoint&&!point(e.forcedWaypoint))return fail('出怪时间线的敌人、时间或入口不正确');previous=e.tick;}}
   if(w.completeTick!==undefined&&(!Number.isInteger(w.completeTick)||w.completeTick<0||w.completeTick>180000))return fail('波内等待时间不正确');
   if(Object.values(w.completeTicks??{}).some(t=>!Number.isInteger(t)||t<0||t>180000))return fail('种子波内等待时间不正确');
   for(const g of w.groups){
    if(!ENEMIES[g.type]||!Number.isInteger(g.count)||g.count<1||g.count>150||!Number.isInteger(g.path)||g.path<0||g.path>=l.paths.length||!Number.isFinite(g.interval)||g.interval<0||g.interval>30||!Number.isFinite(g.delay)||g.delay<0||g.delay>2000)return fail('敌人组的类型、数量、道路或时间配置不正确');count+=g.count;
  }}
  if(count>10000)return fail('关卡敌人总数不能超过 10000');
  if(l.lives!==undefined&&(!Number.isInteger(l.lives)||l.lives<1||l.lives>100))return fail('生命须为 1–100');
  if(l.maxTowerLevel!==undefined&&(!Number.isInteger(l.maxTowerLevel)||l.maxTowerLevel<1||l.maxTowerLevel>4))return fail('塔等级上限须为 1–4');
  if(l.maxUpgrade!==undefined&&(!Number.isInteger(l.maxUpgrade)||l.maxUpgrade<0||l.maxUpgrade>5))return fail('星级上限须为 0–5');
  if(l.allowedTowers!==undefined&&(!Array.isArray(l.allowedTowers)||!l.allowedTowers.length||l.allowedTowers.some(k=>!['archer','barracks','mage','engineer'].includes(k))))return fail('允许塔系不正确');
  if(l.heroes!==undefined&&typeof l.heroes!=='boolean')return fail('英雄开关不正确');
  for(const key of ['obstacles','portals','facilities']as const)if(l[key]!==undefined&&(!Array.isArray(l[key])||l[key]!.length>100))return fail('地图特殊配置须为数组，最多100项');
  if(l.unlocks&&Object.entries(l.unlocks).some(([k,v])=>!['archer','barracks','mage','engineer'].includes(k)||!Number.isInteger(v)||v<0||v>3))return fail('高级分支解锁配置不正确');
  if(l.unlockAtWave&&Object.entries(l.unlockAtWave).some(([k,v])=>!['archer','barracks','mage','engineer'].includes(k)||!Number.isInteger(v)||v<0||v>100))return fail('解锁波次不正确');
  if(l.obstacles?.some(r=>!point(r)||!Number.isFinite(r.width)||!Number.isFinite(r.height)||r.width<1||r.height<1||r.width>1600||r.height>900))return fail('障碍区域不正确');
  if(l.portals?.some(p=>!Number.isInteger(p.path)||p.path<0||p.path>=l.paths.length||!Number.isFinite(p.from)||!Number.isFinite(p.to)||p.from<0||p.to>1||p.from>=p.to))return fail('捷径须指定道路上由前到后的比例');
  if(l.facilities?.some(f=>!point(f)||!['elves','sasquatch','sunray','graveyard','summon','magma','guards'].includes(f.kind)||!Number.isInteger(f.path)||f.path<0||f.path>=l.paths.length||!Number.isFinite(f.progress)||f.progress<0||f.progress>1))return fail('设施位置或类型不正确');
  if(l.facilities?.some(f=>typeof f.id!=='string'||!f.id.length||f.id.length>100||f.cost!==undefined&&(!Number.isFinite(f.cost)||f.cost<0||f.cost>10000)||f.every!==undefined&&(!Number.isFinite(f.every)||f.every<1||f.every>600)))return fail('设施编号、招募成本或周期不正确');
  if(new Set(l.facilities?.map(f=>f.id)).size!==(l.facilities?.length??0))return fail('设施编号不能重复');
  if(l.prebuilt!==undefined&&(!Array.isArray(l.prebuilt)||l.prebuilt.length>l.slots.length||l.prebuilt.some(t=>!Number.isInteger(t.slot)||t.slot<0||t.slot>=l.slots.length||!['archer','barracks','mage','engineer'].includes(t.kind)||!Number.isInteger(t.level)||t.level<1||t.level>4||t.level===4&&t.branch!==0&&t.branch!==1)||new Set(l.prebuilt.map(t=>t.slot)).size!==l.prebuilt.length))return fail('预设塔的塔位、等级或分支不正确');
  return structuredClone(l);
}
