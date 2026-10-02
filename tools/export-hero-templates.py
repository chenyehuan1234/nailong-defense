"""Read-only observations of shared skill templates modified by native level-up."""
import json,pathlib
from reference_runtime import ReferenceRuntime,BOOTSTRAP

def clean(v):
 if isinstance(v,dict):return {str(k):clean(x) for k,x in v.items() if x!='<function/object>'}
 if isinstance(v,list):return [clean(x) for x in v if x!='<function/object>']
 return v

r=ReferenceRuntime()
try:
 r.execute(BOOTSTRAP)
 facts=r.execute("""
 collectgarbage('stop');local out={}
 for _,name in ipairs({'gerald','alleria','malik','bolin','magnus','ignus','denas','elora','ingvar','hacksaw','oni','thor','10yr'}) do
  local key='hero_'..name;local hero=E:create_entity(key);local levels={};out[key]=levels
  for level=1,10 do hero.hero.level=level;hero.hero.fn_level_up(hero,{tick_ts=0});local values={};levels[level]=values
   for k in pairs(E.entities) do if k~=key and string.find(k,name,1,true) then values[k]=table.deepclone(E:get_template(k)) end end
  end
 end
 return out
 """)
 pathlib.Path('content/reference/steam-24662480/hero-skill-templates.json').write_text(json.dumps(clean(facts),ensure_ascii=False,separators=(',',':')),encoding='utf8')
 print('Tenshi native rain loops:',[x['aura_10yr_fireball']['aura'].get('loops') for x in facts['hero_10yr']])
finally:r.close()
