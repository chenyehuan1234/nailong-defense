import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
fs.mkdirSync('test-results/visual-v3',{recursive:true});
const reports=[];
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1600,height:900},...(channel==='chrome'?{recordVideo:{dir:'test-results/video-v3',size:{width:1600,height:900}}}:{})});
 const page=await context.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 await page.goto('http://127.0.0.1:5188',{waitUntil:'networkidle'});await page.locator('[data-action="training-skip"]').click();
 // Visual fixtures deliberately use extra resources; balance tests use legal gold and stars.
 const appearances=await page.evaluate(()=>{
  const a=window.__NAILONG__;a.ui.selectedLevel=11;a.ui.start();const s=a.sim;s.gold=50000;s.lives=999;s.wave=10;
  const families=['archer','barracks','mage','engineer'];
  for(let slot=0;slot<8;slot++){s.command({type:'build',slot,kind:families[Math.floor(slot/2)]});for(let i=0;i<3;i++)s.command({type:'upgrade',slot,branch:slot%2});for(let skill=0;skill<2;skill++)s.command({type:'tower-skill',slot,skill});}
  for(let slot=8;slot<Math.min(16,s.level.slots.length);slot++){s.command({type:'build',slot,kind:families[(slot-8)%4]});for(let i=0;i<Math.floor((slot-8)/4)+1;i++)s.command({type:'upgrade',slot});}
  for(let path=0;path<s.roads.length;path++)for(let i=0;i<24;i++){const e=s.spawn(i%6===0?'bat':i%3===0?'boar':'mushroom',path,s.roads[path].total*(.25+(i%12)*.035));e.hp=e.maxHp=3000;}
  a.scene.syncTowers();a.scene.syncUnits();a.ui.tick();return s.towers.map(t=>({kind:t.kind,level:t.level,branch:t.branch}));
 });
 assert.equal(appearances.filter(t=>t.branch>=0).length,8);
 const speeds=[];
 for(const speed of [1,3]){await page.evaluate(n=>{window.__NAILONG__.scene.speed=n;window.__NAILONG__.ui.tick();},speed);await page.waitForTimeout(1700);await page.screenshot({path:`test-results/visual-v3/combat-${speed}x-${channel}.png`});speeds.push(await page.evaluate(()=>{const a=window.__NAILONG__;return{speed:a.scene.speed,shots:a.sim.events.filter(e=>e.type==='shot').length,impacts:a.sim.events.filter(e=>e.type==='impact').length,loaded:a.ui.audio.buffers.size};}));}
 // Dedicated boss HUD, freeze counts and removable seal remain visible and interactive.
 await page.evaluate(()=>{const a=window.__NAILONG__,s=a.sim;s.spawn('boss',0,s.roads[0].total*.35);s.damage(s.enemies.at(-1),s.enemies.at(-1).maxHp,'true');s.towerAt(0).iceClicks=5;s.towerAt(0).disabledUntil=s.time+20;s.towerAt(1).sealAt=s.time+4;a.scene.consumeEvents();a.ui.tick();});
 assert.match(await page.locator('#boss-hud').textContent(),/第二形态/);await page.screenshot({path:`test-results/visual-v3/boss-${channel}.png`});
 const walk=await page.evaluate(()=>{const a=window.__NAILONG__,s=a.sim,r=a.scene.units.get(s.hero.id),frames=[];for(const facing of [0,1,2])for(const walkDistance of [0,15,30,45,60,75]){r.draw({...s.hero,hp:100,moving:true,anim:'walk',facing,walkDistance},s.time);frames.push([r.body.texture.key,r.body.frame.name]);}return frames;});assert.equal(new Set(walk.map(v=>v.join('/'))).size,18);
 await page.evaluate(()=>window.__NAILONG__.ui.campaign());await page.locator('[data-action="home"]').click();await page.locator('[data-action="art"]').click();assert.equal(await page.evaluate(()=>window.__NAILONG__.scene.artEntries.length),50);
 for(let i=0;i<4;i++){await page.evaluate(()=>window.__NAILONG__.scene.artClock=3.3);await page.waitForTimeout(150);await page.screenshot({path:`test-results/visual-v3/animation-${i}-${channel}.png`});if(i<3)await page.locator('[data-action="art-page"][data-delta="1"]').click();}
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);reports.push({browser:channel,appearances,speeds,heroWalkDirections:3,heroWalkFramesPerDirection:6,animationEntries:50,bossPhaseHud:true,errors,missing});
 await context.close();await browser.close();
}
// Real old-save migration followed by an actual UI export/import, without touching the user's profile.
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage();
const old={version:2,hero:'ranger',scores:{'main:stage-01:campaign':{stars:3,lives:20,hero:'ranger',difficulty:'normal'}},upgrades:{archer:1},settings:{sound:true,music:false}};
await page.addInitScript(value=>{if(!localStorage.getItem('nailong-defense.save.v2'))localStorage.setItem('nailong-defense.save.v2',JSON.stringify(value));},old);
await page.goto('http://127.0.0.1:5188',{waitUntil:'networkidle'});const migrated=await page.evaluate(()=>window.__NAILONG__.ui.save);assert.equal(migrated.version,3);assert.equal(migrated.training.dismissed,true);assert.equal(migrated.hero,'ranger');assert.ok(migrated.discovered.length>0&&migrated.discovered.length<38);assert.ok(!migrated.discovered.includes('boss'));assert.equal(await page.locator('[data-action="training-skip"]').count(),0);
await page.locator('[data-action="settings"]').click();const pending=page.waitForEvent('download');await page.locator('[data-action="export-save"]').click();const download=await pending;await download.saveAs('test-results/export-v3.json');await page.locator('#import-save').setInputFiles('test-results/export-v3.json');await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>window.__NAILONG__.ui.save.discovered),migrated.discovered);assert.ok(await page.evaluate(()=>localStorage.getItem('nailong-defense.save.v2')));await browser.close();
fs.writeFileSync('test-results/combat-presentation.json',JSON.stringify({reports,v2MigrationAndV3RoundTrip:true},null,2));console.log('Combat presentation, directional frames, boss and save roundtrip passed.');
