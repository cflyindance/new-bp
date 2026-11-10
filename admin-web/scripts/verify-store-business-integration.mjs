import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();await page.goto((process.env.BUSINESS_PREVIEW_URL??'http://127.0.0.1:5315')+'/#/login');
 const result=await page.evaluate(async()=>{
  const auth=await import('/src/auth/login.ts');auth.setAuthenticated(auth.DEMO_LOGIN_ACCOUNT);
  const s=await import('/src/config/enterprise-merchant-store.ts');
  const f=await import('/src/config/management-list-filters.ts');
  const original=s.getStoreById('M00000002'),checks={};
  const backup=JSON.stringify(s.getEnterpriseMerchantSnapshotForAuthorization());
  const set=Storage.prototype.setItem;let rejected=false;
  Storage.prototype.setItem=function(k,v){if(k==='menusifu:enterprise-merchants-v1')throw Error('测试写入失败');return set.call(this,k,v);};
  try{s.updateMerchantStoreStatus(original.storeId,'closed');}catch(e){rejected=e.message==='测试写入失败';}finally{Storage.prototype.setItem=set;}
  checks.rollback=rejected&&backup===JSON.stringify(s.getEnterpriseMerchantSnapshotForAuthorization());
  const count=s.getStoreChangelog(original.storeId).length;
  s.updateMerchantStoreStatus(original.storeId,'closed');checks.manual=s.getStoreOperatingStatus(s.getStoreById(original.storeId)).status==='closed';
  checks.filtered=f.filteredManagementStores({status:'closed'}).some(r=>r.store.storeId===original.storeId)&&!f.filteredManagementStores({status:'open'}).some(r=>r.store.storeId===original.storeId);
  checks.audit=s.getStoreChangelog(original.storeId).length===count+1;
  s.updateMerchantStoreStatus(original.storeId,'closed');checks.noop=s.getStoreChangelog(original.storeId).length===count+1;
  s.updateMerchantStoreStatus(original.storeId,'terminated');checks.closed=s.getStoreOperatingStatus(s.getStoreById(original.storeId)).label==='已关闭';
  s.updateMerchantStoreStatus(original.storeId,'open');checks.resumed=s.getStoreOperatingStatus(s.getStoreById(original.storeId)).status==='open';
  const beforeDenied=JSON.stringify(s.getEnterpriseMerchantSnapshotForAuthorization());auth.setAuthenticated('unauthorized-test@example.invalid');
  try{s.updateMerchantStoreStatus(original.storeId,'closed');checks.denied=false;}catch{checks.denied=beforeDenied===JSON.stringify(s.getEnterpriseMerchantSnapshotForAuthorization());}
  auth.setAuthenticated(auth.DEMO_LOGIN_ACCOUNT);
  localStorage.setItem('menusifu:store-business-facts:v1','{bad');checks.invalidFacts=s.getStoreOperatingStatus(s.getStoreById(original.storeId)).status==='unknown';
  localStorage.removeItem('menusifu:store-business-facts:v1');
  return checks;
 });
 for(const [name,passed] of Object.entries(result))assert.equal(passed,true,name);
 console.log('PASS store status persistence rollback, manual precedence, filters, audit, no-op, resume, permissions, corrupt source',JSON.stringify(result));
}finally{await browser.close();}
