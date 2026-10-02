import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.GAME_URL??'http://127.0.0.1:5189/';
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
await mkdir('test-results/fullscreen',{recursive:true});const reports=[];
for(const kind of [chromium,webkit]){
 const browser=await kind.launch(kind===chromium?{channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']}:{headless:true,proxy:{server:'http://127.0.0.1:9',bypass:'127.0.0.1,localhost,chenyehuan1234.github.io'}});
 for(const standalone of [false,true]){
  const context=await browser.newContext({viewport:{width:844,height:standalone?390:268},hasTouch:true,isMobile:true,userAgent:iphone}),page=await context.newPage(),errors=[];
  await page.addInitScript(({standalone})=>{Object.defineProperty(document,'fullscreenEnabled',{value:false});Object.defineProperty(navigator,'standalone',{value:standalone});},{standalone});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(url,{waitUntil:'networkidle'});await page.locator('[data-action="training-skip"]').tap();
  const manifest=await (await page.request.get(new URL('manifest.webmanifest',url).href)).json();
  assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.orientation,'landscape');
  for(const icon of manifest.icons){const res=await page.request.get(new URL(icon.src,url).href);assert.equal(res.status(),200);assert.match(res.headers()['content-type'],/image\/png/);}
  assert.equal(await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content'),'yes');
  if(!standalone){
   await page.locator('.world-header [data-action="app-guide"]').tap();await page.locator('.install-modal').waitFor();
   assert.match(await page.locator('.app-install-steps').textContent(),/Safari/);assert.equal(await page.locator('#app-link').inputValue(),url);
   await page.locator('.app-install-steps li:last-child').scrollIntoViewIfNeeded();assert.equal(await page.locator('.app-install-steps li:last-child').isVisible(),true);
   await page.screenshot({path:`test-results/fullscreen/${kind.name()}-iphone-guide.png`});await page.locator('[data-action="close"]').tap();
  }else assert.equal(await page.locator('.world-header [data-action="app-guide"]').isVisible(),false);
  await page.locator('[data-action="start"]').tap();
  const h=standalone?390:268;assert.equal(Math.round((await page.locator('#game-shell').boundingBox()).height),h);
  for(const selector of ['[data-action="auto-wave"]','[data-action="speed"]','.battle-tools [data-action="pause"]','#next-wave','[data-skill="reinforce"]','[data-skill="meteor"]']){
   const b=await page.locator(selector).boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=845&&b.y+b.height<=h+1&&b.width>=44&&b.height>=44,selector+' stays inside the available viewport');
  }
  const textFits=await page.locator('.spell-button').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return [...b.children].filter(c=>c.matches('strong,small,svg')).every(c=>{const a=c.getBoundingClientRect();return a.top>=r.top+1&&a.bottom<=r.bottom-1&&a.left>=r.left&&a.right<=r.right;});}));assert.ok(textFits,'spell icons, names and cooldowns are not clipped');
  assert.equal(await page.locator('.mobile-fullscreen').isVisible(),!standalone);
  await page.screenshot({path:`test-results/fullscreen/${kind.name()}-${standalone?'standalone':'short-browser'}-battle.png`});
  if(!standalone){await page.locator('.mobile-fullscreen').tap();await page.locator('.install-modal').waitFor();await page.locator('[data-action="close"]').tap();await page.locator('#next-wave').tap();assert.match(await page.locator('#wave').textContent(),/^1 \/ /);}
  assert.deepEqual(errors,[]);reports.push({browser:kind.name(),standalone,availableViewportHeight:h,manifest:true,iphoneGuide:!standalone,controls44:true,spellTextFits:true,errors});await context.close();
 }
 // A browser that exposes the native install prompt gets a working install action.
 const installPage=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
 await installPage.goto(url,{waitUntil:'networkidle'});await installPage.locator('[data-action="training-skip"]').tap();
 await installPage.evaluate(()=>{const event=new Event('beforeinstallprompt');event.prompt=async()=>{window.__QA_PROMPT_SHOWN__=true;};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);});
 await installPage.locator('.world-header [data-action="app-guide"]').tap();await installPage.locator('[data-action="install-app"]').tap();assert.equal(await installPage.evaluate(()=>window.__QA_PROMPT_SHOWN__),true);await installPage.locator('.install-modal').waitFor({state:'hidden'});await installPage.close();
 await browser.close();console.log(kind.name()+' fullscreen and short landscape passed');
}
await writeFile('test-results/fullscreen-v5.json',JSON.stringify(reports,null,2));
