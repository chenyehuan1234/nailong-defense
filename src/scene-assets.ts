import Phaser from 'phaser';
import {ASSET_BASE} from './assets';
export const BATTLE_SHEETS=['tower-plates','tower-operators','heroes-actions','soldiers-actions','heroes-walk-a','heroes-walk-b','soldiers-walk-a','soldiers-walk-b','heroes','soldiers','towers','enemies-a','enemies-b','enemy-new-1','enemy-new-2','enemy-new-3','enemy-new-4','special-allies'];
const parts:Record<string,[number,number]>={heroes:[8,4],soldiers:[8,4],'enemies-a':[7,5],'enemies-b':[7,6],'enemy-new-1':[7,8],'enemy-new-2':[7,8],'enemy-new-3':[7,8],'enemy-new-4':[7,8],'special-allies':[8,3]};
export class SceneAssets {
 private prepared=new Set<string>();private queue:Promise<void>=Promise.resolve();
 constructor(private scene:Phaser.Scene){}
 ready(keys:string[]){return keys.every(key=>this.scene.textures.exists(key));}
 ensure(keys:string[],progress:(value:number)=>void=()=>{}){
  const work=async()=>{
   const missing=keys.filter(key=>!this.scene.textures.exists(key));
   if(missing.length){let failed=await this.batch(missing,false,progress);
    const sheets=failed.filter(key=>BATTLE_SHEETS.includes(key));if(sheets.length){const fallback=await this.batch(sheets,true,progress);failed=[...failed.filter(key=>!sheets.includes(key)),...fallback];}
    if(failed.length)throw Error('未能下载：'+failed.join('、'));
   }
   for(const key of keys)this.prepare(key);progress(1);
  };
  const result=this.queue.catch(()=>{}).then(work);this.queue=result;return result;
 }
 private batch(keys:string[],png:boolean,progress:(value:number)=>void){
  const load=this.scene.load;return new Promise<string[]>((resolve,reject)=>{
   let timer:ReturnType<typeof setTimeout>;
   const cleanup=()=>{clearTimeout(timer);load.off('progress',onProgress);load.off('fileprogress',heartbeat);load.off('complete',complete);};
   const heartbeat=()=>{clearTimeout(timer);timer=setTimeout(()=>{cleanup();load.inflight.each(file=>{file.xhrLoader?.abort();return null;});load.reset();reject(Error('网络请求超时，请重试'));},35000);};
   const onProgress=(value:number)=>{heartbeat();progress(value);};
   const complete=()=>{cleanup();resolve(keys.filter(key=>!this.scene.textures.exists(key)));};
   load.on('progress',onProgress);load.on('fileprogress',heartbeat);load.once('complete',complete);
   for(const key of keys){if(BATTLE_SHEETS.includes(key))load.spritesheet(key,ASSET_BASE+key+(png?'.png':'.webp'),{frameWidth:192,frameHeight:192});else load.image(key,ASSET_BASE+key+'.webp');}
   heartbeat();load.start();
  });
 }
 private prepare(key:string){
  if(this.prepared.has(key))return;const tex=this.scene.textures.get(key),dimensions=parts[key];
  if(dimensions)for(let i=0;i<dimensions[0]*dimensions[1];i++){
   const f=tex.get(i);if(!f)throw Error('角色图片不完整：'+key);
   tex.add(`${i}-body`,0,f.cutX,f.cutY,192,160);tex.add(`${i}-legL`,0,f.cutX,f.cutY+154,96,38);tex.add(`${i}-legR`,0,f.cutX+96,f.cutY+154,96,38);
   for(const n of [2,4,6])for(let j=0;j<n;j++)tex.add(`${i}-foot${n}-${j}`,0,f.cutX+j*192/n,f.cutY+(n===6?140:154),192/n,n===6?52:38);
   tex.add(`${i}-flight-body`,0,f.cutX+64,f.cutY,64,192);tex.add(`${i}-wing0`,0,f.cutX,f.cutY,72,192);tex.add(`${i}-wing1`,0,f.cutX+120,f.cutY,72,192);
  }
  if(key==='tower-plates')for(let i=0;i<20;i++){const f=tex.get(i),cut=[[97,78,69,80,72],[135,118,102,96,110],[142,108,88,74,82],[134,122,108,114,97]][Math.floor(i/5)][i%5];tex.add(`${i}-front`,0,f.cutX,f.cutY+cut,192,192-cut);}
  this.prepared.add(key);
 }
}
