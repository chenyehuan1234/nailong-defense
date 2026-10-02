import {ASSET_BASE} from './assets';
import type { CombatEvent, SaveData } from './types';
type Theme='forest'|'dark'|'boss';
type Voice={source:AudioBufferSourceNode;gain:GainNode};
export class AudioDirector {
 ctx?:AudioContext;master?:GainNode;musicGain?:GainNode;sfxGain?:GainNode;ambientGain?:GainNode;enabled=true;music=true;
 volumes:SaveData['settings']={sound:true,music:true,lowQuality:false,autoWave:true,speed:1,masterVolume:.8,musicVolume:.75,sfxVolume:.8,ambientVolume:.45};
 buffers=new Map<string,AudioBuffer>();manifest:Record<string,string[]>={};voices=new Set<AudioBufferSourceNode>();last=new Map<string,number>();theme:Theme='forest';musicVoice?:Voice;ambientVoice?:Voice;loading?:Promise<void>;counter=0;speed=1;error='';
 async unlock(){
  if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.musicGain=this.ctx.createGain();this.sfxGain=this.ctx.createGain();this.ambientGain=this.ctx.createGain();const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-4;limiter.knee.value=3;limiter.ratio.value=20;limiter.attack.value=.003;limiter.release.value=.15;this.master.connect(limiter);limiter.connect(this.ctx.destination);for(const bus of [this.musicGain,this.sfxGain,this.ambientGain])bus.connect(this.master);this.loading=this.load();}
  if(this.ctx.state==='suspended')await this.ctx.resume();
 }
 async load(){try{const r=await fetch(ASSET_BASE+'audio/manifest.json');if(!r.ok)throw Error('音频清单加载失败');this.manifest=await r.json();await Promise.all(Object.values(this.manifest).flat().map(async file=>{const r=await fetch(ASSET_BASE+'audio/'+file);if(!r.ok)throw Error('音频加载失败：'+file);this.buffers.set(file,await this.ctx!.decodeAudioData(await r.arrayBuffer()));}));this.setTheme(this.theme,true);}catch(e){this.error=e instanceof Error?e.message:'音频加载失败';}}
 loop(key:string,bus:GainNode){const file=this.manifest[key]?.[0],buffer=this.buffers.get(file);if(!buffer)return;const source=this.ctx!.createBufferSource(),gain=this.ctx!.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(bus);gain.gain.setValueAtTime(0,this.ctx!.currentTime);gain.gain.linearRampToValueAtTime(1,this.ctx!.currentTime+1);source.start();return{source,gain};}
 setTheme(theme:Theme,force=false){if(this.theme===theme&&!force&&this.musicVoice)return;this.theme=theme;if(!this.ctx||!this.musicGain||!this.buffers.size)return;const next=this.loop('music-'+theme,this.musicGain);if(!next)return;const old=this.musicVoice;this.musicVoice=next;if(old){old.gain.gain.cancelScheduledValues(this.ctx.currentTime);old.gain.gain.setValueAtTime(old.gain.gain.value,this.ctx.currentTime);old.gain.gain.linearRampToValueAtTime(0,this.ctx.currentTime+1);old.source.stop(this.ctx.currentTime+1.05);}if(!this.ambientVoice)this.ambientVoice=this.loop('ambient',this.ambientGain!);}
 play(key:string,priority=false,x=800){if(!this.ctx||!this.sfxGain||!this.enabled)return;const now=this.ctx.currentTime;if(!priority&&((this.last.get(key)??-99)>now-(this.speed>=3?.1:.055)||this.voices.size>=20)||priority&&this.voices.size>=32)return;this.last.set(key,now);const files=this.manifest[key]??this.manifest['impact'],file=files?.[this.counter++%files.length],buffer=this.buffers.get(file);if(!buffer)return;const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner();source.buffer=buffer;gain.gain.value=priority?.8:.48;pan.pan.value=Math.max(-.65,Math.min(.65,(x-800)/1100));source.connect(gain);gain.connect(pan);pan.connect(this.sfxGain);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();pan.disconnect();};source.start();}
 uiClick(){this.play('ui');}
 handle(e:CombatEvent){
  if(e.type==='shot'){const key=e.effect==='lightning'?'lightning':e.towerKind==='engineer'||e.kind==='engineer'?'cannon':e.towerKind==='mage'||e.damageKind==='magic'?'magic':'bow';this.play(key,false,e.point.x);}
  else if(e.type==='impact')this.play(e.damageKind==='magic'?'magic-hit':e.effect==='melee'||e.kind==='melee'?'shield':e.radius?'explosion':'impact',false,e.point.x);
  else if(e.type==='heal')this.play('heal',false,e.point.x);
  else if(e.type==='upgrade')this.play('upgrade',true,e.point.x);
  else if(e.type==='wave')this.play('wave',true);
  else if(e.type==='leak')this.play('leak',true);
  else if(e.type==='result')this.play(e.kind==='won'?'victory':'defeat',true);
  else if(e.type==='warning'&&e.kind!=='meteor')this.play('boss',true,e.point.x);
 }
 update(paused=false,theme:Theme='forest',speed=1){this.speed=speed;if(!this.ctx||!this.master)return;this.setTheme(theme);const at=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.volumes.masterVolume,at,.08);this.musicGain!.gain.setTargetAtTime(this.music?(paused?.25:1)*this.volumes.musicVolume:0,at,.12);this.sfxGain!.gain.setTargetAtTime(this.volumes.sfxVolume,at,.08);this.ambientGain!.gain.setTargetAtTime(paused?0:this.volumes.ambientVolume*.22,at,.12);}
}
