import json,pathlib
from reference_runtime import ReferenceRuntime,BOOTSTRAP
r=ReferenceRuntime()
try:
 r.execute(BOOTSTRAP)
 metadata=r.execute("""
 collectgarbage('stop');KR_PATH_GAME='kr1';REF_W=1024;REF_H=768
 love.filesystem={isFile=function(name)return __files[name]~=nil end,load=function(name)return assert(loadstring(__files[name])) end}
 local P=require('path_db');local GR=require('grid_db');local output={}
 for n=1,26 do local level=string.format('level%02d',n)
  GR:load(level);P:load(level,{left=0,right=1024,bottom=0,top=768})
  local data=assert(loadstring(__files['kr1/data/levels/'..level..'_data.lua']))()
  local exits={};for _,e in ipairs(data.entities_list) do if e.template=='decal_defend_point' then exits[#exits+1]=e.pos end end
  output[n]={start=P.path_start_node,finish=P.path_end_node,visibleStart=P.visible_path_start_node,visibleFinish=P.visible_path_end_node,exits=exits}
 end
 return output
 """)
 pathlib.Path('content/reference/steam-24662480/path-metadata.json').write_text(json.dumps(metadata,separators=(',',':')),encoding='utf8')
 print(json.dumps(metadata[:4],ensure_ascii=False))
finally:r.close()
