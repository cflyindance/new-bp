const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/config/subscription-service-store.ts','utf8');
function fixture({raw,quota=false,readError=false,migrate=false}={}) {
 const storage=new Map(raw===undefined?[]:[['menusifu:subscription-service-packages-v1',raw]]),events=[],warnings=[];
 let writes=0,seeds=0;
 const dependencies={
  './enterprise-merchant-store':{getMerchants:()=>[],getMerchantStores:()=>[],getStoreById:()=>undefined},
  './subscription-service-domain':{getSubscriptionRouteCatalog:()=>[]},
  './subscription-published-menu-tree':{getPublishedSubscriptionMenuTree:()=>migrate?{source:'menu-document',blueprintVersion:1}:null,getPublishedSubscriptionRouteCatalog:()=>[]},
  './service-entitlement-demo':{seedServiceEntitlementDemo:s=>{s.entitlementDemoVersion=1;s.packages.push({id:'migration-demo'});s.subscriptions.push({id:'migration-grant'});seeds++;return true;}},
  './subscription-growth-menu-demo':{seedGrowthMenuDemo:()=>false},
  './subscription-basic-menu-demo':{seedBasicMenuDemo:()=>false}
 };
 const module={exports:{}};
 const context=vm.createContext({module,exports:module.exports,require:id=>dependencies[id]||{},
  localStorage:{getItem:k=>{if(readError)throw new Error('storage unavailable');return storage.get(k)??null;},setItem:(k,v)=>{writes++;if(quota)throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});storage.set(k,v);}},
  window:{dispatchEvent:e=>events.push(e)},CustomEvent:class{constructor(type){this.type=type;}},console:{warn:(...args)=>warnings.push(args)}});
 vm.runInContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 return {api:module.exports,storage,events,warnings,writes:()=>writes,seeds:()=>seeds};
}
const snapshot={schemaVersion:1,routeBlueprintVersion:1,packages:[{id:'retained',commercial:{chargeType:'paid'}}],drafts:[],releases:[{id:'r1',routeNodeIds:['only-authorized']}],subscriptions:[{id:'real-grant',subjectType:'brand',subjectId:'brand-a',packageId:'retained',disabledAt:'2026-01-01'}],audit:[{id:'history'}],protectedRoutes:[{packageId:'retained',path:'/protected'}],entitlementDemoVersion:0};
const raw=JSON.stringify(snapshot);
const loaded=fixture({raw,quota:true,migrate:true});
const result=loaded.api.readSubscriptionServiceSnapshot();
assert.equal(result.packages.length,1,'failed migration must not grant in-memory demo rights');
assert.equal(result.packages[0].id,'retained');
assert.equal(result.subscriptions.length,1);
assert.equal(result.subscriptions[0].disabledAt,'2026-01-01','disabled grant preserved');
assert.equal(JSON.stringify(result.protectedRoutes),JSON.stringify(snapshot.protectedRoutes));
assert.equal(loaded.storage.get('menusifu:subscription-service-packages-v1'),raw,'no overwrite or clearing');
assert.equal(loaded.writes(),1,'no fallback reseed write');
loaded.api.readSubscriptionServiceSnapshot();assert.equal(loaded.warnings.length,1,'warn once per page');
assert.throws(()=>loaded.api.writeSubscriptionServiceSnapshot(result),/quota/,'explicit save still fails');
assert.equal(loaded.events.length,0,'no change event for failed writes');
const changed={...snapshot,subscriptions:[{...snapshot.subscriptions[0],disabledAt:'2026-02-01'}]};
loaded.storage.set('menusifu:subscription-service-packages-v1',JSON.stringify(changed));
assert.equal(loaded.api.readSubscriptionServiceSnapshot().subscriptions[0].disabledAt,'2026-02-01','later reads observe current data, not a stale fallback cache');
const fresh=fixture({quota:true});
assert.doesNotThrow(()=>fresh.api.readSubscriptionServiceSnapshot(),'initial cache quota must not break navigation');
assert.equal(fresh.storage.size,0);
const unchanged=fixture({raw,quota:true});
assert.equal(unchanged.api.readSubscriptionServiceSnapshot().packages[0].id,'retained');assert.equal(unchanged.writes(),0);
const ok=fixture({raw,migrate:true});
const migrated=ok.api.readSubscriptionServiceSnapshot();assert.equal(migrated.packages.length,2);assert.equal(ok.writes(),1);assert.equal(ok.events.length,0);
ok.api.writeSubscriptionServiceSnapshot(migrated);assert.equal(ok.events.length,1,'successful explicit save notifies');
assert.equal(ok.api.readSubscriptionServiceSnapshot().packages.length,2);
const denied=fixture({readError:true});assert.throws(()=>denied.api.readSubscriptionServiceSnapshot(),/storage unavailable/);assert.equal(denied.writes(),0,'unreadable rights must not reseed');
const corrupt=fixture({raw:'{broken',quota:true});assert.throws(()=>corrupt.api.readSubscriptionServiceSnapshot());assert.equal(corrupt.writes(),0,'malformed data not overwritten');
const wrongSchema=fixture({raw:JSON.stringify({...snapshot,schemaVersion:99})});assert.throws(()=>wrongSchema.api.readSubscriptionServiceSnapshot(),/数据格式无效/);assert.equal(wrongSchema.writes(),0);
console.log('PASS subscription read cache quota: preserve rights, atomic migration, warning once, explicit saves fail, initial navigation, unreadable data fail closed');
