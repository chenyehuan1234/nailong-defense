"""Export resolved property tables from the installed game, excluding executable code."""
import json,pathlib,hashlib
from reference_runtime import ReferenceRuntime,BOOTSTRAP
folder=pathlib.Path('content/reference/steam-24662480')
def clean(v):
 if isinstance(v,dict):return {str(k):clean(x) for k,x in v.items() if k not in ['render','sound_events','main_script','editor_script','ui','editor','info','health_bar'] and x!='<function/object>'}
 if isinstance(v,list):return [clean(x) for x in v if x!='<function/object>']
 return v
r=ReferenceRuntime()
try:
 r.execute(BOOTSTRAP)
 result=r.execute("""
 collectgarbage('stop')
 local result={};for key in pairs(E.entities) do
  local ok,t=pcall(E.get_template,E,key)
  if ok and type(t)=='table' then result[key]=t end
 end
 for _,key in ipairs({'enemy_lycan','enemy_halloween_zombie','eb_elder_shaman'}) do
  local ok,t=pcall(E.create_entity,E,key);if ok then result[key]=t end
 end
 return result
 """)
 (folder/'mechanics.json').write_text(json.dumps(clean(result),ensure_ascii=False,indent=2),encoding='utf8')
 print('Resolved gameplay templates:',len(result))
 manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
 existing=set(manifest['files'])
 for name in ['all/systems.lua','all/scripts.lua','kr1/game_templates.lua','kr1/game_scripts.lua','all/components.lua','all/constants.lua','kr1/upgrades.lua']:
  if name in r.z.namelist() and name not in existing:
   source=r.z.read(name);manifest['files'][name]={'bytes':len(source),'sha256':hashlib.sha256(source).hexdigest()}
 heroes=r.execute("""
 local result={}
 for _,name in ipairs({'gerald','alleria','malik','bolin','magnus','ignus','denas','elora','ingvar','hacksaw','oni','thor','10yr'}) do
  local key='hero_'..name;local entity=E:create_entity(key);local levels={}
  for level=1,10 do entity.hero.level=level;entity.hero.fn_level_up(entity,{tick_ts=0});levels[level]=table.deepclone(entity) end
  result[key]=levels
 end
 return result
 """)
 (folder/'hero-levels.json').write_text(json.dumps(clean(heroes),ensure_ascii=False,separators=(',',':')),encoding='utf8')
 upgrades=r.execute("local U=require('upgrades');return U")
 (folder/'upgrades.json').write_text(json.dumps(clean(upgrades),ensure_ascii=False,indent=2),encoding='utf8')
 manifest['notes']=list(dict.fromkeys(manifest['notes']+['Native spawn timing oracle executed with geometry/audio services stubbed; native path metadata and ordered coroutine schedules are exported separately. Three deterministic reference seeds recorded; no executable source distributed.']))
 (folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
finally:r.close()


