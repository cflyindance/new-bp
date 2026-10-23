// Read-only acceptance of the isolated browser session after visiting normal-store 2026-10-23 and 24.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const session=process.env.TIPOUT_TEST_SESSION||'tips-daily-excess-20261023';
if(!/^[a-z0-9-]+$/i.test(session))throw new Error('Use an isolated test session');
const code=`(async()=>{let root;for(let i=0;i<40;i++){root=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(root?.querySelector('.tipout-funding-summary'))break;await new Promise(r=>setTimeout(r,100));}
const snapshots=Object.values(JSON.parse(localStorage.getItem('tipout_allocation_results_v1')||'{}')).filter(s=>s.store==='Golden Dragon Chinese Kitchen - Dallas, TX 75231');
return {snapshots:snapshots.filter(s=>['2026-10-23','2026-10-24'].includes(s.dateKey)).map(s=>({date:s.dateKey,pool:s.pools.find(p=>p.ruleName.includes('每日超额')),source:s.employeeAmounts.find(e=>e.employeeId==='tipout-daily-excess-source')})),
current:root?.querySelector('#detailDate')?.value,panels:[...root?.querySelectorAll('.tipout-funding-summary')||[]].map(e=>({id:e.closest('.detail-rule-bundle')?.getAttribute('data-rule-id'),text:e.textContent}))};})()`;
const args=['--session',session,'eval','-b',Buffer.from(code).toString('base64')];
const output=process.platform==='win32'?execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd '+args.join(' ')],{encoding:'utf8'}):execFileSync('agent-browser',args,{encoding:'utf8'});
const result=JSON.parse(output);assert.equal(result.snapshots.length,2);
for(const s of result.snapshots){assert.equal(s.pool.funding.target,10);assert.equal(s.pool.funding.contributed,20);assert.equal(s.pool.poolAmount,20);assert.equal(s.source.deducted,20);assert.deepEqual(s.pool.employees.map(e=>e.amount),[12,8]);}
const active=result.snapshots.find(s=>s.date===result.current);assert.ok(active);
assert.ok(result.panels.some(p=>p.id===active.pool.ruleId&&p.text.includes('贡献超出计划 $10.00')));
console.log('PASS live browser: normal store two daily snapshots 10/20, deducted20, receivers12/8 and conditional excess panel');
