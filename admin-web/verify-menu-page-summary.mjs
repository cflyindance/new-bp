import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PREVIEW_URL??'http://127.0.0.1:65287';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();
try{
 await page.goto(base);
 await page.evaluate(async()=>{
  (await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');
  (await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');
  (await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();
 });
 await page.goto(base+'/#/m-platform/nav-blueprint/navigation');
 await page.locator('[data-jme-select]').last().click();
 await page.locator('[data-jme-page-mode="micro-app"]').click();
 if(!await page.locator('[data-picker-project]').count())await page.locator('[data-page-picker-open]').click();
 await page.locator('[data-picker-project="registry-test-product-center"]').click();
 await page.locator('[data-page-pick]:not(:disabled)').first().click();
 await page.locator('[data-page-confirm]').click();
 const card=page.locator('[data-page-binding]');await card.waitFor();
 assert.equal(await card.locator('[data-page-technical-info]').count(),1);
 assert.equal(await card.locator('details').count(),0);
 assert.match(await card.innerText(),/所属项目\s*商品中心/);
 assert.match(await card.innerText(),/页面层级/);
 assert.doesNotMatch(await card.innerText(),/已匹配|页面名称|技术信息/);
 const path=await card.locator('[data-page-copy-path]').getAttribute('data-page-copy-path');
 await card.locator('[data-page-copy-path]').click();
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),path);
 const states=await page.evaluate(async()=>{
  const {renderRegistrationTechnicalInfo}=await import('/src/config/page-registration-technical-info.ts');
  const p={id:'x',title:'测试页面',routing:{type:'micro-app',path:'/x'}};
  const w={projects:[],directories:[],pages:[],assignments:[]};
  return {unknown:renderRegistrationTechnicalInfo(p,w),error:renderRegistrationTechnicalInfo(p,w,'读取失败')};
 });
 assert.match(states.unknown,/未关联项目/);assert.match(states.error,/暂不可读取/);
 await card.scrollIntoViewIfNeeded();await page.waitForTimeout(600);
 await page.screenshot({path:'output/playwright/menu-page-summary.png',fullPage:true});
 console.log('PASS: real menu picker association, integrated expanded summary, project/hierarchy/path, clipboard, missing ownership and read error');
}finally{await browser.close();}
