import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const base=process.env.BRAND_PREVIEW_URL??'http://127.0.0.1:5211';
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('hq.admin@menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('hq.admin@menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
 await p.goto(base+'/#/m-platform/merchants/new');
 const name='核对弹框验收';await p.locator('[name=name]').fill(name);await p.locator('[name=contactName]').fill('测试联系人');await p.locator('[name=contactPhone]').fill('13800000000');await p.locator('[name=groupId]').selectOption({index:1});await p.locator('[name=businessTypeIds]').first().check();
 await p.locator('[data-step="1"]').click();await p.locator('[name=storeIds]').first().check();
 await p.locator('[data-step="2"]').click();await p.locator('[data-module=team]').click();await p.locator('[data-key="team:team-clock"]').check();
 const count=()=>p.evaluate(async()=> (await import('/src/config/enterprise-merchant-store.ts')).getEnterpriseMerchantSnapshot().merchants.length);
 const before=await count();
 await p.locator('[data-next]').click();const dialog=p.locator('dialog.ba-create-confirm');await dialog.waitFor({state:'visible'});
 assert.equal(await count(),before);assert.ok((await dialog.innerText()).includes(name));assert.ok((await dialog.innerText()).includes('测试联系人'));
 assert.equal(await dialog.locator('[data-review-menu-key="team"] [data-review-menu-key="team:team-clock"] [data-review-menu-key="team:clock-view-live"]').count(),1);
 const parent=dialog.locator('[data-review-menu-key="team:team-clock"]');await parent.locator(':scope > summary').click();assert.equal(await parent.getAttribute('open'),null);await parent.locator(':scope > summary').click();
 await p.screenshot({path:'docs/项目文档/assets/brand-menu-access/create-review-dialog-tree.png'});
 await dialog.locator('[data-review-close]').last().click();await dialog.waitFor({state:'detached'});assert.equal(await count(),before);assert.equal(await p.locator('[name=name]').inputValue(),name);assert.ok(await p.locator('[data-key="team:team-clock"]').isChecked());
 await p.locator('[data-next]').click();await p.keyboard.press('Escape');await p.locator('dialog.ba-create-confirm').waitFor({state:'detached'});assert.equal(await count(),before);
 await p.locator('[data-key="team:team-clock"]').uncheck();await p.locator('[data-next]').click();assert.ok((await p.locator('dialog.ba-create-confirm').innerText()).includes('未选择功能菜单'));await p.keyboard.press('Escape');await p.locator('dialog.ba-create-confirm').waitFor({state:'detached'});
 await p.locator('[data-menu-select-all]').check();await p.locator('[data-next]').click();await p.setViewportSize({width:768,height:700});const bounds=await p.locator('[data-confirm-create]').boundingBox();assert.ok(bounds&&bounds.y>=0&&bounds.y+bounds.height<=700);await p.keyboard.press('Escape');await p.locator('dialog.ba-create-confirm').waitFor({state:'detached'});await p.setViewportSize({width:1440,height:1000});await p.locator('[data-menu-select-all]').uncheck();await p.locator('[data-key="team:team-clock"]').check();
 await p.locator('[data-step="0"]').click();await p.locator('[name=name]').fill(name+'修改');await p.locator('[data-step="2"]').click();await p.locator('[data-next]').click();assert.ok((await p.locator('dialog.ba-create-confirm').innerText()).includes(name+'修改'));
 await p.locator('[data-confirm-create]').click();await p.waitForURL(/merchants\/[^/]+/);assert.equal(await count(),before+1);assert.equal(await p.locator('dialog.ba-create-confirm').count(),0);assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS modal tree nesting/collapse, no write on review/return/Escape, retained edits, refreshed summary, confirmed single creation');
}finally{await browser.close();}
