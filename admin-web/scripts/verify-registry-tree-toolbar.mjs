import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
try {
 await page.goto('http://127.0.0.1:65267');await page.locator('[data-login-form]').waitFor();
 await page.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
 await page.goto('http://127.0.0.1:65267/#/m-platform/nav-blueprint/page-registry/pages?project=registry-test-product-center&directory=');
 const toggle=page.locator('[data-reg-toggle-all]');await toggle.waitFor();
 assert.equal(await page.locator('[data-reg-directory=""]').textContent(),'36 项');
 assert.ok(await page.locator('[data-reg-new-directory]').evaluate(el=>el.parentElement.querySelector('h2')?.textContent==='页面结构'));
 assert.equal(await toggle.textContent(),'全部收起');const before=await page.locator('[data-reg-toggle]').count();await toggle.click();assert.equal(await toggle.textContent(),'全部展开');assert.ok(await page.locator('[data-reg-toggle]').count()<before);await toggle.click();assert.equal(await page.locator('[data-reg-toggle]').count(),before);assert.equal(await page.locator('[data-reg-directory=""]').textContent(),'36 项');
 console.log('PASS header action position, 36 unique nodes, collapse/expand toggle and stable count');
}finally {await browser.close();}
