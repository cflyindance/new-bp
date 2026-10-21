import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.env.BRAND_PREVIEW_URL??'http://127.0.0.1:5217';
try{
 const p=await browser.newPage({viewport:{width:Number(process.env.CLOSE_TEST_WIDTH??1440),height:Number(process.env.CLOSE_TEST_HEIGHT??1000)}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('hq.admin@menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('hq.admin@menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
 const fixture=await p.evaluate(async()=>{const s=await import('/src/config/enterprise-merchant-store.ts'),b=await import('/src/config/brand-access-store.ts'),scope=await import('/src/config/enterprise-merchant-scope.ts');const group=s.getGroupsForSelect({allEnterprises:false})[0].groupId;s.ensureBrandCreationDemoStores(group);const stores=s.listBrandAssociationCandidates(group).slice(0,2),keys=b.brandMenuChoices(['pos']).map(c=>c.key),m=s.createMerchant({name:'门店预览弹框验收',code:'',groupId:group,orgType:'chain',timezone:'Asia/Shanghai',contactName:'测试',primaryAdminEmail:'',businessTypeIds:[s.getBusinessTypeOptions()[0].id],productLineIds:['pos'],initialMenuKeys:keys,initialStoreIds:stores.map(s=>s.storeId),accountProvisioningRequired:true,activateImmediately:true});return{id:m.merchantId,stores:stores.map(s=>s.storeId),keys,url:scope.merchantDetailHref(m.merchantId,'org')};});
 const snapshot=()=>p.evaluate(async id=>(await import('/src/config/enterprise-merchant-store.ts')).brandConfigurationVersion(id),fixture.id);
 await p.goto(base+'/'+fixture.url);await p.locator('[data-store-id]').first().waitFor();await p.locator(`[data-ba="store:${fixture.stores[0]}"]`).click();
 const editor=p.locator('dialog:not(.ba-store-menu-preview)'),preview=p.locator('.ba-store-menu-preview');const initial=await snapshot();
 for(const trigger of ['close','cancel','escape']){
   await editor.locator('[name=mode]').selectOption('replace');
   await editor.locator('[data-module=team]').click();await editor.locator('[data-key="team:clock-view-live"]').check();
   await editor.locator('.ba-dialog-body').evaluate(el=>el.scrollTop=0);
   if(trigger==='escape')await p.keyboard.press('Escape');else await editor.locator('[data-close]').nth(trigger==='close'?0:1).click();
   const prompt=editor.locator('[data-discard]');await prompt.waitFor({state:'visible'});
   const visible=await prompt.evaluate(el=>{const r=el.getBoundingClientRect(),b=el.closest('.ba-dialog-body').getBoundingClientRect();return r.top>=b.top&&r.bottom<=b.bottom;});
   if(trigger==='close'&&process.env.CLOSE_TEST_SCREENSHOT)await p.screenshot({path:process.env.CLOSE_TEST_SCREENSHOT});
   assert.ok(visible,`${trigger}: discard confirmation must be visible without scrolling`);
   assert.ok(await editor.locator('[data-ba=keep]').evaluate(el=>el===document.activeElement),'Continue editing must receive focus');
   await editor.locator('[data-ba=keep]').click();assert.ok(await editor.locator('[data-key="team:clock-view-live"]').isChecked());
   await editor.locator('[data-close]').first().click();await editor.locator('[data-ba=discard]').click();await editor.waitFor({state:'detached'});assert.equal(await snapshot(),initial);
   await p.locator(`[data-ba="store:${fixture.stores[0]}"]`).click();
 }
 await editor.locator('[data-close]').last().click();await editor.waitFor({state:'detached'});assert.equal(await snapshot(),initial);
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS close/cancel/Escape: visible discard prompt, focus, preserve edits, discard without writes, clean cancel');
}finally{await browser.close();}