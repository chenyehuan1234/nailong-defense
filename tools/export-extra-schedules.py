"""Read-only oracle for native Blackburn chapter facility spawn scheduling.

Exports gameplay observations only; the delivered game does not load this runtime.
"""
import json,pathlib,sys
from reference_runtime import ReferenceRuntime,BOOTSTRAP

folder=pathlib.Path('content/reference/steam-24662480')
r=ReferenceRuntime()
try:
 r.execute(BOOTSTRAP)
 result=r.execute("""
 collectgarbage('stop');KR_PATH_GAME='kr1';REF_W=1024;REF_H=768
 love.filesystem={isFile=function(name)return __files[name]~=nil end,load=function(name)return assert(loadstring(__files[name])) end}
 local P=require('path_db');local GR=require('grid_db')
 local U=require('utils');local f=E.entities.mega_spawner.main_script.update
 debug.setupvalue(f,5,P)
 local output={}
 for _,seed in ipairs({9451,20261001,314159}) do
  output[tostring(seed)]={}
  for _,stage in ipairs({23,24,26}) do
   math.randomseed(seed)
   local level=string.format('level%02d',stage);GR:load(level);P:load(level,{left=0,right=1024,bottom=0,top=768})
   local data=assert(loadstring(__files['kr1/data/levels/'..level..'_spawner.lua']))()
   local e=E:create_entity('mega_spawner');e.spawner_points=data.points;e.spawner_groups=data.groups;e.spawner_waves=data.waves[1];e.spawner_packs=data.packs
   local trace={};local store={tick_ts=0,level_mode=1,wave_group_number=0,entities={},seen={},queue={insert={},remove={}},waves_finished=false,level={}}
   debug.setupvalue(f,8,function(s,entity)
    trace[#trace+1]={tick=math.floor(s.tick_ts*30+.5),type=entity.template_name,path=entity.nav_path.pi,subPath=entity.nav_path.spi,node=entity.nav_path.ni,from=entity.pos,forcedWaypoint=entity.motion.forced_waypoint}
   end)
   local waves={};output[tostring(seed)][tostring(stage)]=waves
   local co=coroutine.create(f)
   local ok,err=coroutine.resume(co,e,store);assert(ok,tostring(err))
   local campaign=assert(loadstring(__files['kr1/data/waves/'..level..'_waves_campaign.lua']))()
   local tickBase=0
   for wave=1,#campaign.groups do
    trace={};store.wave_group_number=wave
    local rows=data.waves[1][wave] or {};local deadline=0
    for _,row in ipairs(rows) do deadline=math.max(deadline,(row[1] or 0)+(row[2] or 0)+(row[5] or 0)*(row[9] or 0)+5) end
    for tick=0,math.ceil(deadline*30) do
     store.tick_ts=(tickBase+tick)/30;ok,err=coroutine.resume(co);assert(ok,level..'/'..wave..': '..tostring(err))
    end
    for _,birth in ipairs(trace) do birth.tick=birth.tick-tickBase end
    waves[wave]={events=trace};tickBase=tickBase+math.ceil(deadline*30)+1
   end
  end
 end
 return output
 """)
 for stages in result.values():
  for waves in stages.values():
   for wave in waves:
    if not isinstance(wave['events'],list):wave['events']=[]
 (folder/'extra-timelines.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf8')
 print('Exported extra native scheduling') if not result.get('error') else None
finally:r.close()
