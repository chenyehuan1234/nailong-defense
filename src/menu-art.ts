import {ASSET_BASE} from './assets';

export function menuImage(kind:'home'|'campaign',className=''){
 const title=kind==='home'?'奶龙守护者的森林冒险':'王国远征与七个支线章节';
 const fallback=kind==='home'?'home-v4.1':'campaign-v4';
 return `<img class="${className}" src="${ASSET_BASE}menu-${kind}.jpg" data-menu-art="${kind}" data-fallback="${ASSET_BASE}${fallback}.webp" alt="${title}" width="1280" height="720" decoding="async" fetchpriority="high">`;
}

const cleanups=new WeakMap<HTMLElement,()=>void>();
/** Menu pictures must show their own download state; they never block gameplay. */
export function attachMenuArt(root:HTMLElement){
 cleanups.get(root)?.();const cleanup:Array<()=>void>=[];
 for(const img of root.querySelectorAll<HTMLImageElement>('[data-menu-art]')){
  const status=document.createElement('div');status.className='menu-art-status';status.setAttribute('role','status');
  status.innerHTML='<span>插画加载中…</span><button type="button" hidden>重新加载图片</button>';img.parentElement!.append(status);
  const text=status.querySelector('span')!,button=status.querySelector<HTMLButtonElement>('button')!,primary=img.getAttribute('src')!,fallback=img.dataset.fallback!;
  let triedFallback=false,timer:ReturnType<typeof setTimeout>;
  const slow=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!img.isConnected)return;text.textContent='图片下载较慢，可以重试';button.hidden=false;},12000);};
  const ready=()=>{if(!img.naturalWidth)return;clearTimeout(timer);img.classList.remove('art-pending');status.hidden=true;};
  const failed=()=>{if(!img.isConnected)return;if(!triedFallback){triedFallback=true;img.src=fallback;slow();return;}clearTimeout(timer);text.textContent='图片未能加载，请重试';button.hidden=false;};
  const retry=()=>{triedFallback=false;status.hidden=false;img.classList.add('art-pending');text.textContent='插画加载中…';button.hidden=true;const url=new URL(primary,location.href);url.searchParams.set('retry',String(Date.now()));img.src=url.href;slow();};
  img.classList.add('art-pending');img.addEventListener('load',ready);img.addEventListener('error',failed);button.addEventListener('click',retry);slow();if(img.complete){if(img.naturalWidth)ready();else failed();}
  cleanup.push(()=>{clearTimeout(timer);img.removeEventListener('load',ready);img.removeEventListener('error',failed);button.removeEventListener('click',retry);status.remove();});
 }
 cleanups.set(root,()=>cleanup.forEach(fn=>fn()));
}
