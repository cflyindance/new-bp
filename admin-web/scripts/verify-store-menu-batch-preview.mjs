import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.env.BRAND_PREVIEW_URL??'http://127.0.0.1:5217';
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('hq.admin@menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('hq.admin@menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
 const fixture=await p.evaluate(async()=>{const s=await import('/src/config/enterprise-merchant-store.ts'),b=await import('/src/config/brand-access-store.ts'),scope=await import('/src/config/enterprise-merchant-scope.ts');const group=s.getGroupsForSelect({allEnterprises:false})[0].groupId;s.ensureBrandCreationDemoStores(group);const stores=s.listBrandAssociationCandidates(group).slice(0,2),keys=b.brandMenuChoices(['pos']).map(c=>c.key),m=s.createMerchant({name:'门店预览弹框验收',code:'',groupId:group,orgType:'chain',timezone:'Asia/Shanghai',contactName:'测试',primaryAdminEmail:'',businessTypeIds:[s.getBusinessTypeOptions()[0].id],productLineIds:['pos'],initialMenuKeys:keys,initialStoreIds:stores.map(s=>s.storeId),accountProvisioningRequired:true,activateImmediately:true});return{id:m.merchantId,stores:stores.map(s=>s.storeId),keys,url:scope.merchantDetailHref(m.merchantId,'org')};});
 const snapshot=()=>p.evaluate(async id=>(await import('/src/config/enterprise-merchant-store.ts')).brandConfigurationVersion(id),fixture.id);
 await p.evaluate(async f=>{const s=await import('/src/config/enterprise-merchant-store.ts');s.saveBrandStoreMenus(f.id,[f.stores[0]],[],'replace',s.brandConfigurationVersion(f.id),'test','M 平台');},fixture);
 await p.goto(base+'/'+fixture.url);await p.locator('[data-select-all]').check();await p.locator('[data-ba=batch]').click();
 const editor=p.locator('dialog:not(.ba-store-menu-preview):not(.ba-discard-dialog)'),preview=p.locator('.ba-store-menu-preview');const initial=await snapshot();
 for(const mode of ['inherit','replace','add']){
   await editor.locator('[name=mode]').selectOption(mode);await editor.locator('[type=submit]').click();await preview.waitFor({state:'visible'});
   assert.equal(await preview.locator('[data-preview-filter=all]').count(),0);assert.equal(await preview.locator('[data-preview-filter][aria-pressed=true]').getAttribute('data-preview-filter'),'added');
   await preview.locator('[data-preview-stores] summary').click();assert.equal(await preview.locator('[data-preview-stores] li').count(),2);
   assert.equal(await preview.locator('[data-preview-store]').isVisible(),mode==='inherit');
   if(mode==='inherit'){await preview.locator('[data-preview-store]').selectOption(fixture.stores[1]);assert.ok((await preview.innerText()).includes('本次没有新增菜单'));await preview.locator('[data-preview-store]').selectOption(fixture.stores[0]);assert.ok(!(await preview.innerText()).includes('本次没有新增菜单'));}
   await preview.locator('[data-preview-filter=removed]').click();assert.equal(await preview.locator('[data-preview-store]').isVisible(),mode==='replace');
   await preview.locator('[data-store-preview-close]').last().click();await preview.waitFor({state:'detached'});assert.equal(await snapshot(),initial);
 }
 await p.keyboard.press('Escape');await p.locator('.ba-discard-dialog [data-ba=discard]').click();
 const effective=p.locator('.ba-store-effective');
 for(const [i,sid] of fixture.stores.entries()){
   await p.locator(`[data-ba="effective:${sid}"]`).click();await effective.waitFor({state:'visible'});assert.ok((await effective.innerText()).includes(sid));assert.equal(await effective.locator('input[type=checkbox]').count(),0);assert.equal(await effective.locator('[type=submit]').count(),0);
   if(i===0)assert.ok((await effective.innerText()).includes('该门店当前没有生效菜单'));else{assert.ok((await effective.innerText()).includes('继承品牌菜单'));await effective.locator('[data-opened-category=team]').click();assert.equal(await effective.locator('[data-opened-node="team:clock-view-live"]').count(),1);}
   if(i===1&&process.env.EFFECTIVE_SCREENSHOT)await p.screenshot({path:process.env.EFFECTIVE_SCREENSHOT});
   await p.keyboard.press('Escape');await effective.waitFor({state:'detached'});assert.equal(await snapshot(),initial);
 }
 await p.locator(`[data-ba="store:${fixture.stores[0]}"]`).click();await editor.locator('[data-module=team]').click();await editor.locator('[data-key="team:clock-view-live"]').check();await editor.locator('[type=submit]').click();assert.equal(await preview.locator('[data-preview-filter]').count(),2);
 if(process.env.BATCH_PREVIEW_SCREENSHOT)await p.screenshot({path:process.env.BATCH_PREVIEW_SCREENSHOT});
 await preview.locator('[data-store-preview-save]').click();await editor.waitFor({state:'detached'});await p.locator(`[data-ba="effective:${fixture.stores[0]}"]`).click();await effective.locator('[data-opened-category=team]').click();assert.equal(await effective.locator('[data-opened-node="team:clock-view-live"]').count(),1);assert.equal(await effective.locator('[data-opened-node="team:clock-view-records"]').count(),0);await effective.locator('[data-effective-close]').last().click();
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS batch preview: unified inherit/replace, involved stores, per-store differing changes, incremental results, filter transitions, no preview writes');
}finally{await browser.close();}
