import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
await mkdir('public/assets/tower-icons',{recursive:true});
const atlas=await sharp('public/assets/tower-plates.png').metadata(),columns=atlas.width/192;
for(let row=0;row<4;row++)for(let column=0;column<5;column++){
 const frame=row*5+column;
 const crop=await sharp('public/assets/tower-plates.png').extract({left:frame%columns*192,top:Math.floor(frame/columns)*192,width:192,height:192}).png().toBuffer();
 const image=await sharp(crop).trim().resize({width:56,height:56,fit:'inside'}).toBuffer();
 const size=await sharp(image).metadata();
 await sharp({create:{width:64,height:64,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:image,left:Math.round((64-size.width)/2),top:Math.round((64-size.height)/2)}]).png().toFile(`public/assets/tower-icons/${row}-${column}.png`);
}
console.log('20 tower icons exported from existing tower artwork');
