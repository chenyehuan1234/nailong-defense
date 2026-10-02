type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome:'accepted'|'dismissed'}>;
};
let installPrompt:InstallPrompt|undefined;
export const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||!!(navigator as Navigator&{standalone?:boolean}).standalone;
export const canInstall=()=>!!installPrompt;
export async function installApp(){
  const prompt=installPrompt;
  if(!prompt)return false;
  await prompt.prompt();
  const choice=await prompt.userChoice;
  installPrompt=undefined;
  return choice.outcome==='accepted';
}
export function setupAppMode(onChange:()=>void){
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event as InstallPrompt;onChange();});
  window.addEventListener('appinstalled',()=>{installPrompt=undefined;onChange();});
  for(const mode of ['standalone','fullscreen'])matchMedia(`(display-mode: ${mode})`).addEventListener('change',onChange);
}
