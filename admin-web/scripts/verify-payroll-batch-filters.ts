import assert from "node:assert/strict";
import { getBatchStoreId, scopeBatchSnapshot, filterBatchEmployees } from "../src/team/payroll/payroll-batch-export-filters";
import type { PayrollScopeSnapshot, PayrollSnapshot, PayrollEmployee } from "../src/team/payroll/payroll-types";
const scope: PayrollScopeSnapshot = {brandId:"",regionId:"",storeId:"a",storeLabel:"甲店",storeLabelEn:"Store A",isAllStores:false,usesInPageStorePicker:true,stores:[{id:"a",labelZh:"甲店",labelEn:"Store A"},{id:"b",labelZh:"乙店",labelEn:"Store B"}]};
const employees = [
 {id:"1",name:"王一",adpFile:"801",store:"甲店",role:"Server"},
 {id:"2",name:"李二",store:"Store B",role:"Manager"},
 {id:"3",name:"王三",store:"乙店",role:"Server"},
 {id:"4",name:"陈四",store:"乙店分店",role:"Server"},
 {id:"5",name:"空门店",store:"",role:"Server"},
] as PayrollEmployee[];
const snapshot = {periodId:"p",employeeStoreFilter:"甲店",data:{periods:[{id:"p"}],employees:{p:employees},auditLog:[]}} as unknown as PayrollSnapshot;
assert.equal(getBatchStoreId(snapshot,scope),"a");
const b = scopeBatchSnapshot(snapshot,scope,"b");
assert.deepEqual(b.data.employees.p.map(e=>e.id),["2","3"]);
assert.equal(snapshot.data.employees.p.length,5);
assert.equal(snapshot.employeeStoreFilter,"甲店");
assert.throws(()=>scopeBatchSnapshot(snapshot,scope,"evil"),/权限/);
assert.deepEqual(filterBatchEmployees(b.data.employees.p,"Server","王").map(e=>e.id),["3"]);
assert.equal(filterBatchEmployees(employees,"Server","801")[0].id,"1");
assert.equal(filterBatchEmployees(employees,"Manager","王").length,0);
const storePeriod = {...snapshot,data:{...snapshot.data,periods:[{id:"p",storeId:"a"}]}};
assert.equal(scopeBatchSnapshot(storePeriod,scope,"b").data.employees.p.length,0);
console.log("Batch store/role/employee filter checks passed");
