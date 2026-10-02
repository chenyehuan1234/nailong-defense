import Phaser from 'phaser';
import {Random,Road} from './math';
export function paintRoads(scene:Phaser.Scene,roads:Road[],map:string){
 const key='roads';if(scene.textures.exists(key))scene.textures.remove(key);const tex=scene.textures.createCanvas(key,1600,900)!,ctx=tex.context;
 const stage=Number(map.replace('map-','')),theme=map==='ruins'||stage>=10?'ash':stage>=7?'ice':'forest';
 const palette={forest:{edge:'#707b43',soil:'#b09765',wash:'#d4bb8844',grass:['#737e40','#94a557','#b6b86e']},ice:{edge:'#9cacb2',soil:'#a9b7b9',wash:'#d1e4edcc',grass:['#dce7ea','#9cbbce','#b6ccda']},ash:{edge:'#655a50',soil:'#857465',wash:'#7a685faa',grass:['#514943','#6e5e50','#a08160']}}[theme];
 const stroke=(road:Road,width:number,color:string|CanvasPattern)=>{ctx.beginPath();road.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();};
 ctx.save();if(map==='map-04'){ctx.beginPath();ctx.rect(0,0,1600,900);ctx.rect(650,180,330,130);ctx.rect(650,530,330,145);ctx.clip('evenodd');}if(map==='river'){ctx.beginPath();ctx.rect(0,0,845,900);ctx.rect(1140,0,460,900);ctx.clip();}
 ctx.lineJoin='round';ctx.lineCap='round';
 const pattern=ctx.createPattern(scene.textures.get('road-texture').getSourceImage()as HTMLImageElement,'repeat');
 for(const road of roads){ctx.globalAlpha=.28;ctx.shadowColor='#263222';ctx.shadowBlur=12;stroke(road,107,palette.edge);ctx.shadowBlur=0;ctx.globalAlpha=.35;stroke(road,103,palette.soil);ctx.globalAlpha=.65;stroke(road,97,palette.soil);ctx.globalAlpha=1;stroke(road,89,pattern??palette.soil);stroke(road,89,palette.wash);}
 const rng=new Random(729);
 for(const road of roads){for(let d=0;d<road.total;d+=6){const p=road.at(d),q=road.at(d+3),normal=Math.atan2(q.y-p.y,q.x-p.x)+Math.PI/2;
  for(const side of [-1,1]){const offset=side*(44+rng.next()*12),x=p.x+Math.cos(normal)*offset,y=p.y+Math.sin(normal)*offset;ctx.fillStyle=palette.grass[Math.floor(rng.next()*3)];ctx.globalAlpha=.22+rng.next()*.46;ctx.beginPath();ctx.ellipse(x,y,2+rng.next()*5,1.3+rng.next()*2,normal+rng.next(),0,Math.PI*2);ctx.fill();if(theme==='forest'&&rng.next()>.62){ctx.strokeStyle=palette.grass[1];ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y-4-rng.next()*5);ctx.moveTo(x,y);ctx.lineTo(x+3,y-3-rng.next()*4);ctx.stroke();}}
 }
 for(let i=0;i<1400;i++){const d=rng.next()*road.total,p=road.at(d),q=road.at(d+3),angle=Math.atan2(q.y-p.y,q.x-p.x)+Math.PI/2,o=(rng.next()-.5)*80;ctx.globalAlpha=.12+rng.next()*.18;ctx.fillStyle=rng.next()>.5?palette.edge:'#fff3db';ctx.beginPath();ctx.ellipse(p.x+Math.cos(angle)*o,p.y+Math.sin(angle)*o,1+rng.next()*2,1+rng.next(),0,0,Math.PI*2);ctx.fill();}}
 ctx.restore();tex.refresh();return scene.add.image(800,450,key).setDepth(2);
}
