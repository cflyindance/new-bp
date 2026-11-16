import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});
try{await page.goto('http://127.0.0.1:65274');await page.locator('[data-login-form]').waitFor();await page.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});await page.goto('http://127.0.0.1:65274/#/m-platform/nav-blueprint/navigation');await page.locator('[data-jme-tree-scroll]').waitFor({timeout:60000});
 await page.locator('[data-jme-tree-scroll]').evaluate(el=>el.scrollTop=600);
 const top=await page.locator('[data-jme-tree-scroll]').evaluate(el=>el.scrollTop);assert.ok(top>100);
 const modes=page.locator('[data-jme-page-mode]');
 if(await modes.count()===0){const rows=page.locator('[data-jme-tree-item]');await rows.last().click();}
 const before=await page.locator('[data-jme-tree-scroll]').evaluate(el=>el.scrollTop);
 await page.locator('[data-jme-page-mode="micro-app"]').click();await page.locator('[data-page-picker-open]').waitFor();
 assert.ok(Math.abs(await page.locator('[data-jme-tree-scroll]').evaluate(el=>el.scrollTop)-before)<2);
 await page.locator('[data-page-picker-open]').click();await page.locator('[data-page-modal]').waitFor();await page.locator('[data-page-modal] [data-page-close]').first().click();
 assert.ok(Math.abs(await page.locator('[data-jme-tree-scroll]').evaluate(el=>el.scrollTop)-before)<2);
 console.log('PASS left tree viewport preserved for right type switch and page picker open/close');
}finally{await browser.close();}
