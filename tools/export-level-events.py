"""Export declarative extra-spawn tables and literal reference metadata."""
import json,hashlib,pathlib
from reference_runtime import ReferenceRuntime,BOOTSTRAP
folder=pathlib.Path('content/reference/steam-24662480')
r=ReferenceRuntime()
def clean(v):
 if isinstance(v,dict):return {str(k):clean(x) for k,x in v.items() if x!='<function/object>'}
 if isinstance(v,list):return [clean(x) for x in v if x!='<function/object>']
 return v
try:
 r.execute("J=require('jit.util');"+BOOTSTRAP)
 result={};manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
 for name in r.z.namelist():
  if not name.startswith('kr1/data/levels/') or not name.endswith('.lua') or name.endswith(('_data.lua','_paths.lua','_grid.lua')):continue
  raw=r.z.read(name);manifest['files'][name]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
  try:
   data=r.execute("collectgarbage('stop');return assert(loadstring(__files['"+name+"']))()")
   result[name]=clean(data)
  except Exception as e:result[name]={'inspectionError':str(e)}
 (folder/'level-events.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 (folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(result,ensure_ascii=False)[:6000])
finally:r.close()
