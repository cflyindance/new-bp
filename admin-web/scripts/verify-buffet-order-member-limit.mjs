import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const window = {};
for (const name of ['buffet-rule-policy.js', 'buffet-rule-domain.js']) vm.runInNewContext(fs.readFileSync('dist/Configuration center/assets/' + name, 'utf8'), { window, Date, Math, Number, String, Array, Object, JSON, Set, Error });
const cell = value => ({ configured: true, value });
const rule = { id:'test-order', version:1, schemaVersion:4, subject:'order', targetType:'dish_set', measureUnit:'kind', enabledPeriods:['order_lifetime'], periodPolicies:{order_lifetime:{blocks:{targetEnabled:true,sameDishEnabled:true}}}, partyRanges:[{min:1,max:null}], roundRanges:[{min:1,max:null}], deployStoreIds:['store-a'], conditions:{activityCycle:'daily',memberMode:'all'}, storeConfigs:{'store-a':{productLines:['kiosk'],dishTargets:[],categoryTargets:[],dishSetMembers:[{productLineId:'kiosk',dishId:'a'}],periodValues:{order_lifetime:{targetLimits:{'0|0':cell(3)},exceptionDishLimits:{'0|0':[{dishes:[{productLineId:'kiosk',dishId:'a'}],limit:cell(2)}]}}}} }};
const run = (roundNo, limit=2) => {rule.storeConfigs['store-a'].periodValues.order_lifetime.exceptionDishLimits['0|0'][0].limit=cell(limit);return window.BuffetRuleDomain.evaluateBatch({context:{orderMode:'buffet',buffetSessionId:'s',storeId:'store-a',orderId:'o',partySize:3,roundNo},operationId:'op',rules:[rule],counters:{order:[{productLineId:'kiosk',dishId:'a',quantity:2}],round:[]},items:[{productLineId:'kiosk',dishId:'a',quantity:1}],phase:'add'});};
for(const round of [1,2,3]) {const result=run(round);assert.ok(JSON.stringify(result).includes('SAME_DISH_LIMIT_EXCEEDED'), '跨轮整单累计需拒绝第三份');}
assert.ok(!JSON.stringify(run(2,4)).includes('SAME_DISH_LIMIT_EXCEEDED'));
assert.ok(JSON.stringify(run(2,0)).includes('SAME_DISH_LIMIT_EXCEEDED'));
console.log('verify-buffet-order-member-limit: PASS');
