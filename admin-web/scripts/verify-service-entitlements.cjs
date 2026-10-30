const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1500,height:1050}}),errors=[];
  p.on('pageerror',e=>{if(!errors.length)console.log('FIRST PAGE ERROR',e.stack);errors.push(e.message)});
  const base=process.env.BRAND_PREVIEW_URL||'http://127.0.0.1:5265',assets=process.env.USAGE_SCREENSHOT_DIR||'docs/需求文档/服务与订阅/assets/service-entitlements-20261029';
  fs.mkdirSync(assets,{recursive:true});
  const go=async path=>{await p.goto(base+'/#'+path);await p.waitForTimeout(500);};
  const shot=async name=>{await p.waitForTimeout(300);await p.screenshot({path:assets+'/'+name+'.png',fullPage:true});};
  await p.goto(base);await p.evaluate(async()=>{const a=await import('/src/auth/login.ts');a.setAuthenticated(a.DEMO_LOGIN_ACCOUNT);(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
  await go('/m-platform/merchants/merchant-zhangji');
  await p.evaluate(async()=>{
    const scope=await import('/src/auth/session-scope.ts');let events=0;
    const listener=()=>events++;window.addEventListener('menusifu:scope-filter-change',listener);
    const before=scope.readScopeFilters();scope.writeScopeFilters(before);scope.writeScopeFilters(before);
    window.removeEventListener('menusifu:scope-filter-change',listener);if(events)throw Error('unchanged scope remounted');
    const store=await import('/src/config/enterprise-merchant-store.ts');let writes=0;
    const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='menusifu:enterprise-merchants-v1')writes++;return original.call(this,key,value)};
    try{store.getEnterpriseMerchantSnapshot();store.getEnterpriseMerchantSnapshot();if(writes)throw Error('empty provisioning requests triggered writes')}finally{Storage.prototype.setItem=original}
  });
  // Only this isolated browser fixture enables the real brand/store menu ceiling before commercial tests.
  await p.evaluate(async()=>{const s=await import('/src/config/enterprise-merchant-store.ts'),a=await import('/src/config/brand-access-store.ts');const cap=s.getMerchantCapability('merchant-zhangji'),keys=a.brandMenuChoices(cap.productLineIds).map(c=>c.key);s.saveExplicitBrandMenus('merchant-zhangji',keys,s.brandConfigurationVersion('merchant-zhangji'),a.authorizeBrandManagement('merchant-zhangji','m-platform'),'权益回归fixture');s.saveBrandStoreMenus('merchant-zhangji',['M00000001','M00000002'],[],'inherit',s.brandConfigurationVersion('merchant-zhangji'),a.authorizeBrandManagement('merchant-zhangji','m-platform'),'权益回归fixture');});
  await go('/m-platform/permissions/subscription-services/create');
  await p.locator('[name=name]').fill('会员营销权益测试');await p.locator('[name=code]').fill('MEMBER_TRIAL_TEST');await p.locator('[name=price]').fill('299');
  await p.locator('[name=chargeType]').selectOption('paid');await p.locator('[name=trialEnabled]').check();await p.locator('[name=trialDays]').fill('14');await shot('service-create');
  await p.locator('[data-wizard-next]').click();
  await p.locator('[data-subscription-menu-tree]').waitFor();
  const catalog=await p.evaluate(async()=>{const m=await import('/src/config/subscription-published-menu-tree.ts');await m.ensurePublishedSubscriptionMenuTree();return m.getPublishedSubscriptionRouteCatalog();});
  // Isolate this custom expiry scenario from other valid default demo services
  // bound to the same menu. Production correctly unions valid service sources.
  await p.evaluate(async()=>{const s=await import('/src/config/subscription-service-store.ts'),data=s.readSubscriptionServiceSnapshot();const demo=new Set(data.packages.filter(p=>p.id.startsWith('pkg-ent-demo-')).map(p=>p.id));data.packages=data.packages.filter(p=>!demo.has(p.id));data.releases=data.releases.filter(r=>!demo.has(r.packageId));data.subscriptions=data.subscriptions.filter(g=>!demo.has(g.packageId));data.protectedRoutes=data.protectedRoutes?.filter(r=>!demo.has(r.packageId));s.writeSubscriptionServiceSnapshot(data);});
  const sms=catalog.find(n=>n.path==='/members/crm/sms-tasks'),member=catalog.find(n=>n.path==='/members/users/list');assert(sms&&member);
  await p.locator('input[data-sub-tree-select-ids]').evaluateAll((nodes,id)=>{const n=nodes.find(n=>n.getAttribute('data-sub-tree-select-ids')===JSON.stringify([id]));if(!n)throw Error('SMS node absent');n.click();},sms.id);
  await p.locator('[data-wizard-next]').click();await p.locator('[data-wizard-submit=publish]').click();
  await p.locator('[data-subscription-service-page]').waitFor();
  const pkg=await p.evaluate(async()=>{const s=await import('/src/config/subscription-service-store.ts');return s.readSubscriptionServiceSnapshot().packages.find(p=>p.code==='MEMBER_TRIAL_TEST');});assert(pkg.commercial.trialEnabled);
  const free=await p.evaluate(async id=>{const s=await import('/src/config/subscription-service-store.ts');return s.createServicePackageFromWizard({name:'会员基础权益测试',code:'MEMBER_FREE_TEST',priceMinor:0,commercial:{chargeType:'free',billingUnit:'brand',trialEnabled:false,trialDays:0},routeNodeIds:[id],publish:true});},member.id);
  await go('/m-platform/merchants/merchant-zhangji/services');await p.locator('[data-brand-entitlements]').waitFor();await shot('brand-rights');
  await p.locator(`[data-ent-new=free][data-pkg="${free.id}"]`).click();await p.getByRole('button',{name:'确认免费开通',exact:true}).click();
  await p.locator(`[data-ent-new=trial][data-pkg="${pkg.id}"]`).click();const dialog=p.getByRole('dialog');await dialog.waitFor();await shot('trial-confirm');
  await p.getByRole('button',{name:'取消',exact:true}).click();
  const hasTrial=await p.evaluate(async id=>(await import('/src/config/subscription-service-store.ts')).readSubscriptionServiceSnapshot().subscriptions.some(s=>s.packageId===id&&s.entitlementKind==='trial'),pkg.id);assert.equal(hasTrial,false,'cancel must not consume trial');
  // Enter through the real store impersonation flow, preserving all brand and account ceilings.
  assert(await p.evaluate(async()=> (await import('/src/config/enterprise-merchant-impersonate.ts')).enterStoreBackendAsImpersonator('M00000001','#/m-platform/merchants/merchant-zhangji/services')));
  await go('/members/crm/sms-tasks');await p.locator('[data-service-gate]').waitFor();await shot('merchant-locked');
  assert.equal(await p.locator('[data-member-route-placeholder]').count(),0);
  await p.locator(`[data-service-trial="${pkg.id}"]`).click();await p.getByRole('button',{name:'确认开始试用',exact:true}).click();
  await p.locator('[data-member-route-placeholder]').waitFor();await p.locator('[data-service-notice]').waitFor();await shot('merchant-trial');
  const trial=await p.evaluate(async id=>(await import('/src/config/subscription-service-store.ts')).readSubscriptionServiceSnapshot().subscriptions.find(s=>s.packageId===id&&s.entitlementKind==='trial'),pkg.id);
  // Simulate a near expiry in this disposable browser and notify the same production runtime.
  await p.evaluate(async id=>{const s=await import('/src/config/subscription-service-store.ts');const snap=s.readSubscriptionServiceSnapshot(),g=snap.subscriptions.find(g=>g.id===id);g.endAt=new Date(Date.now()+800).toISOString();s.writeSubscriptionServiceSnapshot(snap);},trial.id);
  await p.locator('[data-service-gate]').waitFor();assert.equal(await p.locator('[data-member-route-placeholder]').count(),0);assert.equal(await p.locator('[data-service-trial]').count(),0);await shot('merchant-expired');
  await go('/members/users/list');await p.locator('[data-member-route-placeholder]').waitFor();assert.equal(await p.locator('[data-service-gate]').count(),0);
  await p.locator('[data-merchant-impersonation-exit]').click();await p.locator('[data-brand-entitlements]').waitFor();
  const repeat=await p.evaluate(async id=>{try{(await import('/src/config/service-entitlement-store.ts')).recordServiceEntitlement({brandId:'merchant-zhangji',packageId:id,kind:'trial',scopeMode:'all'},'m-platform');return false}catch{return true}},pkg.id);assert(repeat);
  await p.locator(`[data-ent-new=paid][data-pkg="${pkg.id}"]`).click();await p.getByRole('dialog').locator('[name=price]').fill('199');
  await p.getByRole('dialog').locator('[name=scopeMode]').selectOption('selected');await p.getByRole('dialog').locator('[name=storeIds][value=M00000001]').check();await p.getByRole('dialog').locator('[name=reference]').fill('TEST-CONTRACT-001');await shot('formal-confirm');
  await p.getByRole('button',{name:'确认正式开通',exact:true}).click();
  const paid=await p.evaluate(async id=>(await import('/src/config/subscription-service-store.ts')).readSubscriptionServiceSnapshot().subscriptions.find(s=>s.packageId===id&&s.entitlementKind==='paid'),pkg.id);assert.equal(paid.agreedPriceMinor,19900);assert.deepEqual(paid.storeIds,['M00000001']);
  await shot('brand-paid');
  const rightsGroup=p.locator(`[data-rights-service="${pkg.id}"]`);if(await rightsGroup.locator('[data-rights-expand]').getAttribute('aria-expanded')==='false')await rightsGroup.locator('[data-rights-expand]').click();
  await p.locator(`[data-ent-extend="${paid.id}"]`).click();await shot('renew-confirm');await p.getByRole('button',{name:'取消',exact:true}).click();
  await p.locator(`[data-ent-disable="${paid.id}"]`).click();await shot('disable-confirm');await p.getByRole('button',{name:'取消',exact:true}).click();
  const invalid=await p.evaluate(async id=>{const s=await import('/src/config/service-entitlement-store.ts');try{s.recordServiceEntitlement({brandId:'merchant-zhangji',packageId:id,kind:'gift',scopeMode:'selected',storeIds:['M00000003'],reference:'invalid',endAt:new Date(Date.now()+86400000).toISOString()},'m-platform');return false}catch{return true}},pkg.id);assert(invalid);
  await go('/m-platform/permissions/subscription-services/'+pkg.id);await p.locator('[data-spe-form]').waitFor();await p.locator('[name=price]').fill('399');await p.locator('[data-spe-save]').click();await p.locator('[data-spe-publish]').click();await p.getByRole('dialog',{name:'预览发布',exact:true}).locator('[data-spe-confirm]').click();
  const retained=await p.evaluate(async id=>(await import('/src/config/subscription-service-store.ts')).readSubscriptionServiceSnapshot().subscriptions.find(s=>s.id===id).agreedPriceMinor,paid.id);assert.equal(retained,19900);await shot('service-published');
  await go('/m-platform/merchants/merchant-zhangji/services');assert(await p.evaluate(async()=> (await import('/src/config/enterprise-merchant-impersonate.ts')).enterStoreBackendAsImpersonator('M00000002','#/m-platform/merchants/merchant-zhangji/services')));
  await go('/members/crm/sms-tasks');await p.locator('[data-service-gate]').waitFor();assert((await p.locator('[data-service-gate]').innerText()).includes('不在适用门店'));await shot('merchant-scope');
  await p.locator('[data-merchant-impersonation-exit]').click();await p.locator('[data-brand-entitlements]').waitFor();
  await p.evaluate(async id=>{
    const s=await import('/src/config/service-entitlement-store.ts'),data=await import('/src/config/subscription-service-store.ts');
    const old=data.readSubscriptionServiceSnapshot().subscriptions.find(s=>s.id===id),next=new Date(Date.parse(old.endAt)+86400000).toISOString();
    s.changeServiceEntitlement(id,'extend',next);
    let updated=data.readSubscriptionServiceSnapshot().subscriptions.find(s=>s.id===id);
    if(updated.endAt!==next||updated.agreedPriceMinor!==19900)throw Error('renewal lost contract snapshot');
    s.changeServiceEntitlement(id,'disable','回归验证停用');updated=data.readSubscriptionServiceSnapshot().subscriptions.find(s=>s.id===id);
    if(!updated.disabledAt||updated.disableReason!=='回归验证停用')throw Error('disable lost history');
  },paid.id);
  await p.evaluate(async()=>{const s=await import('/src/permissions/m-platform-store.ts');const state=s.createMState();state.roles[0].grants['m:page:brands']='read';state.roles[0].grants['m:page:subscriptions']='read';localStorage.setItem(s.M_PERMISSION_STORAGE,JSON.stringify(state));});
  await go('/m-platform/merchants/merchant-zhangji/services');await p.reload();await p.locator('[data-brand-entitlements]').waitFor();assert.equal(await p.locator('[data-ent-new]').count(),0);
  assert(await p.evaluate(async id=>{try{(await import('/src/config/service-entitlement-store.ts')).recordServiceEntitlement({brandId:'merchant-zhangji',packageId:id,kind:'free',scopeMode:'all'},'m-platform');return false}catch{return true}},free.id));
  assert.deepEqual(errors,[]);
  console.log('PASS integrated entitlements: wizard tree/policy publish, brand rights, cancellation, B real store impersonation, locked/trial/exact expiry, retained data, free service, one-time trial, contract snapshot, selected stores, foreign-store rejection and readonly storage gate');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
