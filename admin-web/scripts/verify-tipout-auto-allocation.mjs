import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = {};
vm.runInNewContext(fs.readFileSync('src/team/tips/legacy/tipout-auto-allocation.js.txt','utf8'), {window:root});
let calls=[], fail=true, active=0;
const queue=root.TipOutAutoAllocation.create(['01','02','03'],async date=>{
  assert.equal(++active,1); calls.push(date);
  try { if(date==='02'&&fail)throw Error('测试失败'); return {status:date==='03'?'skipped':'success',message:'已处理'}; }
  finally {active--;}
},()=>{});
const first=queue.run(); assert.equal(queue.run(),first); await first;
assert.equal(queue.items[1].status,'failed'); assert.equal(queue.items[2].status,'skipped');
fail=false; await queue.run(true); assert.deepEqual(calls,['01','02','03','02']);
await queue.run(true); assert.equal(calls.length,4);
let release;
const stopped=root.TipOutAutoAllocation.create(['a','b'],()=>new Promise(r=>{release=r;}),()=>{});
const pending=stopped.run(); await Promise.resolve(); stopped.stop(); release({status:'success'}); await pending;
assert.equal(stopped.items[1].status,'pending');
console.log('PASS sequential allocation, continue on failure, retry only failed, duplicate run, stop');
// Prove the navigation guard runs again after asynchronous snapshot hashing.
const storeSource=fs.readFileSync('src/team/tips/legacy/tipout-allocation-results-store.js.txt','utf8');
const commit=storeSource.slice(storeSource.indexOf('  async function commit('),storeSource.indexOf('  function commitPrepared('));
let alive=true,writes=0;
const scope={validate:()=>null,isAllocated:()=>false,read:()=>null,commitPrepared:()=>writes++,root:{TipOutDateState:{withLock:async(_s,_d,fn)=>fn(),assertDateWritable(){},prepareSnapshot:async s=>{alive=false;return s;}}}};
vm.createContext(scope);vm.runInContext(commit,scope);
await assert.rejects(scope.commit({store:'s',dateKey:'d'},{onlyIfUnallocated:true,assertActive(){if(!alive)throw Error('left page');}}),/left page/);
assert.equal(writes,0,'leaving during hashing must prevent commit');
console.log('PASS lifecycle guard prevents writes after navigation during snapshot preparation');
const ui=fs.readFileSync('src/team/tips/programs/summary-auto-allocation.js.txt','utf8');
const existing=ui.slice(ui.indexOf('    function summaryAutoExisting('),ui.indexOf('    async function executeSummaryAutoDate('));
let state={error:'',payoutStatus:'pending',snapshot:{allocationSource:'manual'}};
const safety={TipOutDateState:{inspect:()=>state},TipOutAllocationResults:{isAllocated:()=>false}};
vm.createContext(safety);vm.runInContext(existing,safety);
assert.equal(safety.summaryAutoExisting('s','d').status,'skipped','saved manual result is protected');
state={error:'',payoutStatus:'paid',snapshot:{}};assert.match(safety.summaryAutoExisting('s','d').message,/已发放/);
state={error:'损坏',payoutStatus:'error'};assert.throws(()=>safety.summaryAutoExisting('s','d'),/损坏/);
console.log('PASS manual/paid protection and corrupt-state failure');
