"""Read-only timing oracle. Execute installed scheduler; export facts, never code."""
import json,pathlib,hashlib
from reference_runtime import ReferenceRuntime,BOOTSTRAP
out=pathlib.Path('content/reference/steam-24662480')
r=ReferenceRuntime()
try:
 r.execute(BOOTSTRAP)
 code="""
 collectgarbage('stop');KR_PATH_GAME='kr1';REF_W=1024;REF_H=768
 love.filesystem={isFile=function(name)return __files[name]~=nil end,load=function(name)return assert(loadstring(__files[name])) end}
 local P=require('path_db');local GR=require('grid_db')
 local _,spawn=debug.getupvalue(require('systems').wave_spawn.init,7)
 local output={}
 for _,seed in ipairs({__seed}) do
  math.randomseed(seed);output[tostring(seed)]={}
  for stage=__stage,__stage do
   local name=string.format('kr1/data/waves/level%02d_waves_campaign.lua',stage)
   local data=assert(loadstring(__files[name]))()
   local pathData=assert(loadstring(__files[string.format('kr1/data/levels/level%02d_paths.lua',stage)]))()
   local level=string.format('level%02d',stage);GR:load(level);P:load(level,{left=0,right=1024,bottom=0,top=768});debug.setupvalue(spawn,2,P)
   local waves={};output[tostring(seed)][stage]=waves
   for groupIndex,group in ipairs(data.groups) do
    local trace={};local store={tick_ts=0,level_mode=1,gems_per_wave=0,wave_signals={},seen={},entities={}}
    debug.setupvalue(spawn,8,function(s,e)
     trace[#trace+1]={tick=math.floor(s.tick_ts*30+0.5),type=e.template_name,path=e.nav_path.pi,subPath=e.nav_path.spi,node=e.nav_path.ni}
    end)
    local threads={};for index,wave in ipairs(group.waves) do
     threads[index]={co=coroutine.create(spawn),wave=wave,delay=wave.delay or 0,started=false}
    end
    local complete=false
    for tick=0,60000 do
     store.tick_ts=tick/30;complete=true
     for index,thread in ipairs(threads) do
      if not thread.started and tick>=thread.delay then
       thread.started=true;local ok,err=coroutine.resume(thread.co,store,thread.wave)
       assert(ok,'Stage '..stage..' group '..groupIndex..': '..tostring(err))
      elseif thread.started and coroutine.status(thread.co)~='dead' then
       local ok,err=coroutine.resume(thread.co);assert(ok,'Stage '..stage..' group '..groupIndex..' tick '..tick..': '..tostring(err))
      end
      if not thread.started or coroutine.status(thread.co)~='dead' then complete=false end
     end
     if complete then break end
    end
    assert(complete,'Spawner exceeded frame limit')
    waves[groupIndex]={events=trace,completeTick=math.floor(store.tick_ts*30+0.5),interval=group.interval}
   end
  end
 end
 return output
 """
 import sys,subprocess,concurrent.futures
 if len(sys.argv)>1:
  seed,stage=map(int,sys.argv[1:3])
  data=r.execute(f'__seed={seed};__stage={stage};'+code)
  value=data[str(seed)][stage-1] if isinstance(data[str(seed)],list) else data[str(seed)][stage]
  target=out/'oracle-v3'/f'{seed}-{stage}.json';target.parent.mkdir(exist_ok=True)
  target.write_text(json.dumps(value,separators=(',',':')),encoding='utf8');sys.exit(0)
 def one(args):
  seed,stage=args;target=out/'oracle-v3'/f'{seed}-{stage}.json'
  for attempt in range(3):
   if target.exists():return seed,stage,json.loads(target.read_text())
   result=subprocess.run([sys.executable,__file__,str(seed),str(stage)],capture_output=True,text=True)
  raise RuntimeError(f'Oracle {seed}/{stage}: '+result.stderr)
 timelines={str(s):[None]*26 for s in [9451,20261001,314159]}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  for seed,stage,value in pool.map(one,[(s,n) for s in [9451,20261001,314159] for n in range(1,27)]):
   timelines[str(seed)][stage-1]=value;print('Oracle',seed,stage,flush=True)
 (out/'native-timelines.json').write_text(json.dumps(timelines,separators=(',',':')),encoding='utf8')
 print('Native scheduling exported for 26 stages x 3 seeds.')
finally:r.close()
