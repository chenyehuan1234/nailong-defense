import { clamp, distance, Road } from './math';
import type { LevelDefinition, Point } from './types';
/** Terrain A*: independent of rendering, deterministic tie ordering. */
export class Navigation {
 readonly cell:number;readonly columns:number;readonly rows:number;readonly originX:number;readonly originY:number;blocked:Uint8Array;
 constructor(public level:LevelDefinition,public roads:Road[]) {
  const g=level.walkingGrid,l=level.logicalSize;this.cell=g&&l?16*l.scale:32;this.columns=g?g.grid.length:50;this.rows=g?g.grid[0].length:29;this.originX=g&&l?l.offsetX+g.ox*l.scale:0;this.originY=g&&l?900-(g.oy+this.rows*16)*l.scale:0;this.blocked=new Uint8Array(this.columns*this.rows);
  for(let y=0;y<this.rows;y++)for(let x=0;x<this.columns;x++) {
   const p=this.point(y*this.columns+x);let blocked=p.y<100||p.y>820;
   if(level.walkingGrid&&level.logicalSize){const g=level.walkingGrid,l=level.logicalSize,xx=(p.x-l.offsetX)/l.scale,yy=(900-p.y)/l.scale;const gx=Math.floor((xx-g.ox)/16),gy=Math.floor((yy-g.oy)/16),flags=g.grid[gx]?.[gy]??256;blocked=!!(flags&256)||!(flags&2049)||xx<0||xx>l.width||yy<0||yy>l.height;this.blocked[y*this.columns+x]=blocked?1:0;continue;}
   if(!blocked)blocked=(level.obstacles??[]).some(r=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height);
   // Roads cut explicit bridge corridors through terrain obstacles.
   if(blocked&&p.y>=100&&p.y<=820&&roads.some(r=>r.nearest(p).distance<48))blocked=false;
   this.blocked[y*this.columns+x]=blocked?1:0;
  }
 }
 point(index:number):Point{return{x:this.originX+(index%this.columns+.5)*this.cell,y:this.originY+(Math.floor(index/this.columns)+.5)*this.cell};}
 index(p:Point){return clamp(Math.floor((p.y-this.originY)/this.cell),0,this.rows-1)*this.columns+clamp(Math.floor((p.x-this.originX)/this.cell),0,this.columns-1);}
 snap(p:Point,maxDistance=95):Point|undefined {let found:Point|undefined,best=maxDistance;const first=this.index(p);if(!this.blocked[first]&&p.x>=this.originX&&p.x<=this.originX+this.columns*this.cell&&p.y>=(this.level.walkingGrid?0:100)&&p.y<=(this.level.walkingGrid?900:820))return {x:p.x,y:p.y};
  for(let i=0;i<this.blocked.length;i++)if(!this.blocked[i]){const q=this.point(i),d=distance(q,p);if(d<best){best=d;found=q;}}return found;
 }
 clear(a:Point,b:Point){const n=Math.max(1,Math.ceil(distance(a,b)/12));for(let i=0;i<=n;i++)if(this.blocked[this.index({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n})])return false;return true;}
 path(from:Point,to:Point):Point[]|undefined {
  const start=this.snap(from,160),goal=this.snap(to);if(!start||!goal)return;
  if(this.clear(start,goal))return [goal];
  const s=this.index(start),end=this.index(goal),scores=new Float64Array(this.blocked.length).fill(Infinity),previous=new Int32Array(this.blocked.length).fill(-1),closed=new Uint8Array(this.blocked.length);
  const open:number[]=[s];scores[s]=0;const heuristic=(i:number)=>distance(this.point(i),this.point(end))/this.cell;
  while(open.length){let best=0;for(let j=1;j<open.length;j++)if(scores[open[j]]+heuristic(open[j])<scores[open[best]]+heuristic(open[best]))best=j;const current=open.splice(best,1)[0];if(current===end){const chain:Point[]=[goal];for(let q=end;previous[q]>=0;q=previous[q])chain.push(this.point(previous[q]));chain.reverse();const result:Point[]=[];let anchor=start;for(let i=1;i<chain.length;i++){if(!this.clear(anchor,chain[i])){result.push(chain[i-1]);anchor=chain[i-1];}}result.push(goal);return result;}
   closed[current]=1;const x=current%this.columns,y=Math.floor(current/this.columns);
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=this.columns||yy>=this.rows)continue;const next=yy*this.columns+xx;if(closed[next]||this.blocked[next])continue;
    if(dx&&dy&&(this.blocked[y*this.columns+xx]||this.blocked[yy*this.columns+x]))continue;
    const value=scores[current]+Math.hypot(dx,dy);if(value<scores[next]){scores[next]=value;previous[next]=current;if(!open.includes(next))open.push(next);}
   }
  }
 }
}

