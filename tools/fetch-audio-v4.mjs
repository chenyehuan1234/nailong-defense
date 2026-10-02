import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
const run=promisify(execFile),folder='art/source/audio/v4';
fs.mkdirSync(folder,{recursive:true});
const names=['01_-_it_is_dangerous_to_be_lonely_without_a_sword.ogg','02_-_the_town_where_i_got_the_magic_bottle.ogg','03_-_quest_of_magic_cowboy_dude.ogg','04_-_youthful_elf_seeking_adventure.ogg','05_-_tower_of_the_vampire.ogg','06_-_samurai_eats_ninja_for_breakfast.ogg','07_-_youthful_elf_in_the_dark_world.ogg','08_-_poison_the_sultan_with_saltpeter_slower_world_version.ogg','08_-_poison_the_sultan_with_saltpeter_world_version.ogg','09_-_the_tribe_is_mellow.ogg','10_-_the_shaman_is_dancing.ogg','11_-_dungeon_of_qetzyl.ogg'];
const sources=names.map(file=>({file,url:'https://opengameart.org/sites/default/files/'+file,page:'https://opengameart.org/content/orchestral-and-world-music-pack',author:'Ragnar Random',license:'CC0-1.0'}));
sources.push({file:'battle_sound_effects_0.zip',url:'https://opengameart.org/sites/default/files/battle_sound_effects_0.zip',page:'https://opengameart.org/content/battle-sound-effects',author:'artisticdude',license:'CC0-1.0 (chosen from offered licenses)'});
sources.push({file:'ehlers.zip',url:'https://opengameart.org/sites/default/files/Alexander%20Ehlers%20-%20Free%20Music%20Pack.zip',page:'https://opengameart.org/content/free-music-pack',author:'Alexander Ehlers',license:'CC0-1.0'});
sources.push({file:'ForgottenVictory.ogg',url:'https://opengameart.org/sites/default/files/ForgottenVictory.ogg',page:'https://opengameart.org/content/forgotten-victory',author:'yd',license:'CC0-1.0'});
sources.push({file:'calm_track.ogg',url:'https://opengameart.org/sites/default/files/calm_track.ogg',page:'https://opengameart.org/content/calm-track',author:'pmiller',license:'CC0-1.0'});
for(const [slug,file,url] of [
 ['pathfinder','pathfinder.mp3','2021/04/sb_pathfinder.mp3'],
 ['discovery','discovery.mp3','2020/01/sb_discovery.mp3'],
 ['permafrost','permafrost.mp3','2022/08/Permafrost.mp3'],
 ['titan','titan.mp3','2018/06/sb_titan.mp3'],
 ['vanguard','vanguard.mp3','2023/07/Vanguard.mp3'],
 ['beautiful-oblivion','beautiful-oblivion.mp3','2020/10/sb_beautifuloblivion.mp3'],
])sources.push({file,url:'https://www.scottbuckley.com.au/library/wp-content/uploads/'+url,page:'https://www.scottbuckley.com.au/library/'+slug+'/',author:'Scott Buckley',license:'CC-BY-4.0'});
let cursor=0;
await Promise.all(Array.from({length:3},async()=>{while(cursor<sources.length){const source=sources[cursor++],target=path.join(folder,source.file);if(!fs.existsSync(target))await run('curl.exe',['--noproxy','*','-f','-L','--retry','2','--max-time','120','-s','-o',target,source.url]);source.bytes=fs.statSync(target).size;source.sha256=createHash('sha256').update(fs.readFileSync(target)).digest('hex');console.log(source.file,source.bytes);}}));
fs.writeFileSync(folder+'/downloads.json',JSON.stringify({version:4,sources},null,2));
