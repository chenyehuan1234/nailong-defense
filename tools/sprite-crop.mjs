import sharp from 'sharp';
// Packaging cleanup: discard disconnected pieces from adjacent contact-sheet cells.
// Preserve source art and its soft silhouette edge; never redraw a character here.
export async function isolateSprite(input){
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,seen=new Uint8Array(w*h),components=[];
 for(let i=0;i<w*h;i++){
  if(seen[i]||data[i*4+3]<96)continue;
  const q=[i];seen[i]=1;
  for(let j=0;j<q.length;j++){const k=q[j],x=k%w,y=Math.floor(k/w);for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const n=yy*w+xx;if(!seen[n]&&data[n*4+3]>=96){seen[n]=1;q.push(n);}}}
  components.push(q);
 }
 components.sort((a,b)=>b.length-a.length);if(!components.length)throw Error('Empty sprite crop');
 const keep=new Uint8Array(w*h);
 for(const component of components)if(component.length>=components[0].length*.12)for(const k of component){const x=k%w,y=Math.floor(k/w);for(let yy=Math.max(0,y-2);yy<=Math.min(h-1,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(w-1,x+2);xx++)keep[yy*w+xx]=1;}
 let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!keep[i])data[i*4+3]=0;if(data[i*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
 const width=x1-x0+1,height=y1-y0+1;
 return{image:await sharp(data,{raw:info}).extract({left:x0,top:y0,width,height}).png().toBuffer(),x0,y0,width,height};
}
