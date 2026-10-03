import {chromium,webkit} from '@playwright/test';
import {openCampaign,openBriefing} from './browser-onboarding.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'http://127.0.0.1:5188/';
await mkdir('test-results/startup',{recursive:true});const reports=[];
for(const kind of [chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost,chenyehuan1234.github.io'}});
 const make=async()=>{const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});page.setDefaultTimeout(60000);return page;};
 // A cold homepage must work even if every battle image is unavailable.
 let page=await make(),failed=true,requests=[],errors=[];
 page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/assets/**',async route=>{const path=new URL(route.request().url()).pathname;return failed&&(/\/map-\d+\.webp$/.test(path)||/\/(?:heroes|soldiers|enemies|enemy-new|tower-plates|tower-operators|special-allies)(?:[^/]*\.(?:png|webp))$/.test(path))?route.abort():route.continue();});
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.begin').waitFor();assert.equal(await page.locator('#ui').getAttribute('data-screen'),'home');
 assert.equal(requests.filter(u=>/\/map-\d+\.webp$/.test(u)).length,0);assert.equal(requests.filter(u=>/\/tower-plates\./.test(u)).length,0);
 await openCampaign(page,true);await openBriefing(page,true);await page.locator('[data-action="start"]').tap();await page.locator('.asset-error-modal').waitFor();assert.equal(await page.locator('.battle-hud').count(),0);
 await page.screenshot({path:`test-results/startup/${kind.name()}-failure.png`});failed=false;await page.locator('[data-action="asset-retry"]').tap();await page.locator('.battle-hud').waitFor();
 assert.deepEqual(requests.filter(u=>/\/map-\d+\.webp$/.test(u)).map(u=>new URL(u).pathname.split('/').pop()).filter((v,i,a)=>a.indexOf(v)===i),['map-01.webp']);
 const canvas=await page.locator('canvas').boundingBox();await page.touchscreen.tap(canvas.x+645*canvas.width/1600,canvas.y+568*canvas.height/900);await page.locator('[data-action="build"][data-kind="archer"]').tap();assert.equal(await page.locator('#gold').textContent(),'195');await page.locator('[data-action="close-tower"]').tap();await page.locator('#next-wave').tap();assert.match(await page.locator('#wave').textContent(),/^1 \/ /);
 assert.deepEqual(errors,[]);reports.push({browser:kind.name(),coldHomeWithoutBattleAssets:true,failedDownloadsDoNotStartBattle:true,retryWorks:true,onlyCurrentMap:true,touchBuild:true,errors});await page.close();
 // The compressed sheet has a PNG fallback; partial successes are reusable.
 page=await make();let fallback=false;errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/tower-plates.webp',r=>r.abort());page.on('request',r=>{if(r.url().endsWith('/tower-plates.png'))fallback=true;});
 await page.goto(url,{waitUntil:'domcontentloaded'});await openCampaign(page,true);await openBriefing(page,true);await page.locator('[data-action="start"]').tap();await page.locator('.battle-hud').waitFor();assert.ok(fallback);assert.equal(await page.locator('.asset-error-modal').count(),0);assert.deepEqual(errors,[]);reports.push({browser:kind.name(),pngFallback:true,errors});await page.close();
 // No WebGL capability still produces a working game through Canvas.
 page=await make();errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args);};});
 await page.goto(url,{waitUntil:'domcontentloaded'});await openCampaign(page,true);await openBriefing(page,true);await page.locator('[data-action="start"]').tap();await page.locator('.battle-hud').waitFor();await page.locator('#next-wave').tap();await page.waitForTimeout(500);assert.deepEqual(errors,[]);await page.screenshot({path:`test-results/startup/${kind.name()}-canvas.png`});reports.push({browser:kind.name(),noWebGLCanvasFallback:true,wave:true,errors});await page.close();
 // Editor selection must not overwrite a different draft while its map fails.
 page=await make();let blockMap=true;errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/map-26.webp',r=>blockMap?r.abort():r.continue());
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.begin').waitFor();await page.evaluate(async()=>{const ui=window.__NAILONG__.ui;await ui.action('editor',document.createElement('button'));});
 await page.locator('[data-work="gold"]').fill('345');await page.locator('[data-work="gold"]').dispatchEvent('change');await page.locator('[data-work="level-index"]').selectOption('25');await page.locator('.asset-error-modal').waitFor();await page.waitForTimeout(400);
 const before=await page.evaluate(()=>{const ui=window.__NAILONG__.ui;return{index:ui.editorIndex,map:ui.editorLevel.map,gold:ui.editorLevel.gold,lastMap:ui.customCampaign.levels[25].map};});assert.deepEqual(before,{index:0,map:'map-01',gold:345,lastMap:'map-26'});
 blockMap=false;await page.locator('[data-action="asset-retry"]').tap();await page.waitForFunction(()=>window.__NAILONG__.ui.editorLevel.map==='map-26');const after=await page.evaluate(()=>{const ui=window.__NAILONG__.ui;return{index:ui.editorIndex,firstGold:ui.customCampaign.levels[0].gold,texture:ui.scene.textures.exists('map-26')};});assert.deepEqual(after,{index:25,firstGold:345,texture:true});assert.deepEqual(errors,[]);reports.push({browser:kind.name(),editorFailedMapPreservesDraft:true,editorRetry:true,errors});await page.close();
 await browser.close();console.log(kind.name()+' cold startup, retry, Canvas and editor recovery passed');
}
// A stalled request ends in a recoverable error, instead of an endless spinner.
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});page.setDefaultTimeout(65000);let release;const gate=new Promise(r=>release=r);
await page.route('**/map-01.webp',async route=>{await gate;try{await route.continue();}catch{}});await page.goto(url,{waitUntil:'domcontentloaded'});await openCampaign(page,true);await openBriefing(page,true);await page.locator('[data-action="start"]').tap();await page.locator('#asset-loading').waitFor();const start=Date.now();await page.locator('.asset-error-modal').waitFor();assert.ok(Date.now()-start>=30000);assert.match(await page.locator('.asset-error-modal').textContent(),/超时/);release();await page.unroute('**/map-01.webp');await page.locator('[data-action="asset-retry"]').tap();await page.locator('.battle-hud').waitFor();reports.push({browser:'chromium',stalledRequestTimeout:true,retryAfterTimeout:true});await browser.close();
await writeFile('test-results/startup-v53.json',JSON.stringify(reports,null,2));console.log('Stalled request timeout and recovery passed');
