import {openCampaign,openBriefing} from './browser-onboarding.mjs';
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'http://127.0.0.1:5188/';
await mkdir('test-results/visual-v41',{recursive:true});
const reports=[];
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1600,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.stack??e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto(url,{waitUntil:'networkidle'});await openCampaign(page);
 await page.locator('[data-action="home"]').first().click();
 assert.match(await page.locator('.mobile-home-background').getAttribute('src'),/menu-home\.jpg$/);
 assert.equal(await page.locator('.hero-showcase').count(),0);await page.screenshot({path:`test-results/visual-v41/home-${channel}.png`});
 await page.locator('[data-action="campaign"]').click();
 await page.evaluate(async()=>{const a=window.__NAILONG__,{LEVELS}=await import('/content/levels.ts'),{scoreKey}=await import('/src/save.ts');for(const l of LEVELS)a.ui.save.scores[scoreKey('main',l.id)]={stars:3,lives:20,hero:'shield',difficulty:'normal'};a.ui.selectedLevel=3;a.ui.campaign(true);});
 // Inspect the formerly noninteractive paragraph/blank area, not just buttons.
 await page.mouse.move(1390,210);await page.mouse.wheel(0,600);await page.waitForTimeout(300);
 assert.ok(await page.locator('.expedition-v2').evaluate(el=>el.scrollTop)>50,'wheel over panel text should scroll');

 await page.locator('.compact-heroes').scrollIntoViewIfNeeded();await page.locator('.compact-heroes').evaluate(el=>el.scrollTop=0);
 const heroArea=await page.locator('.compact-heroes').boundingBox();await page.mouse.move(heroArea.x+116,heroArea.y+65);await page.mouse.wheel(0,160);await page.waitForTimeout(200);
 assert.ok(await page.locator('.compact-heroes').evaluate(el=>el.scrollTop)>30,'wheel over hero-list gaps should scroll');
 await page.locator('.expedition-v2').evaluate(el=>el.scrollTop=300);await page.locator('.compact-heroes').evaluate(el=>el.scrollTop=100);
 const before=await page.locator('.expedition-v2').evaluate(el=>el.scrollTop);
 await page.locator('[data-action="hero"][data-hero="ranger"]').click();
 assert.ok(Math.abs(await page.locator('.expedition-v2').evaluate(el=>el.scrollTop)-before)<5,'hero choice should retain side-panel position');
 await page.screenshot({path:`test-results/visual-v41/campaign-scroll-${channel}.png`});
 // Existing one-level work survives; all templates can be copied into it.
 await page.evaluate(async()=>{const w=await import('/src/workshop.ts');const c=w.newCampaign(false);c.name='原有作品';c.levels[0].gold=345;await w.saveDraft(c);});
 await page.locator('[data-action="editor"]').click();await page.locator('.editor-floating').waitFor();
 assert.equal(await page.locator('[data-work="level-index"] option').count(),1);
 assert.equal(await page.locator('[data-work="reference-level"] option').count(),26);
 await page.locator('[data-work="reference-level"]').selectOption('25');await page.locator('[data-action="work-add-template"]').click();await page.waitForFunction(()=>document.querySelector('[data-work="level-index"]').options.length===2);
 assert.equal(await page.locator('[data-work="level-index"] option').count(),2);
 assert.equal(await page.evaluate(async()=>window.__NAILONG__.ui.editorLevel.map),'map-26');
 await page.locator('[data-work="gold"]').fill('777');await page.locator('[data-work="gold"]').dispatchEvent('change');
 await page.locator('[data-work="level-index"]').selectOption('0');await page.waitForFunction(()=>document.querySelector('[data-work="gold"]').value==='345');assert.equal(await page.locator('[data-work="gold"]').inputValue(),'345');
 await page.locator('[data-work="level-index"]').selectOption('1');await page.waitForFunction(()=>document.querySelector('[data-work="gold"]').value==='777');assert.equal(await page.locator('[data-work="gold"]').inputValue(),'777');
 // Editor fields retain native text selection for copying.
 const nameInput=page.locator('[data-work="name"]');await nameInput.click();await nameInput.press('Control+a');
 assert.ok(await nameInput.evaluate(el=>el.selectionEnd>el.selectionStart),'editable names should retain native selection');
 await page.locator('summary').filter({hasText:'波次 JSON'}).click();
 const jsonArea=page.locator('#editor-waves');await jsonArea.click();await jsonArea.press('Home');await jsonArea.press('Shift+ArrowRight');
 assert.ok(await jsonArea.evaluate(el=>el.selectionEnd>el.selectionStart),'JSON should remain selectable for copying');
 await jsonArea.press('ArrowLeft');
 // Replace and undo within the current level, without editing level one.
 await page.locator('[data-work="reference-level"]').selectOption('17');await page.locator('[data-action="work-use-template"]').click();await page.waitForFunction(()=>window.__NAILONG__.ui.editorLevel.map==='map-18');
 assert.equal(await page.evaluate(async()=>window.__NAILONG__.ui.editorLevel.map),'map-18');
 await page.locator('[data-action="editor-undo"]').click();await page.waitForFunction(()=>window.__NAILONG__.ui.editorLevel.map==='map-26');assert.equal(await page.evaluate(async()=>window.__NAILONG__.ui.editorLevel.map),'map-26');
 const header=await page.locator('.editor-drag-handle').boundingBox();
 await page.mouse.move(header.x+100,header.y+20);await page.mouse.down();await page.mouse.move(header.x-650,header.y+55,{steps:15});await page.mouse.up();
 let rect=await page.locator('.editor-floating').boundingBox();assert.ok(rect.x<600,'panel should move to the left');
 await page.locator('[data-action="editor-mode"][data-mode="slots"]').click();
 const slots=await page.evaluate(async()=>window.__NAILONG__.ui.editorLevel.slots.length);
 await page.mouse.click(1450,730);assert.equal(await page.evaluate(async()=>window.__NAILONG__.ui.editorLevel.slots.length),slots+1,'right-side map area should be usable after moving panel');
 await page.screenshot({path:`test-results/visual-v41/workshop-drag-${channel}.png`});
 await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(100);
 const position=await page.evaluate(async()=>({...window.__NAILONG__.ui.editorPanelPosition})),scaled=await page.locator('.editor-drag-handle').boundingBox();
 await page.mouse.move(scaled.x+60,scaled.y+20);await page.mouse.down();await page.mouse.move(scaled.x+220,scaled.y+60,{steps:10});await page.mouse.up();
 const moved=await page.evaluate(async()=>window.__NAILONG__.ui.editorPanelPosition);assert.ok(Math.abs(moved.x-position.x-200)<5,'scaled drag should stay in game coordinates');
 await page.setViewportSize({width:1600,height:900});await page.waitForTimeout(600);
 await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="editor"]').click();await page.locator('[data-work="level-index"]').waitFor();
 assert.equal(await page.locator('[data-work="level-index"] option').count(),2);await page.locator('[data-work="level-index"]').selectOption('1');await page.waitForFunction(()=>document.querySelector('[data-work="gold"]').value==='777');assert.equal(await page.locator('[data-work="gold"]').inputValue(),'777');
 // Deterministic, isolated actors for hit testing; no player's save or campaign is altered.
 await page.evaluate(async()=>{const a=window.__NAILONG__;a.ui.trainingIndex=-1;a.ui.save.hero='shield';a.ui.selectedLevel=3;await a.ui.start();const s=a.sim;s.gold=300;s.command({type:'build',slot:0,kind:'barracks'});const e=s.spawn('boar',0,200);e.x=740;e.y=480;e.immobileUntil=Infinity;const soldier=s.allies.find(f=>f.tower===0);soldier.x=930;soldier.y=660;soldier.stunnedUntil=Infinity;s.hero.x=1060;s.hero.y=475;s.hero.stunnedUntil=Infinity;a.scene.syncUnits();window.qaActors={enemy:e.id,soldier:soldier.id,hero:s.hero.id};});
 // Reproduce left-button dragging across both the title and the battle tip.
 for(const label of ['.battle-title strong','#battle-tip']){
  await page.evaluate(async()=>window.getSelection()?.removeAllRanges());
  const bounds=await page.locator(label).boundingBox();
  await page.mouse.move(bounds.x+8,bounds.y+bounds.height/2);await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width-8,bounds.y+bounds.height/2,{steps:15});await page.mouse.up();
  assert.equal(await page.evaluate(async()=>window.getSelection()?.toString()??''),'',label+' should not be drag-selected');
 }
 await page.screenshot({path:`test-results/visual-v41/no-text-selection-${channel}.png`});
 const clickActor=async kind=>{const p=await page.evaluate(kind=>{const a=window.__NAILONG__,r=a.scene.units.get(window.qaActors[kind]).root.getBounds();return{x:r.centerX,y:r.centerY};},kind);await page.mouse.click(p.x,p.y);await page.locator('.unit-info').waitFor();};
 await clickActor('enemy');assert.equal(await page.locator('.unit-info').getAttribute('data-side'),'enemy');
 await page.evaluate(async()=>{const a=window.__NAILONG__,e=a.sim.enemies.find(e=>e.id===window.qaActors.enemy);e.hp=75;e.armor=.12;});await page.waitForTimeout(150);
 assert.match(await page.locator('[data-unit="hp"]').textContent(),/^75 \/ /);assert.match(await page.locator('.unit-info-stats').textContent(),/12%/);
 await page.screenshot({path:`test-results/visual-v41/enemy-info-${channel}.png`});
 await clickActor('soldier');assert.match(await page.locator('[data-unit="name"]').textContent(),/卫兵/);
 await clickActor('hero');assert.match(await page.locator('[data-unit="category"]').textContent(),/英雄/);assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.heroSelected),true);
 await page.mouse.click(1140,610);assert.equal(await page.evaluate(async()=>window.__NAILONG__.sim.hero.commanded),true);
 await page.evaluate(async()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(150);
 assert.equal(await page.locator('.pause-modal').count(),0);assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),false);assert.equal(await page.evaluate(async()=>window.__NAILONG__.ui.audio.focused),true);
 const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await page.waitForTimeout(200);await page.bringToFront();await other.close();await page.waitForTimeout(200);
 assert.equal(await page.locator('.pause-modal').count(),0);assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),false);
 await page.locator('[data-action="pause"]').last().click();await page.locator('.pause-modal').waitFor();assert.equal(await page.evaluate(async()=>window.__NAILONG__.scene.paused),true);await page.locator('[data-action="resume"]').click();
 await clickActor('enemy');await page.evaluate(async()=>{const a=window.__NAILONG__,e=a.sim.enemies.find(e=>e.id===window.qaActors.enemy);a.sim.damage(e,99999,'true');});await page.waitForTimeout(150);assert.equal(await page.locator('.unit-info').count(),0);
 assert.deepEqual(errors,[]);reports.push({browser:channel,status:'passed',dragDoesNotSelectLabels:true,editableTextSelection:true,textAreaScrolling:true,selectionScrollRetained:true,nestedHeroScrolling:true,templates:26,multiLevelEditsSaved:true,templateUndo:true,draggablePanel:true,scaledDragging:true,uncoveredRightMap:true,liveActorInspection:true,blurDoesNotPause:true,explicitPauseWorks:true,newHomeArt:true,errors});
 console.log(channel+' interaction v4.1 passed');await browser.close();
}
await writeFile('test-results/interaction-v41.json',JSON.stringify(reports,null,2));
