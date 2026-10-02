import fs from 'node:fs';
import sharp from 'sharp';
const stages=JSON.parse(fs.readFileSync('content/reference/steam-24662480/stages.json','utf8'));
const out='public/assets',source='art/source/reference-maps';fs.mkdirSync(source,{recursive:true});
const S=900/768,p=(q)=>({x:200+q.x*S,y:900-q.y*S});
const palettes={forest:['#819547','#b2b46f','#505f33','#b6a16e'],snow:['#7c9baa','#c3d2d2','#496676','#a9b5b9'],ash:['#696451','#a2987d','#443f39','#aa926c'],rot:['#6e7956','#98a46b','#394e3b','#aaa47a'],black:['#657a63','#96a180','#344a43','#ad9c7a']};
const theme=n=>[7,8,9,13,18,19].includes(n)?'snow':[10,11,12,20,21].includes(n)?'ash':[15,22].includes(n)?'rot':n>=23?'black':'forest';
const svg=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="9451"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".1"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter><filter id="soft"><feGaussianBlur stdDeviation="9"/></filter><filter id="shadow"><feDropShadow dx="-3" dy="6" stdDeviation="4" flood-opacity=".27"/></filter><linearGradient id="light" x2=".7" y2="1"><stop stop-color="#ffffff" stop-opacity=".10"/><stop offset="1" stop-color="#102321" stop-opacity=".1"/></linearGradient></defs>${body}</svg>`;
const tree=(x,y,size,color)=>`<g transform="translate(${x} ${y}) scale(${size})" filter="url(#shadow)"><ellipse cy="9" rx="19" ry="7" fill="#152c25" opacity=".2"/><path d="M-4 3L-3-23H5L4 3Z" fill="#66563b"/><path d="M-22-18Q-34-30-19-41Q-26-53-9-55Q-5-72 10-61Q25-63 24-47Q38-38 23-23Q23-9 7-14Q-8-5-22-18Z" fill="${color}" stroke="#334d31" stroke-width="2"/><path d="M-22-31Q-9-26 4-39Q15-37 21-45" stroke="#b2c878" stroke-opacity=".34" stroke-width="5" fill="none"/></g>`;
for(const stage of stages){
 const n=stage.number,t=theme(n),[ground,light,dark,road]=palettes[t],l=stage.layout;
 let body=`<rect width="1600" height="900" fill="${ground}"/><rect x="200" width="1200" height="900" fill="${light}" opacity=".25"/>`;
 const paths=stage.paths.paths.map(lanes=>lanes[0].map(p));
 const reserved=q=>paths.some(nodes=>nodes.some(a=>Math.hypot(a.x-q.x,a.y-q.y)<58))||l.entities_list.some(e=>e.pos&&e.template.startsWith('tower')&&Math.hypot(p(e.pos).x-q.x,p(e.pos).y-q.y)<65);
 let water='',ice='',blocked='';
 for(let gx=0;gx<stage.grid.grid.length;gx++)for(let gy=0;gy<stage.grid.grid[gx].length;gy++){
  const cell=stage.grid.grid[gx][gy],q=p({x:stage.grid.ox+gx*16,y:stage.grid.oy+gy*16});
  if(cell&2)water+=`<rect x="${q.x}" y="${q.y-16*S}" width="${16*S+1}" height="${16*S+1}"/>`;
  else if(cell&2048)ice+=`<rect x="${q.x}" y="${q.y-16*S}" width="${16*S+1}" height="${16*S+1}"/>`;
  else if(cell&256&&q.x>180&&q.x<1400)blocked+=`<rect x="${q.x}" y="${q.y-16*S}" width="${16*S+1}" height="${16*S+1}"/>`;
 }
 body+=`<g fill="${dark}" opacity=".16" filter="url(#soft)">${blocked}</g><g fill="#567f86" filter="url(#soft)">${water}</g><g fill="#8cc6d0" opacity=".35">${water}</g><g fill="#a2cbd4" filter="url(#soft)">${ice}</g><g fill="#c2e4e8" opacity=".6">${ice}</g>`;
 let seed=n*9451;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let i=0;i<1400;i++){const x=rnd()*1600,y=rnd()*900;body+=`<ellipse cx="${x}" cy="${y}" rx="${rnd()*11+2}" ry="${rnd()*3+1}" fill="${rnd()>.5?light:dark}" opacity="${rnd()*.14+.04}"/>`;}
 for(let i=0;i<130;i++){const q={x:120+rnd()*1360,y:60+rnd()*820};if(!reserved(q))body+=tree(q.x,q.y,.6+rnd()*.6,t==='snow'?'#708d8e':t==='ash'?'#6d704e':dark);}
 for(const roadNodes of paths){const d=roadNodes.map((q,i)=>(i?'L':'M')+q.x.toFixed(2)+' '+q.y.toFixed(2)).join(' ');body+=`<path d="${d}" fill="none" stroke="${dark}" stroke-opacity=".28" stroke-width="55" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${road}" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#e2d1a8" stroke-opacity=".16" stroke-width="32" stroke-linejoin="round"/>`;}
 const terrain=q=>stage.grid.grid[Math.floor(((q.x-200)/S-stage.grid.ox)/16)]?.[Math.floor(((900-q.y)/S-stage.grid.oy)/16)]??0;
 const bridges=[];
 for(const nodes of paths){let frost=[];const flush=()=>{if(frost.length>1){const d=frost.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ');body+=`<path d="${d}" stroke="#c4e2e5" stroke-width="46" fill="none"/><path d="${d}" stroke="#79afc0" stroke-opacity=".45" stroke-width="25" fill="none" stroke-dasharray="36 8"/>`;}frost=[];};
  nodes.forEach((q,i)=>{if(terrain(q)&2048)frost.push(q);else flush();if(i%5||i===0)return;const before=nodes[i-1],dx=q.x-before.x,dy=q.y-before.y,len=Math.hypot(dx,dy)||1,normal={x:-dy/len*40,y:dx/len*40};
   if((terrain({x:q.x+normal.x,y:q.y+normal.y})&2)&&(terrain({x:q.x-normal.x,y:q.y-normal.y})&2)&&!bridges.some(b=>Math.hypot(b.x-q.x,b.y-q.y)<65)){bridges.push(q);const angle=Math.atan2(dy,dx)*180/Math.PI;body+=`<g transform="translate(${q.x} ${q.y}) rotate(${angle})" filter="url(#shadow)"><rect x="-32" y="-25" width="64" height="50" rx="2" fill="#795c42" stroke="#463f30" stroke-width="3"/>${Array.from({length:8},(_,j)=>`<path d="M${-28+j*8}-22V22" stroke="#c5a16c" stroke-width="5"/>`).join('')}<path d="M-36-26H36M-36 26H36" stroke="#4e4433" stroke-width="5"/><path d="M-36-28H36" stroke="#c4a577" stroke-width="2"/></g>`;}
  });flush();
 }
 // Place native landmark categories at their reference anchors using original project geometry.
 for(const e of l.entities_list){if(!e.pos||!e.template.match(/mill|tower_elf|tower_sasquash|graveyard|portal|defend_point|sunray|castle|tunnel/))continue;
  const q=p(e.pos),name=e.template;
  if(name.includes('defend'))body+=`<g transform="translate(${q.x} ${q.y})" filter="url(#shadow)"><path d="M-34 14V-46H34V14" fill="#c7b795" stroke="#665943" stroke-width="3"/><path d="M-44-45L0-78L44-45Z" fill="#886640"/><path d="M-12 14V-15Q0-31 12-15V14" fill="#534b35"/><path d="M2-80V-111L33-97L2-86" fill="#e3b65e"/></g>`;
  else if(name.includes('mill'))body+=`<g transform="translate(${q.x} ${q.y})" filter="url(#shadow)"><path d="M-20 6L-15-43H18L22 6Z" fill="#d3c3a0" stroke="#796445" stroke-width="3"/><path d="M-24-43L0-65L28-43Z" fill="#b08151"/><path d="M-27-60L28-6M28-60L-27-6" stroke="#735538" stroke-width="6"/></g>`;
  else if(name.includes('portal'))body+=`<ellipse cx="${q.x}" cy="${q.y}" rx="34" ry="17" fill="#404635" stroke="#bc8d84" stroke-width="4"/>`;
  else body+=`<g transform="translate(${q.x} ${q.y})" filter="url(#shadow)"><ellipse rx="34" ry="16" fill="${dark}" opacity=".5"/><path d="M-25 0V-33L0-49L25-33V0Z" fill="#a4aa86" stroke="#566344" stroke-width="3"/><path d="M-9 0V-18Q0-29 9-18V0" fill="#4c5140"/></g>`;
 }
 body+=`<rect width="1600" height="900" fill="url(#light)"/><rect width="1600" height="900" fill="transparent" filter="url(#grain)"/>`;
 const content=svg(body);fs.writeFileSync(`${source}/map-${String(n).padStart(2,'0')}.svg`,content);await sharp(Buffer.from(content)).webp({quality:92}).toFile(`${out}/map-${String(n).padStart(2,'0')}.webp`);console.log('Map',n,t);
}
// Keep the existing locally authored campaign painting; actual nodes and edges are UI overlays.
await sharp('art/source/campaign-v2.png').resize(1600,900).webp({quality:92}).toFile(out+'/campaign-v4.webp');
fs.writeFileSync(source+'/README.md','# Reference layout maps\n\nAll paths and landmark anchors derive from Build 24662480 gameplay data. Landscape, vegetation and structures are project-authored SVG geometry. No original game image is included. Native coordinate transform: x=200+x*900/768, y=900-y*900/768.\n');
