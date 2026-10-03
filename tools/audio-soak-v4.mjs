import {openCampaign,openBriefing} from './browser-onboarding.mjs';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const reports=[];
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5188/',{waitUntil:'networkidle'});await openCampaign(page);await page.waitForFunction(()=>window.__NAILONG__.ui.audio.buffers.size===36);
 const result=await page.evaluate(async()=>{
  const ui=window.__NAILONG__.ui,a=ui.audio;const update=a.update.bind(a);a.update=()=>{};ui.screen='audio-qa'; // keep scene HUD from choosing a different theme during the isolated audio test
  let peakEffects=0;const samples=[],started=performance.now();update(false,'forest',3);
  for(let i=0;i<90;i++){
   const theme=['forest','dark','boss'][Math.floor(i/6)%3];update(i%11===0,theme,3);for(let j=0;j<40;j++)a.play('bow');peakEffects=Math.max(peakEffects,a.voices.size);
   if(i%6===3&&a.musicVoice&&!a.switching&&a.nextVoice)a.musicVoice.element.currentTime=a.musicVoice.element.duration-.25;
   await new Promise(r=>setTimeout(r,750));update(false,theme,3);
   samples.push({streamCount:Number(!!a.musicVoice)+Number(!!a.nextVoice)+Number(!!a.retiring),voices:a.voices.size,decoded:a.buffers.size,rate:a.musicVoice?.element.playbackRate,error:a.error,heap:performance.memory?.usedJSHeapSize});
  }
  window.dispatchEvent(new Event('blur'));const visibleBlurKeepsAudio=a.focused;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));const allMusicPaused=(!a.musicVoice||a.musicVoice.element.paused)&&(!a.retiring||a.retiring.element.paused);delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));
  return{seconds:(performance.now()-started)/1000,maxStreams:Math.max(...samples.map(s=>s.streamCount)),maxEffects:Math.max(peakEffects,...samples.map(s=>s.voices)),decodedCounts:[...new Set(samples.map(s=>s.decoded))],normalRate:samples.every(s=>s.rate===1),visibleBlurKeepsAudio,allMusicPaused,errors:samples.map(s=>s.error).filter(Boolean),heapFirst:samples[0].heap,heapLast:samples.at(-1).heap};
 });
 assert.ok(result.maxStreams<=3);assert.ok(result.maxEffects<=20);assert.deepEqual(result.decodedCounts,[36]);assert.ok(result.normalRate);assert.ok(result.visibleBlurKeepsAudio);assert.ok(result.allMusicPaused);assert.deepEqual(result.errors,[]);assert.deepEqual(errors,[]);reports.push({browser:channel,...result,errors});console.log(channel,JSON.stringify(result));await browser.close();
}
await writeFile('test-results/audio-soak-v4.json',JSON.stringify(reports,null,2));
