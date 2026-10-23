import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const storage=new Map();let failKey=null;
const localStorage={getItem:k=>storage.get(k)??null,setItem(k,v){if(k===failKey){failKey=null;throw Error('quota');}storage.set(k,String(v));},removeItem:k=>storage.delete(k)};
const window={localStorage,crypto:webcrypto,TextEncoder,navigator:{locks:{request:async(k,o,fn)=>fn()}},dispatchEvent(){}};
const c={window,localStorage,TextEncoder,Uint8Array,crypto:webcrypto};vm.createContext(c);
for(const file of ['tipout-date-state-store','tipout-allocation-results-store'])vm.runInContext(fs.readFileSync('src/team/tips/legacy/'+file+'.js.txt','utf8'),c);
const api=window.TipOutAllocationResults,state=window.TipOutDateState;
const make=(store,dateKey)=>({store,dateKey,version:1,pools:[{poolAmount:10,employees:[]}],summary:{originalTips:10,poolAmount:10,allocatedAmount:0,unallocatedAmount:10}});
async function paid(store,date){const s=await api.commit(make(store,date));await state.confirmPayout({storeId:store,businessDate:date,expectedSnapshotId:s.snapshotId,expectedSnapshotVersion:s.snapshotVersion,expectedSnapshotHash:s.snapshotHash});return s;}
await paid('S','2026-10-23');await paid('Other','2026-10-23');
await assert.rejects(api.cancel('S','2026-10-23'),/锁定/);
assert.equal(typeof api.resetConfirmed,'function');
state.markUnconfirmedUpdate('S','2026-10-23','draft');
const fp=api.cancelFingerprint('S','2026-10-23');
await assert.rejects(api.resetConfirmed('S','2026-10-23',{expectedFingerprint:fp}),/确认/);
await assert.rejects(api.resetConfirmed('S','2026-10-23',{confirmed:true,expectedFingerprint:'stale'}),/变化/);
assert.equal(await api.resetConfirmed('S','2026-10-23',{confirmed:true,expectedFingerprint:fp}),true);
assert.equal(api.isAllocated('S','2026-10-23'),false);assert.equal(state.inspect('S','2026-10-23').allocationStatus,'pending');assert.equal(state.readPayout('S','2026-10-23'),null);assert.equal(state.hasUnconfirmedUpdate('S','2026-10-23'),false);
assert.equal(state.inspect('Other','2026-10-23').payoutStatus,'paid');
const h=JSON.parse(storage.get(api.CANCEL_HISTORY_KEY));assert.equal(h.length,1);assert.ok(h[0].snapshot.snapshotHash);assert.equal(h[0].payout.status,'paid');
assert.equal(await api.resetConfirmed('S','2026-10-23',{confirmed:true,expectedFingerprint:api.cancelFingerprint('S','2026-10-23')}),false);
await paid('S','2026-10-24');
for(const key of [api.CANCEL_HISTORY_KEY,api.RESULT_KEY,'tipout_allocated',state.PAYOUT_KEY,state.UPDATE_KEY]){
const before=JSON.stringify([...storage]);failKey=key;
await assert.rejects(api.resetConfirmed('S','2026-10-24',{confirmed:true,expectedFingerprint:api.cancelFingerprint('S','2026-10-24')}),/quota/);
assert.deepEqual([...storage].sort(),JSON.parse(before).sort());assert.equal(state.inspect('S','2026-10-24').payoutStatus,'paid');
}
console.log('PASS cancel paid: explicit consent, default lock, archive, stale guard, isolation, idempotence, five-key rollback');
