import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PREVIEW_URL??'http://127.0.0.1:65288';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await page.goto(base);
 await page.evaluate(async()=>{
  (await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');
  (await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');
  (await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();
 });
 await page.goto(base+'/#/m-platform/nav-blueprint/navigation/logs');
 await page.locator('[data-operation-log]').waitFor();
 assert.equal(await page.locator('[data-operation-log] tbody tr').count(),13);
 assert.doesNotMatch(await page.locator('[data-operation-log]').innerText(),/测试数据|示例操作员|演示记录/);
 await page.locator('[name=result]').selectOption('failure');
 await page.locator('[data-log-filter]').getByRole('button',{name:'查询',exact:true}).click();
 assert.equal(await page.locator('[data-operation-log] tbody tr').count(),1);
 await page.locator('[data-log-detail]').click();
 const dialog=page.getByRole('dialog',{name:'操作记录详情'});await dialog.waitFor();
 assert.match(await dialog.innerText(),/路径地址与“订单列表”重复/);
 assert.match(await dialog.innerText(),/路径地址/);
 assert.equal(await dialog.locator('pre').count(),0);
 await page.locator('[data-log-close]').first().click();
 await page.locator('[data-log-reset]').click();
 await page.locator('[name=action]').selectOption('停用菜单');
 await page.locator('[data-log-filter]').getByRole('button',{name:'查询',exact:true}).click();
 assert.equal(await page.locator('[data-log-action-tag=warning]').innerText(),'停用菜单');
 await page.locator('[data-log-reset]').click();await page.reload();
 await page.locator('[data-operation-log]').waitFor();
 assert.equal(await page.locator('[data-operation-log] tbody tr').count(),13);
 assert.equal(await page.evaluate(()=>localStorage.getItem('menusifu:menu-registry-operation-log:v1')),null);
 const pure=await page.evaluate(async()=>{
  const {menuOperationFixtures}=await import('/src/config/menu-operation-fixtures.ts');
  const rows=menuOperationFixtures();return {same:JSON.stringify(rows)===JSON.stringify(menuOperationFixtures()),unique:new Set(rows.map(e=>e.id)).size,changed:rows.every(e=>e.changes.every(c=>JSON.stringify(c.before)!==JSON.stringify(c.after)))};
 });
 assert.deepEqual(pure,{same:true,unique:13,changed:true});
 await page.waitForTimeout(600);await page.screenshot({path:'output/playwright/menu-log-fixtures.png',fullPage:true});
 console.log('PASS: 13 business scenarios, failure reason, action/result filters, readable details, refresh idempotence, no real-log writes');
}finally{await browser.close();}
