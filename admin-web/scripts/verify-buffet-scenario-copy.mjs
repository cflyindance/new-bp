import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js','utf8');
const window={};
const context=vm.createContext({window,Object,JSON,Array,String,Number,Math,cloneValue:v=>v===undefined?undefined:JSON.parse(JSON.stringify(v)),storeConfigFor:(d,id)=>d.storeConfigs[id],quantityScenarioIndexes:()=>[{partyIndex:0,roundIndex:0}],v4ScenarioKey:()=> 'p1|r1',v4TargetCellKey:(p,r,line,id)=>`p1|r1|${line}|${id}`,v4TargetsForConfig:(d,c)=>c.dishTargets.map(t=>({lineId:t.productLineId,id:t.dishId})),v4PeriodValues:(c,p)=>c.periodValues[p]});
vm.runInContext(fs.readFileSync('dist/Configuration center/assets/buffet-rule-policy.js','utf8'),context);
const scopeStart=source.indexOf('  function sceneScopeConfig(');
vm.runInContext(source.slice(scopeStart,source.indexOf('  function currentBuffetWorkbenchTargets(',scopeStart)),context);
const start=source.indexOf('  function buffetCopyCellConfigured(');
vm.runInContext(source.slice(start,source.indexOf('  if (window.__BUFFET_PERIOD_QUANTITY_TEST__)',start)),context);
const target=id=>({productLineId:'kiosk',dishId:id,name:id});
const values=limits=>({targetLimits:limits,tableTargetCaps:{},totalBounds:{},tableTotalBounds:{},defaultDishLimits:{},exceptionDishLimits:{}});
const draft={subject:'party_size',targetType:'dish',enabledPeriods:['per_round'],partyRanges:[{rangeId:'p1'}],roundRanges:[{rangeId:'r1'}],storeConfigs:{
 source:{dishTargets:[target('a'),target('b')],scenarioTargets:{per_round:{'p1|r1':{dishTargets:[target('a'),target('b')]}}},periodValues:{per_round:values({'p1|r1|kiosk|a':{configured:true,value:2},'p1|r1|kiosk|b':{configured:true,value:3}})}},
 destination:{dishTargets:[target('a')],periodValues:{per_round:values({})}}
}};
const preview=context.previewBuffetStoreCopy(draft,'source',['destination'],{});
assert.ok(preview.summary.missing>0,'缺失商品列入预览');
assert.equal(draft.storeConfigs.destination.scenarioTargets,undefined,'预览不写数据');
context.applyBuffetStoreCopyPreview(draft,preview);
const destination=draft.storeConfigs.destination;
assert.deepEqual(destination.scenarioTargets.per_round['p1|r1'].dishTargets.map(t=>t.dishId),['a']);
assert.equal(destination.periodValues.per_round.targetLimits['p1|r1|kiosk|a'].value,2);
assert.equal(destination.periodValues.per_round.targetLimits['p1|r1|kiosk|b'],undefined);
destination.scenarioTargets.per_round['p1|r1'].dishTargets[0].name='local';
assert.equal(draft.storeConfigs.source.scenarioTargets.per_round['p1|r1'].dishTargets[0].name,'a');
const preserve=context.previewBuffetStoreCopy(draft,'source',['destination'],{});
assert.ok(preserve.summary.preserved>0);
context.applyBuffetStoreCopyPreview(draft,preserve);
assert.equal(destination.scenarioTargets.per_round['p1|r1'].dishTargets[0].name,'local','默认保留已配置范围');
console.log('verify-buffet-scenario-copy: PASS');
