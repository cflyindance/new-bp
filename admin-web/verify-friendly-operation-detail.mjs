import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PREVIEW_URL??'http://127.0.0.1:65281';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
try{
 await page.goto(base);
 await page.evaluate(async()=>{
  (await import('/src/auth/login.ts')).setAuthenticated('demo.menusifu.cn');
  (await import('/src/config/platform-preset-onboarding.ts')).markPlatformPresetOnboardingComplete('demo.menusifu.cn');
  (await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();
 });
 const checks=await page.evaluate(async()=>{
  const {appendOperation}=await import('/src/config/operation-log.ts');
  const {renderOperationChanges,renderOperationValue,operationFieldLabel}=await import('/src/config/operation-log-presentation.ts');
  const before={projects:[{id:'internal-project-id',name:'商品中心',status:'active'}],directories:[],pages:[],assignments:[]};
  const after=structuredClone(before);after.projects[0].status='disabled';after.projects[0].name='新商品中心';
  const e=appendOperation({scope:'registry',action:'友好展示回归测试',stage:'保存',before,after});
  const original=JSON.stringify(e);
  const html=renderOperationChanges(e);
  const added=renderOperationChanges({...e,changes:[{field:'projects[internal-project-id]',before:null,after:{id:'internal-project-id',name:'商品中心',status:'active'}}]});
  const removed=renderOperationChanges({...e,changes:[{field:'projects[internal-project-id]',before:{name:'商品中心'},after:null}]});
  const ordering=renderOperationValue(['internal-project-id','unresolved-internal-id'],e,'projects.顺序','before');
  const xss=renderOperationValue('<img src=x onerror=alert(1)>',e,'name','before');
  return {html,added,removed,ordering,xss,unchanged:JSON.stringify(e)===original,label:operationFieldLabel('projects[internal-project-id].status',e)};
 });
 assert.match(checks.html,/启用状态/);assert.match(checks.html,/启用/);assert.match(checks.html,/停用/);
 assert.doesNotMatch(checks.html,/修改内容/);
 assert.doesNotMatch(checks.html,/internal-project-id|\.status|active|disabled/);
 assert.match(checks.added,/新增内容/);assert.match(checks.removed,/删除内容/);assert.match(checks.removed,/已删除/);
 assert.doesNotMatch(checks.added,/internal-project-id/);assert.doesNotMatch(checks.ordering,/internal-id/);
 assert.match(checks.ordering,/商品中心/);assert.ok(checks.unchanged);assert.doesNotMatch(checks.xss,/<img/);
 await page.goto(base+'/#/m-platform/nav-blueprint/page-registry/logs');
 await page.locator('[data-operation-log]').waitFor();
 await page.locator('tr').filter({hasText:'友好展示回归测试'}).getByRole('button',{name:'查看详情'}).click();
 const dialog=page.getByRole('dialog',{name:'操作记录详情'});await dialog.waitFor();
 assert.equal(await dialog.locator('pre').count(),0);
 assert.match(await dialog.innerText(),/项目名称/);assert.match(await dialog.innerText(),/启用状态/);
 assert.doesNotMatch(await dialog.innerText(),/internal-project-id|projects\[|\.status/);
 await page.waitForTimeout(1000);
 await page.screenshot({path:'output/playwright/friendly-operation-detail.png',fullPage:true});
 await page.evaluate(async()=>{
  const {appendOperation}=await import('/src/config/operation-log.ts');
  appendOperation({scope:'menu',action:'菜单友好展示测试',stage:'保存',before:{menu:[{id:'internal-menu-id',name:'商品',display:true,type:'inner'}]},after:{menu:[{id:'internal-menu-id',name:'商品',display:false,type:'micro-app'}]}});
 });
 await page.goto(base+'/#/m-platform/nav-blueprint/navigation/logs');
 await page.locator('[data-operation-log]').waitFor();
 await page.locator('tr').filter({hasText:'菜单友好展示测试'}).getByRole('button',{name:'查看详情'}).click();
 await dialog.waitFor();
 const menuText=await dialog.innerText();
 assert.match(menuText,/是否显示/);assert.match(menuText,/项目内页面/);assert.match(menuText,/微应用/);
 assert.doesNotMatch(menuText,/internal-menu-id|micro-app|true|false/);
 console.log('PASS: Chinese fields/status, add/delete, ordered names, missing references, escaping, no snapshot mutation, browser detail without JSON/pre/internal IDs');
}finally{await browser.close();}
