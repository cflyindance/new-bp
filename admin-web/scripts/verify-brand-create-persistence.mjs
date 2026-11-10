import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.BRAND_PREVIEW_URL??'http://127.0.0.1:5314';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/#/login');await page.waitForFunction(()=>!!document.querySelector('input'));
 const result=await page.evaluate(async()=>{
  const login=await import('/src/auth/login.ts');login.setAuthenticated(login.DEMO_LOGIN_ACCOUNT);
  const s=await import('/src/config/enterprise-merchant-store.ts');
  const ids=await import('/src/config/enterprise-merchant-bid.ts');
  const lifecycle=await import('/src/config/brand-service-lifecycle.ts');
  const business=s.getBusinessTypeOptions()[0].id;
  const key='menusifu:enterprise-merchants-v1';
  const input={name:'创建存储边界验收',orgType:'chain',primaryAdminEmail:'',businessTypeIds:[business],productLineIds:['pos'],initialMenuKeys:[],activateImmediately:false};
  const results=[];
  for(const provisioning of [false,true]) {
   const before=s.getEnterpriseMerchantSnapshotForAuthorization(),beforeJSON=JSON.stringify(before),raw=localStorage.getItem(key),expected=ids.generateNextBid(structuredClone(before));
   const original=Storage.prototype.setItem;let rejected=false;
   Storage.prototype.setItem=function(k,v){if(k===key)throw Error('Injected storage failure');return original.call(this,k,v);};
   try{s.createMerchant({...input,accountProvisioningRequired:provisioning});}catch(e){rejected=e.message==='Injected storage failure';}finally{Storage.prototype.setItem=original;}
   const unchanged=localStorage.getItem(key)===raw&&JSON.stringify(s.getEnterpriseMerchantSnapshotForAuthorization())===beforeJSON;
   const created=s.createMerchant({...input,accountProvisioningRequired:provisioning});
   results.push({provisioning,rejected,unchanged,expected,bid:created.bid,code:created.code,timezone:created.timezone,contactOmitted:created.contactName===undefined,readiness:lifecycle.brandServiceReadiness(created.merchantId)});
  }
  const beforeInvalid=JSON.stringify(s.getEnterpriseMerchantSnapshotForAuthorization());let invalidBusiness=false,invalidLine=false;
  try{s.createMerchant({...input,businessTypeIds:[]});}catch(e){invalidBusiness=e.message.includes('经营业态');}
  try{s.createMerchant({...input,productLineIds:[]});}catch(e){invalidLine=e.message.includes('产线');}
  const invalidUnchanged=beforeInvalid===JSON.stringify(s.getEnterpriseMerchantSnapshotForAuthorization());
  const legacy=s.createMerchant({...input,name:'显式种子兼容',code:'brand-create-demo-compat'});
  return {results,invalidBusiness,invalidLine,invalidUnchanged,legacyCode:legacy.code};
 });
 for(const r of result.results){assert.equal(r.rejected,true);assert.equal(r.unchanged,true);assert.equal(r.bid,r.expected);assert.equal(r.code,r.bid);assert.match(r.code,/^B\d{8}$/);assert.equal(r.timezone,'Asia/Shanghai');assert.equal(r.contactOmitted,true);assert.equal(r.readiness.some(v=>v.includes('联系人')),false,'Optional contact must not block brand activation');assert.equal(r.readiness.some(v=>v.includes('管理员')),true);assert.equal(r.readiness.some(v=>v.includes('菜单')),true);}
 assert.equal(result.invalidBusiness,true);assert.equal(result.invalidLine,true);assert.equal(result.invalidUnchanged,true);assert.equal(result.legacyCode,'brand-create-demo-compat');
 assert.deepEqual(errors,[]);
 mkdirSync('docs/verification/brand-create-fields-20261110',{recursive:true});writeFileSync('docs/verification/brand-create-fields-20261110/store-test-result.json',JSON.stringify({base,...result,errors},null,2));
 console.log('PASS brand create persistence boundary: failure rollback and ID reuse, optional contact/default timezone, required groups, legacy demo code');
}finally{await browser.close();}
