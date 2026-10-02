import fs from 'node:fs';
import sharp from 'sharp';
import {isolateSprite} from './sprite-crop.mjs';
const source='art/source/animation-v3';fs.mkdirSync(source,{recursive:true});
const inputs=[['heroes-walk-1.png','heroes-walk-a',2],['heroes-walk-2.png','heroes-walk-b',2],['soldiers-walk-1.png','soldiers-walk-a',2],['soldiers-walk-2.png','soldiers-walk-b',2]];
const manifest={version:3,cell:192,columns:6,rows:6,anchor:{x:96,y:176},cycleDistance:90,sheets:[]};
for(const [file,key,characters]of inputs){if(!fs.existsSync(source+'/'+file))continue;const {data,info}=await sharp(source+'/'+file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const activity=[];for(let y=0;y<info.height;y++){let n=0;for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>40)n++;activity.push(n);}
 // Detect transparent row gutters; AI source art need not have mathematically equal margins.
 const bounds=[0];for(let row=1;row<6;row++){const center=Math.round(info.height*row/6),a=Math.max(bounds.at(-1)+20,center-45),z=Math.min(info.height-1,center+45);let best=center,value=Infinity;for(let y=a;y<=z;y++){const v=activity[y]+(activity[y-1]??0)+(activity[y+1]??0);if(v<value){value=v;best=y;}}bounds.push(best);}bounds.push(info.height);
 const parts=[],images=[];
 for(let row=0;row<6;row++){
  const top=bounds[row],bottom=bounds[row+1],activityX=new Uint32Array(info.width),xs=[0];
  for(let y=top;y<bottom;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>96)activityX[x]++;
  for(let col=1;col<6;col++){const center=Math.round(col*info.width/6);let best=center,v=Infinity;for(let x=center-45;x<=center+45;x++){const n=activityX[x]+(activityX[x-1]??0)+(activityX[x+1]??0)+Math.abs(x-center)*.001;if(n<v){v=n;best=x;}}xs.push(best);}xs.push(info.width);
  for(let col=0;col<6;col++){const left=xs[col],right=xs[col+1],sprite=await isolateSprite(await sharp(source+'/'+file).extract({left,top,width:right-left,height:bottom-top}).png().toBuffer());parts.push({row,col,x0:left+sprite.x0,y0:top+sprite.y0,width:sprite.width,height:sprite.height});images.push(sprite.image);}
 }
 const scales=Array.from({length:characters},(_,hero)=>Math.min(...parts.filter(p=>Math.floor(p.row/3)===hero).map(p=>Math.min(160/p.height,180/p.width))));
 const composites=[];for(const [i,p]of parts.entries()){const scale=scales[Math.floor(p.row/3)],width=Math.round(p.width*scale),height=Math.round(p.height*scale);const input=await sharp(images[i]).resize(width,height).png().toBuffer();composites.push({input,left:p.col*192+Math.round((192-width)/2),top:p.row*192+176-height});}
 await sharp({create:{width:1152,height:1152,channels:4,background:'#0000'}}).composite(composites).png().toFile('public/assets/'+key+'.png');
 manifest.sheets.push({key,file:key+'.png',source:file,rows:bounds,frames:parts});
}
fs.writeFileSync(source+'/manifest.json',JSON.stringify(manifest,null,2));console.log('Packed walk sheets:',manifest.sheets.length);
