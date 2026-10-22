import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.env.BRAND_PREVIEW_URL??'http://127.0.0.1:5240';
try{
 for(const kind of ['store','brand']){
 const context=await browser.newContext(),p=await context.newPage({viewport:{width:1280,height:700}});await p.goto(base);await p.evaluate(async()=>{(await import('/src/auth/login.ts')).setAuthenticated('hq.admin@menusifu.cn');(await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('hq.admin@menusifu.cn');(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});await p.goto(base+'/#/m-platform/merchants'+(kind==='store'?'/stores':''));await p.locator('[data-management-filters]').waitFor();
 const selector=kind==='store'?'[data-store-impersonate]:not([disabled])':'[data-merchant-impersonate]';await p.locator(selector).first().click();await p.locator('[data-merchant-impersonation-banner]').waitFor();await p.locator('[data-impersonation-loading]').waitFor({state:'detached'});
 for(const width of [1920,768,390]){await p.setViewportSize({width,height:920});await p.waitForTimeout(100);const rect=await p.evaluate(()=>{const banner=document.querySelector('[data-merchant-impersonation-banner]'),side=document.querySelector('aside');const b=banner.getBoundingClientRect(),s=side?.getBoundingClientRect();return {x:b.x,right:b.right,bottom:b.bottom,sideTop:s?.top,viewport:innerWidth,count:document.querySelectorAll('[data-merchant-impersonation-banner]').length,exit:!!banner.querySelector('[data-merchant-impersonation-exit]')};});assert.equal(rect.count,1);assert.equal(rect.x,0);assert.equal(rect.right,rect.viewport);assert(rect.sideTop>=rect.bottom);assert(rect.exit);if(width===1920&&kind==='store')await p.screenshot({path:'docs/项目文档/assets/brand-menu-access/impersonation-banner-fullwidth.png'});}
 await p.setViewportSize({width:1280,height:920});await p.getByRole('button',{name:'退出代管',exact:true}).click();await p.locator('[data-management-filters]').waitFor();assert.equal(await p.locator('[data-merchant-impersonation-banner]').count(),0);await context.close();
 }
 console.log('PASS brand/store full-width banner at 1920/768/390px, sidebar below banner, single banner and exit return');
}finally{await browser.close();}
