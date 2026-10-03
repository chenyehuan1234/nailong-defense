import {openCampaign,openBriefing} from './browser-onboarding.mjs';
import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'http://127.0.0.1:5188/';
await mkdir('test-results/mobile-v52',{recursive:true});const reports=[];
for(const kind of [chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}});
 for(const size of [{width:844,height:390},{width:844,height:268},{width:390,height:844}]){
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],id=`${kind.name()}-${size.width}x${size.height}`;
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await page.goto(url,{waitUntil:'networkidle'});await page.locator('.begin').waitFor();
  assert.equal(await page.locator('#ui').getAttribute('data-screen'),'home');assert.equal(await page.locator('.training-modal').count(),0);
  const photo=await page.locator('.mobile-home-background').boundingBox();assert.equal(Math.round(photo.width),size.width);assert.equal(Math.round(photo.height),size.height);
  const begin=await page.locator('.begin').boundingBox();assert.ok(begin.y>=0&&begin.y+begin.height<=size.height,'first home screen start button is visible');
  await page.screenshot({path:`test-results/mobile-v52/${id}-home.png`});
  await openCampaign(page,true);assert.equal(await page.locator('.expedition-v2').isVisible(),false);
  const map=await page.locator('.world-map').boundingBox();assert.ok(map.width>=size.width-24,'campaign map uses the phone width');
  const overflow=await page.locator('.world-map').evaluate(e=>({x:e.scrollWidth-e.clientWidth,y:e.scrollHeight-e.clientHeight}));assert.ok(overflow.x<3&&overflow.y<3,'map starts fully fitted');
  await page.screenshot({path:`test-results/mobile-v52/${id}-map.png`});await openBriefing(page,true);await page.screenshot({path:`test-results/mobile-v52/${id}-brief.png`});
  if(size.width<size.height){await page.setViewportSize({width:844,height:390});}
  await page.locator('[data-action="start"]').tap();const tap=async(x,y)=>{const r=await page.locator('canvas').boundingBox();await page.touchscreen.tap(r.x+x*r.width/1600,r.y+y*r.height/900);};
  await tap(645,568);assert.equal(await page.locator('.tower-wheel [data-action="build"]').count(),4);assert.equal(await page.locator('.tower-stats,.upgrade-delta,.panel-note').count(),0);
  assert.deepEqual(await page.locator('.chip-price').allTextContents(),['70','70','100','125']);
  await page.screenshot({path:`test-results/mobile-v52/${id}-build.png`});await page.locator('[data-action="build"][data-kind="archer"]').tap();assert.equal(await page.locator('#gold').textContent(),'195');
  assert.equal(await page.locator('[data-action="sell"]').count(),1);await page.locator('[data-action="close-tower"]').tap();
  const before=await page.locator('canvas').boundingBox();await page.locator('[data-action="map-zoom"][data-factor="1.25"]').tap();await page.locator('[data-action="map-zoom"][data-factor="1.25"]').tap();const enlarged=await page.locator('canvas').boundingBox();assert.ok(enlarged.width>before.width*1.5);
  const p=await page.locator('canvas').boundingBox(),cx=Math.max(100,p.x+p.width/2),cy=140;
  if(kind===chromium){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+8*i,y:cy+5*i,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+40,cy+25,{steps:5});await page.mouse.up();}
  assert.equal(await page.locator('.tower-wheel').count(),0,'dragging does not open a tower menu');const moved=await page.locator('canvas').boundingBox();assert.ok(Math.abs(moved.x-enlarged.x)+Math.abs(moved.y-enlarged.y)>10,'map pans after zoom');
  await page.locator('[data-action="map-fit"]').tap();const fitted=await page.locator('canvas').boundingBox();assert.ok(Math.abs(fitted.width-before.width)<1&&Math.abs(fitted.x-before.x)<1);
  if(kind===chromium){
   const cdp=await context.newCDPSession(page);const y=130;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:350,y,id:1},{x:490,y,id:2}]});
   for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:350-i*15,y,id:1},{x:490+i*15,y,id:2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.ok((await page.locator('canvas').boundingBox()).width>fitted.width*1.8,'two fingers enlarge the map');
   assert.equal(await page.locator('.tower-wheel').count(),0,'pinching does not select a tower');await page.locator('[data-action="map-fit"]').tap();
  }
  await page.locator('#next-wave').tap();assert.match(await page.locator('#wave').textContent(),/^1 \/ /);
  // UI fixture only: generous gold verifies every purchase control without
  // pretending to validate campaign balance or altering the player's save.
  let purchasedBranches=0;
  if(size.width!==390)for(const kind of ['archer','barracks','mage','engineer'])for(const branch of [0,1]){
   await page.evaluate(async()=>{const a=window.__NAILONG__,{LEVELS}=await import('/content/levels.ts'),l=structuredClone(LEVELS[11]);Object.assign(l,{id:'mobile-menu-fixture',gold:9000,maxTowerLevel:4,heroes:false,prebuilt:[],facilities:[],scriptEvents:[],unlocks:{},unlockAtWave:{}});a.ui.editorReturn=true;a.ui.start(l);a.scene.speed=1;});
   const slot=await page.evaluate(()=>window.__NAILONG__.sim.level.slots[0]);await tap(slot.x,slot.y);
   await page.locator(`[data-action="build"][data-kind="${kind}"]`).tap();
   for(let level=2;level<=3;level++){await page.locator('[data-action="tower-upgrade"]').tap();assert.equal(await page.evaluate(()=>window.__NAILONG__.sim.towers[0].level),level);}
   assert.equal(await page.locator('[data-action="tower-upgrade"][data-branch]').count(),2);
   await page.screenshot({path:`test-results/mobile-v52/${id}-${kind}-branches.png`});await page.locator(`[data-action="tower-upgrade"][data-branch="${branch}"]`).tap();
   assert.equal(await page.evaluate(()=>window.__NAILONG__.sim.towers[0].branch),branch);
   const skillCount=await page.locator('[data-action="tower-skill"]').count();for(let skill=0;skill<skillCount;skill++)await page.locator(`[data-action="tower-skill"][data-skill="${skill}"]`).tap();
   assert.ok(await page.evaluate(()=>window.__NAILONG__.sim.towers[0].skills.every((rank,i)=>i>=2||rank>=1)));
   assert.equal(await page.locator('.tower-stats,.upgrade-delta,.panel-note,.branch-list').count(),0);
   const panel=await page.locator('.tower-wheel').boundingBox();assert.ok(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=844&&panel.y+panel.height<=(size.height===268?268:390),'upgrades stay inside the viewport');
   assert.ok(await page.locator('.mini-tower-art').evaluateAll(images=>images.every(e=>e.complete&&e.naturalWidth===64)),'tower thumbnails are valid local images');
   await page.screenshot({path:`test-results/mobile-v52/${id}-${kind}-${branch}-skills.png`});purchasedBranches++;
  }
  assert.deepEqual(errors,[]);reports.push({browser:kind.name(),size,homeFirst:true,photoFillsScreen:true,mapFits:true,briefOnTap:true,iconPriceMenus:true,touchBuild:true,zoomAndPan:true,pinch:kind===chromium,dragDoesNotBuild:true,purchasedBranches,wave:true,errors});await context.close();
 }
 await browser.close();console.log(kind.name()+' mobile experience passed');
}
// Emulate Safari's permission per media element. Delay every short effect so music
// must start during the first real tap, independently from effect decoding.
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{window.__QA_PLAY__=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const allowed=this.__gestureGranted||navigator.userActivation.isActive;if(navigator.userActivation.isActive)this.__gestureGranted=true;window.__QA_PLAY__.push({allowed,active:navigator.userActivation.isActive});return allowed?play.call(this):Promise.reject(new DOMException('Gesture required','NotAllowedError'));};});
await page.route('**/assets/audio/*',async route=>{const pathname=new URL(route.request().url()).pathname;if(!pathname.endsWith('.mp3')&&!pathname.endsWith('.json'))await new Promise(r=>setTimeout(r,6000));await route.continue();});
await page.goto(url,{waitUntil:'networkidle'});await page.locator('.begin').tap();await page.waitForFunction(()=>{const a=window.__NAILONG__.ui.audio;return a.musicVoice&&!a.musicVoice.element.paused&&a.musicVoice.element.currentTime>.05;},null,{timeout:5000});
assert.equal(await page.evaluate(()=>window.__NAILONG__.ui.audio.buffers.size),0,'music begins before delayed effects');await page.waitForFunction(()=>window.__NAILONG__.ui.audio.buffers.size===36);
await page.waitForTimeout(5200);await page.evaluate(()=>{const a=window.__NAILONG__.ui.audio;window.__NAILONG__.ui.screen='audio-qa';a.setTheme('boss');});await page.waitForFunction(()=>window.__NAILONG__.ui.audio.musicVoice.theme==='boss'&&!window.__NAILONG__.ui.audio.musicVoice.element.paused);
const audio=await page.evaluate(()=>({pool:window.__NAILONG__.ui.audio.musicPool.length,denied:window.__QA_PLAY__.filter(p=>!p.allowed).length,error:window.__NAILONG__.ui.audio.error}));assert.equal(audio.pool,2);assert.equal(audio.denied,0);assert.equal(audio.error,'');
reports.push({audio:'first touch and automatic theme transition',musicBeforeEffects:true,reusedMediaElements:audio.pool,denied:audio.denied});
await page.evaluate(()=>{const ui=window.__NAILONG__.ui;ui.save.settings.music=false;ui.save.settings.sound=false;ui.persist();});
await page.route('**/assets/home-v4.1.webp',async route=>{await new Promise(r=>setTimeout(r,4000));await route.continue();});await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__NAILONG__?.ui.screen==='loading');await page.touchscreen.tap(420,180);
const muted=await page.evaluate(()=>{const a=window.__NAILONG__.ui.audio;return{music:a.music,sound:a.enabled,gain:a.musicGain.gain.value};});assert.deepEqual(muted,{music:false,sound:false,gain:0});
reports.push({audio:'saved mute applies before game assets finish loading',mutedOnFirstLoadingTouch:true});await browser.close();await writeFile('test-results/mobile-experience-v52.json',JSON.stringify(reports,null,2));
