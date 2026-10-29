const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const base=process.env.BRAND_PREVIEW_URL||'http://127.0.0.1:5266';await p.goto(base);
 await p.evaluate(async()=>{const a=await import('/src/auth/login.ts');a.setAuthenticated(a.DEMO_LOGIN_ACCOUNT);(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell()});
 await p.goto(base+'/#/m-platform/merchants/merchant-zhangji/services');await p.locator('[data-brand-entitlements]').waitFor();
 const fixture=await p.evaluate(async()=>{
  const t=await import('/src/config/subscription-published-menu-tree.ts');await t.ensurePublishedSubscriptionMenuTree();const nodes=t.getPublishedSubscriptionRouteCatalog();
  const sms=nodes.find(n=>n.path==='/members/crm/sms-tasks'),users=nodes.find(n=>n.path==='/members/users/list');
  const s=await import('/src/config/subscription-service-store.ts');const pkg=s.createServicePackageFromWizard({name:'会员营销服务',code:'PREVIEW_MENU',priceMinor:29900,commercial:{chargeType:'paid',billingUnit:'brand',trialEnabled:true,trialDays:14},routeNodeIds:[sms.id],publish:true});
  const draft=s.getOrCreatePackageDraft(pkg.id);draft.routeNodeIds=[users.id];s.savePackageDraft(draft);
  return {id:pkg.id,sms:sms.path,other:users.path};
 });
 await p.reload();await p.locator(`[data-ent-menu="${fixture.id}"]`).waitFor();
 const before=await p.evaluate(()=>localStorage.getItem('menusifu:subscription-service-packages-v1'));
 await p.locator(`[data-ent-menu="${fixture.id}"]`).click();const d=p.locator('[data-service-menu-preview]');await d.waitFor();
 assert((await d.innerText()).includes(fixture.sms));assert(!(await d.innerText()).includes(fixture.other));assert.equal(await d.locator('input[type=checkbox]').count(),0);assert(await d.locator('details').count()>0);
 const assets=process.env.USAGE_SCREENSHOT_DIR||'docs/需求文档/服务与订阅/assets/service-menu-preview-20261029';fs.mkdirSync(assets,{recursive:true});await p.screenshot({path:assets+'/configured-menus.png',fullPage:true});
 await d.locator('[data-menu-preview-search]').fill('no-matching-menu');assert((await d.innerText()).includes('没有匹配'));await p.keyboard.press('Escape');await d.waitFor({state:'detached'});
 await p.locator(`[data-ent-menu="${fixture.id}"]`).click();await d.waitFor();await d.getByRole('button',{name:'关闭',exact:true}).last().click();await d.waitFor({state:'detached'});
 assert.equal(await p.evaluate(()=>localStorage.getItem('menusifu:subscription-service-packages-v1')),before,'preview must not write service data');
 await p.evaluate(async()=>{const s=await import('/src/permissions/m-platform-store.ts');const state=s.createMState();state.roles[0].grants['m:page:brands']='read';state.roles[0].grants['m:page:subscriptions']='read';localStorage.setItem(s.M_PERMISSION_STORAGE,JSON.stringify(state))});await p.reload();await p.locator(`[data-ent-menu="${fixture.id}"]`).click();await d.waitFor();assert.equal(await p.locator('[data-ent-new]').count(),0);await p.goto(base+'/#/m-platform/merchants');await d.waitFor({state:'detached'});assert.deepEqual(errors,[]);
 console.log('PASS published-only tree, ancestor retention, unbound/draft exclusion, search, readonly permission, Escape/close/navigation cleanup and no storage writes');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
