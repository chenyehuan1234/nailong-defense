"""Developer-only read-only inspection of resolved reference function literals."""
import sys,json
from reference_runtime import ReferenceRuntime,BOOTSTRAP
r=ReferenceRuntime()
try:
 r.execute("J=require('jit.util');"+BOOTSTRAP)
 mode=sys.argv[1] if len(sys.argv)>1 else 'waves'
 if mode=='wave-child':
  print(json.dumps(r.execute("local f=require('systems').wave_spawn.init;local out={};local info=J.funcinfo(f);for i=-1,-info.gcconsts,-1 do local v=J.funck(f,i);local ok,ii=pcall(J.funcinfo,v);if ok then local t={info=ii,strings={},numbers={}};for j=-1,-t.info.gcconsts,-1 do local q=J.funck(v,j);t.strings[#t.strings+1]=q end;for j=0,t.info.nconsts-1 do t.numbers[#t.numbers+1]=J.funck(v,j) end;out[#out+1]=t end end;return out"),ensure_ascii=False,indent=2))
  sys.exit(0)
 if mode=='waves':
  print(json.dumps(r.execute("local out={};for k,f in pairs(require('systems').wave_spawn) do if type(f)=='function' then local t={info=J.funcinfo(f),upvalues={},literals={}};for i=1,40 do local n,v=debug.getupvalue(f,i);if not n then break end;t.upvalues[i]={n,type(v)} end;for i=-1,-t.info.gcconsts,-1 do t.literals[#t.literals+1]=J.funck(f,i) end;out[k]=t end end;return out"),ensure_ascii=False,indent=2))
 elif mode=='files':print('\n'.join(n for n in r.z.namelist() if n.endswith('.lua') and ('spawner' in n or '/levels/level' in n and '_data' not in n and '_grid' not in n and '_paths' not in n)))
 elif mode=='function':
  name=sys.argv[2];prop=sys.argv[3] if len(sys.argv)>3 else 'main_script.update'
  source=f"require('{name[7:]}')" if name.startswith('module:') else f"E.entities['{name}']"
  print(json.dumps(r.execute(f"local f={source};for k in string.gmatch('{prop}','[^.]+') do f=f[k] end;local t={{info=J.funcinfo(f),upvalues={{}},strings={{}},numbers={{}}}};for i=1,40 do local n,v=debug.getupvalue(f,i);if not n then break end;t.upvalues[i]={{n,type(v)}} end;for i=-1,-t.info.gcconsts,-1 do local v=J.funck(f,i);if type(v)~='function' then t.strings[#t.strings+1]=v end end;for i=0,t.info.nconsts-1 do t.numbers[#t.numbers+1]=J.funck(f,i) end;return t"),ensure_ascii=False,indent=2))
finally:r.close()
