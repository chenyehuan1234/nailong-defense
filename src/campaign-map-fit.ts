/** Keep phone flags inside the map and leave a gap between their touch areas. */
export function fitCampaignMap(map:HTMLElement){
 const surface=map.querySelector<HTMLElement>('.world-map-surface');if(!surface)return;
 const buttons=[...surface.querySelectorAll<HTMLElement>('.world-node')],w=map.clientWidth;
 const rows=Math.ceil(buttons.length/Math.max(1,Math.floor((w-60)/52)+1));
 surface.style.minHeight=Math.max(0,60+(rows-1)*59)+'px';
 const h=surface.offsetHeight,points=buttons.map(b=>({b,x:Number(b.dataset.mapX)*w/100,y:Number(b.dataset.mapY)*h/100}));
 const clamp=(p:typeof points[number])=>{p.x=Math.max(30,Math.min(w-30,p.x));p.y=Math.max(30,Math.min(h-30,p.y));};
 for(const p of points)clamp(p);
 for(let pass=0;pass<180;pass++)for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  const a=points[i],b=points[j],dx=b.x-a.x,dy=b.y-a.y,px=52-Math.abs(dx),py=59-Math.abs(dy);
  if(px<=0||py<=0)continue;
  if(px<py||h<119){const push=(px+.1)/2*(dx>=0?1:-1);a.x-=push;b.x+=push;}
  else{const push=(py+.1)/2*(dy>=0?1:-1);a.y-=push;b.y+=push;}
  clamp(a);clamp(b);
 }
 const byId=new Map(points.map(p=>[p.b.dataset.nodeId,p]));
 for(const p of points){p.b.style.left=p.x/w*100+'%';p.b.style.top=p.y/h*100+'%';}
 for(const line of surface.querySelectorAll<SVGLineElement>('line')){
  const a=byId.get(line.dataset.from),b=byId.get(line.dataset.to);if(!a||!b)continue;
  for(const [key,value]of Object.entries({x1:a.x/w*1600,y1:a.y/h*900,x2:b.x/w*1600,y2:b.y/h*900}))line.setAttribute(key,String(value));
 }
}
