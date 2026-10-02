import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const records=[];const cell=192;
/** Strip disconnected neighbor fragments from a crop; retain the character silhouette. */
async function silhouette(input){const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});const {width:w,height:h}=info,seen=new Uint8Array(w*h),components=[];
 for(let i=0;i<w*h;i++){if(seen[i]||data[i*4+3]<100)continue;const queue=[i];seen[i]=1;for(let q=0;q<queue.length;q++){const k=queue[q],x=k%w,y=Math.floor(k/w);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx<0||yy<0||xx>=w||yy>=h||seen[n]||data[n*4+3]<100)continue;seen[n]=1;queue.push(n);}}components.push(queue);}
 components.sort((a,b)=>b.length-a.length);const keep=new Uint8Array(w*h);for(const list of components)if(list.length>=Math.max(35,(components[0]?.length??0)*.16))for(const k of list)keep[k]=1;
 let minX=w,minY=h,maxX=-1,maxY=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!keep[i])data[i*4+3]=0;else{minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
 if(maxX<0)throw Error('Empty sprite crop');const width=maxX-minX+1,height=maxY-minY+1;return {image:await sharp(data,{raw:info}).extract({left:minX,top:minY,width,height}).png().toBuffer(),width,height};
}
async function pack(name,source,cols,rows,bands,remap){const composites=[];for(let row=0;row<rows;row++){let sourcePath=source,sourceRow=remap?.[row]??row;if(sourceRow===-1){sourcePath='enemy-marauder';sourceRow=0;}const original='art/source/'+sourcePath+'.png',meta=await sharp(original).metadata();const ys=bands&&sourcePath===source?bands:Array.from({length:sourcePath==='enemy-marauder'?2:rows+1},(_,i)=>i*meta.height/(sourcePath==='enemy-marauder'?1:rows));const poses=[];
 for(let col=0;col<cols;col++){const left=Math.round(col*meta.width/cols)+2,top=Math.round(ys[sourceRow])+2,width=Math.round((col+1)*meta.width/cols)-left-2,height=Math.round(ys[sourceRow+1])-top-2;const pose=await silhouette(await sharp(original).extract({left,top,width,height}).png().toBuffer());poses.push(pose);records.push({sheet:name,row,col,source:original,rect:{left,top,width,height},anchor:{x:96,y:176}});}
 const scale=172/Math.max(...poses.map(p=>Math.max(p.width,p.height)));for(const [col,p]of poses.entries()){const width=Math.round(p.width*scale),height=Math.round(p.height*scale),input=await sharp(p.image).resize(width,height).png().toBuffer();const frame=await sharp({create:{width:cell,height:cell,channels:4,background:'#0000'}}).composite([{input,left:Math.round((192-width)/2),top:176-height}]).png().toBuffer();composites.push({input:frame,left:col*cell,top:row*cell});if(col===0)await sharp(frame).toFile(`public/assets/${name}-${row}.png`);}}
 await sharp({create:{width:cols*cell,height:rows*cell,channels:4,background:'#0000'}}).composite(composites).png().toFile(`public/assets/${name}.png`);console.log(name,cols*rows,'frames');}
await pack('heroes','heroes-v2',8,4,[0,250,464,679,887]);
await pack('soldiers','soldiers-v2',8,4,[0,240,468,670,887]);
// The generated first enemy sheet omitted the marauder row. Explicit remapping repairs it.
const m=await sharp('art/source/enemy-new-1.png').metadata();
await pack('enemy-new-1','enemy-new-1',7,8,[0,190,365,559,729,952,1100,m.height],[0,1,2,-1,3,4,5,6]);
await pack('enemy-new-2','enemy-new-2',7,8,[0,133,289,438,581,726,888,1036,1174]);
await pack('enemy-new-3','enemy-new-3',7,8,[0,178,341,504,634,778,914,1060,1199]);
await pack('enemy-new-4','enemy-new-4',7,8,[0,137,295,461,606,760,907,1057,1199]);
await pack('special-allies','special-allies',8,3);
for(const name of ['campaign-v2',...Array.from({length:12},(_,i)=>'map-'+String(i+1).padStart(2,'0'))])await sharp(`art/source/${name}.png`).resize(1600,900).webp({quality:91}).toFile(`public/assets/${name}.webp`);
await writeFile('public/assets/frame-manifest.json',JSON.stringify({version:2,cell:192,frames:records},null,2));
const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));manifest.version=2;for(const n of [1,2,3,4])manifest.atlases['enemy-new-'+n]={file:'enemy-new-'+n+'.png',columns:7,rows:8,frameWidth:192,frameHeight:192};manifest.atlases['special-allies']={file:'special-allies.png',columns:8,rows:3,frameWidth:192,frameHeight:192};manifest.maps=[...new Set([...manifest.maps,'campaign-v2.webp',...Array.from({length:12},(_,i)=>'map-'+String(i+1).padStart(2,'0')+'.webp')])];manifest.frameManifest='frame-manifest.json';await writeFile('public/assets/manifest.json',JSON.stringify(manifest,null,2));
