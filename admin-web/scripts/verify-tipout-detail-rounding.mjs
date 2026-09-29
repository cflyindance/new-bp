import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={window:{},money:value=>'$'+value.toFixed(2)};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-detail-manual-allocation.js.txt','utf8'),context);
const source=fs.readFileSync('src/team/tips/programs/details.js.txt','utf8');
vm.runInContext(source.match(/    function recalcDetailLegacyCard\(card\) \{[\s\S]*?\n    \}/)[0],context);
function recalc(cents, weights) {
  const rows=weights.map(value=>{
    const amount={textContent:''};
    const input={value:String(value),closest:()=>({nextElementSibling:amount})};
    return {amount,querySelector:()=>input};
  });
  const roleLabel={textContent:''};
  const section={querySelector:selector=>selector==='.detail-role-pct-input'?{value:'100'}:selector==='.role-amount'?roleLabel:{querySelectorAll:()=>rows}};
  const card={getAttribute:key=>key==='data-pool'?String(cents/100):null,querySelectorAll:()=>[section]};
  context.recalcDetailLegacyCard(card);
  return rows.map(row=>Math.round(Number(row.amount.textContent.slice(1))*100));
}
assert.deepEqual(recalc(101,[1,1,1]),[34,34,33], 'three equal receivers must not receive 102 cents from a 101-cent pool');
assert.deepEqual(recalc(1,[1,1]),[1,0]);
assert.deepEqual(recalc(148,[0,1,1,1,0,1,1,1]),[0,25,25,25,0,25,24,24]);
for(let cents=0;cents<500;cents++) {
  for(const weights of [[1,1,1],[1,2,3],[0,1,3,2,0],[33.33,33.33,33.34],[0,0]]) {
    const amounts=recalc(cents,weights);
    assert.equal(amounts.reduce((sum,value)=>sum+value,0),weights.some(Boolean)?cents:0);
    weights.forEach((weight,index)=>{if(!weight)assert.equal(amounts[index],0);});
  }
}
console.log('PASS: real detail recalculation conserves cents across 2500 weighted/equal/zero cases');
