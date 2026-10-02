import {chromium} from '@playwright/test';import fs from 'node:fs';import assert from 'node:assert/strict';
const reports=[];fs.mkdirSync('test-results/visual-v3',{recursive:true});
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[],missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 await page.goto('http://127.0.0.1:5188',{waitUntil:'networkidle'});await page.locator('[data-action="training-skip"]').click();assert.equal(await page.locator('.world-node').count(),12);assert.equal(await page.locator('.scout-enemies article').count(),2);await page.screenshot({path:`test-results/visual-v3/world-${channel}.png`});
 await page.locator('[data-action="book"]').click();assert.equal(await page.locator('.enemy-entry').count(),0);await page.locator('[data-action="close"]').click();
 await page.locator('[data-action="upgrades"]').click();assert.equal(await page.locator('.star-node').count(),30);await page.screenshot({path:`test-results/visual-v3/upgrades-${channel}.png`});await page.locator('[data-action="close"]').click();
 const training=[];
 for(let index=0;index<3;index++){
  await page.evaluate(i=>{window.__NAILONG__.ui.startTraining(i);window.__NAILONG__.scene.paused=true;},index);
  const report=await page.evaluate(index=>{
   const app=window.__NAILONG__,u=app.ui,s=app.sim,l=u.teaching,steps=new Set(),command=c=>{app.scene.paused=false;const ok=u.command(c);app.scene.paused=true;return ok;};
   for(let tick=0;tick<24000&&s.result==='playing';tick++){
    const id=l.current.id;steps.add(id);
    if(id==='archer')command({type:'build',slot:3,kind:'archer'});if(id==='range')l.selectedTower=true;if(id==='upgrade')command({type:'upgrade',slot:3});
    if(id==='barracks'){command({type:'build',slot:3,kind:'barracks'});command({type:'build',slot:4,kind:'archer'});}if(id==='rally')command({type:'rally',slot:3,point:s.nearestRoad({x:720,y:300}).point});if(id==='hero')command({type:'move-hero',point:s.towerAt(3).rally});if(id==='retreat'&&l.retreatAt<0)command({type:'move-hero',point:s.level.heroStart});if(id==='mage')command({type:'build',slot:5,kind:'mage'});if(id==='engineer')command({type:'build',slot:3,kind:'engineer'});if(id==='wave')command({type:'next-wave'});if(id==='reinforce')command({type:'cast',skill:'reinforce',point:s.towerAt(3).rally});if(id==='auto')command({type:'auto-wave',enabled:true});if(id==='speed')app.scene.speed=3;
    u.tick();if(tick%30===0){if(index===2){command({type:'upgrade',slot:5});command({type:'upgrade',slot:3});}if(index===1)command({type:'upgrade',slot:4});if(l.canStart()&&s.wave>0&&!s.spawns.length&&!s.enemies.length&&s.wave<s.level.waves.length&&!s.autoWave)command({type:'next-wave'});}
    s.step();app.scene.consumeEvents();
   }
   app.scene.syncTowers();app.scene.syncUnits();u.tick();u.result();return{index,result:s.result,step:l.current.id,lives:s.lives,steps:[...steps],gold:s.gold,metrics:s.metrics,stars:Object.values(u.save.scores).reduce((a,b)=>a+b.stars,0),completed:[...u.save.training.completed],discovered:[...u.save.discovered]};
  },index);assert.equal(report.result,'won');assert.equal(report.step,'finish');assert.equal(report.stars,0);assert.ok(report.discovered.length>0);training.push(report);
  await page.locator('[data-action="quit"]').count()?await page.locator('[data-action="quit"]').click():await page.evaluate(()=>window.__NAILONG__.ui.campaign());
 }
 await page.evaluate(()=>window.__NAILONG__.ui.startTraining(1));
 await page.mouse.click(645,339);await page.locator('[data-action="build"][data-kind="barracks"]').click();const panel=await page.locator('.tower-popover').boundingBox();const rallyPoint=await page.evaluate(box=>{const a=window.__NAILONG__,s=a.sim,t=s.towerAt(3),points=[];for(const road of s.roads)for(let d=0;d<road.total;d+=5){const p=road.at(d);if(p.x>box.x+8&&p.x<box.x+box.width-8&&p.y>box.y+8&&p.y<box.y+box.height-8&&Math.hypot(p.x-s.level.slots[3].x,p.y-s.level.slots[3].y)<s.stats(t).range)points.push(p);}return points[Math.floor(points.length/2)];},panel);assert.ok(rallyPoint);
 await page.locator('[data-action="rally"]').click();assert.equal(await page.locator('.tower-popover').count(),0);await page.mouse.click(20,700);assert.equal(await page.evaluate(()=>window.__NAILONG__.scene.mode),'rally');await page.mouse.click(rallyPoint.x,rallyPoint.y);assert.equal(await page.evaluate(()=>window.__NAILONG__.scene.mode),'');assert.equal(await page.locator('.tower-popover').count(),1);await page.locator('[data-action="rally"]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.tower-popover').count(),1);
 await page.locator('[data-action="close-tower"]').click();await page.locator('[data-action="select-hero"]').click();await page.mouse.click(800,275);assert.equal(await page.evaluate(()=>window.__NAILONG__.sim.hero.commanded),true);
 await page.locator('[data-action="speed"]').click();await page.locator('[data-action="speed"]').click();assert.equal(await page.locator('#speed').textContent(),'3×');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const time=await page.evaluate(()=>window.__NAILONG__.sim.time);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__NAILONG__.sim.time),time);await page.locator('[data-action="resume"]').click();
 await page.locator('[data-action="settings"]').click();assert.equal(await page.locator('[data-volume]').count(),4);await page.locator('[data-volume="musicVolume"]').fill('85');await page.locator('[data-action="close"]').click();await page.waitForTimeout(750);
 const audio=await page.evaluate(()=>({loaded:window.__NAILONG__.ui.audio.buffers.size,error:window.__NAILONG__.ui.audio.error,volume:window.__NAILONG__.ui.save.settings.musicVolume}));assert.equal(audio.loaded,36);assert.equal(audio.error,'');assert.equal(audio.volume,.85);
 await page.screenshot({path:`test-results/visual-v3/rally-${channel}.png`});await page.reload({waitUntil:'networkidle'});const saved=await page.evaluate(()=>window.__NAILONG__.ui.save);assert.equal(saved.training.completed.length,3);assert.ok(saved.discovered.includes('boar'));assert.equal(saved.settings.musicVolume,.85);
 // Workshop preview uses the same rules and leaves player discovery untouched.
 const discovered=[...saved.discovered];await page.locator('[data-action="editor"]').click();await page.locator('[data-action="editor-play"]').click();await page.locator('#next-wave').click();await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>window.__NAILONG__.ui.save.discovered),discovered);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);reports.push({browser:channel,status:'passed',training,rallyUnderOldPanel:true,rallyCancelAndInvalidPoint:true,heroCommandBeforeTowerPicking:true,speed3:true,blurPauses:true,audio,saveSurvivesReload:true,editorDoesNotUnlock:true,errors,missing});await browser.close();
}
fs.writeFileSync('test-results/experience-qa.json',JSON.stringify(reports,null,2));console.log('Experience browser QA passed:',reports.map(r=>r.browser));
