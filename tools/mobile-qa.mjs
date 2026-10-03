import {openCampaign,openBriefing} from './browser-onboarding.mjs';
import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'http://127.0.0.1:5188/';
await mkdir('test-results/mobile',{recursive:true});
const cases=[{name:'iphone',width:844,height:390},{name:'android-small',width:667,height:375},{name:'tablet',width:1024,height:768}];
const reports=[];
for(const browserKind of process.env.WEBKIT_ONLY?[webkit]:[chromium]){
 const browser=await browserKind.launch(browserKind===chromium?{channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}});
 for(const device of cases){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:1,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.stack??e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  const prefix=browserKind.name()+'-'+device.name;
  await page.goto(url,{waitUntil:'networkidle'});await openCampaign(page,true);
  assert.equal(await page.evaluate(async()=>document.documentElement.classList.contains('mobile')),true);
  await page.screenshot({path:`test-results/mobile/${prefix}-campaign.png`});
  await page.locator('[data-action="settings"]').tap();await page.locator('.settings-modal').waitFor();
  assert.ok((await page.locator('.settings-modal').boundingBox()).width<=device.width);
  await page.locator('[data-volume="musicVolume"]').fill('81');await page.locator('[data-volume="musicVolume"]').dispatchEvent('change');
  await page.locator('[data-action="close"]').tap();
  await page.locator('[data-action="upgrades"]').tap();await page.locator('.upgrade-modal').waitFor();await page.screenshot({path:`test-results/mobile/${prefix}-upgrades.png`});await page.locator('[data-action="close"]').tap();
  await openBriefing(page,true);await page.locator('[data-action="start"]').tap();await page.locator('.battle-hud').waitFor();
  const worldTap=async(x,y)=>{const r=await page.locator('#canvas canvas').boundingBox();await page.touchscreen.tap(r.x+x*r.width/1600,r.y+y*r.height/900);};
  await worldTap(645,568);await page.locator('.tower-popover').waitFor();
  const popover=await page.locator('.tower-popover').boundingBox();assert.ok(popover.x>=0&&popover.x+popover.width<=device.width+1&&popover.y>=0&&popover.y+popover.height<=device.height+1,'tower panel stays onscreen');
  await page.locator('[data-action="build"][data-kind="archer"]').tap();assert.equal(await page.evaluate(async()=>window.__NAILONG__.sim.towers[0].kind),'archer');
  await page.screenshot({path:`test-results/mobile/${prefix}-tower.png`});await page.locator('[data-action="close-tower"]').tap();
  // No offscreen control or scaled-down desktop touch target.
  for(const selector of ['[data-action="auto-wave"]','[data-action="speed"]','.battle-tools [data-action="pause"]','#next-wave','[data-skill="reinforce"]','[data-skill="meteor"]']){
   const r=await page.locator(selector).boundingBox();assert.ok(r.width>=43.5&&r.height>=43.5&&r.x>=0&&r.x+r.width<=device.width+1&&r.y+r.height<=device.height+1,selector+' has a visible 44px touch target');
  }
  await page.locator('#next-wave').tap();assert.equal(await page.evaluate(async()=>window.__NAILONG__.sim.wave),1);
  await page.locator('[data-action="speed"]').tap();await page.locator('[data-action="speed"]').tap();assert.equal(await page.locator('#speed').textContent(),'3×');
  await page.screenshot({path:`test-results/mobile/${prefix}-battle.png`});
  await page.setViewportSize({width:device.height,height:device.width});await page.locator('#rotate-hint').waitFor({state:'visible'});assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),true);
  const time=await page.evaluate(async()=>window.__NAILONG__.sim.time);await page.waitForTimeout(150);assert.equal(await page.evaluate(async()=>window.__NAILONG__.sim.time),time);
  await page.screenshot({path:`test-results/mobile/${prefix}-rotate.png`});
  await page.setViewportSize({width:device.width,height:device.height});await page.locator('#rotate-hint').waitFor({state:'hidden'});assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),false);
  await page.locator('.battle-tools [data-action="pause"]').tap();await page.locator('.pause-modal').waitFor();await page.setViewportSize({width:device.height,height:device.width});await page.setViewportSize({width:device.width,height:device.height});await page.waitForTimeout(100);assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),true);await page.locator('[data-action="resume"]').tap();
  await page.locator('.battle-tools [data-action="pause"]').tap();await page.locator('[data-action="quit"]').tap();
  // Isolated fourth-stage fixture adds heroes and unlocked powers for touch tests.
  await page.evaluate(async()=>{const a=window.__NAILONG__,{LEVELS}=await import('/content/levels.ts'),{scoreKey}=await import('/src/save.ts');for(const l of LEVELS.slice(0,3))a.ui.save.scores[scoreKey('main',l.id)]={stars:3,lives:20,hero:'shield',difficulty:'normal'};a.ui.selectedLevel=3;await a.ui.start();a.sim.gold=800;a.sim.cooldowns.reinforce=0;});
  await page.locator('[data-skill="reinforce"]').tap();await page.locator('.mobile-cancel').waitFor();await page.locator('.mobile-cancel').tap();assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.mode),'');
  await page.locator('[data-action="select-hero"]').tap();assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.heroSelected),true);assert.equal(await page.locator('[data-action="unit-details"]').count(),0);assert.match(await page.locator('#unit-inspector').textContent(),/物抗/);assert.match(await page.locator('#unit-inspector').textContent(),/魔抗/);
  await page.screenshot({path:`test-results/mobile/${prefix}-unit-hero.png`});
  await worldTap(1050,640);assert.equal(await page.evaluate(async()=>window.__NAILONG__.sim.hero.commanded),true);await page.locator('.mobile-cancel').tap();
  const site=await page.evaluate(async()=>window.__NAILONG__.sim.level.slots[0]);await worldTap(site.x,site.y);await page.locator('[data-action="build"][data-kind="barracks"]').tap();await page.locator('[data-action="rally"]').tap();assert.equal(await page.locator('.tower-popover').count(),0);
  const rally=await page.evaluate(async()=>window.__NAILONG__.sim.towers[0].rally);await worldTap(rally.x,rally.y);assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.mode),'');await page.locator('.tower-popover').waitFor();await page.locator('[data-action="close-tower"]').tap();
  await page.screenshot({path:`test-results/mobile/${prefix}-hero.png`});
  const soldier=await page.evaluate(async()=>{const a=window.__NAILONG__.sim.allies.find(a=>a.kind==='soldier');return{x:a.x,y:a.y-20};});await worldTap(soldier.x,soldier.y);await page.locator('.unit-info[data-side="ally"]').waitFor();assert.match(await page.locator('#unit-inspector').textContent(),/魔抗/);await page.screenshot({path:`test-results/mobile/${prefix}-unit-soldier.png`});
  await page.evaluate(async()=>{const a=window.__NAILONG__,e=a.sim.spawn('boar',0,400);e.immobileUntil=Infinity;a.scene.syncUnits();window.mobileEnemy={x:e.x,y:e.y-20};});const enemy=await page.evaluate(async()=>window.mobileEnemy);await worldTap(enemy.x,enemy.y);await page.locator('.unit-info[data-side="enemy"]').waitFor();assert.match(await page.locator('#unit-inspector').textContent(),/物抗/);await page.screenshot({path:`test-results/mobile/${prefix}-unit-enemy.png`});
  await page.locator('.battle-tools [data-action="settings"]').tap();assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),true);await page.locator('[data-action="close"]').tap();assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),false);
  await page.locator('.battle-tools [data-action="pause"]').tap();await page.locator('[data-action="quit"]').tap();
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.screenshot({path:`test-results/mobile/${prefix}-portrait-menu.png`});
  await openBriefing(page,true);assert.equal(await page.locator('[data-level-select]').isVisible(),true);
  assert.ok(await page.evaluate(async()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:device.width,height:device.height});await page.locator('[data-action="editor"]').tap();await page.locator('.editor-floating').waitFor();
  await page.locator('[data-work="level-index"]').selectOption('3');await page.waitForFunction(()=>window.__NAILONG__.ui.editorLevel.map==='map-04');assert.equal(await page.evaluate(async()=>window.__NAILONG__.ui.editorLevel.map),'map-04');
  const handle=await page.locator('.editor-drag-handle').boundingBox(),origin=await page.locator('.editor-floating').boundingBox();
  if(browserKind===chromium){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:handle.x+65,y:handle.y+20}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:handle.x-75,y:handle.y+20}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await page.mouse.move(handle.x+65,handle.y+20);await page.mouse.down();await page.mouse.move(handle.x-75,handle.y+20,{steps:10});await page.mouse.up();}
  const floating=await page.locator('.editor-floating').boundingBox();assert.ok(floating.x<origin.x-50&&floating.x>=0&&floating.x+floating.width<=device.width+1,'workshop panel drags inside the mobile viewport');
  await page.screenshot({path:`test-results/mobile/${prefix}-workshop.png`});
  assert.deepEqual(errors,[]);reports.push({browser:browserKind.name(),device:device.name,status:'passed',touchBuild:true,screenCoordinatesCorrect:true,controls44px:true,panelsInViewport:true,touchSkillCancel:true,touchHeroMovement:true,unitStatsVisible:true,touchRally:true,wavesAndSpeed:true,rotationPausesAndResumes:true,manualPauseSurvivesRotation:true,portraitMenu:true,mobileWorkshop:true,errors});
  console.log(prefix+' mobile passed');await context.close();
 }
 await browser.close();
}
await writeFile(`test-results/mobile${process.env.WEBKIT_ONLY?'-webkit':''}.json`,JSON.stringify(reports,null,2));
