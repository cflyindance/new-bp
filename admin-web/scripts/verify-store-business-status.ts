import assert from 'node:assert/strict';
import {resolveStoreBusinessStatus as resolve,shiftBusinessDate,localBusinessDate,type StoreBusinessFacts} from '../src/config/store-business-status';
const now=new Date('2026-11-10T08:00:00Z'),tz='Asia/Shanghai',store={storeId:'MID',status:'open' as const};
const data=():StoreBusinessFacts=>({storeId:'MID',timezone:tz,updatedAt:now.toISOString(),source:'integrated',days:Array.from({length:30},(_,i)=>({date:shiftBusinessDate('2026-11-10',-i),salesAmount:0,tipAmount:0,punchRecords:[],complete:true}))});
const state=(f:StoreBusinessFacts|undefined)=>resolve(store,tz,f,now).status;
assert.equal(state(undefined),'unknown');assert.equal(state(data()),'no-records');
for(const field of ['salesAmount','tipAmount'] as const){const f=data();f.days[29]![field]=1;assert.equal(state(f),'open');f.days[29]!.date='2026-10-11';assert.equal(state(f),'unknown');}
let f=data();f.days[29]!.punchRecords=[{source:'pos',status:'complete',hours:1}];assert.equal(state(f),'open');
f.days[29]!.punchRecords[0]!.source='manual';assert.equal(state(f),'no-records');f.days[29]!.punchRecords[0]!.source='pos';f.days[29]!.punchRecords[0]!.status='incomplete';assert.equal(state(f),'no-records');
f=data();f.days.pop();assert.equal(state(f),'unknown');f.days[0]!.salesAmount=1;assert.equal(state(f),'open');
f=data();f.days[0]!.tipAmount=NaN;assert.equal(state(f),'unknown');f.days[1]!.salesAmount=1;assert.equal(state(f),'open');
f=data();f.updatedAt='2026-11-09T08:00:00Z';assert.equal(state(f),'unknown');f.days[1]!.salesAmount=1;assert.equal(state(f),'open');
f=data();f.days[0]!.date='2026-11-11';f.days[0]!.salesAmount=1;assert.equal(state(f),'unknown');
f=data();f.storeId='other';assert.equal(state(f),'unknown');f=data();f.updatedAt='2026-11-11T08:00:00Z';assert.equal(state(f),'unknown');
for(const status of ['preparing','closed','terminated','archived'] as const)assert.equal(resolve({...store,status},tz,data(),now).status,status);
assert.equal(resolve(store,'invalid',data(),now).status,'unknown');
assert.equal(localBusinessDate(new Date('2026-11-10T00:30:00Z'),'America/Los_Angeles'),'2026-11-09');
console.log('PASS 30-day boundaries, independent evidence, coverage, manual override, timezone and MID isolation');
