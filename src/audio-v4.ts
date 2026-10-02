import {ASSET_BASE} from './assets';
import type {CombatEvent,SaveData} from './types';
type Theme='forest'|'dark'|'boss';
type MusicVoice={element:HTMLAudioElement;source:MediaElementAudioSourceNode;gain:GainNode;theme:Theme;index:number};
type Voice={source:AudioBufferSourceNode;gain:GainNode};
/** Short effects are decoded once; full songs stay in the browser's streaming cache. */
export class AudioDirector {
 ctx?:AudioContext;master?:GainNode;musicGain?:GainNode;sfxGain?:GainNode;ambientGain?:GainNode;enabled=true;music=true;
 volumes:SaveData['settings']={sound:true,music:true,lowQuality:false,autoWave:true,speed:1,masterVolume:.8,musicVolume:.75,sfxVolume:.8,ambientVolume:.45};
 buffers=new Map<string,AudioBuffer>();manifest:Record<string,string[]>={};voices=new Set<AudioBufferSourceNode>();last=new Map<string,number>();
 theme:Theme='forest';musicVoice?:MusicVoice;nextVoice?:MusicVoice;ambientVoice?:Voice;loading?:Promise<void>;counter=0;speed=1;error='';
 positions:Partial<Record<Theme,{index:number;time:number}>>={};focused=true;switching=false;retiring?:MusicVoice;fadeTimer?:ReturnType<typeof setTimeout>;transition=0;
 constructor(){
  const focus=(active:boolean)=>{this.focused=active;if(active){void this.ctx?.resume();void this.musicVoice?.element.play().catch(()=>{});}else{this.musicVoice?.element.pause();this.retiring?.element.pause();void this.ctx?.suspend();}};
  window.addEventListener('focus',()=>focus(!document.hidden));
  document.addEventListener('visibilitychange',()=>focus(!document.hidden));
 }
 async unlock(){
  if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.musicGain=this.ctx.createGain();this.sfxGain=this.ctx.createGain();this.ambientGain=this.ctx.createGain();
   const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-4;limiter.knee.value=3;limiter.ratio.value=20;limiter.attack.value=.003;limiter.release.value=.15;
   this.master.connect(limiter);limiter.connect(this.ctx.destination);for(const bus of [this.musicGain,this.sfxGain,this.ambientGain])bus.connect(this.master);this.loading=this.load();
  }
  this.focused=true;if(this.ctx.state==='suspended')await this.ctx.resume();void this.musicVoice?.element.play().catch(()=>{});
 }
 async load(){try{
  const response=await fetch(ASSET_BASE+'audio/manifest.json');if(!response.ok)throw Error('音频清单加载失败');this.manifest=await response.json();
  const files=[...new Set(Object.entries(this.manifest).filter(([key])=>!key.startsWith('music-')).flatMap(([,files])=>files))];
  await Promise.all(files.map(async file=>{const r=await fetch(ASSET_BASE+'audio/'+file);if(!r.ok)throw Error('音频加载失败：'+file);this.buffers.set(file,await this.ctx!.decodeAudioData(await r.arrayBuffer()));}));
  this.setTheme(this.theme,true);
 }catch(e){this.error=e instanceof Error?e.message:'音频加载失败';}}
 createMusic(theme:Theme,index:number):MusicVoice{
  const element=new Audio(ASSET_BASE+'audio/'+this.manifest['music-'+theme][index]);element.preload='auto';element.loop=false;element.playbackRate=1;
  const source=this.ctx!.createMediaElementSource(element),gain=this.ctx!.createGain();source.connect(gain);gain.connect(this.musicGain!);gain.gain.value=0;
  element.addEventListener('error',()=>{this.error='音乐加载失败，请刷新重试';});
  return{element,source,gain,theme,index};
 }
 release(v:MusicVoice){v.element.pause();v.element.removeAttribute('src');v.element.load();v.source.disconnect();v.gain.disconnect();}
 remember(v:MusicVoice){this.positions[v.theme]={index:v.index,time:v.element.currentTime};}
 activate(v:MusicVoice,old?:MusicVoice){
  if(this.fadeTimer)clearTimeout(this.fadeTimer);if(this.retiring)this.release(this.retiring);this.retiring=old;const transition=++this.transition;this.switching=true;this.musicVoice=v;const at=this.ctx!.currentTime;
  v.gain.gain.setValueAtTime(0,at);v.gain.gain.linearRampToValueAtTime(1,at+1);
  if(this.focused)void v.element.play().catch(()=>{});
  if(old){if(old.theme!==v.theme)this.remember(old);old.gain.gain.cancelScheduledValues(at);old.gain.gain.setValueAtTime(old.gain.gain.value,at);old.gain.gain.linearRampToValueAtTime(0,at+1);}
  this.fadeTimer=setTimeout(()=>{if(transition!==this.transition)return;if(this.retiring){this.release(this.retiring);this.retiring=undefined;}this.switching=false;this.preloadNext();},1050);
 }
 preloadNext(){if(!this.musicVoice||this.nextVoice)return;const current=this.musicVoice,files=this.manifest['music-'+current.theme];this.nextVoice=this.createMusic(current.theme,(current.index+1)%files.length);}
 setTheme(theme:Theme,force=false){
  if(this.theme===theme&&!force&&this.musicVoice)return;this.theme=theme;if(!this.ctx||!this.manifest['music-'+theme]?.length)return;
  if(this.nextVoice){this.release(this.nextVoice);this.nextVoice=undefined;}
  const position=this.positions[theme],next=this.createMusic(theme,position?.index??0);
  if(position?.time)next.element.addEventListener('loadedmetadata',()=>{next.element.currentTime=Math.min(position.time,Math.max(0,next.element.duration-2));},{once:true});
  this.activate(next,this.musicVoice);
  if(!this.ambientVoice){const file=this.manifest.ambient?.[0],buffer=this.buffers.get(file);if(buffer){const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.ambientGain!);source.start();this.ambientVoice={source,gain};}}
 }
 play(key:string,priority=false,x=800){
  if(!this.ctx||!this.sfxGain||!this.enabled||!this.focused)return;const now=this.ctx.currentTime;
  const spacing=key==='bow'||key==='crossbow'?(this.speed>=3?.18:.09):(this.speed>=3?.1:.055);
  if(!priority&&((this.last.get(key)??-99)>now-spacing||this.voices.size>=20)||priority&&this.voices.size>=32)return;
  this.last.set(key,now);const files=this.manifest[key]??this.manifest.impact,file=files?.[this.counter++%files.length],buffer=this.buffers.get(file);if(!buffer)return;
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner();source.buffer=buffer;gain.gain.value=priority?.8:key==='bow'?.55:.48;
  pan.pan.value=Math.max(-.65,Math.min(.65,(x-800)/1100));source.connect(gain);gain.connect(pan);pan.connect(this.sfxGain);this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();pan.disconnect();};source.start();
 }
 uiClick(){this.play('ui');}
 handle(e:CombatEvent){
  if(e.type==='shot')this.play(e.effect==='lightning'?'lightning':e.towerKind==='engineer'||e.kind==='engineer'?'cannon':e.towerKind==='mage'||e.damageKind==='magic'?'magic':e.towerKind==='archer'&&e.branch===1?'crossbow':'bow',false,e.point.x);
  else if(e.type==='impact')this.play(e.damageKind==='magic'?'magic-hit':e.effect==='melee'||e.kind==='melee'?'shield':e.radius?'explosion':'impact',false,e.point.x);
  else if(e.type==='heal')this.play('heal',false,e.point.x);
  else if(e.type==='upgrade')this.play('upgrade',true,e.point.x);
  else if(e.type==='wave')this.play('wave',true);
  else if(e.type==='leak')this.play('leak',true);
  else if(e.type==='result')this.play(e.kind==='won'?'victory':'defeat',true);
  else if(e.type==='warning'&&e.kind!=='meteor')this.play('boss',true,e.point.x);
 }
 update(paused=false,theme:Theme='forest',speed=1){
  this.speed=speed;if(!this.ctx||!this.master)return;this.setTheme(theme);const at=this.ctx.currentTime;
  this.master.gain.setTargetAtTime(this.volumes.masterVolume,at,.08);this.musicGain!.gain.setTargetAtTime(this.music?(paused?.25:1)*this.volumes.musicVolume:0,at,.12);
  this.sfxGain!.gain.setTargetAtTime(this.enabled?this.volumes.sfxVolume:0,at,.08);this.ambientGain!.gain.setTargetAtTime(paused||!this.enabled?0:this.volumes.ambientVolume*.22,at,.12);
  const v=this.musicVoice;
  if(v&&!this.switching&&this.focused&&(v.element.ended||Number.isFinite(v.element.duration)&&v.element.duration-v.element.currentTime<=1)&&this.nextVoice){
   const next=this.nextVoice;this.nextVoice=undefined;this.positions[v.theme]={index:next.index,time:0};this.activate(next,v);
  }
 }
}
