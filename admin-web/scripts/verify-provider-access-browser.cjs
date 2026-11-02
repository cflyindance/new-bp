const assert=require('node:assert/strict');
const {mkdirSync,writeFileSync}=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PROVIDER_PREVIEW_URL||'http://127.0.0.1:5301';
const out='docs/项目文档/assets/provider-merchant-access-20261102';mkdirSync(out,{recursive:true});
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1500,height:1000}});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>{errors.push(e.stack);console.log('BROWSER ERROR '+e.stack);});
try{
 await page.goto(base+'/#/login');
 await page.waitForFunction(()=>!!document.querySelector('input'),null,{timeout:60000});
 await page.evaluate(async()=>{const a=await import('/src/auth/login.ts');a.setAuthenticated(a.DEMO_LOGIN_ACCOUNT);(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();location.hash='/m-platform/permissions/provider-roles';});
 await page.getByRole('heading',{name:'商家后台访问角色',exact:true}).first().waitFor({timeout:60000});
 await page.getByRole('button',{name:'新建访问角色',exact:true}).click();
 await page.locator('dialog input[name=name]').fill('订单支持');
 await page.locator('dialog button[type=submit]').click();
 await page.getByRole('link',{name:'配置权限',exact:true}).first().waitFor();
 await page.screenshot({path:out+'/roles.png',fullPage:true});
 const fixture=await page.evaluate(async()=>{
  const m=await import('/src/permissions/m-platform-store.ts'),p=await import('/src/permissions/provider-access-store.ts');
  const data=await import('/src/config/enterprise-merchant-store.ts'),brand=await import('/src/config/brand-access-store.ts'),domain=await import('/src/permissions/center-domain.ts'),catalog= (await import('/src/permissions/center-catalog.ts')).buildCenterCatalog();
  const snapshot=data.getEnterpriseMerchantSnapshotForAuthorization(),merchant=snapshot.merchants.find(m=>m.merchantId==='merchant-zhangji'),stores=snapshot.stores.filter(s=>s.merchantId===merchant.merchantId).slice(0,2);
  if(stores.length!==2)throw Error('Need two existing demo stores');
  data.saveBrandStoreMenus(merchant.merchantId,stores.map(s=>s.storeId),[],'inherit',data.brandConfigurationVersion(merchant.merchantId),'provider-access-test','隔离浏览器验收');
  const upper=brand.brandCatalog(merchant.merchantId,catalog).ceiling,upperStores=stores.map(s=>brand.mappedRuntimeKeys(new Set(data.getStoreCapability(s.storeId)?.enabledKeys??[]),catalog));
  const moduleOf=(r)=>{let x=r;const seen=new Set();while(x.parent&&!seen.has(x.key)){seen.add(x.key);x=catalog.resources.get(x.parent)||x;}return x.key;};
  const pages=[...catalog.resources.values()].filter(r=>r.type==='page'&&!r.compatibilityOnly&&r.path&&!r.path.startsWith('/permissions')&&upper.has(r.key)&&upperStores.every(u=>u.has(r.key)));
  const first=pages.find(r=>moduleOf(r)==='module:orders')||pages[0];
  const second=pages.find(r=>moduleOf(r).includes('finance'))||pages.find(r=>moduleOf(r)!==moduleOf(first)&&!r.path.startsWith('/brand'));
  if(!second)throw Error('Need two permitted modules '+JSON.stringify({pages:pages.map(p=>[p.key,moduleOf(p)]),ceiling:upper.size,stores:upperStores.map(s=>s.size)}));
  const makeRole=(id,name,moduleKey)=>({id,name,description:'权限验收',system:false,grants:Object.fromEntries([...catalog.resources.values()].filter(r=>moduleOf(r)===moduleKey).map(r=>[r.key,r.type==='action'?'hidden':'read']))});
  const next=p.readProviderState();next.roles=[makeRole('orders','订单支持',moduleOf(first)),makeRole('finance','财务查看',moduleOf(second))];
  next.employees=[{employeeId:'ent002',bindings:[{id:'a1',roleId:'orders',scope:{mode:'stores',ids:[stores[0].storeId]}},{id:'a2',roleId:'finance',scope:{mode:'stores',ids:[stores[1].storeId]}}]},
  {employeeId:'ent003',bindings:[{id:'b1',roleId:'finance',scope:{mode:'stores',ids:[stores[0].storeId]}}]}];
  p.saveProviderState(next,next.revision,'验收员工','配置验收授权');
  const ms=m.readMState();ms.roles.push({id:'provider-test',name:'商户访问验收',description:'',grants:{'m:module:merchants':'read','m:page:brands':'read','m:page:stores':'read','m:action:brands:impersonate':'edit','m:action:stores:impersonate':'edit'}});
  for(const id of ['ent002','ent003']){let e=ms.employees.find(e=>e.id===id);if(e)e.roleIds=['provider-test'];else ms.employees.push({id,roleIds:['provider-test']});}
  m.saveMState(ms,'验收角色','验收员工',['staff','assign']);
  const accounts=(await import('/src/permissions/enterprise-staff-account-store.ts')).listStaffLoginAccounts();
  return {brandId:merchant.merchantId,stores:stores.map(s=>s.storeId),first:{key:first.key,path:first.path},second:{key:second.key,path:second.path},a:accounts.find(a=>a.employeeId==='ent002').loginEmail,b:accounts.find(a=>a.employeeId==='ent003').loginEmail};
 });
 await page.goto(base+'/#/m-platform/permissions/staff/ent002/merchant-access');
 await page.getByRole('heading',{name:/商户访问授权/}).waitFor();
 await page.waitForTimeout(500);await page.screenshot({path:out+'/staff-access.png',fullPage:true});
 await page.getByRole('button',{name:'添加访问授权',exact:true}).click();await page.locator('dialog.provider-dialog').waitFor();await page.screenshot({path:out+'/scope-dialog.png',fullPage:true});await page.locator('dialog [data-cancel]').click();
 await page.goto(base+'/#/m-platform/permissions/provider-roles/edit/orders');
 await page.locator('.pc-editor').waitFor();await page.locator('[data-page="'+fixture.first.key+'"]').first().click();await page.waitForTimeout(500);await page.screenshot({path:out+'/role-editor.png',fullPage:true});
 await page.getByRole('button',{name:'权限预览',exact:true}).click();await page.locator('[data-provider-target]').selectOption(fixture.brandId+'|'+fixture.stores[0]);await page.waitForTimeout(300);await page.screenshot({path:out+'/role-preview.png',fullPage:true});await page.getByRole('button',{name:'返回编辑',exact:true}).click();
 const ownModule=await page.evaluate(async key=>{const c=(await import('/src/permissions/center-catalog.ts')).buildCenterCatalog();let r=c.resources.get(key);while(r.parent)r=c.resources.get(r.parent);return r.key;},fixture.first.key);
 await page.locator('[data-grant="'+ownModule+'"][data-value=hidden]').first().click();await page.locator('[data-provider-save]').click();await page.locator('dialog.provider-dialog').waitFor();await page.screenshot({path:out+'/save-confirm.png',fullPage:true});await page.locator('dialog [data-cancel]').click();await page.locator('[data-grant="'+ownModule+'"][data-value=read]').first().click();
 const check=async(email,storeId,allowed,denied)=>{
  await page.evaluate(async({email})=>{const a=await import('/src/auth/login.ts');a.setAuthenticated(email);(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();location.hash='/m-platform/merchants/stores';},{email});
  await page.getByRole('heading',{name:'门店管理',exact:true}).first().waitFor({timeout:30000});
  const result=await page.evaluate(async({storeId,allowed,denied})=>{
   const imp=await import('/src/config/enterprise-merchant-impersonate.ts');
   const data=await import('/src/config/enterprise-merchant-store.ts'),p=await import('/src/permissions/provider-access-store.ts');
   let readonlyRejected=false,managementRejected=false;
   try{data.saveBrandStoreMenus(data.getStoreById(storeId).merchantId,[storeId],[],'replace',data.brandConfigurationVersion(data.getStoreById(storeId).merchantId),'test','test');}catch{readonlyRejected=true;}
   try{const state=p.readProviderState();p.saveProviderState(state,state.revision,'test','test');}catch{managementRejected=true;}
   const ok=imp.enterStoreBackendAsImpersonator(storeId,'/m-platform/merchants/stores');
   await Promise.resolve();
   const brand=await import('/src/config/brand-access-store.ts'),sess=await import('/src/auth/session-permissions.ts');
   return {ok,readonlyRejected,managementRejected,allowed:brand.isBrandPathAllowed(allowed),denied:brand.isBrandPathAllowed(denied),session:sess.getUserSessionContext()?.employeeId,as:imp.readActiveImpersonation()?.operatorEmployeeId};
  },{storeId,allowed,denied});
  assert.equal(result.readonlyRejected,true);assert.equal(result.managementRejected,true);assert.equal(result.ok,true);assert.equal(result.allowed,true);assert.equal(result.denied,false);assert.equal(result.session,result.as);
  await page.goto(base+'/#'+denied);await page.waitForTimeout(350);
  assert.match(await page.locator('body').innerText(),/权限|不可用|未开通|无权/);
  await page.evaluate(async()=>{(await import('/src/config/enterprise-merchant-impersonate.ts')).endMerchantImpersonation();});
 };
 await check(fixture.a,fixture.stores[0],fixture.first.path,fixture.second.path);
 await check(fixture.b,fixture.stores[0],fixture.second.path,fixture.first.path);
 await check(fixture.a,fixture.stores[1],fixture.second.path,fixture.first.path);
 const unauthorized=await page.evaluate(async(fixture)=>{
  const a=await import('/src/auth/login.ts');a.setAuthenticated(fixture.b);(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();location.hash='/m-platform/merchants/stores';
  const m=await import('/src/config/enterprise-merchant-store.ts'),imp=await import('/src/config/enterprise-merchant-impersonate.ts'),runtime=await import('/src/permissions/m-platform-runtime.ts');
  return {rows:m.getEnterpriseStoreList().map(r=>r.store.storeId),direct:runtime.mCanVisit('/m-platform/merchants/stores/'+fixture.stores[1]),enter:imp.enterStoreBackendAsImpersonator(fixture.stores[1],'/m-platform/merchants/stores'),brand:imp.enterMerchantBackendAsImpersonator(fixture.brandId),session:!!imp.readActiveImpersonation()};
 },fixture);
 assert.deepEqual(unauthorized.rows,[fixture.stores[0]]);assert.equal(unauthorized.direct,false);assert.equal(unauthorized.enter,false);assert.equal(unauthorized.brand,false);assert.equal(unauthorized.session,false);
 await page.goto(base+'/#/m-platform/merchants/stores');await page.getByRole('heading',{name:'门店管理',exact:true}).first().waitFor();await page.screenshot({path:out+'/restricted-stores.png',fullPage:true});

 const entered=await page.evaluate(async(fixture)=>{return (await import('/src/config/enterprise-merchant-impersonate.ts')).enterStoreBackendAsImpersonator(fixture.stores[0],'/m-platform/merchants/stores');},fixture);
 assert.equal(entered,true);
 const admin=await context.newPage();await admin.goto(base+'/#/login');
 await admin.evaluate(async()=>{const a=await import('/src/auth/login.ts');a.setAuthenticated(a.DEMO_LOGIN_ACCOUNT);(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();location.hash='/m-platform/permissions/provider-roles';});
 await admin.locator('[data-provider-new]').waitFor();
 const security=await admin.evaluate(async()=>{
  const p=await import('/src/permissions/provider-access-store.ts');
  let state=p.readProviderState();const revision=state.revision;
  p.saveProviderState(state,revision,'验收','并发校验准备');
  let conflict=false;try{p.saveProviderState(state,revision,'验收','过期保存');}catch{conflict=true;}
  state=p.readProviderState();state.employees=state.employees.map(e=>e.employeeId==='ent003'?{...e,bindings:[]}:e);
  p.saveProviderState(state,state.revision,'吴蓝图','撤销商户访问');
  const before=localStorage.getItem(p.PROVIDER_ACCESS_KEY);let failedWrite=false;const set=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){if(key===p.PROVIDER_ACCESS_KEY)throw new DOMException('quota','QuotaExceededError');return set.call(this,key,value);};
  try{const next=p.readProviderState();p.saveProviderState(next,next.revision,'test','test');}catch{failedWrite=true;}finally{Storage.prototype.setItem=set;}
  const unchanged=before===localStorage.getItem(p.PROVIDER_ACCESS_KEY);
  localStorage.setItem(p.PROVIDER_ACCESS_KEY,'{bad json');const deniedCorrupt=!p.currentProviderCanTarget('merchant-zhangji');localStorage.setItem(p.PROVIDER_ACCESS_KEY,before);
  return {conflict,failedWrite,unchanged,deniedCorrupt};
 });
 assert.equal(security.conflict,true);assert.equal(security.failedWrite,true);assert.equal(security.unchanged,true);assert.equal(security.deniedCorrupt,true);
 await page.waitForFunction(()=>location.hash.startsWith('#/m-platform/'),null,{timeout:15000});
 assert.equal(await page.evaluate(async()=>!!(await import('/src/config/enterprise-merchant-impersonate.ts')).readActiveImpersonation()),false);
 await admin.close();

 assert.equal(errors.length,0,'Browser errors: '+errors.join('; '));
 writeFileSync(out+'/verification.json',JSON.stringify({base,fixture:{...fixture,a:'ent002',b:'ent003'},checks:['role create UI','staff scope UI','role editor','same store different employee menus','same employee different store menus','direct path denial','out-of-scope entry denied','no brand elevation','store list scope','read-only function guard','management function guard','failed write preserved','corrupt state denied','cross-window live revocation','concurrent save conflict','target menu preview','scope dialog and confirmation'],errors},null,2));
 console.log('PASS provider access browser: scoped roles, menu intersections, direct access, real employee identity and UI');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
