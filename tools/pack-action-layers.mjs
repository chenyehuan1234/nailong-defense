import fs from 'node:fs';import sharp from 'sharp';
const source='art/source/animation-v3',manifest={version:3,cell:192,anchor:{x:96,y:176},atlases:{}};
for(const [file,key,columns]of [['tower-plates.png','tower-plates',5],['operators.png','tower-operators',6],['heroes-actions.png','heroes-actions',6],['soldiers-actions.png','soldiers-actions',6]]){
 if(!fs.existsSync(source+'/'+file))continue;
 const {data,info}=await sharp(source+'/'+file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const transparent=[0,info.width-1,(info.height-1)*info.width,info.width*info.height-1].filter(i=>data[i*4+3]<20).length;if(transparent<3)throw Error('Background is not transparent: '+file);
 const rows=4,bounds=[0],activity=Array.from({length:info.height},()=>0);for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>40)activity[y]++;
 for(let row=1;row<rows;row++){const center=Math.round(info.height*row/rows);let best=center,val=Infinity;for(let y=center-25;y<=center+25;y++){const n=activity[y]+(activity[y-1]??0)+(activity[y+1]??0);if(n<val){val=n;best=y;}}bounds.push(best);}bounds.push(info.height);
 const parts=[],composite=[],factors=[];
 for(let row=0;row<rows;row++){const top=bounds[row],bottom=bounds[row+1],activityX=new Uint32Array(info.width),columnsX=[0];for(let y=top;y<bottom;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>40)activityX[x]++;for(let col=1;col<columns;col++){const center=Math.round(col*info.width/columns);let best=center,val=Infinity;for(let x=Math.max(columnsX.at(-1)+20,center-60);x<=Math.min(info.width-1,center+60);x++){const v=activityX[x]+(activityX[x-1]??0)+(activityX[x+1]??0)+Math.abs(x-center)*.001;if(v<val){val=v;best=x;}}columnsX.push(best);}columnsX.push(info.width);const cells=[];for(let col=0;col<columns;col++){const left=columnsX[col],right=columnsX[col+1];let x0=right,y0=bottom,x1=left,y1=top;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>30){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}if(x1<x0)throw Error('Empty cell: '+file);cells.push({row,col,x0,y0,width:x1-x0+1,height:y1-y0+1});}
  const scale=Math.min(...cells.map(p=>Math.min(164/p.height,180/p.width)));factors.push(160/(cells[0].height*scale));
  for(const p of cells){const width=Math.round(p.width*scale),height=Math.round(p.height*scale),input=await sharp(source+'/'+file).extract({left:p.x0,top:p.y0,width:p.width,height:p.height}).resize(width,height).png().toBuffer();composite.push({input,left:p.col*192+Math.round((192-width)/2),top:p.row*192+176-height});parts.push(p);}
 }
 await sharp({create:{width:192*columns,height:192*rows,channels:4,background:'#0000'}}).composite(composite).png().toFile('public/assets/'+key+'.png');manifest.atlases[key]={file:key+'.png',columns,rows,source:file,factors,frames:parts};
}
fs.writeFileSync(source+'/action-manifest.json',JSON.stringify(manifest,null,2));
fs.writeFileSync('content/action-scales.ts','export const ACTION_SCALES:Record<string,number[]>='+JSON.stringify(Object.fromEntries(Object.entries(manifest.atlases).map(([k,v])=>[k,v.factors])))+';\n');console.log('Action atlases:',Object.keys(manifest.atlases));
