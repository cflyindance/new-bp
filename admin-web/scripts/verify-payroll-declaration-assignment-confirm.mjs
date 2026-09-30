import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/team/payroll/payroll-declaration-assignment-dialog.ts', 'utf8');
const handler = source.split("dialog.addEventListener('click', async e => {")[1]
  .split('\n  });')[0].replace('e.target as Element', 'e.target');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
async function run(accepted, result, rejectSave = false) {
  const calls = [];
  const execute = new AsyncFunction('accepted', 'result', 'rejectSave', 'calls', `
    let busy=false, token=0, preview=null, message='';
    let rows=[{key:'employee',preference:null}], selected=new Set(['employee']);
    const family={familyId:'template'};
    const paint=()=>{};
    const close=()=>{calls.push('close');token++;};
    const onSaved=text=>calls.push('success');
    const listEmployees=async()=>rows;
    const confirmAssignment=async text=>{calls.push(text);return accepted;};
    const batch={prepareAssignment:async()=>({employees:rows,replacements:0}),executeAssignment:async()=>{
      calls.push('save');if(rejectSave)throw new Error('network failure');return result;
    }};
    const e={target:{closest:selector=>selector==='[data-submit]'}};
    await (async()=>{${handler}})();
    return {message,selected:[...selected],busy};
  `);
  return { state: await execute(accepted, result, rejectSave, calls), calls };
}
const success = {succeeded:['employee'],failed:[],skipped:[]};
let check=await run(false, success);
assert.equal(check.calls.length,1,'cancel must not write');
assert.deepEqual(check.state.selected,['employee']);
check=await run(true, success);
assert.deepEqual(check.calls.slice(1),['save','close','success']);
check=await run(true,{succeeded:[],failed:[{employee:{key:'employee',name:'Test'},message:'failed'}],skipped:[]});
assert.ok(!check.calls.includes('close'));
assert.deepEqual(check.state.selected,['employee']);
check=await run(true,success,true);
assert.ok(!check.calls.includes('close'));
assert.equal(check.state.message,'network failure');
check=await run(true,{requiresConfirmation:true});
assert.ok(!check.calls.includes('close'));
assert.match(check.state.message,/重新确认/);
console.log('Assignment confirmation: cancel, success, partial failure, network error and stale preference passed');
