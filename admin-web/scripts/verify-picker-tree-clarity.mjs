import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await page.goto('http://127.0.0.1:65270');await page.locator('[data-login-form]').waitFor();
 await page.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
 await page.goto('http://127.0.0.1:65270/#/m-platform/nav-blueprint/navigation');await page.locator('[data-json-menu-editor]').waitFor();
 await page.evaluate(async()=>{const {registrationUi,registrationModal}=await import('/src/config/page-registration-ui.ts');const {pickerTree}=await import('/src/config/page-registration-picker-tree.ts');pickerTree.project='registry-test-product-center';registrationUi.picker=true;document.body.insertAdjacentHTML('beforeend',registrationModal());});
 const first=page.locator('[data-picker-tree-toggle]').first();const expanded=await page.locator('[data-page-pick]').count();await first.click();assert.ok(await page.locator('[data-page-pick]').count()<expanded);await page.locator('[data-picker-tree-toggle]').first().click();assert.equal(await page.locator('[data-page-pick]').count(),expanded);
 assert.ok(await page.locator('[data-picker-tree-children]').count()>0);
 await page.locator('[data-page-pick]').first().click();assert.equal(await page.locator('[data-page-pick][aria-pressed=true]').count(),1);assert.equal(await page.locator('[data-page-pick][aria-pressed=true]').evaluate(el=>el.classList.contains('border-blue-500')),true);
 await page.locator('[data-page-picker-search]').fill('调味');await page.getByText('商品管理',{exact:true}).last().waitFor();assert.ok(await page.locator('[data-picker-tree-children]').count()>=2);
 console.log('PASS nested tree connectors, collapse/expand, selected border/radio, search preserves ancestor hierarchy');
}finally{await browser.close();}
