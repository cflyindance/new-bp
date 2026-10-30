import assert from 'node:assert/strict';
import { entitlementRowPolicy } from '../src/config/subscription-entitlement-policy';
import { entitlementDisableImpact } from '../src/config/service-entitlement-impact';
import type { MerchantSubscription, ServicePackage, SubscriptionServiceSnapshot } from '../src/config/subscription-service-domain';
const now = Date.parse('2026-10-30T08:00:00Z');
const pkg: ServicePackage = { id:'p',code:'P',name:'收费服务',priceMinor:10000,currency:'CNY',billingInterval:'month',status:'published',saleStatus:'on',activeReleaseId:'r',createdAt:'',updatedAt:'',commercial:{chargeType:'paid',billingUnit:'brand',trialEnabled:true,trialDays:14} };
const grant: MerchantSubscription = {id:'g',subjectType:'brand',subjectId:'b',packageId:'p',entitlementKind:'paid',scopeMode:'selected',storeIds:['s1'],startAt:new Date(now-10000).toISOString(),endAt:new Date(now+10000).toISOString(),createdAt:'',createdBy:'test'};
for (const [kind,primary,label] of [['free',undefined,undefined],['trial','paid','付费开通'],['paid','extend','续期'],['gift','extend','延长赠送']] as const) {
  const result=entitlementRowPolicy({...grant,entitlementKind:kind},pkg,now);
  assert.equal(result.primary,primary);assert.equal(result.label,label);assert.equal(result.canDisable,true);
}
for(const kind of ['paid','gift','free'] as const){
  const expired={...grant,entitlementKind:kind,endAt:new Date(now).toISOString()};
  assert.equal(entitlementRowPolicy(expired,pkg,now).primary,kind,'expired records must reopen, not extend');
  assert.equal(entitlementRowPolicy(expired,pkg,now).canDisable,false);
  assert.equal(entitlementRowPolicy({...grant,entitlementKind:kind,disabledAt:new Date(now-1).toISOString()},pkg,now).primary,kind);
}
assert.equal(entitlementRowPolicy(grant,{...pkg,saleStatus:'off'},now).primary,undefined);
assert.equal(entitlementRowPolicy(grant,{...pkg,saleStatus:'off'},now).canDisable,true);
assert.equal(entitlementRowPolicy({...grant,startAt:'invalid'},pkg,now).primary,undefined);
assert.equal(entitlementRowPolicy({...grant,endAt:'invalid'},pkg,now).canDisable,false);
assert.equal(entitlementRowPolicy({...grant,startAt:new Date(now+1000).toISOString()},pkg,now).primary,undefined);
const snapshot: SubscriptionServiceSnapshot={schemaVersion:1,routeBlueprintVersion:1,packages:[pkg],drafts:[],releases:[{...pkg,id:'r',packageId:'p',version:1,routeBlueprintVersion:1,routeNodeIds:['A','B'],publishedAt:'',publishedBy:'test'}],subscriptions:[grant],audit:[]};
assert.deepEqual(entitlementDisableImpact(snapshot,'g',['s1','s2'],now),{provided:2,lost:2,retained:0,stores:1},'selected store must not include brand or sibling store');
snapshot.subscriptions.push({...grant,id:'other',entitlementKind:'gift'});
assert.deepEqual(entitlementDisableImpact(snapshot,'g',['s1','s2'],now),{provided:2,lost:0,retained:2,stores:1},'alternative source retains menus');
snapshot.subscriptions=[{...grant,scopeMode:'all'}];
assert.deepEqual(entitlementDisableImpact(snapshot,'g',['s1','s2'],now),{provided:6,lost:6,retained:0,stores:2});
assert.deepEqual(entitlementDisableImpact(snapshot,'g',['s1','s2'],now+10000),{provided:0,lost:0,retained:0,stores:2},'end boundary is exclusive');
console.log('entitlement action matrix and scoped disable impact passed');
