import {openCampaign,openBriefing} from './browser-onboarding.mjs';
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const url=process.env.GAME_URL??'http://127.0.0.1:5188/';
const reports=[];fs.mkdirSync('test-results/visual-v4',{recursive:true});
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(url,{waitUntil:'networkidle'});await page.waitForSelector('.begin');
 // Verify migration against a disposable browser profile, including an existing editor work.
 await page.evaluate(async()=>{const w=await import('/src/workshop.ts');const c=w.newCampaign();c.name='保留的编辑器作品';await w.saveDraft(c);localStorage.removeItem('nailong-defense.save.v4');localStorage.setItem('nailong-defense.save.v3',JSON.stringify({version:3,scores:{'stage-12':{stars:3}},hero:'star',settings:{music:true,speed:3},upgrades:{mage:5}}));});
 await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.begin');
 const migration=await page.evaluate(async()=>({save:window.__NAILONG__.ui.save,draft:(await (await import('/src/workshop.ts')).loadDraft()).name,old:localStorage.getItem('nailong-defense.save.v3')}));
 if(migration.save.version!==4||Object.keys(migration.save.scores).length||migration.save.discovered.length||migration.draft!=='保留的编辑器作品'||migration.old!==null)throw Error('Campaign reset/editor preservation failed');
 await openCampaign(page);await page.waitForFunction(()=>window.__NAILONG__.ui.audio.buffers.size>30);
 const fresh={nodes:await page.locator('.world-node').count(),open:await page.locator('.world-node:not([disabled])').count(),heroes:await page.locator('[data-action="hero"]').count(),heroOpen:await page.locator('[data-action="hero"]:not([disabled])').count()};
 if(fresh.nodes!==26||fresh.open!==1||fresh.heroes!==13||fresh.heroOpen!==0)throw Error('Fresh campaign unlocks incorrect');
 await page.screenshot({path:`test-results/visual-v4/world-${channel}.png`});
 // Test all chapters/heroes in this isolated profile, never the user's live save.
 await page.evaluate(async()=>{const a=window.__NAILONG__,{LEVELS}=await import('/content/levels.ts'),{scoreKey}=await import('/src/save.ts');for(const l of LEVELS)a.ui.save.scores[scoreKey('main',l.id)]={stars:3,lives:20,hero:'shield',difficulty:'normal'};a.ui.selectedLevel=25;a.ui.campaign();});
 if(await page.locator('.world-node:not([disabled])').count()!==26||await page.locator('[data-action="hero"]:not([disabled])').count()!==13)throw Error('Completed campaign unlocks incorrect');
 for(const chapter of ['main','spider','acaroth','rot','bandits','trolls','demons','blackburn']){await page.locator(`[data-action="chapter"][data-chapter="${chapter}"]`).click();if(!await page.locator('.world-node').count())throw Error('Empty chapter '+chapter);}
 await page.screenshot({path:`test-results/visual-v4/blackburn-${channel}.png`});
 const music=await page.evaluate(async()=>{
  const a=window.__NAILONG__.ui.audio;await a.loading;const duration={};
  for(const theme of ['forest','dark','boss']){duration[theme]=[];for(const file of a.manifest['music-'+theme]){const el=new Audio('/assets/audio/'+file);el.preload='metadata';await new Promise((resolve,reject)=>{el.onloadedmetadata=resolve;el.onerror=reject;});duration[theme].push(el.duration);el.removeAttribute('src');el.load();}}
  return{duration,decoded:a.buffers.size,musicDecoded:[...a.buffers.keys()].filter(k=>k.endsWith('.mp3')).length};
 });
 for(const durations of Object.values(music.duration))if(durations.length<3||durations.some(n=>n<180)||durations.reduce((a,b)=>a+b,0)<600)throw Error('Music length requirements failed');
 if(music.musicDecoded)throw Error('Long music decoded into short-effect memory');
 await page.evaluate(async()=>{const a=window.__NAILONG__.ui.audio;a.setTheme('forest');});await page.waitForTimeout(1300);
 const continuity=await page.evaluate(async()=>{const a=window.__NAILONG__.ui.audio,v=a.musicVoice,t=v.element.currentTime;a.setTheme('forest');return{same:v===a.musicVoice,position:t,rate:v.element.playbackRate,streamCount:Number(!!a.musicVoice)+Number(!!a.nextVoice)+Number(!!a.retiring)};});
 if(!continuity.same||continuity.rate!==1||continuity.streamCount>3)throw Error('Same-theme continuity/bounded music failed');
 await page.evaluate(async()=>{const a=window.__NAILONG__.ui.audio;a.musicVoice.element.currentTime=a.musicVoice.element.duration-.3;});await page.waitForTimeout(1600);
 const next=await page.evaluate(async()=>({index:window.__NAILONG__.ui.audio.musicVoice.index,position:window.__NAILONG__.ui.audio.musicVoice.element.currentTime}));if(next.index!==1)throw Error('Playlist advance failed');
 await page.evaluate(async()=>window.dispatchEvent(new Event('blur')));const blur=await page.evaluate(async()=>window.__NAILONG__.ui.audio.focused);if(!blur)throw Error('Visible-window blur should not mute music');await page.evaluate(async()=>window.dispatchEvent(new Event('focus')));
 const maps=[];
 for(let index=0;index<26;index++){
  await page.evaluate(async i=>{const a=window.__NAILONG__;a.ui.selectedLevel=i;await a.ui.start();a.scene.speed=1;},index);await page.waitForTimeout(80);
  const result=await page.evaluate(async()=>{const a=window.__NAILONG__,s=a.sim;return{id:s.level.id,slots:s.level.slots.length,paths:s.roads.length,texture:a.scene.textures.exists(s.level.map),hero:s.level.heroes!==false,initialGold:s.gold};});
  if(!result.texture)throw Error('Missing map '+result.id);maps.push(result);
 }
 // A real UI action must hide the panel before accepting a rally click under it.
 await page.evaluate(async()=>{const a=window.__NAILONG__,{TRAINING}=await import('/content/training.ts');await a.ui.start(TRAINING[1]);a.scene.speed=1;a.sim.command({type:'build',slot:3,kind:'barracks'});a.scene.syncTowers();a.scene.selectedSlot=3;a.ui.towerPanel();});
 const point=await page.evaluate(async()=>{const a=window.__NAILONG__,p=document.querySelector('.tower-popover'),x=parseFloat(p.style.left),y=parseFloat(p.style.top),s=a.sim,t=s.towerAt(3);return s.roads.flatMap(r=>r.points).find(q=>q.x>x&&q.x<x+p.offsetWidth&&q.y>y&&q.y<y+p.offsetHeight&&Math.hypot(q.x-s.level.slots[3].x,q.y-s.level.slots[3].y)<s.stats(t).range);});
 if(!point)throw Error('Rally regression test lacks a covered valid road point');await page.locator('[data-action="rally"]').click();if(await page.locator('.tower-popover').count())throw Error('Rally panel was not hidden');
 await page.evaluate(p=>window.__NAILONG__.ui.click(p),point);const rally=await page.evaluate(async()=>({mode:window.__NAILONG__.scene.mode,rally:window.__NAILONG__.sim.towerAt(3).rally,panel:!!document.querySelector('.tower-popover')}));if(rally.mode==='rally'||!rally.panel)throw Error('Rally click not accepted');
 await page.screenshot({path:`test-results/visual-v4/rally-${channel}.png`});
 await page.evaluate(async()=>{const a=window.__NAILONG__;a.ui.selectedLevel=25;a.ui.save.hero='tenshi';await a.ui.start();a.sim.command({type:'next-wave'});a.scene.speed=3;});await page.waitForTimeout(2200);await page.screenshot({path:`test-results/visual-v4/battle26-${channel}.png`});
 reports.push({browser:channel,migration:{campaignReset:true,editorPreserved:true},fresh,music,continuity,next,blur,maps,rally,errors});console.log(channel,JSON.stringify({nodes:fresh.nodes,heroes:fresh.heroes,maps:maps.length,music,errors}));
 await browser.close();if(errors.length)throw Error(channel+' browser errors: '+errors.join('; '));
}
fs.writeFileSync('test-results/experience-v4.json',JSON.stringify(reports,null,2));
