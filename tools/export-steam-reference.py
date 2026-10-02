import ctypes,os,zipfile,json,re
root=r'D:\steam\steamapps\common\Kingdom Rush'
with os.add_dll_directory(root):lua=ctypes.CDLL(os.path.join(root,'lua51.dll'))
P=ctypes.c_void_p
for name,args,ret in [('luaL_newstate',[],P),('luaL_loadbuffer',[P,ctypes.c_char_p,ctypes.c_size_t,ctypes.c_char_p],ctypes.c_int),('lua_pcall',[P,ctypes.c_int,ctypes.c_int,ctypes.c_int],ctypes.c_int),('lua_type',[P,ctypes.c_int],ctypes.c_int),('lua_gettop',[P],ctypes.c_int),('lua_settop',[P,ctypes.c_int],None),('lua_pushnil',[P],None),('lua_next',[P,ctypes.c_int],ctypes.c_int),('lua_tolstring',[P,ctypes.c_int,ctypes.POINTER(ctypes.c_size_t)],P),('lua_tonumber',[P,ctypes.c_int],ctypes.c_double),('lua_toboolean',[P,ctypes.c_int],ctypes.c_int),('lua_close',[P],None),('luaL_openlibs',[P],None)]:f=getattr(lua,name);f.argtypes=args;f.restype=ret
def val(L,i,dep=0):
 t=lua.lua_type(L,i)
 if t==0:return None
 if t==1:return bool(lua.lua_toboolean(L,i))
 if t==3:return lua.lua_tonumber(L,i)
 if t==4:
  n=ctypes.c_size_t();p=lua.lua_tolstring(L,i,ctypes.byref(n));return ctypes.string_at(p,n.value).decode('utf8','replace')
 if t!=5:return '<function/object>'
 ix=i if i>0 else lua.lua_gettop(L)+i+1;r={};lua.lua_pushnil(L)
 while lua.lua_next(L,ix):r[val(L,-2,dep+1)]=val(L,-1,dep+1);lua.lua_settop(L,-2)
 return [r[k] for k in range(1,len(r)+1)] if r and set(r)==set(range(1,len(r)+1)) else r
def run(src,prep=b''):
 L=lua.luaL_newstate()
 try:
  lua.luaL_openlibs(L)
  pre=b'os=nil;io=nil;package=nil;require=nil;dofile=nil;loadfile=nil;GAME_MODE_CAMPAIGN=1;GAME_MODE_HEROIC=2;GAME_MODE_IRON=3;DIFFICULTY_EASY=1;DIFFICULTY_NORMAL=2;DIFFICULTY_HARD=3;FPS=30;'+prep
  assert lua.luaL_loadbuffer(L,pre,len(pre),b'constants')==0 and lua.lua_pcall(L,0,0,0)==0
  e=lua.luaL_loadbuffer(L,src,len(src),b'reference');e=e or lua.lua_pcall(L,0,1,0)
  return {'read_error':val(L,-1)} if e else val(L,-1)
 finally:lua.lua_close(L)
z=zipfile.ZipFile(os.path.join(root,'Kingdom Rush.exe'))

import argparse,hashlib,pathlib,sys
parser=argparse.ArgumentParser(description='Read-only Steam reference export. Never copies game images, music, DLLs or executable code.')
parser.add_argument('--output',default='content/reference/steam-24662480')
args=parser.parse_args()
out=pathlib.Path(args.output);out.mkdir(parents=True,exist_ok=True)
records={}
def read(name,prep=b''):
    raw=z.read(name);data=run(raw,prep)
    if isinstance(data,dict) and 'read_error' in data:raise RuntimeError(name+': '+data['read_error'])
    records[name]={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw)}
    return data
def write(name,data):
    (out/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
prep=b"""
REF_H=768;GGLabel={static={ref_h=768}}
local dummy={}
setmetatable(dummy,{__index=function() return dummy end,__call=function() return dummy end,__add=function() return 0 end,__sub=function() return 0 end,__mul=function() return 0 end,__div=function() return 0 end,__concat=function() return '' end})
require=function(name) if name=='klua.vector' then return {v=function(x,y) return {x=x,y=y} end} end return dummy end
"""
settings=read('kr1/game_settings.lua')
metadata=read('kr1-desktop/data/map_data.lua',prep)
write('settings.json',settings)
write('heroes-unlocks.json',metadata['hero_data'])
write('map-points.json',read('kr1-desktop/data/map_points.lua'))
stages=[]
for i in range(1,27):
    prefix=f'kr1/data/levels/level{i:02}'
    stages.append({'number':i,'waves':read(f'kr1/data/waves/level{i:02}_waves_campaign.lua'),'layout':read(prefix+'_data.lua'),'paths':read(prefix+'_paths.lua'),'grid':read(prefix+'_grid.lua')})
write('stages.json',stages)
manifest={'version':1,'game':'Kingdom Rush','platform':'Steam Windows','appId':246420,'buildId':24662480,'sourceRoot':root,'coordinateSystem':{'width':1024,'height':768,'yAxis':'up'},'framesPerSecond':30,'files':records,'notes':['Only gameplay facts and layout data exported. Original executable, Lua code, images and audio are excluded.','GUI-only helpers were stubbed when reading hero availability metadata; hero literal configuration is unmodified.']}
write('manifest.json',manifest)
print(json.dumps({'stages':len(stages),'heroes':len(metadata['hero_data']),'files':len(records),'output':str(out)},ensure_ascii=False))

