import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('src/team/tips/legacy/tipAllocation.js.txt','utf8'),context);
const api = context.window.TipAllocation;
const employees = [
  {name:'A',role:'Server',hours:6,orderCount:3,clockedIn:true},
  {name:'B',role:'Server',hours:0,orderCount:2,clockedIn:false},
  {name:'C',role:'Server',hours:4,orderCount:0,clockedIn:true}
];
const distribute = (distribution,clockin,rows=employees) => JSON.parse(JSON.stringify(api.distributeRoleAmountsToEmployees({Server:100},{distribution,clockin},rows).receivedByName));
assert.deepEqual(distribute('average','unrestricted'),{A:50,B:0,C:50});
assert.deepEqual(distribute('hours','unrestricted'),{A:60,B:0,C:40});
assert.deepEqual(distribute('orders','unrestricted'),{A:60,B:40,C:0});
assert.deepEqual(distribute('orders','clock'),{A:100,B:0,C:0});
assert.deepEqual(distribute('orders','unrestricted',employees.map(e=>({...e,orderCount:0}))),{A:0,B:0,C:0});
assert.deepEqual(distribute('hours','unrestricted',employees.map(e=>e.name==='B'?{...e,hours:10,manuallyIncluded:true}:e)),{A:30,B:50,C:20});
console.log('Participation eligibility and order-count allocation passed');
