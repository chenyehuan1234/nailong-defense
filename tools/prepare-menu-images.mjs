import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const files=[];
for(const [kind,source]of [['home','home-v4.1.webp'],['campaign','campaign-v4.webp']]){
 const file=`menu-${kind}.jpg`;const info=await sharp('public/assets/'+source).resize(1280,720).jpeg({quality:84,mozjpeg:true,progressive:true}).toFile('public/assets/'+file);
 files.push({kind,file,source,width:info.width,height:info.height,bytes:info.size});
}
await writeFile('public/assets/menu-images.json',JSON.stringify({version:1,format:'progressive JPEG',quality:84,files},null,2));console.log(files);
