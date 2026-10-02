import type { Point } from './types';
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class Random { constructor(public seed=12345) {} next(){ this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296; } }
export class Road {
  points:Point[]=[]; lengths:number[]=[0]; total=0;
  constructor(public nodes:Point[],linear=false) {
    if(linear){this.points=nodes.map(p=>({...p}));for(let i=1;i<this.points.length;i++){this.total+=distance(this.points[i-1],this.points[i]);this.lengths.push(this.total);}return;}
    for(let i=0;i<nodes.length-1;i++) {
      const a=nodes[Math.max(0,i-1)],b=nodes[i],c=nodes[i+1],d=nodes[Math.min(nodes.length-1,i+2)];
      for(let j=0;j<24;j++) { const t=j/24;
        const f=(v0:number,v1:number,v2:number,v3:number)=>.5*((2*v1)+(-v0+v2)*t+(2*v0-5*v1+4*v2-v3)*t*t+(-v0+3*v1-3*v2+v3)*t*t*t);
        this.points.push({x:f(a.x,b.x,c.x,d.x),y:f(a.y,b.y,c.y,d.y)});
      }
    }
    this.points.push(nodes[nodes.length-1]);
    for(let i=1;i<this.points.length;i++){this.total+=distance(this.points[i-1],this.points[i]);this.lengths.push(this.total);}
  }
  at(d:number):Point {
    d=clamp(d,0,this.total);let lo=0,hi=this.lengths.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(this.lengths[mid]<d)lo=mid+1;else hi=mid;}
    const i=Math.max(1,lo),a=this.points[i-1],b=this.points[i],len=this.lengths[i]-this.lengths[i-1];
    const t=len?(d-this.lengths[i-1])/len:0;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  }
  nearest(p:Point):{point:Point;distance:number;progress:number} {
    let best={point:this.points[0],distance:Infinity,progress:0};
    for(let i=1;i<this.points.length;i++){const a=this.points[i-1],b=this.points[i];const dx=b.x-a.x,dy=b.y-a.y;
      const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);const q={x:a.x+dx*t,y:a.y+dy*t},dd=distance(p,q);
      if(dd<best.distance)best={point:q,distance:dd,progress:this.lengths[i-1]+t*(this.lengths[i]-this.lengths[i-1])};
    }return best;
  }
}
export class SpatialGrid<T extends Point> {
  cells=new Map<string,T[]>(); constructor(public cellSize=180){}
  key(x:number,y:number){return `${Math.floor(x/this.cellSize)},${Math.floor(y/this.cellSize)}`;}
  rebuild(items:T[]){this.cells.clear();for(const it of items){const k=this.key(it.x,it.y);const c=this.cells.get(k);if(c)c.push(it);else this.cells.set(k,[it]);}}
  around(p:Point,r:number):T[]{const found:T[]=[];for(let x=Math.floor((p.x-r)/this.cellSize);x<=Math.floor((p.x+r)/this.cellSize);x++)for(let y=Math.floor((p.y-r)/this.cellSize);y<=Math.floor((p.y+r)/this.cellSize);y++)for(const it of this.cells.get(`${x},${y}`)??[])if(distance(p,it)<=r)found.push(it);return found;}
}
