import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'https://chenyehuan1234.github.io/nailong-defense/';
await mkdir('test-results/deployed',{recursive:true});const reports=[];
for(const browserKind of [chromium,webkit]){
 const browser=await browserKind.launch(browserKind===chromium?{channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'chenyehuan1234.github.io'}});
 const page=await browser.newPage({viewport:{width:844,height:390},deviceScaleFactor:1,isMobile:true,hasTouch:true}),errors=[],requests=[];
 page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});page.on('request',r=>requests.push(r.url()));
 const response=await page.goto(url,{waitUntil:'networkidle',timeout:120000});assert.equal(response.status(),200);
 await page.locator('[data-action="training-skip"]').tap();assert.equal(await page.locator('[data-level-select] option').count(),26);
 assert.equal(await page.evaluate(()=>Boolean(window.__NAILONG__)),false);
 await page.locator('[data-action="settings"]').tap();await page.locator('[data-volume="musicVolume"]').fill('79');await page.locator('[data-volume="musicVolume"]').dispatchEvent('change');await page.locator('[data-action="close"]').tap();
 await page.locator('[data-action="start"]').tap();const canvas=await page.locator('canvas').boundingBox();await page.touchscreen.tap(canvas.x+645*canvas.width/1600,canvas.y+568*canvas.height/900);await page.locator('[data-action="build"][data-kind="archer"]').tap();assert.equal(await page.locator('#gold').textContent(),'195');await page.locator('[data-action="close-tower"]').tap();
 await page.locator('#next-wave').tap();await page.waitForTimeout(1000);assert.match(await page.locator('#wave').textContent(),/^1 \/ /);
 await page.locator('[data-action="speed"]').tap();await page.locator('[data-action="speed"]').tap();assert.equal(await page.locator('#speed').textContent(),'3×');
 await page.screenshot({path:`test-results/deployed/${browserKind.name()}-mobile.png`});
 await page.locator('.battle-tools [data-action="pause"]').tap();await page.locator('[data-action="quit"]').tap();await page.reload({waitUntil:'networkidle'});await page.locator('[data-action="settings"]').tap();assert.equal(await page.locator('[data-volume="musicVolume"]').inputValue(),'79');
 assert.deepEqual(errors,[]);const base=new URL(url),unexpected=requests.filter(r=>{const u=new URL(r);if(u.protocol==='data:')return false;if(u.protocol==='blob:')return u.origin!==base.origin;return u.origin!==base.origin||!u.pathname.startsWith(base.pathname);});
 assert.deepEqual(unexpected,[],'assets should use the GitHub project path');
 const manifest=await(await page.request.get(new URL('assets/audio/manifest.json',url).href)).json(),song=manifest['music-forest'][0];
 const music=await page.request.get(new URL('assets/audio/'+song,url).href,{headers:{Range:'bytes=1000-1999'}});assert.ok([200,206].includes(music.status()));assert.match(music.headers()['content-type'],/audio\/mpeg/);
 reports.push({browser:browserKind.name(),url,status:'passed',http:200,projectAssets:true,productionDebugAbsent:true,touchBuild:true,goldAfterBuild:195,waveStart:true,speed3:true,settingsSurviveReload:true,musicAvailable:true,errors});console.log(browserKind.name()+' deployed mobile passed');await browser.close();
}
await writeFile('test-results/deployed-v5.json',JSON.stringify(reports,null,2));
