import {chromium,webkit} from '@playwright/test';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'http://127.0.0.1:5188/';
await mkdir('test-results/battle-maps-v55',{recursive:true});const reports=[];
for(const kind of [chromium,webkit])for(const mode of ['auto','canvas']){
 const browser=await kind.launch(kind===chromium?{channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost'}});
 const page=await browser.newPage({viewport:{width:852,height:393},hasTouch:true,isMobile:true}),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 const target=new URL(url);if(mode==='canvas')target.searchParams.set('renderer','canvas');await page.goto(target.href,{waitUntil:'networkidle'});await page.locator('.begin').waitFor();
 const maps=[];
 for(let index=0;index<26;index++){
  await page.evaluate(async i=>{const a=window.__NAILONG__;if(i%3===0)a.ui.home();a.ui.selectedLevel=i;await a.ui.start();a.scene.paused=true;},index);await page.waitForTimeout(80);
  const geometry=await page.evaluate(()=>{const a=window.__NAILONG__,o=a.scene.background,b=o.getBounds();return{key:o.texture.key,width:o.width,height:o.height,displayWidth:o.displayWidth,displayHeight:o.displayHeight,scaleX:o.scaleX,scaleY:o.scaleY,bounds:{x:b.x,y:b.y,width:b.width,height:b.height},maps:a.scene.textures.getTextureKeys().filter(k=>/^map-\d+$/.test(k))};});
  assert.equal(geometry.key,'map-'+String(index+1).padStart(2,'0'));assert.equal(geometry.width,1600);assert.equal(geometry.height,900);assert.equal(geometry.displayWidth,1600);assert.equal(geometry.displayHeight,900);assert.equal(geometry.scaleX,1);assert.equal(geometry.scaleY,1);assert.deepEqual(geometry.bounds,{x:0,y:0,width:1600,height:900});assert.equal(geometry.maps.length,1);
  const canvas=await page.locator('canvas').screenshot(),meta=await sharp(canvas).metadata();const crop={left:Math.floor(meta.width*.2),top:Math.floor(meta.height*.18),width:Math.floor(meta.width*.6),height:Math.floor(meta.height*.55)};const actual=await sharp(canvas).extract(crop).stats();const expected=await sharp(`public/assets/${geometry.key}.webp`).resize(meta.width,meta.height).extract(crop).stats();const variation=a=>a.channels.slice(0,3).reduce((v,c)=>v+c.stdev,0)/3;assert.ok(variation(actual)>variation(expected)*.65,geometry.key+' must show terrain and roads, not a magnified flat patch');
  if([0,2,3,11,25].includes(index))await page.screenshot({path:`test-results/battle-maps-v55/${kind.name()}-${mode}-${geometry.key}.png`});maps.push({index:index+1,geometry,terrainVariation:variation(actual),sourceVariation:variation(expected)});
 }
 // Editor background swaps and the animation stage share the same reset.
 await page.evaluate(async()=>{const ui=window.__NAILONG__.ui;await ui.action('editor',document.createElement('button'));});await page.locator('[data-work="map"]').selectOption('map-03');await page.waitForFunction(()=>window.__NAILONG__.scene.background.texture.key==='map-03');assert.deepEqual(await page.evaluate(()=>{const o=window.__NAILONG__.scene.background;return[o.displayWidth,o.displayHeight,o.scaleX,o.scaleY];}),[1600,900,1,1]);
 await page.evaluate(async()=>{const ui=window.__NAILONG__.ui;ui.home();await ui.action('art',document.createElement('button'));});assert.deepEqual(await page.evaluate(()=>{const o=window.__NAILONG__.scene.background;return[o.texture.key,o.displayWidth,o.displayHeight,o.scaleX,o.scaleY];}),['forest',1600,900,1,1]);assert.deepEqual(errors,[]);reports.push({browser:kind.name(),mode,maps,editor:true,art:true,errors});await browser.close();console.log(kind.name()+' '+mode+' all 26 actual map renders passed');
}
await writeFile('test-results/battle-maps-v55.json',JSON.stringify(reports,null,2));
