const paths:Record<string,string>={
  leaf:'<path d="M20 4C9 3 3 8 5 16c7 4 15-1 15-12Z"/><path d="m4 21 11-12"/>',
  shield:'<path d="m12 3 8 3v6c0 5-5 8-8 10-3-2-8-5-8-10V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  arrow:'<path d="M4 20 20 4M12 4h8v8M4 14v6h6"/>',
  star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  heart:'<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 3 12 8 16 5-4 13-11 8-16Z"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M14 7h-3a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3m2-9v10"/>',
  flame:'<path d="M13 2c3 7-2 7 3 10 0-3 2-4 2-4 6 8 1 14-6 14S1 15 6 8c0 4 2 5 3 5-1-5 2-7 4-11Z"/>',
  book:'<path d="M12 6c-4-3-8-2-10-1v15c4-2 7-1 10 1 3-2 6-3 10-1V5c-2-1-6-2-10 1Zm0 0v15"/>',
  gear:'<path d="m9 3-1 3-3 1-2 3 2 2-1 4 3 2 3-1 2 4 3-1 1-3 3-1 2-3-2-2 1-4-3-2-3 1-2-4-3 1Z"/><circle cx="12" cy="12" r="3"/>',
  play:'<path d="m8 4 12 8-12 8V4Z"/>',
  pause:'<path d="M7 4v16M17 4v16"/>',
  back:'<path d="m10 5-7 7 7 7M3 12h18"/>',
  cross:'<path d="m6 6 12 12M18 6 6 18"/>',
  flag:'<path d="M5 22V3h14l-3 5 3 5H5"/>',
  bolt:'<path d="m14 2-9 12h6l-1 8 9-12h-6l1-8Z"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  sound:'<path d="m10 4-5 5H2v6h3l5 5V4Zm4 4c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
  tool:'<path d="M14 3c-2 3-1 6 2 7 2 1 4 0 5-2 0 5-4 7-7 5L5 22l-3-3 9-9c-2-3 0-7 3-7Z"/>',
};
export function icon(name:string,cls=''){return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??paths.star}</svg>`;}
export function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
