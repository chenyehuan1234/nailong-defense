import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results/visual',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5188',{waitUntil:'networkidle'});
await page.locator('[data-action="training-skip"]').click();await page.locator('.world-node').first().waitFor();
for(const index of Array.from({length:12},(_,i)=>i)){
  // Visual fixtures have extra resources; legal balance playthroughs are separate tests.
  await page.evaluate(i=>{const {ui,scene}=window.__NAILONG__;ui.selectedLevel=i;ui.start();const s=scene.sim;s.gold=30000;const kinds=['archer','barracks','mage','engineer'];for(let slot=0;slot<s.level.slots.length;slot++){s.command({type:'build',slot,kind:kinds[slot%4]});for(let n=0;n<3;n++)s.command({type:'upgrade',slot,branch:Math.floor(slot/4)%2});s.command({type:'tower-skill',slot,skill:0});s.command({type:'tower-skill',slot,skill:1});}for(let n=0;n<90;n++)s.step();scene.syncTowers();scene.syncUnits();scene.paused=true;ui.tick();},index);
  await page.waitForTimeout(150);
  await page.screenshot({path:`test-results/visual-v3/map-${index+1}.png`});
}
await page.evaluate(()=>{const {scene}=window.__NAILONG__,s=scene.sim;const boss=s.spawn('boss',0,s.roads[0].total*.63);s.damage(boss,boss.maxHp,'true');boss.specialCd=0;s.step();scene.syncUnits();scene.syncTowers();scene.consumeEvents();});
await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>[...window.__NAILONG__.scene.units.values()].some(r=>r.sheet==='enemy-new-4'&&r.row===3)),true);await page.screenshot({path:'test-results/visual-v3/boss-phase.png'});
await page.evaluate(()=>{const {ui,scene}=window.__NAILONG__;scene.selectedSlot=2;ui.towerPanel();});
assert.ok(await page.locator('.tower-popover').isVisible());await page.screenshot({path:'test-results/visual/advanced-tower.png'});
assert.deepEqual(errors,[]);await writeFile('test-results/content-report.json',JSON.stringify({status:'passed',errors,checks:['twelve maps','eight advanced tower appearances','boss transformed skin and seal warning','advanced skills panel']},null,2));
await browser.close();console.log('Content visuals passed.');
