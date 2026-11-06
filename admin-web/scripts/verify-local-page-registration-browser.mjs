import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:65263';
const output = 'docs/项目文档/assets/local-page-registration'; mkdirSync(output, {recursive:true});
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror',error=>errors.push(error.message));
const key='menusifu:local-page-registrations:v1';
const shot=name=>page.screenshot({path:`${output}/${name}.png`,animations:'disabled',timeout:20000});
const form=()=>page.locator('[data-page-registration-form]');
const raw=()=>page.evaluate(key=>localStorage.getItem(key),key);
async function open(){await page.locator('[data-page-register]').click(); await form().waitFor();}
async function fill(id, type='inner', path=`/${id.replaceAll('.','-')}`){
  await form().locator('[name="title"]').fill(id==='local.demo.report'?'本地示例页面':`本地 ${type} 页面`);
  await form().locator('[name="id"]').fill(id);
  await form().locator('[name="module"]').fill('本地演示');
  await form().locator('[name="type"]').selectOption(type);
  await form().locator('[name="path"]').fill(path);
  if(type==='iframe'||type==='external')await form().locator('[name="url"]').fill('https://example.com/page');
  if(type==='micro-app') {await form().locator('[name="microName"]').fill('local-micro');await form().locator('[name="microUrl"]').fill('https://example.com/micro');}
}
try {
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('[data-login-form]').waitFor({timeout:60000});
  await page.evaluate(async()=>{
    (await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');
    (await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');
    (await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();
  });
  await page.goto(`${base}/#/m-platform/nav-blueprint/page-registry`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-page-register]').waitFor({timeout:60000}); await shot('registry');
  assert.equal(await raw(),null);
  await open(); await shot('create');
  await page.locator('[data-page-registration-save]').click();
  assert.equal(await form().locator('[name="title"]').evaluate(el=>el.validity.valueMissing),true);
  await fill('cancelled.record'); await page.getByRole('button',{name:'取消',exact:true}).click();
  assert.equal(await raw(),null); await shot('cancelled');
  await open(); await page.keyboard.press('Escape'); assert.equal(await form().count(),0); assert.equal(await raw(),null);
  assert.equal(await page.locator('[data-page-register]').evaluate(el=>el===document.activeElement),true);
  await open(); await page.locator('[data-page-overlay]').click({position:{x:5,y:5}}); assert.equal(await form().count(),0);assert.equal(await raw(),null);
  await open(); await page.getByRole('button',{name:'关闭',exact:true}).click(); assert.equal(await form().count(),0);assert.equal(await raw(),null);
  await open(); await fill('local.demo.report');
  await page.locator('[data-page-registration-save]').click(); await form().waitFor({state:'detached'}); await shot('saved');
  const first=JSON.parse(await raw()); assert.equal(first.pages.length,1);
  assert.equal(first.pages[0].source,'本地注册（当前浏览器）');
  await page.reload({waitUntil:'domcontentloaded'}); await page.locator('[data-page-register]').waitFor();
  await page.locator('[data-page-registry-search]').fill('local.demo.report');
  assert.equal(await page.locator('[data-page-registry-rows] tr').count(),1); await shot('reload');
  await page.locator('[data-page-detail]').click(); await shot('detail'); await page.keyboard.press('Escape');
  await open(); await fill('local.demo.report','inner','/unique-path');
  await page.locator('[data-page-registration-save]').click(); await page.locator('[data-page-registration-error]').getByText(/标识.*重复/).waitFor(); await shot('duplicate');
  assert.equal(await form().locator('[name="title"]').inputValue(),'本地示例页面');
  await fill('unique.id','inner','/local-demo-report');await page.locator('[data-page-registration-save]').click();assert.match(await page.locator('[data-page-registration-error]').innerText(),/路由.*重复/);await shot('duplicate-path');
  await page.keyboard.press('Escape');assert.equal(JSON.parse(await raw()).pages.length,1);
  for(const type of ['iframe','external','micro-app']){
    await open(); await fill(`local.${type}`,type); await shot(type);
    if(type==='micro-app'){
      assert.equal(await form().locator('[name="url"]').isDisabled(),true);
      assert.equal(await form().locator('[name="path"]').inputValue(),'/local-micro-app');
      await form().locator('[name="microUrl"]').fill('ftp://invalid.example/app');
      await page.locator('[data-page-registration-save]').click();assert.match(await page.locator('[data-page-registration-error]').innerText(),/微应用/);await shot('micro-invalid');
      await form().locator('[name="microUrl"]').fill('https://example.com/micro');
    }
    await page.locator('[data-page-registration-save]').click(); await form().waitFor({state:'detached'});
  }
  assert.equal(JSON.parse(await raw()).pages.length,4);
  await page.locator('[data-m-nav-layer="routing"] a[href$="/navigation"]').click();
  await page.locator('[data-jme-select="0.0"]').click();
  const name=await page.locator('[data-jme-dialog-field="name"]').inputValue();
  await page.locator('[data-page-picker-open]').click();
  await page.locator('[data-page-picker-search]').fill('local.demo.report');
  await page.locator('[data-page-pick="local.demo.report"]').waitFor(); await shot('selectable');
  await page.locator('[data-page-pick="local.demo.report"]').click();
  await page.locator('[data-page-confirm]').click();
  assert.match(await page.locator('[data-page-binding]').innerText(),/local.demo.report/);
  assert.equal(await page.locator('[data-jme-dialog-field="name"]').inputValue(),name);
  assert.equal(await page.locator('[data-jme-publish-current]').isEnabled(),true); await shot('bound-unpublished');
  await page.locator('[data-m-nav-layer="routing"] a[href$="/page-registry"]').click();
  await open(); await fill('failed.local'); const beforeFailure=await raw();
  await page.evaluate(key=>{const original=Storage.prototype.setItem;window.restoreRegistrationStorage=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Quota','QuotaExceededError');return original.call(this,k,v);};},key);
  await page.locator('[data-page-registration-save]').click(); assert.match(await page.locator('[data-page-registration-error]').innerText(),/本地保存失败/);await shot('storage-failure');
  assert.equal(await raw(),beforeFailure);assert.equal(await form().locator('[name="id"]').inputValue(),'failed.local');
  await page.evaluate(()=>window.restoreRegistrationStorage()); await page.keyboard.press('Escape');
  const beforePermission=await raw();
  await page.evaluate(async()=>{const store=await import('/src/permissions/m-platform-store.ts');const state=store.readMState();for(const role of state.roles)role.grants['m:page:routing']='read';localStorage.setItem(store.M_PERMISSION_STORAGE,JSON.stringify(state));});
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-page-register]:disabled').waitFor();
  await page.locator('[data-page-registry-search]').fill('local.demo.report');await page.locator('[data-page-detail]').click();await page.keyboard.press('Escape');await shot('readonly');assert.equal(await raw(),beforePermission);
  await page.evaluate(async()=>{const store=await import('/src/permissions/m-platform-store.ts');localStorage.setItem(store.M_PERMISSION_STORAGE,JSON.stringify(store.createMState()));});
  await page.evaluate(key=>localStorage.setItem(key,'not json'),key);
  await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('alert').getByText(/不可读取/).waitFor();await shot('corrupt-storage');
  await open();await fill('not.overwrite');await page.locator('[data-page-registration-save]').click();assert.match(await page.locator('[data-page-registration-error]').innerText(),/不可读取/);assert.equal(await raw(),'not json');await shot('corrupt-save-blocked');
  assert.deepEqual(errors,[]);
  writeFileSync(`${output}/verification.json`,JSON.stringify({status:'passed',baseline:'ec151927',branch:'codex/menu-routing-subnav-20261106',url:base,at:new Date().toISOString(),checks:['open','required','cancel','escape-focus','overlay','save','reload','details','duplicate-id','duplicate-path','four-types','micro-validation','picker-visible','binding-no-auto-publish','quota-input-retained','readonly','corrupt-no-overwrite'],pageErrors:errors},null,2));
  console.log('PASS browser local registration: create/cancel/validate/save/reload/four types/select/readonly/storage failure; zero page errors');
}catch(error){await shot('failure').catch(()=>{});writeFileSync(`${output}/verification.json`,JSON.stringify({status:'failed',error:String(error),pageErrors:errors},null,2));throw error;}finally{await browser.close();}
