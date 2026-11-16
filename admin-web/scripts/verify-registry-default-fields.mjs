import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
try {
 await page.goto('http://127.0.0.1:65264'); await page.locator('[data-login-form]').waitFor();
 await page.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();localStorage.setItem('menusifu:page-registry:v2',JSON.stringify({version:2,projects:[{id:'p',name:'演示项目',microName:'demo',microUrl:'https://example.com',microRoute:'/demo'}],directories:[{id:'d',name:'演示页面',projectId:'p',parentId:null}],pages:[],assignments:[]}));});
 await page.goto('http://127.0.0.1:65264/#/m-platform/nav-blueprint/page-registry/pages?project=p&directory=');
 await page.locator('[data-reg-directory=d]').click();
 const f=page.locator('[data-reg-page-form]');await f.waitFor();
 assert.equal(await f.locator('input:visible,select:visible,textarea:visible').count(),3);
 assert.equal(await f.locator('[name=type]').isVisible(),true);
 assert.equal(await f.locator('[name=title]').inputValue(),'演示页面');
 await f.locator('[name=path]').fill('/demo/list');await page.locator('[form=project-page-registration]').click();
 await page.locator('[data-reg-directory=""]').click();await page.locator('[data-reg-directory=d]').click();await f.waitFor();
 assert.equal(await f.locator('[name=path]').inputValue(),'/demo/list');
 assert.equal(await page.locator('[data-reg-select-page]').count(),0);
 console.log('PASS selected node defaults to registration fields, save persists on same node, reselect restores fields without duplicate tree row');
}finally{await browser.close();}
