import {chromium,webkit} from '@playwright/test';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {openCampaign,openBriefing} from './browser-onboarding.mjs';
const url=process.env.GAME_URL??'http://127.0.0.1:5188/';
await mkdir('test-results/menu-v54',{recursive:true});const reports=[];
async function painted(page,selector,name){
 const img=page.locator(selector);await img.waitFor();await page.waitForFunction(s=>{const e=document.querySelector(s);return e?.complete&&e.naturalWidth>0&&getComputedStyle(e).visibility==='visible';},selector);await img.evaluate(e=>e.decode());assert.ok(await img.evaluate(e=>e.complete&&e.naturalWidth>0&&getComputedStyle(e).visibility==='visible'));
 const rect=await img.boundingBox();assert.ok(rect.width>250&&rect.height>100);
 const {channels}=await sharp(await img.screenshot()).stats();assert.ok(channels.slice(0,3).some(c=>c.stdev>24),name+' contains actual artwork');
}
for(const kind of [chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{channel:'chrome',headless:true}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost,chenyehuan1234.github.io'}});
 for(const size of [{width:852,height:393},{width:852,height:280},{width:393,height:852},{width:667,height:375},{width:1024,height:768}]){
  const page=await browser.newPage({viewport:size,isMobile:true,hasTouch:true,deviceScaleFactor:3});page.setDefaultTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.begin').waitFor();await painted(page,'[data-menu-art="home"]','home');await page.screenshot({path:`test-results/menu-v54/${kind.name()}-${size.width}x${size.height}-home.png`});
  await openCampaign(page,true);await painted(page,'[data-menu-art="campaign"]','map');assert.equal(await page.locator('.expedition-v2').isVisible(),false);
  await page.screenshot({path:`test-results/menu-v54/${kind.name()}-${size.width}x${size.height}-map.png`});await openBriefing(page,true);
  const rect=await page.locator('.expedition-v2').boundingBox();assert.ok(rect.width>=Math.min(320,size.width-24),`briefing width ${rect.width} must be usable`);assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=size.width&&rect.y+rect.height<=size.height,'briefing stays on screen');
  const overflow=await page.locator('.expedition-v2').evaluate(e=>({horizontal:e.scrollWidth-e.clientWidth,vertical:e.scrollHeight-e.clientHeight}));assert.ok(overflow.horizontal<=2,'briefing does not squeeze or scroll horizontally');assert.ok(overflow.vertical>0,'briefing has vertical scrolling');
  await page.locator('.expedition-v2').evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await page.locator('.expedition-v2').evaluate(e=>e.scrollTop>30));const start=await page.locator('[data-action="start"]').boundingBox();assert.ok(start.width>250&&start.x>=rect.x&&start.x+start.width<=rect.x+rect.width&&start.y>=rect.y&&start.y+start.height<=rect.y+rect.height,'start button is readable and reachable');
  await page.locator('.expedition-v2').evaluate(e=>e.scrollTop=0);await page.screenshot({path:`test-results/menu-v54/${kind.name()}-${size.width}x${size.height}-brief.png`});await page.locator('[data-action="brief-close"]').tap();assert.equal(await page.locator('.expedition-v2').isVisible(),false);assert.deepEqual(errors,[]);reports.push({browser:kind.name(),size,homePainted:true,mapPainted:true,briefing:rect,scroll:true,errors});await page.close();
 }
 // Failed JPEGs use the original WebP. If both fail, the user can retry.
 let page=await browser.newPage({viewport:{width:852,height:393},hasTouch:true,isMobile:true});await page.route('**/assets/menu-*.jpg',r=>r.abort());await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.begin').waitFor();await painted(page,'[data-menu-art="home"]','JPEG fallback home');await openCampaign(page,true);await painted(page,'[data-menu-art="campaign"]','JPEG fallback map');reports.push({browser:kind.name(),jpegFallback:true});await page.close();
 page=await browser.newPage({viewport:{width:852,height:393},hasTouch:true,isMobile:true});let block=true;await page.route('**/assets/**',route=>block&&/\/(?:menu-(?:home|campaign)\.jpg|home-v4\.1\.webp|campaign-v4\.webp)/.test(route.request().url())?route.abort():route.continue());await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.begin').waitFor();await page.getByText('图片未能加载，请重试').waitFor();block=false;await page.getByRole('button',{name:'重新加载图片'}).tap();await painted(page,'[data-menu-art="home"]','retry home');assert.equal(await page.locator('.menu-art-status:visible').count(),0);reports.push({browser:kind.name(),imageRetry:true});await page.close();
 await browser.close();console.log(kind.name()+' menu images and readable briefings passed');
}
await writeFile('test-results/menu-v54.json',JSON.stringify(reports,null,2));
