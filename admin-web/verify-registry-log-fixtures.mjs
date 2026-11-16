import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
try {
 await page.goto('http://127.0.0.1:65278/');
 await page.evaluate(async()=>{
  (await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');
  (await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');
  (await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();
 });
 await page.goto('http://127.0.0.1:65278/#/m-platform/nav-blueprint/page-registry/logs');
 await page.locator('[data-operation-log]').waitFor();
 assert.match(await page.locator('[data-operation-log] footer').innerText(),/共 40 条/);
 await page.locator('[name=project]').selectOption('registry-test-product-center');
 await page.locator('[data-log-filter]').getByRole('button',{name:'查询',exact:true}).click();
 assert.equal(await page.locator('[data-operation-log] tbody tr').count(),8);
 await page.locator('[data-log-detail]').first().click();
 await page.getByRole('dialog',{name:'操作记录详情'}).waitFor();
 assert.match(await page.getByRole('dialog').innerText(),/测试数据/);
 await page.locator('[data-log-close]').first().click();
 await page.locator('[data-log-reset]').click();
 assert.match(await page.locator('[data-operation-log] footer').innerText(),/共 40 条/);
 await page.reload();
 await page.locator('[data-operation-log]').waitFor();
 assert.match(await page.locator('[data-operation-log] footer').innerText(),/共 40 条/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('menusifu:menu-registry-operation-log:v1')),null);
 const domain=await page.evaluate(async()=>{
  const {belongsToProject}=await import('/src/config/registry-log-view.ts');
  const entry={objects:[{id:'page1'}],before:{assignments:[{pageId:'page1',projectId:'p1'}]},after:null};
  return [belongsToProject(entry,'p1'),belongsToProject(entry,'p2')];
 });
 assert.deepEqual(domain,[true,false]);
 await page.screenshot({path:'output/playwright/registry-log-fixtures.png',fullPage:true});
 console.log('PASS: all-project 40 fixtures, per-project 8, filter/reset, details, refresh idempotence, no real-store writes, page ownership');
} finally {await browser.close();}
