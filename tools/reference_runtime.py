import ctypes,os,zipfile,json,re
root=r'D:\steam\steamapps\common\Kingdom Rush'
with os.add_dll_directory(root):lua=ctypes.CDLL(os.path.join(root,'lua51.dll'))
P=ctypes.c_void_p
for name,args,ret in [('luaL_newstate',[],P),('luaL_loadbuffer',[P,ctypes.c_char_p,ctypes.c_size_t,ctypes.c_char_p],ctypes.c_int),('lua_pcall',[P,ctypes.c_int,ctypes.c_int,ctypes.c_int],ctypes.c_int),('lua_type',[P,ctypes.c_int],ctypes.c_int),('lua_gettop',[P],ctypes.c_int),('lua_settop',[P,ctypes.c_int],None),('lua_pushnil',[P],None),('lua_next',[P,ctypes.c_int],ctypes.c_int),('lua_tolstring',[P,ctypes.c_int,ctypes.POINTER(ctypes.c_size_t)],P),('lua_tonumber',[P,ctypes.c_int],ctypes.c_double),('lua_toboolean',[P,ctypes.c_int],ctypes.c_int),('lua_close',[P],None),('luaL_openlibs',[P],None)]:f=getattr(lua,name);f.argtypes=args;f.restype=ret
def val(L,i,dep=0):
 if dep>40: return '<depth-limit>'
 lua.lua_checkstack(L,8)
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

lua.lua_createtable.argtypes=[P,ctypes.c_int,ctypes.c_int]
lua.lua_checkstack.argtypes=[P,ctypes.c_int]
lua.lua_checkstack.restype=ctypes.c_int
lua.lua_pushlstring.argtypes=[P,ctypes.c_char_p,ctypes.c_size_t]
lua.lua_setfield.argtypes=[P,ctypes.c_int,ctypes.c_char_p]
lua.lua_getfield.argtypes=[P,ctypes.c_int,ctypes.c_char_p]
class ReferenceRuntime:
 def __init__(self):
  self.z=zipfile.ZipFile(os.path.join(root,'Kingdom Rush.exe'))
  self.L=lua.luaL_newstate();lua.luaL_openlibs(self.L)
  lua.lua_createtable(self.L,0,400)
  for name in self.z.namelist():
   if not name.endswith('.lua') or name.startswith('_assets/'):continue
   data=self.z.read(name);lua.lua_pushlstring(self.L,data,len(data));lua.lua_setfield(self.L,-2,name.encode())
  lua.lua_setfield(self.L,-10002,b'__files')
 def execute(self,code):
  lua.lua_settop(self.L,0);code=code.encode() if isinstance(code,str) else code
  e=lua.luaL_loadbuffer(self.L,code,len(code),b'reference-reader');e=e or lua.lua_pcall(self.L,0,1,0)
  if e:raise RuntimeError(val(self.L,-1))
  return val(self.L,-1)
 def close(self):lua.lua_close(self.L);self.z.close()
BOOTSTRAP="""
KR_GAME='kr1';KR_TARGET='desktop'
local native_require=require
native_require('jit').off()
local cache={bit=native_require('bit')}
os=nil;io=nil;dofile=nil;loadfile=nil
local dummy={}
setmetatable(dummy,{__index=function() return dummy end,__call=function() return dummy end,__add=function() return 0 end,__sub=function() return 0 end,__mul=function() return 0 end,__div=function() return 0 end,__concat=function() return '' end})
love={graphics={getDimensions=function() return 1024,768 end},system={getOS=function() return 'Windows' end},timer={getTime=function() return 0 end}}
require=function(name)
 if cache[name]~=nil then return cache[name] end
 if name=='love.graphics' then return love.graphics
 elseif name=='image_db' then
  return {image_size=function() return {x=192,y=192} end,ref_h=768,ref_w=1024}
 elseif name=='sound_db' or name=='klua.log' or name=='animation_db' or name=='signal' or name=='hump.signal' then return dummy end
 local paths={'kr1/'..name:gsub('%.','/')..'.lua','all/'..name:gsub('%.','/')..'.lua','lib/'..name:gsub('%.','/')..'.lua','kr1-desktop/'..name:gsub('%.','/')..'.lua','all-desktop/'..name:gsub('%.','/')..'.lua',name:gsub('%.','/')..'.lua'}
 for _,path in ipairs(paths) do
  local source=__files[path]
  if source then
   cache[name]=true
   local result=assert(loadstring(source,'@'..path))()
   if result~=nil then cache[name]=result end
   return cache[name]
  end
 end
 error('Missing read-only reference module: '..name)
end
require('constants')
E=require('entity_db')
E.components={};E.entities={};E.templates={}
require('components')
T=require('templates')
GT=require('game_templates')
local keys={};for k in pairs(E) do keys[#keys+1]=k end
return {entityKeys=keys,templateModule=type(T),gameModule=type(GT)}
"""
if __name__=='__main__':
 r=ReferenceRuntime()
 try:
  data=r.execute(BOOTSTRAP)
  print(json.dumps(data,ensure_ascii=False)[:6000])
 finally:r.close()

