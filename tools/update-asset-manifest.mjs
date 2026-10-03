import fs from 'node:fs';
const file='public/assets/manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
manifest.version=4;
manifest.menu={image:'home-v4.1.webp',source:'art/source/home-v4.1.png',production:'art/source/home-v4.1.json',version:'4.1'};
if(!fs.existsSync('public/assets/'+manifest.menu.image))throw Error('Missing menu art');
manifest.maps=Array.from({length:26},(_,i)=>`map-${String(i+1).padStart(2,'0')}.webp`);
for(const [key,columns,rows]of [['heroes-walk-a',6,6],['heroes-walk-b',6,6],['soldiers-walk-a',6,6],['soldiers-walk-b',6,6],['tower-plates',5,4],['tower-operators',6,4],['heroes-actions',6,4],['soldiers-actions',6,4]])manifest.atlases[key]={file:key+'.png',columns,rows,frameWidth:192,frameHeight:192,anchor:{x:96,y:176}};
manifest.audio={type:'streamed HTMLAudio music + short WebAudio buffers',manifest:'audio/manifest.json',production:'art/source/audio/v4/downloads.json',license:'CC0 + CC BY 4.0 + project-authored layers',credits:'audio/CREDITS.md',version:4};
manifest.actionManifests=['art/source/animation-v3/manifest.json','art/source/animation-v3/action-manifest.json'];
const runtime=JSON.parse(fs.readFileSync('public/assets/runtime-sheets.json','utf8'));
manifest.runtimeSheets={manifest:'runtime-sheets.json',format:'WebP',fallback:'PNG'};
for(const sheet of runtime.files){if(!fs.existsSync('public/assets/'+sheet.runtime)||!fs.existsSync('public/assets/'+sheet.source))throw Error('Missing runtime sheet '+sheet.key);const atlas=manifest.atlases[sheet.key];if(atlas){atlas.sourceFile=sheet.source;atlas.file=sheet.runtime;}}
for(const a of Object.values(manifest.atlases))if(!fs.existsSync('public/assets/'+a.file))throw Error('Missing atlas '+a.file);
for(const map of manifest.maps)if(!fs.existsSync('public/assets/'+map))throw Error('Missing map '+map);
for(const file of Object.values(JSON.parse(fs.readFileSync('public/assets/audio/manifest.json','utf8'))).flat())if(!fs.existsSync('public/assets/audio/'+file))throw Error('Missing audio '+file);
fs.writeFileSync(file,JSON.stringify(manifest,null,2));console.log('Asset manifest v4 validated: 26 maps; streamed full-length music.');
