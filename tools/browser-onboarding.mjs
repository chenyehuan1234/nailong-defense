export async function openCampaign(page,touch=false){
 await page.waitForFunction(()=>document.querySelector('#ui')?.dataset.screen==='home'||document.querySelector('.world-v4'));
 const activate=locator=>touch?locator.tap():locator.click();
 const begin=page.locator('.begin[data-action="campaign"]');
 if(await begin.count())await activate(begin);
 const skip=page.locator('[data-action="training-skip"]');
 if(await skip.isVisible())await activate(skip);
 await page.locator('.world-v4').waitFor({state:'visible'});
}
export async function openBriefing(page,touch=false){
 const preview=page.locator('.mobile-level-preview');
 if(await preview.isVisible())await(touch?preview.tap():preview.click());
 await page.locator('.expedition-v2').waitFor({state:'visible'});
}
