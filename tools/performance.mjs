import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const reports=[];
for(const channel of ['chrome','msedge']){
  const browser=await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5188',{waitUntil:'networkidle'});await page.locator('[data-action="training-skip"]').click();await page.locator('.world-node').first().waitFor();await page.evaluate(()=>window.__NAILONG__.ui.audio.unlock());await page.waitForTimeout(800);
  await page.evaluate(()=>{
    const a=window.__NAILONG__;a.ui.selectedLevel=11;a.ui.start();const s=a.sim;s.gold=30000;s.lives=10000;
    const kinds=['archer','mage','barracks','engineer'];for(let i=0;i<s.level.slots.length;i++){s.command({type:'build',slot:i,kind:kinds[i%4]});s.command({type:'upgrade',slot:i});s.command({type:'upgrade',slot:i});s.command({type:'upgrade',slot:i,branch:i%2});s.command({type:'tower-skill',slot:i,skill:0});s.command({type:'tower-skill',slot:i,skill:1});}
    for(let i=0;i<150;i++){const e=s.spawn(['mushroom','boar','bat','slime','treant','spear'][i%6],i%2,180+(i%30)*20);e.hp=e.maxHp=8000;}
    while(s.allies.length<40){const a=s.createSoldier(undefined,s.allies.length,{x:550+(s.allies.length%8)*40,y:425});a.expires=10000;}
    for(const ally of s.allies)ally.hp=ally.maxHp=8000;
    a.scene.syncUnits();a.scene.syncTowers();
  });
  await page.waitForTimeout(1500);
  const result=await page.evaluate(()=>new Promise(resolve=>{const samples=[],counts=[];let last=performance.now(),started=last;const initialTime=window.__NAILONG__.sim.time;function frame(now){samples.push(now-last);last=now;const s=window.__NAILONG__.sim;for(const e of s.enemies)if(e.distance>s.goalProgress(e)-180){e.distance=180+(e.id%30)*20;const p=s.roads[e.path].at(e.distance);e.x=p.x;e.y=p.y;}if(samples.length%50===0){while(s.enemies.length<150){const e=s.spawn(['mushroom','boar','bat','slime','treant','spear'][s.enemies.length%6],s.enemies.length%2,350);e.hp=e.maxHp=8000;}counts.push(s.enemies.length);}if(now-started<20000)requestAnimationFrame(frame);else{samples.sort((a,b)=>a-b);const sum=samples.reduce((a,b)=>a+b,0);const a=window.__NAILONG__;resolve({sampleSeconds:+(sum/1000).toFixed(1),frames:samples.length,simulationSeconds:+(a.sim.time-initialTime).toFixed(1),paused:a.scene.paused,minEnemies:Math.min(...counts),maxEnemies:Math.max(...counts),averageFps:Math.round(samples.length*1000/sum),medianFrameMs:+samples[Math.floor(samples.length*.5)].toFixed(2),p95FrameMs:+samples[Math.floor(samples.length*.95)].toFixed(2),enemies:a.sim.enemies.length,allies:a.sim.allies.length,renderer:a.game.renderer.type===2?'WebGL':'Canvas',gpu:(()=>{const gl=a.game.renderer.gl,info=gl?.getExtension('WEBGL_debug_renderer_info');return info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl?.getParameter(gl.RENDERER);})()});}}requestAnimationFrame(frame);}));
  await page.screenshot({path:`test-results/visual-v4/stress-${channel}.png`});reports.push({browser:channel,viewport:'1920x1080',...result,errors});console.log(JSON.stringify(reports.at(-1)));await browser.close();
}
await writeFile('test-results/performance-v4.json',JSON.stringify(reports,null,2));
