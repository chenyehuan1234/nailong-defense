"""Observe Legion copy budgets using the installed read-only script; no native code export."""
import json,pathlib
from reference_runtime import ReferenceRuntime,BOOTSTRAP
r=ReferenceRuntime()
try:
 r.execute(BOOTSTRAP)
 result=r.execute("""
 local f=E.entities.enemy_demon_legion.main_script.update
 debug.setupvalue(f,1,{is_node_valid=function()return true end,nodes_to_defend_point=function()return 100 end})
 debug.setupvalue(f,2,{queue=function()end})
 local wait=function()coroutine.yield();return false end
 debug.setupvalue(f,3,{animation_name_facing_point=function()return 'idle' end,y_animation_play=wait,animation_start=function()end,y_enemy_death=function()end,y_enemy_stun=wait,y_enemy_wait=wait,y_enemy_animation_wait=wait})
 debug.setupvalue(f,4,{y_enemy_animation_wait=wait,y_enemy_wait=wait,y_enemy_mixed_walk_melee_ranged=function()coroutine.yield();return false,false end})
 local out={}
 for generation=0,2 do
  local trace={};debug.setupvalue(f,6,function(store,e)trace[#trace+1]={seconds=store.tick_ts,hp=e.health.hp,generation=e.timed_attacks.list[1].generation,summoned=e._summoned};end)
  local e=E:create_entity('enemy_demon_legion');e.pos={x=100,y=100};e.health.hp=200;e.nav_path={pi=1,spi=1,ni=20};e.timed_attacks.list[1].generation=generation;local store={tick_ts=0,entities={}}
  local co=coroutine.create(f);debug.sethook(co,function()error('Instruction budget')end,'',100000)
  for tick=0,1800 do store.tick_ts=tick/30;local ok,err=coroutine.resume(co,e,store);assert(ok,tostring(err)) end
  out[tostring(generation)]={copies=trace,remaining=e.timed_attacks.list[1].count}
 end
 return out
 """)
 print(json.dumps(result,ensure_ascii=False))
 pathlib.Path('content/reference/steam-24662480/legion-observation.json').write_text(json.dumps(result,indent=2),encoding='utf8')
finally:r.close()

