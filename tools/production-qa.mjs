import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'http://127.0.0.1:5189/';
const reports=[];await mkdir('test-results/visual-v4',{recursive:true});
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[],requests=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
 await page.goto(url,{waitUntil:'networkidle'});await page.locator('[data-action="training-skip"]').click();await page.locator('.world-node').first().waitFor();assert.equal(await page.locator('.world-node').count(),26);assert.equal(await page.locator('[data-action="hero"]').count(),13);
 await page.locator('[data-action="settings"]').click();await page.locator('[data-volume="musicVolume"]').fill('82');await page.locator('[data-volume="musicVolume"]').dispatchEvent('change');await page.locator('[data-wave-timing]').selectOption('original');await page.reload({waitUntil:'networkidle'});
 await page.locator('[data-action="settings"]').click();assert.equal(await page.locator('[data-volume="musicVolume"]').inputValue(),'82');assert.equal(await page.locator('[data-wave-timing]').inputValue(),'original');await page.locator('[data-wave-timing]').selectOption('clear');await page.locator('[data-action="close"]').first().click();
 await page.locator('[data-action="home"]').click();assert.equal(await page.locator('[data-action="art"]').count(),0);await page.locator('[data-action="campaign"]').click();await page.locator('[data-action="start"]').click();await page.mouse.click(645,568);await page.locator('[data-action="build"][data-kind="archer"]').click();await page.locator('[data-action="close-tower"]').click();await page.locator('#next-wave').click();await page.waitForTimeout(1500);
 await page.locator('[data-action="speed"]').click();await page.locator('[data-action="speed"]').click();assert.equal(await page.locator('#speed').textContent(),'3×');
 await page.screenshot({path:`test-results/visual-v4/production-${channel}.png`});assert.equal(await page.evaluate(()=>Boolean(window.__NAILONG__)),false);
 const manifest=await(await page.request.get(new URL('assets/audio/manifest.json',url).href)).json(),music=manifest['music-forest'][0];const range=await page.request.get(new URL('assets/audio/'+music,url).href,{headers:{Range:'bytes=1000-1999'}});assert.equal(range.status(),206);assert.equal((await range.body()).byteLength,1000);assert.equal(range.headers()['content-type'],'audio/mpeg');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);assert.ok(requests.every(u=>new URL(u).origin===new URL(url).origin));reports.push({browser:channel,status:'passed',errors,missing,allResourcesLocal:true,debugHooksAbsent:true,settingsSurviveReload:true,mp3RangeSupport:true});await browser.close();
}
await writeFile('test-results/production-v4.json',JSON.stringify(reports,null,2));console.log('Chrome/Edge production build passed.');

