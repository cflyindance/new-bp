import assert from 'node:assert/strict';
import { countDeclarationEmployees } from '../src/team/payroll/payroll-declaration-usage';

async function main() {
  const families: any[] = [{familyId:'enterprise',scope:{}},{familyId:'store',scope:{storeId:'A'}},{familyId:'unused',scope:{}}];
  const employees: any[] = [{id:'1',store:'A'},{id:'1',store:'A'},{id:'1',store:'B'},{id:'2',store:'A'}];
  const stores: any[] = [{id:'A',labelZh:'A'},{id:'B',labelZh:'B'}];
  let assigned = 'enterprise';
  const repositoryFor = (store: string): any => ({loadEmployeePreference:async (id: string)=>({defaultFamilyId:id==='2'?'store':assigned})});
  assert.deepEqual(await countDeclarationEmployees(families,employees,stores,repositoryFor),{enterprise:2,store:1,unused:0});
  assigned='system-default';
  assert.deepEqual(await countDeclarationEmployees(families,employees,stores,repositoryFor),{enterprise:0,store:1,unused:0});
  assigned='store';
  assert.deepEqual(await countDeclarationEmployees(families,employees,stores,repositoryFor),{enterprise:0,store:2,unused:0});
  const failed = await countDeclarationEmployees(families,employees,stores,()=>({loadEmployeePreference:async()=>{throw new Error('offline');}} as any));
  assert.deepEqual(failed,{enterprise:null,store:null,unused:null});
  console.log('Declaration usage counts passed: period deduplication, store scope, reassignment, zero and failures');
}
void main();
