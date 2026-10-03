import {chromium,webkit} from '@playwright/test';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openCampaign} from './browser-onboarding.mjs';
const url=process.env.GAME_URL??'https://chenyehuan1234.github.io/nailong-defense/';
// Isolated UI fixture reproduces the user's unlocked third stage. Combat still
// uses its real 300 starting gold and the mage's real 100-gold cost.
const score=stars=>({stars,lives:20,hero:'shield',difficulty:'normal'});
const save={version:4,rulesVersion:24662480,discovered:[],training:{completed:[],dismissed:true},scores:{'main:stage-01:campaign':score(2),'main:stage-02:campaign':score(3)},hero:'shield',upgrades:{},settings:{sound:false,music:false,lowQuality:false,autoWave:true,speed:3,waveTiming:'clear',masterVolume:.8,musicVolume:.75,sfxVolume:.8,ambientVolume:.45}};
await mkdir('test-results/battle-render-v55',{recursive:true});const reports=[];
for(const kind of [chromium,webkit])for(const mode of ['auto','canvas']){
 const browser=await kind.launch(kind===chromium?{channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost,chenyehuan1234.github.io'}});
 const page=await browser.newPage({viewport:{width:852,height:393},isMobile:true,hasTouch:true}),errors=[];page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.addInitScript(data=>{localStorage.setItem('nailong-defense.save.v4',JSON.stringify(data));Object.defineProperty(navigator,'standalone',{get:()=>true});},save);
 const target=new URL(url);if(mode==='canvas')target.searchParams.set('renderer','canvas');await page.goto(target.href,{waitUntil:'networkidle'});await page.locator('.begin').waitFor();assert.equal(await page.locator('.version').textContent(),'v0.5.5');
 await openCampaign(page,true);await page.locator('[data-action="level"][data-index="2"]').tap();await page.locator('[data-action="start"]').tap();await page.locator('.battle-hud').waitFor();assert.equal(await page.locator('#gold').textContent(),'300');assert.equal(await page.locator('#speed').textContent(),'3×');
 const canvas=await page.locator('canvas').boundingBox();await page.touchscreen.tap(canvas.x+680.46875*canvas.width/1600,canvas.y+512.109375*canvas.height/900);await page.locator('[data-action="build"][data-kind="mage"]').tap();assert.equal(await page.locator('#gold').textContent(),'200');await page.locator('[data-action="close-tower"]').tap();await page.locator('#next-wave').tap();await page.waitForTimeout(1000);assert.equal(await page.locator('#wave').textContent(),'1 / 11');
 const png=await page.locator('canvas').screenshot(),meta=await sharp(png).metadata(),crop={left:Math.floor(meta.width*.2),top:Math.floor(meta.height*.18),width:Math.floor(meta.width*.6),height:Math.floor(meta.height*.55)};const stats=await sharp(png).extract(crop).stats();const expected=await sharp('public/assets/map-03.webp').resize(meta.width,meta.height).extract(crop).stats(),variation=a=>a.channels.slice(0,3).reduce((v,c)=>v+c.stdev,0)/3;assert.ok(variation(stats)>variation(expected)*.65,'third-stage terrain and roads must be painted');
 await page.screenshot({path:`test-results/battle-render-v55/${kind.name()}-${mode}-stage03.png`});assert.deepEqual(errors,[]);reports.push({browser:kind.name(),mode,url:target.href,version:'0.5.5',stage:3,goldAfterMage:200,wave:'1 / 11',speed:3,terrainVariation:variation(stats),sourceVariation:variation(expected),errors});await browser.close();console.log(kind.name()+' '+mode+' stage 3 published render passed');
}
await writeFile('test-results/battle-render-v55.json',JSON.stringify(reports,null,2));
