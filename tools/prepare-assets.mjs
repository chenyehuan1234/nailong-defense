import sharp from 'sharp';
import {isolateSprite} from './sprite-crop.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const out=path.join(root,'public/assets');
await mkdir(out,{recursive:true});
const cell=192;
const sheets=[['heroes',8,4],['soldiers',8,4],['towers',5,4],['enemies-a',7,5],['enemies-b',7,6]];
// Generated contact sheets have deliberate row spacing, not mathematically equal rows.
// Separate the actual row bands, normalize all poses within a row to one scale and foot anchor.
const bands={heroes:[0,250,464,679,887],soldiers:[0,240,468,670,887],towers:[0,308,585,887,1122],'enemies-a':[0,231,453,653,852,1060],'enemies-b':[0,171,346,544,729,922,1161]};
for(const [name,cols,rows]of sheets){
  const source=path.join(root,'art/source',name+'.png');const {width,height}=await sharp(source).metadata();const comps=[];
  for(let r=0;r<rows;r++){
    const poses=[],topBand=Math.round(bands[name][r]*height/bands[name].at(-1)),bottomBand=Math.round(bands[name][r+1]*height/bands[name].at(-1));
    const {data:rowPixels,info:rowInfo}=await sharp(source).extract({left:0,top:topBand,width,height:bottomBand-topBand}).ensureAlpha().raw().toBuffer({resolveWithObject:true}),counts=new Uint32Array(width),xs=[0];
    for(let y=0;y<rowInfo.height;y++)for(let x=0;x<width;x++)if(rowPixels[(y*width+x)*4+3]>96)counts[x]++;
    for(let col=1;col<cols;col++){const center=Math.round(col*width/cols),spread=Math.floor(width/cols*.22);let best=center,value=Infinity;for(let x=center-spread;x<=center+spread;x++){const n=counts[x]+(counts[x-1]??0)+(counts[x+1]??0)+Math.abs(x-center)*.001;if(n<value){value=n;best=x;}}xs.push(best);}xs.push(width);
    for(let c=0;c<cols;c++){
      const left=xs[c],top=topBand,w=xs[c+1]-left,h=bottomBand-top;
      const pose=await isolateSprite(await sharp(source).extract({left,top,width:w,height:h}).png().toBuffer());poses.push(pose);
    }
    const factor=172/Math.max(...poses.map(p=>Math.max(p.width,p.height)));
    for(const [c,pose]of poses.entries()){
      const w=Math.max(1,Math.round(pose.width*factor)),h=Math.max(1,Math.round(pose.height*factor));
      const resized=await sharp(pose.image).resize(w,h).png().toBuffer();
      const image=await sharp({create:{width:cell,height:cell,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:resized,left:Math.round((cell-w)/2),top:176-h}]).png().toBuffer();
      comps.push({input:image,left:c*cell,top:r*cell});
      if(c===0)await sharp(image).toFile(path.join(out,`${name}-${r}.png`));
    }
  }
  await sharp({create:{width:cols*cell,height:rows*cell,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(comps).png().toFile(path.join(out,name+'.png'));
  console.log(`${name}: ${cols}×${rows} frames (${cols*rows})`);
}
for(const map of ['forest','river','ruins','campaign']){
  await sharp(path.join(root,'art/source',map+'.png')).resize(1600,900).webp({quality:91}).toFile(path.join(out,map+'.webp'));
}
await sharp(path.join(root,'art/source/road-texture.png')).resize(384,384).webp({quality:90}).toFile(path.join(out,'road-texture.webp'));
const manifest={version:1,maps:['forest','river','ruins','campaign','road-texture'].map(n=>n+'.webp'),footAnchor:{x:96,y:176},actions:{allies:['front','side','back','walkA','walkB','attack','hurt','skill'],enemies:['front','side','back','walkA','walkB','attack','death'],towers:['level1','level2','level3','branch1','branch2']},audio:{type:'procedural WebAudio',source:'src/audio.ts'},atlases:Object.fromEntries(sheets.map(([name,columns,rows])=>[name,{file:name+'.png',columns,rows,frameWidth:cell,frameHeight:cell}])),sources:['YHSome/BigNaiWa assets/fruits/08-pineapple.png (identity reference)','Generated using built-in image_gen; production specifications in docs/art-direction.md']};
await writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
