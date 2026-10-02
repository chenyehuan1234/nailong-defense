import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
const root='art/source/audio/v4',output='public/assets/audio';
const manifest=JSON.parse(fs.readFileSync(output+'/manifest.json','utf8'));
const receipts=JSON.parse(fs.readFileSync(root+'/downloads.json','utf8')).sources;
const lists={
 forest:[['Pathfinder','pathfinder.mp3'],['Discovery','discovery.mp3'],['Forgotten Victory','ForgottenVictory.ogg']],
 dark:[['Calm Track','calm_track.ogg'],['Twists','ehlers/Alexander Ehlers - Twists.mp3'],['Dungeon of Qetzyl','11_-_dungeon_of_qetzyl.ogg']],
 boss:[['Permafrost','permafrost.mp3'],['Vanguard','vanguard.mp3'],['Beautiful Oblivion','beautiful-oblivion.mp3']],
};
function duration(file){const result=spawnSync(ffmpeg,['-hide_banner','-i',file],{encoding:'utf8'}),m=result.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);if(!m)throw Error('Unreadable audio: '+file);return +m[1]*3600 + +m[2]*60 + +m[3];}
function convert(input,file,filter,codec='libmp3lame'){
 const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',input,'-af',filter,'-ar','44100','-c:a',codec,...(codec==='libmp3lame'?['-b:a','128k']:[]),output+'/'+file],{encoding:'utf8'});
 if(result.status!==0)throw Error(result.stderr);
}
const tracks=[];
for(const [theme,songs] of Object.entries(lists)){
 manifest['music-'+theme]=[];let total=0;
 for(const [index,[title,input]] of songs.entries()){
  const seconds=duration(root+'/'+input);if(seconds<180)throw Error(title+' is shorter than 3 minutes');total+=seconds;
  const file=`music-v4-${theme}-${index}.mp3`;
  convert(root+'/'+input,file,'loudnorm=I=-18:TP=-2:LRA=11,alimiter=limit=0.89');
  manifest['music-'+theme].push(file);
  const receipt=receipts.find(r=>r.file===path.basename(input))??receipts.find(r=>r.file==='ehlers.zip');
  tracks.push({title,file,theme,seconds,author:receipt.author,license:receipt.license,source:receipt.page,changes:'Full recording retained; loudness normalized and MP3 encoded.'});
 }
 if(total<600)throw Error(theme+' playlist is shorter than 10 minutes');
 console.log(theme,Math.round(total)+' seconds');
}
// Real bow release, softly filtered; pitch variations preserve the short transient.
manifest.bow=[];manifest.crossbow=[];
for(let i=0;i<3;i++){
 const file=`bow-v4-${i}.wav`,pitch=[.96,1,1.035][i];
 convert(root+'/battle/Bow.wav',file,`atrim=duration=0.65,asetpts=PTS-STARTPTS,asetrate=${44100*pitch},aresample=44100,highpass=f=100,lowpass=f=3400,afade=t=out:st=0.3:d=0.35,loudnorm=I=-25:TP=-8:LRA=7`,'pcm_s16le');
 manifest.bow.push(file);
 const heavy=`crossbow-v4-${i}.wav`;
 convert(root+'/battle/Bow.wav',heavy,`atrim=duration=0.7,asetpts=PTS-STARTPTS,asetrate=${44100*(.78+i*.025)},aresample=44100,highpass=f=85,lowpass=f=2800,afade=t=out:st=0.4:d=0.4,loudnorm=I=-23:TP=-7:LRA=7`,'pcm_s16le');
 manifest.crossbow.push(heavy);
}
fs.writeFileSync(output+'/manifest.json',JSON.stringify(manifest,null,2));
fs.writeFileSync(output+'/credits.json',JSON.stringify({version:4,tracks,bow:{author:'artisticdude',license:'CC0-1.0',source:'https://opengameart.org/content/battle-sound-effects',changes:'Cropped, softened high frequencies, normalized, pitch variations.'}},null,2));
const attribution=tracks.map(t=>`- ${t.title} — ${t.author}, ${t.license}. ${t.source} (${(t.seconds/60).toFixed(2)} min)`).join('\n');
fs.writeFileSync(output+'/CREDITS.md',`# Audio credits\n\n${attribution}\n\nScott Buckley tracks released under CC-BY 4.0: https://creativecommons.org/licenses/by/4.0/ . Music by Scott Buckley — www.scottbuckley.com.au . Full recordings retained; loudness normalized and encoded.\n\nBow by artisticdude, CC0. Other effects: Kenney, CC0. Sources and processing in art/source/audio/production.json.\n`);
console.log('Prepared nine full-length streaming songs and six soft bow releases.');
