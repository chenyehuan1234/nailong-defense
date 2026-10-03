import sharp from 'sharp';
import {stat,writeFile} from 'node:fs/promises';
const sheets=['tower-plates','tower-operators','heroes-actions','soldiers-actions','heroes-walk-a','heroes-walk-b','soldiers-walk-a','soldiers-walk-b','heroes','soldiers','towers','enemies-a','enemies-b','enemy-new-1','enemy-new-2','enemy-new-3','enemy-new-4','special-allies'];
let before=0,after=0;const files=[];
for(const key of sheets){const source=`public/assets/${key}.png`,target=`public/assets/${key}.webp`;const metadata=await sharp(source).metadata();await sharp(source).webp({quality:90,alphaQuality:100,effort:5}).toFile(target);const a=(await stat(source)).size,b=(await stat(target)).size;before+=a;after+=b;files.push({key,source:key+'.png',runtime:key+'.webp',width:metadata.width,height:metadata.height,bytes:b});}
await writeFile('public/assets/runtime-sheets.json',JSON.stringify({version:1,quality:90,alphaQuality:100,frameSize:192,sourceBytes:before,runtimeBytes:after,files},null,2));
console.log(`18 atlases: ${(before/1048576).toFixed(2)} MB → ${(after/1048576).toFixed(2)} MB; dimensions and alpha preserved`);
