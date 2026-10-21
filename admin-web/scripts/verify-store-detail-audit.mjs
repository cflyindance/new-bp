import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.env.BRAND_PREVIEW_URL??'http://127.0.0.1:5235';
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);
 await p.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('hq.admin@menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('hq.admin@menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
 const fixture=await p.evaluate(async()=>{const s=await import('/src/config/enterprise-merchant-store.ts');const row=s.getEnterpriseStoreList({allEnterprises:true})[0];s.saveBrandStoreMenus(row.merchantId,[row.store.storeId],[],'inherit',s.brandConfigurationVersion(row.merchantId),'hq.admin@menusifu.cn','M平台运营');return row;});
 const url=base+'/#/m-platform/merchants/stores/'+fixture.store.storeId;
 await p.goto(url+'/capabilities');await p.locator('[data-store-menu-read]').waitFor();assert.equal(await p.getByRole('link',{name:'能力与服务',exact:true}).count(),0);await p.getByRole('heading',{name:'门店菜单',exact:true}).waitFor();assert.match(await p.locator('[data-enterprise-merchant-page="store-detail"]').innerText(),/继承品牌菜单/);
 await p.getByRole('button',{name:'编辑门店菜单',exact:true}).click();await p.getByRole('dialog').last().waitFor();await p.getByRole('dialog').last().getByRole('button',{name:'取消',exact:true}).click();
 if(process.env.STORE_DETAIL_SCREENSHOTS){await p.waitForTimeout(500);await p.screenshot({path:'docs/项目文档/assets/brand-menu-access/store-detail-menu.png'});}
 await p.getByRole('link',{name:'变更记录',exact:true}).click();await p.locator('[data-change-row]').first().waitFor();const list=await p.locator('[data-store-change-log]').innerText();assert.match(list,/配置门店菜单/);assert.match(list,/hq.admin@menusifu.cn/);assert(!list.includes('store.capability.update'));
 if(process.env.STORE_DETAIL_SCREENSHOTS){await p.waitForTimeout(500);await p.screenshot({path:'docs/项目文档/assets/brand-menu-access/store-detail-changelog.png'});}
 await p.getByRole('button',{name:'查看详情',exact:true}).first().click();const d=p.getByRole('dialog',{name:'变更详情',exact:true});await d.waitFor();assert.match(await d.innerText(),/配置方式/);assert.match(await d.innerText(),/继承品牌菜单/);assert.match(await d.innerText(),/新增菜单/);assert.match(await d.innerText(),/关闭菜单/);
 if(process.env.STORE_DETAIL_SCREENSHOTS)await p.screenshot({path:'docs/项目文档/assets/brand-menu-access/store-detail-change-dialog.png'});
 await d.getByRole('button',{name:'关闭',exact:true}).click();assert.equal(await d.count(),0);await p.reload();await p.locator('[data-store-change-log]').waitFor();assert.deepEqual(errors,[]);
 console.log('PASS store menu naming, effective tree, menu editor cancel, readable store audit, details/mode/menu tree, close and reload');
}finally{await browser.close();}
