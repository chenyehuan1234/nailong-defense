import sharp from 'sharp';
// Reuse our existing shield guardian. Keep the face and shield inside the maskable safe circle.
const background=Buffer.from('<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g"><stop stop-color="#5e7850"/><stop offset="1" stop-color="#274735"/></radialGradient></defs><path fill="url(#g)" d="M0 0h512v512H0z"/></svg>');
const hero=await sharp('public/assets/heroes-0.png').trim().resize({width:340,height:340,fit:'inside'}).toBuffer();
const meta=await sharp(hero).metadata();
const icon=await sharp(background).composite([{input:hero,left:Math.round((512-meta.width)/2),top:Math.round((512-meta.height)/2)}]).png().toBuffer();
for(const size of [180,192,512])await sharp(icon).resize(size,size).toFile(`public/assets/app-icon-${size}.png`);
console.log('Home screen icons exported: 180, 192, 512 px');
