import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js','utf8');
function body(name) {
 const start=source.indexOf('  function '+name+'(');
 assert.ok(start>=0,name+' must exist');
 const end=source.indexOf('\n  }',start)+4;
 return source.slice(start,end);
}
const ctx={};vm.createContext(ctx);
vm.runInContext(['formatRange','quantitySceneDialogTitle'].map(body).join('\n'),ctx);
const draft={subject:'party_size',partyRanges:[{min:1,max:null},{min:1,max:3},{min:4,max:null}],roundRanges:[{min:1,max:1},{min:2,max:4},{min:5,max:null}]};
const title=(period,partyIndex=0,roundIndex=0)=>ctx.quantitySceneDialogTitle(draft,{period,partyIndex,roundIndex});
assert.equal(title('multi_round'),'配置1 人及以上 · 1 轮');
assert.equal(title('multi_round',1,1),'配置1–3 人 · 2–4 轮');
assert.equal(title('multi_round',2,2),'配置4 人及以上 · 5 轮及以上');
assert.equal(title('per_round',2),'配置4 人及以上 · 每轮');
assert.equal(title('order_lifetime',1),'配置1–3 人 · 整单限购');
draft.subject='order';
assert.equal(title('order_lifetime'),'配置整单限购');
assert.equal(title('per_round'),'配置每轮限购');
assert.equal(title('multi_round'),'配置1 轮');
assert.match(body('renderQuantitySceneDialog'),/esc\(quantitySceneDialogTitle\(draft, scene.combo\)\)/);
console.log('PASS scene titles: party/round ranges, open ranges, fixed periods and dynamic escaped heading');
