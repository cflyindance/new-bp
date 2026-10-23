import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const script=`(async()=>{let root;for(let i=0;i<60;i++){root=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(root?.querySelector('#cancelAllocationBtn'))break;await new Promise(r=>setTimeout(r,100));}if(!root)throw Error('tips preview not ready');return {rows:[...root.querySelectorAll('tr')].filter(x=>/^10\\/(23|22|21)/.test(x.textContent)).map(x=>x.textContent),history:JSON.parse(localStorage.getItem('tipout-allocation-cancel-history-v1')||'[]').map(x=>({date:x.businessDate,paid:!!x.payout,snapshot:!!x.snapshot})),borders:[...root.querySelectorAll('#cancelAllocationBtn,#tipoutScenarioListButton')].map(b=>getComputedStyle(b).borderColor)};})()`;
const out=execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-cancel-paid-20261023 eval -b '+Buffer.from(script).toString('base64')],{encoding:'utf8'});
const r=JSON.parse(out);
assert.equal(r.rows.length,3);assert.match(r.rows.find(x=>x.startsWith('10/23')),/未分配待发放/);assert.match(r.rows.find(x=>x.startsWith('10/21')),/未分配待发放/);assert.match(r.rows.find(x=>x.startsWith('10/22')),/无需分配无需发放/);
assert.deepEqual(r.borders,['rgb(184, 50, 50)','rgb(184, 50, 50)']);
assert.equal(r.history.filter(x=>x.snapshot).length,2);assert.ok(r.history.find(x=>x.date==='2026-10-23').paid);
console.log('PASS isolated browser: red borders, paid/unpaid dates pending, closed unchanged, two snapshots and original payout archived');
